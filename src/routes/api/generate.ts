import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { buildPrompt, prepareHistory } from "@/lib/forge";

const input = z.object({
  mode: z.enum(["chat", "build"]), code: z.string().max(400000),
  history: z.array(z.object({ role: z.enum(["user", "model"]), text: z.string().max(300000) })).max(200),
});

// Streams DeepSeek output as plain text so long, professional builds never hit a request timeout.
export const Route = createFileRoute("/api/generate")({
  server: { handlers: { POST: async ({ request }) => {
    const secret = process.env["FORGE_SESSION_SECRET"], key = process.env["DEEPSEEK_API_KEY"];
    if (!secret || !key) return new Response("Servidor não configurado.", { status: 500 });
    const session = await useSession<{ unlocked: boolean }>({ name: "forge_session", password: secret });
    if (!session.data.unlocked) return new Response("Entre no BatDev para continuar.", { status: 401 });
    const parsed = input.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return new Response("Pedido inválido.", { status: 400 });
    const data = parsed.data;
    const base = [{ role: "system", content: buildPrompt(data.mode, new Date(), data.code) }, ...prepareHistory(data.history, data.mode)];
    const encoder = new TextEncoder();
    const stream = new ReadableStream({ async start(controller) {
      let text = "";
      try {
        for (let round = 0; round < 6; round++) {
          const messages = round === 0 ? base : [...base, { role: "assistant", content: text }, { role: "user", content: "Continue EXATAMENTE do último caractere, sem repetir nada e sem comentários, até fechar o bloco de código." }];
          const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "deepseek-chat", stream: true, max_tokens: data.mode === "chat" ? 2000 : 8192, temperature: 0.7, messages }),
          });
          if (!response.ok || !response.body) {
            controller.enqueue(encoder.encode(`\n[[BATDEV_ERRO:${response.status === 402 ? "O saldo DeepSeek acabou. Recarregue sua conta." : `O DeepSeek não respondeu (${response.status}). Tente novamente.`}]]`));
            break;
          }
          const reader = response.body.getReader(), decoder = new TextDecoder();
          let buffer = "", finish = "", head = round > 0 ? "" : null as string | null;
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (payload === "[DONE]") continue;
              try {
                const chunk = JSON.parse(payload) as { choices?: { delta?: { content?: string }; finish_reason?: string | null }[] };
                const piece = chunk.choices?.[0]?.delta?.content ?? "";
                let out = piece;
                if (head !== null && out) { head += out; if (head.length < 12 && !head.includes("\n")) continue; out = head.replace(/^\s*```[a-z]*\s*\n/i, ""); head = null; }
                if (out) { text += out; controller.enqueue(encoder.encode(out)); }
                if (chunk.choices?.[0]?.finish_reason) finish = chunk.choices[0].finish_reason;
              } catch { /* partial line */ }
            }
          }
          if (finish !== "length" || data.mode === "chat") break;
        }
      } catch { controller.enqueue(encoder.encode("\n[[BATDEV_ERRO:A conexão com o DeepSeek caiu. Tente novamente.]]")); }
      controller.close();
    } });
    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } });
  } } },
});
