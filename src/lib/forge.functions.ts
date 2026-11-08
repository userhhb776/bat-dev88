import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { buildPrompt, prepareHistory, projectFiles, slugify } from "./forge";
import { formatSources, isSourcePath, parseGitHubRepository, sourcePriority, type SourceFile } from "./source-import";
import { siteConnectionSchema } from "./site-connection";

const privateAccess = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const secret = process.env['FORGE_SESSION_SECRET'];
  if (!secret) throw new Error("O acesso privado não está configurado.");
  const session = await useSession<{ unlocked: boolean }>({ name: "forge_session", password: secret });
  if (!session.data.unlocked) throw new Error("Abra o BatDev com sua senha para continuar.");
  return next();
});
export const accessStatus = createServerFn({ method: "GET" }).handler(async () => {
  const secret = process.env['FORGE_SESSION_SECRET'];
  if (!secret) return false;
  return !!(await useSession<{ unlocked: boolean }>({ name: "forge_session", password: secret })).data.unlocked;
});
export const unlockForge = createServerFn({ method: "POST" }).inputValidator(z.object({ email: z.string().max(256), password: z.string().min(1).max(256) })).handler(async ({ data }) => {
  const password = process.env['FORGE_LOGIN_PASSWORD'] ?? process.env['FORGE_PASSWORD'];
  const email = (process.env['FORGE_EMAIL'] ?? "").trim().toLowerCase();
  const secret = process.env['FORGE_SESSION_SECRET'];
  if (!password || !secret) return { ok: false, error: "Configure a senha privada no seu servidor." };
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", encoder.encode(email + "\n" + password)), crypto.subtle.digest("SHA-256", encoder.encode(data.email.trim().toLowerCase() + "\n" + data.password))]);
  const left = new Uint8Array(a), right = new Uint8Array(b);
  let difference = 0; for (let i = 0; i < left.length; i++) difference |= (left[i] ?? 0) ^ (right[i] ?? 0);
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
    const base = [{ role: "system", content: buildPrompt(data.mode, new Date(), data.code) }, ...prepareHistory(data.history, data.mode)];
    let text = "";
    // DeepSeek limita cada resposta a 8192 tokens; quando corta, pedimos para continuar de onde parou.
    for (let round = 0; round < 4; round++) {
      const messages = round === 0 ? base : [...base, { role: "assistant", content: text }, { role: "user", content: "Continue EXATAMENTE do último caractere, sem repetir nada e sem comentários, até fechar o bloco de código." }];
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "deepseek-chat", max_tokens: data.mode === "chat" ? 2000 : 8192, temperature: 0.7, messages }),
      });
      if (!response.ok) return { text: "", error: response.status === 402 ? "O saldo DeepSeek acabou. Recarregue sua conta." : `O DeepSeek não respondeu (${response.status}). Tente novamente.` };
      const result = await response.json() as { choices?: { message?: { content?: string }; finish_reason?: string }[] };
      text += result.choices?.[0]?.message?.content ?? "";
      if (result.choices?.[0]?.finish_reason !== "length" || data.mode === "chat") break;
      if (round === 3) return { text: "", error: "O site ficou grande demais. Peça em partes; o site anterior foi preservado." };
    }
    return { text, error: "" };
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
const publishInput = z.object({ code: z.string().min(1).max(400000), name: z.string().min(1).max(120), exact: z.boolean().optional(), connection: siteConnectionSchema.optional(), sql: z.string().max(100000).optional() });
export const integrationStatus = createServerFn({ method: "GET" }).middleware([privateAccess]).handler(async () => ({
  vercel: !!process.env['VERCEL_TOKEN'], github: !!process.env['GITHUB_TOKEN'],
}));
export const publishVercel = createServerFn({ method: "POST" }).middleware([privateAccess]).inputValidator(publishInput).handler(async ({ data }) => {
  const token = process.env['VERCEL_TOKEN'];
  if (!token) return { url: "", error: "Adicione o token da Vercel para publicar." };
  try {
    const response = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.exact ? slugify(data.name).slice(0, 52) : `batdev-${slugify(data.name)}`.slice(0, 52), target: "production",
        files: Object.entries(projectFiles(data.code, data.connection, data.sql)).map(([file, content]) => ({ file, data: content })),
        projectSettings: { framework: "vite", buildCommand: "vite build", outputDirectory: "dist", installCommand: "npm install" } }),
    });
    const result = await response.json() as { id?: string; url?: string; error?: { message?: string } };
    if (!response.ok) { console.error("Vercel", response.status, result); return { id: "", url: "", error: `A Vercel recusou a publicação (${response.status}): ${result.error?.message ?? "erro desconhecido"}` }; }
    return { id: result.id ?? "", url: `https://${result.url}`, error: "" };
  } catch { return { id: "", url: "", error: "A conexão com a Vercel falhou." }; }
});
/** Checks a deployment; when ready, assigns the clean <name>.vercel.app address; when failed, returns the build error lines. */
export const vercelCheck = createServerFn({ method: "POST" }).middleware([privateAccess]).inputValidator(z.object({ id: z.string().min(1).max(100), name: z.string().min(1).max(60) })).handler(async ({ data }) => {
  const token = process.env['VERCEL_TOKEN'];
  if (!token) return { state: "ERROR", url: "", error: "Token da Vercel ausente." };
  const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  try {
    const d = await (await fetch(`https://api.vercel.com/v13/deployments/${data.id}`, { headers: h })).json() as { readyState?: string; url?: string; alias?: string[] };
    const state = d.readyState ?? "BUILDING";
    if (state === "ERROR" || state === "CANCELED") {
      const events = await (await fetch(`https://api.vercel.com/v2/deployments/${data.id}/events`, { headers: h })).json().catch(() => []) as { text?: string }[];
      const lines = (Array.isArray(events) ? events : []).map(e => e.text ?? "").filter(Boolean);
      const i = lines.findIndex(l => /error/i.test(l));
      return { state: "ERROR", url: "", error: (i >= 0 ? lines.slice(i, i + 8) : lines.slice(-8)).join("\n").slice(0, 1200) };
    }
    if (state !== "READY") return { state, url: "", error: "" };
    const wanted = `${slugify(data.name).slice(0, 52)}.vercel.app`;
    const set = await fetch(`https://api.vercel.com/v2/deployments/${data.id}/aliases`, { method: "POST", headers: h, body: JSON.stringify({ alias: wanted }) });
    if (set.ok) return { state, url: `https://${wanted}`, error: "" };
    const fallback = d.alias?.slice().sort((a, b) => a.length - b.length)[0] ?? d.url;
    return { state, url: `https://${fallback}`, error: `O endereço ${wanted} já pertence a outra conta da Vercel; usei este.` };
  } catch { return { state: "BUILDING", url: "", error: "" }; }
});
export const saveGitHub = createServerFn({ method: "POST" }).middleware([privateAccess]).inputValidator(publishInput.extend({ repo: z.string().max(100).optional() })).handler(async ({ data }) => {
  const token = process.env['GITHUB_TOKEN'];
  if (!token) return { repo: "", url: "", error: "Adicione o token do GitHub para salvar." };
  const gh = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`https://api.github.com/${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "BatDev", "Content-Type": "application/json" } });
    const body = response.status === 204 ? {} : await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, body: body as any };
  };
  try {
    const user = await gh("user");
    if (!user.ok) return { repo: "", url: "", error: `O GitHub recusou o token (${user.status}).` };
    const login = user.body.login as string, repo = data.repo || `batdev-${slugify(data.name)}`;
    let info = await gh(`repos/${login}/${repo}`);
    if (info.status === 404) {
      info = await gh("user/repos", { method: "POST", body: JSON.stringify({ name: repo, private: true, auto_init: true, description: "Criado com BatDev" }) });
      if (!info.ok) return { repo: "", url: "", error: `Não foi possível criar o repositório (${info.status}): ${info.body.message ?? ""}` };
      await new Promise(r => setTimeout(r, 1500));
    } else if (!info.ok) return { repo: "", url: "", error: `Repositório indisponível (${info.status}).` };
    const branch = (info.body.default_branch as string) || "main";
    const ref = await gh(`repos/${login}/${repo}/git/ref/heads/${branch}`);
    if (!ref.ok) return { repo: "", url: "", error: `Não foi possível ler o repositório (${ref.status}).` };
    const parent = ref.body.object.sha as string;
    const base = await gh(`repos/${login}/${repo}/git/commits/${parent}`);
    const tree = await gh(`repos/${login}/${repo}/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: base.body.tree?.sha,
      tree: Object.entries(projectFiles(data.code, data.connection, data.sql)).map(([path, content]) => ({ path, mode: "100644", type: "blob", content })) }) });
    if (!tree.ok) return { repo: "", url: "", error: `Falha ao enviar arquivos (${tree.status}).` };
    const commit = await gh(`repos/${login}/${repo}/git/commits`, { method: "POST", body: JSON.stringify({ message: `BatDev: ${new Date().toISOString().slice(0, 16).replace("T", " ")}`, tree: tree.body.sha, parents: [parent] }) });
    const moved = await gh(`repos/${login}/${repo}/git/refs/heads/${branch}`, { method: "PATCH", body: JSON.stringify({ sha: commit.body.sha }) });
    if (!commit.ok || !moved.ok) return { repo: "", url: "", error: "Não foi possível registrar a versão no GitHub." };
    return { repo, url: `https://github.com/${login}/${repo}`, error: "" };
  } catch { return { repo: "", url: "", error: "A conexão com o GitHub falhou." }; }
});
// Biblioteca na nuvem: um JSON por projeto num bucket privado do Supabase do usuário (sem tabelas extras).
const BUCKET = "batdev-projects";
async function storage() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const s = supabaseAdmin.storage;
  const { error } = await s.getBucket(BUCKET);
  if (error) await s.createBucket(BUCKET, { public: false });
  return s.from(BUCKET);
}
const projectSchema = z.object({ id: z.string().uuid(), title: z.string().min(1).max(200), messages: z.array(z.object({ role: z.enum(["user", "model"]), text: z.string() })).max(500), code: z.string().max(400000), mode: z.enum(["chat", "build"]), updatedAt: z.string(), repo: z.string().optional(), repoUrl: z.string().optional(), siteUrl: z.string().optional(), siteName: z.string().optional(), connection: siteConnectionSchema.optional(), sql: z.string().max(100000).optional() });
export const cloudList = createServerFn({ method: "GET" }).middleware([privateAccess]).handler(async () => {
  try {
    const bucket = await storage();
    const { data: files, error } = await bucket.list("", { limit: 1000 });
    if (error) return { projects: [], error: "Nuvem indisponível." };
    const projects = (await Promise.all((files ?? []).filter(f => f.name.endsWith(".json")).map(async f => {
      const { data } = await bucket.download(f.name);
      if (!data) return null;
      const parsed = projectSchema.safeParse(JSON.parse(await data.text()));
      return parsed.success ? parsed.data : null;
    }))).filter(p => p !== null);
    return { projects, error: "" };
  } catch (e) { console.error("cloudList", e); return { projects: [], error: "Nuvem indisponível." }; }
});
export const cloudSave = createServerFn({ method: "POST" }).middleware([privateAccess]).inputValidator(projectSchema).handler(async ({ data }) => {
  try {
    const { error } = await (await storage()).upload(`${data.id}.json`, new Blob([JSON.stringify(data)], { type: "application/json" }), { upsert: true, contentType: "application/json" });
    return { ok: !error };
  } catch (e) { console.error("cloudSave", e); return { ok: false }; }
});
export const cloudDelete = createServerFn({ method: "POST" }).middleware([privateAccess]).inputValidator(z.object({ id: z.string().uuid() })).handler(async ({ data }) => {
  try { const { error } = await (await storage()).remove([`${data.id}.json`]); return { ok: !error }; } catch { return { ok: false }; }
});

