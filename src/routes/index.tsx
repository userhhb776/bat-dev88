import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Eye, Code2, Send, Square, Triangle, Hammer, RotateCw } from "lucide-react";
import { deployVercel, downloadZip, extractCode, streamChat, DEFAULT_KEYS, fallbackChain, type Msg } from "@/lib/forge";
import { ForgePreview } from "@/components/forge-preview";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Forge — Crie sites e apps com IA" },
      { name: "description", content: "Crie sites e aplicativos com IA, converse sobre suas ideias e veja o resultado com exportação ZIP e Vercel." },
      { property: "og:title", content: "Forge — Crie sites e apps com IA" },
      { property: "og:description", content: "Chat com IA, preview em tempo real, código React + Tailwind, ZIP e Vercel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SUGGESTIONS = ["Landing page para uma cafeteria artesanal", "Dashboard de finanças pessoais", "App de lista de tarefas com filtros"];

function Index() {
  const keys = DEFAULT_KEYS;
  const [vercelToken, setVercelToken] = useState("");
  const model = "groq|openai/gpt-oss-120b";
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [mView, setMView] = useState<"chat" | "app">("chat");
  const [notice, setNotice] = useState("");
  const [frameKey, setFrameKey] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVercelToken(localStorage.getItem("forge_vercel_token") ?? "");
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const saveSettings = () => {
    localStorage.setItem("forge_vercel_token", vercelToken.trim());
    setShowSettings(false);
  };

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const chain = fallbackChain(model, keys);
    const history: Msg[] = [...messages, { role: "user", text: text.trim() }];
    setMessages(history);
    setInput("");
    setBusy(true);
    setStreaming("");
    setNotice("");
    setTab("code");
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      let full = "";
      let lastErr: Error | null = null;
      for (const [provider, modelName] of chain) {
        try {
          setNotice("Gerando…");
          full = await streamChat(provider, keys[provider], modelName, history, (t) => {
            setStreaming(t);
          }, ac.signal);
          if (!full.trim()) throw new Error("Resposta vazia");
          if ((full.match(/```/g) ?? []).length % 2 === 1) throw new Error("Resposta incompleta");
          lastErr = null;
          setNotice("");
          break;
        } catch (err) {
          if ((err as Error).name === "AbortError") throw err;
          lastErr = err as Error;
          setStreaming("");
        }
      }
      if (lastErr) throw new Error("A IA está indisponível no momento. Tente de novo em instantes.");
      setMessages((m) => [...m, { role: "model", text: full }]);
      const c = extractCode(full);
      if (c) {
        setCode(c);
        setTab("preview");
        setMView("app");
        setFrameKey((k) => k + 1);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setMessages((m) => [...m, { role: "model", text: `⚠️ ${(e as Error).message}` }]);
    } finally {
      setStreaming("");
      setBusy(false);
      setNotice("");
    }
  };

  const onDeploy = async () => {
    if (!code) return;
    if (!vercelToken) { setShowSettings(true); return; }
    setNotice("Publicando na Vercel…");
    try {
      const url = await deployVercel(vercelToken, code);
      setNotice(url);
    } catch (e) {
      setNotice(`Falha: ${(e as Error).message}`);
    }
  };

  const chatText = (t: string) => t.replace(/```[\s\S]*?(```|$)/g, "\n").replace(/\n{3,}/g, "\n\n").trim() || "Código gerado ✓";

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2 font-display text-lg font-bold">
          <Hammer className="h-5 w-5 text-primary" /> Forge
        </div>
        <div className="flex items-center gap-2">
          <button disabled={!code} onClick={() => downloadZip(code)} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-40">
            <Download className="h-4 w-4" /> ZIP
          </button>
          <button disabled={!code} onClick={onDeploy} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
            <Triangle className="h-3.5 w-3.5 fill-current" /> Vercel
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className={`${mView === "chat" ? "flex" : "hidden"} w-full shrink-0 flex-col border-r border-border bg-card md:flex md:w-[400px]`}>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && !busy && (
              <div className="pt-8">
                <h1 className="font-display text-2xl font-bold">O que vamos construir?</h1>
                <p className="mt-2 text-sm text-muted-foreground">Descreva um site ou app. A IA gera o código e você vê o resultado ao lado.</p>
                <div className="mt-6 space-y-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="block w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:border-primary hover:bg-accent">{s}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "ml-8 rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground" : "text-sm whitespace-pre-wrap text-foreground"}>
                {m.role === "user" ? m.text : chatText(m.text)}
                {m.role === "model" && extractCode(m.text) && (
                  <button onClick={() => { setTab("preview"); setMView("app"); }} className="mt-2 flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs md:hidden"><Eye className="h-3.5 w-3.5" /> Abrir Preview</button>
                )}
              </div>
            ))}
            {busy && (
              <div className="space-y-3 text-sm">
                {streaming && <p className="whitespace-pre-wrap">{streaming.replace(/```[\s\S]*$/, "").trim()}</p>}
                <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                {streaming.includes("```") ? "Preparando seu site…" : "Pensando na sua ideia…"}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t border-border p-3">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-primary">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                rows={2}
                placeholder={messages.length ? "Peça uma alteração…" : "Descreva seu app…"}
                className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {busy ? (
                <button type="button" onClick={() => abortRef.current?.abort()} className="rounded-lg bg-secondary p-2"><Square className="h-4 w-4" /></button>
              ) : (
                <button type="submit" disabled={!input.trim()} className="rounded-lg bg-primary p-2 text-primary-foreground disabled:opacity-40"><Send className="h-4 w-4" /></button>
              )}
            </div>
          </form>
        </aside>

        <main className={`${mView === "app" ? "flex" : "hidden"} md:flex min-w-0 flex-1 flex-col`}>
          <div className="flex h-11 items-center gap-1 border-b border-border px-3">
            <button onClick={() => setMView("chat")} className="mr-1 rounded-md px-3 py-1 text-sm text-muted-foreground hover:text-foreground md:hidden">← Chat</button>
            {(["preview", "code"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm ${tab === t ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {t === "preview" ? <Eye className="h-4 w-4" /> : <Code2 className="h-4 w-4" />} {t === "preview" ? "Preview" : "Código"}
              </button>
            ))}
            {tab === "preview" && code && (
              <button onClick={() => setFrameKey((k) => k + 1)} className="ml-1 rounded-md p-1.5 text-muted-foreground hover:text-foreground" title="Recarregar"><RotateCw className="h-4 w-4" /></button>
            )}
            {notice && (
              <div className="ml-auto truncate font-mono text-xs text-muted-foreground">
                {notice.startsWith("https://") ? <a href={notice} target="_blank" rel="noreferrer" className="text-primary underline">{notice}</a> : notice}
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1 bg-muted">
            {!code ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Seu app aparecerá aqui.</div>
            ) : tab === "preview" ? (
              <ForgePreview key={frameKey} code={code} busy={busy} onRepair={(error) => send(`O site não abriu: ${error}. Corrija o problema e devolva o App completo, mantendo o design. Use JavaScript JSX e SVG inline para ícones.`)} />
            ) : (
              <pre className="h-full overflow-auto p-4 font-mono text-xs leading-relaxed text-foreground"><code>{code}</code></pre>
            )}
          </div>
        </main>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="font-display text-xl font-bold">Publicar na Vercel</h2>
            <label className="mt-4 block text-sm font-medium">Token da Vercel (opcional)</label>
            <input type="password" value={vercelToken} onChange={(e) => setVercelToken(e.target.value)} placeholder="Para publicar com um clique" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary" />
            <a href="https://vercel.com/account/tokens" target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary underline">Criar token na Vercel</a>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowSettings(false)} className="rounded-md px-4 py-2 text-sm hover:bg-accent">Cancelar</button>
              <button onClick={saveSettings} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
