import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { buildPrompt, prepareHistory } from "./forge";

const privateAccess = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const secret = process.env['FORGE_SESSION_SECRET'];
  if (!secret) throw new Error("L’accès privé n’est pas configuré.");
  const session = await useSession<{ unlocked: boolean }>({ name: "forge_session", password: secret });
  if (!session.data.unlocked) throw new Error("Abra o Forge com sua senha para continuar.");
  return next();
});
export const accessStatus = createServerFn({ method: "GET" }).handler(async () => {
  const secret = process.env['FORGE_SESSION_SECRET'];
  if (!secret) return false;
  return !!(await useSession<{ unlocked: boolean }>({ name: "forge_session", password: secret })).data.unlocked;
});
export const unlockForge = createServerFn({ method: "POST" }).inputValidator(z.object({ password: z.string().min(1).max(256) })).handler(async ({ data }) => {
  const password = process.env['FORGE_PASSWORD'];
  const secret = process.env['FORGE_SESSION_SECRET'];
  if (!password || !secret) return { ok: false, error: "Configure a senha privada no seu servidor." };
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", encoder.encode(password)), crypto.subtle.digest("SHA-256", encoder.encode(data.password))]);
  const left = new Uint8Array(a), right = new Uint8Array(b);
  let difference = 0; for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  if (difference) return { ok: false, error: "Senha incorreta." };
  await (await useSession<{ unlocked: boolean }>({ name: "forge_session", password: secret })).update({ unlocked: true });
  return { ok: true, error: "" };
});
export const generateSite = createServerFn({ method: "POST" }).middleware([privateAccess]).inputValidator(z.object({
  mode: z.enum(["chat", "build"]), code: z.string().max(300000),
  history: z.array(z.object({ role: z.enum(["user", "model"]), text: z.string().max(300000) })).max(200),
})).handler(async ({ data }) => {
  const key = process.env['DEEPSEEK_API_KEY'];
  if (!key) return { text: "", error: "Configure a chave DeepSeek no seu servidor." };
  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "deepseek-chat", max_tokens: data.mode === "chat" ? 800 : 8192, temperature: 0.7,
        messages: [{ role: "system", content: buildPrompt(data.mode, new Date(), data.code) }, ...prepareHistory(data.history, data.mode)] }),
    });
    if (!response.ok) return { text: "", error: response.status === 402 ? "O saldo DeepSeek acabou. Recarregue sua conta." : `O DeepSeek não respondeu (${response.status}). Tente novamente.` };
    const result = await response.json() as { choices?: { message?: { content?: string }; finish_reason?: string }[] };
    if (result.choices?.[0]?.finish_reason === "length") return { text: "", error: "A resposta ficou incompleta. Peça uma versão mais enxuta; o site anterior foi preservado." };
    return { text: result.choices?.[0]?.message?.content ?? "", error: "" };
  } catch { return { text: "", error: "A conexão com o DeepSeek falhou. Tente novamente." }; }
});
export const getBalance = createServerFn({ method: "GET" }).middleware([privateAccess]).handler(async () => {
  const key = process.env['DEEPSEEK_API_KEY'];
  if (!key) return { balances: [], error: "Chave DeepSeek não configurada." };
  try {
    const response = await fetch("https://api.deepseek.com/user/balance", { headers: { Authorization: `Bearer ${key}` } });
    if (!response.ok) return { balances: [], error: `Saldo indisponível (${response.status}).` };
    const result = z.object({ balance_infos: z.array(z.object({ currency: z.string(), total_balance: z.string() })) }).parse(await response.json());
    return { balances: result.balance_infos.map(b => ({ currency: b.currency, total: Number(b.total_balance) })), error: "" };
  } catch { return { balances: [], error: "Saldo indisponível." }; }
});