// Arquivos do chat (imagens/vídeos) vão para um bucket público do Supabase do usuário, para o site usar a URL.
export const uploadFile = createServerFn({ method: "POST" }).middleware([privateAccess]).inputValidator(z.object({ name: z.string().max(200), type: z.string().regex(/^(image|video)\//), base64: z.string().max(11_000_000) })).handler(async ({ data }) => {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const s = supabaseAdmin.storage, bucket = "batdev-assets";
    if ((await s.getBucket(bucket)).error) await s.createBucket(bucket, { public: true });
    const bytes = Uint8Array.from(atob(data.base64), c => c.charCodeAt(0));
    const path = `${crypto.randomUUID()}-${slugify(data.name.replace(/\.[^.]+$/, ""))}.${data.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin"}`;
    const { error } = await s.from(bucket).upload(path, bytes, { contentType: data.type });
    if (error) return { url: "", error: "Não foi possível guardar o arquivo." };
    return { url: s.from(bucket).getPublicUrl(path).data.publicUrl, error: "" };
  } catch (e) { console.error("uploadFile", e); return { url: "", error: "Não foi possível enviar o arquivo." }; }
});

// Leitura de imagens (prints, referências) pela API em nuvem do Ollama; sem chave, segue sem visão.
export const describeImage = createServerFn({ method: "POST" }).middleware([privateAccess]).inputValidator(z.object({ base64: z.string().max(9_000_000) })).handler(async ({ data }) => {
  const key = process.env['OLLAMA_API_KEY'];
  if (!key) return { text: "" };
  try {
    const response = await fetch("https://ollama.com/api/chat", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env['OLLAMA_VISION_MODEL'] || "gemma4:31b", stream: false, messages: [{ role: "user", images: [data.base64],
        content: "Descreva em português, com precisão, esta imagem para um desenvolvedor web: se for print de erro, transcreva a mensagem exata; se for site/app, descreva layout, seções, cores (hex aproximado), fontes, textos visíveis e estilo. Máximo 250 palavras." }] }),
    });
    if (!response.ok) { console.error("Ollama", response.status, await response.text().catch(() => "")); return { text: "" }; }
    const result = await response.json() as { message?: { content?: string } };
    return { text: (result.message?.content ?? "").trim().slice(0, 3000) };
  } catch (e) { console.error("describeImage", e); return { text: "" }; }
});

export const readPublicRepository = createServerFn({ method: "POST" }).middleware([privateAccess]).inputValidator(z.object({ url: z.string().url().max(500) })).handler(async ({ data }) => {
  try {
    const { owner, repo, ref } = parseGitHubRepository(data.url);
    const headers = { Accept: "application/vnd.github+json", "User-Agent": "BatDev" };
    const get = async (path: string) => {
      const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${path ? `/${path}` : ""}`, { headers, signal: AbortSignal.timeout(20000), redirect: "error" });
      if (!response.ok) {
        if (response.status === 404) throw new Error("Repositório não encontrado ou privado. Para privados, envie o ZIP.");
        if (response.status === 403 || response.status === 429) throw new Error("O GitHub limitou a leitura pública. Tente depois ou envie o ZIP.");
        throw new Error(`O GitHub não respondeu (${response.status}).`);
      }
      const body = await response.text();
      if (body.length > 4_000_000) throw new Error("Repositório grande demais; envie um ZIP com os arquivos principais.");
      return JSON.parse(body);
    };
    const info = await get("");
    const tree = await get(`git/trees/${encodeURIComponent(ref || info.default_branch)}?recursive=1`) as { truncated?: boolean; tree?: { path: string; type: string; size?: number; sha: string }[] };
    const candidates = (tree.tree ?? []).filter(f => f.type === "blob" && isSourcePath(f.path) && (f.size ?? 0) <= 120000).sort((a,b) => sourcePriority(a.path) - sourcePriority(b.path));
    const files: SourceFile[] = [];
    let total = 0;
    for (let i = 0; i < Math.min(candidates.length, 60) && total < 180000; i += 4) {
      const batch = await Promise.all(candidates.slice(i, Math.min(i + 4, 60)).map(async f => {
        const blob = await get(`git/blobs/${encodeURIComponent(f.sha)}`) as { encoding?: string; content?: string };
        if (blob.encoding !== "base64" || !blob.content) throw new Error(`Não foi possível ler ${f.path}.`);
        const bytes = Uint8Array.from(atob(blob.content.replace(/\s/g, "")), c => c.charCodeAt(0));
        return { path: f.path, content: new TextDecoder().decode(bytes) };
      }));
      files.push(...batch); total += batch.reduce((sum,f) => sum + f.content.length, 0);
    }
    const imported = formatSources(files, data.url, Math.max(0, candidates.length - files.length) + (tree.truncated ? 1 : 0));
    return { ...imported, error: "" };
  } catch (error) { return { text: "", count: 0, omitted: 0, error: error instanceof Error ? error.message : "Não foi possível ler o repositório. Envie o ZIP." }; }
});
