import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Download, Eye, Code2, Send, Square, RotateCw, Plus, ArrowLeft, MessageCircle, WandSparkles, FolderOpen, Pencil, Trash2, Upload, Rocket, Github, Check, X, ExternalLink } from "lucide-react";
import { applyEdits, downloadZip, extractCode, parseDecisions, wantsBuild, type VisualEdit } from "@/lib/forge";
import { cloudDelete, cloudList, cloudSave, generateSite, integrationStatus, publishVercel, saveGitHub } from "@/lib/forge.functions";
import { deleteProject, exportBackup, listProjects, newProject, parseBackup, saveProject, type Project } from "@/lib/projects";
import { ForgePreview } from "@/components/forge-preview";
import { ForgeAccess } from "@/components/forge-access";
import { ForgeBalance } from "@/components/forge-balance";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "BatDev — Central tática de criação com IA" },
    { name: "description", content: "Converse, construa, edite e publique sites com IA no BatDev." },
    { property: "og:title", content: "BatDev — Central tática de criação com IA" },
    { property: "og:description", content: "Projetos próprios, conversa econômica e criação com DeepSeek." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: () => <ForgeAccess><Index/></ForgeAccess>,
});
const chatText = (text: string) => text.replace(/```[\s\S]*?(```|$)/g, "\n").replace(/\n{3,}/g, "\n\n").trim() || "Site atualizado.";
function Index() {
  const generate = useServerFn(generateSite);
  const [projects, setProjects] = useState<Project[]>([]), [active, setActive] = useState<Project | null>(null);
  const [loaded, setLoaded] = useState(false), [input, setInput] = useState(""), [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(""), [saved, setSaved] = useState(""), [balanceRefresh, setBalanceRefresh] = useState(0);
  const [tab, setTab] = useState<"preview" | "code">("preview"), [mView, setMView] = useState<"chat" | "app">("chat");
  const [frameKey, setFrameKey] = useState(0), [renameId, setRenameId] = useState(""), [renameText, setRenameText] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const [editing, setEditing] = useState(false), [edits, setEdits] = useState<VisualEdit[]>([]), [shipping, setShipping] = useState<"" | "vercel" | "github">("");
  const [links, setLinks] = useState({ vercel: false, github: false });
  const status = useServerFn(integrationStatus), publish = useServerFn(publishVercel), pushRepo = useServerFn(saveGitHub);
  const activeRef = useRef<Project | null>(null); activeRef.current = active;
  useEffect(() => { status().then(setLinks).catch(() => {}); }, []);
  const endRef = useRef<HTMLDivElement>(null), uploadRef = useRef<HTMLInputElement>(null), requestId = useRef(0);
  const cList = useServerFn(cloudList), cSave = useServerFn(cloudSave), cDelete = useServerFn(cloudDelete);
  useEffect(() => { (async () => {
    let local: Project[] = [];
    try { local = await listProjects(); setProjects(local); } catch { setNotice("O salvamento local não está disponível neste navegador."); }
    setLoaded(true);
    try {
      const cloud = await cList();
      if (cloud.error) return;
      const byId = new Map(local.map(p => [p.id, p]));
      for (const remote of cloud.projects as Project[]) { const mine = byId.get(remote.id); if (!mine || remote.updatedAt > mine.updatedAt) { byId.set(remote.id, remote); await saveProject(remote).catch(() => {}); } }
      for (const mine of local) if (!cloud.projects.some(p => p.id === mine.id)) void cSave({ data: mine }).catch(() => {});
      setProjects([...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    } catch { /* offline: keep local copy */ }
  })(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active?.messages, busy]);
  const persist = async (project: Project) => {
    setSaved("Salvando…");
    try { await saveProject(project); setProjects(previous => [project, ...previous.filter(p => p.id !== project.id)].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt))); setSaved("Salvo neste aparelho"); cSave({ data: project }).then(r => setSaved(r.ok ? "Salvo na nuvem" : "Salvo neste aparelho")).catch(() => {}); }
    catch { setSaved("Não salvo"); setNotice("Não foi possível salvar. Baixe uma cópia de segurança antes de fechar."); }
  };
  const update = (changes: Partial<Project>) => { if (!active) return; const next = { ...active, ...changes, updatedAt: new Date().toISOString() }; setActive(next); void persist(next); };
  const syncGitHub = async (project: Project, manual = false) => {
    if (!links.github && !manual) return;
    setShipping("github"); setSaved("Salvando no GitHub…");
    try {
      const result = await pushRepo({ data: { code: project.code, name: project.title, repo: project.repo } });
      if (result.error) { setNotice(result.error); setSaved("Salvo neste navegador"); return; }
      const latest = activeRef.current?.id === project.id ? activeRef.current : project;
      const next = { ...latest, repo: result.repo, repoUrl: result.url };
      if (activeRef.current?.id === project.id) setActive(next);
      await persist(next); setSaved("Salvo no navegador e no GitHub");
    } catch { setNotice("Não foi possível salvar no GitHub agora."); } finally { setShipping(""); }
  };
  const goLive = async () => {
    if (!active?.code) return;
    if (!links.vercel) { setNotice("Falta conectar a Vercel. Me envie o token no chat do Lovable para eu deixar integrado."); return; }
    setShipping("vercel"); setNotice("Publicando na Vercel…");
    try { const result = await publish({ data: { code: active.code, name: active.title } }); if (result.error) setNotice(result.error); else { update({ siteUrl: result.url }); setNotice(`Publicado! O site fica no ar em instantes: ${result.url}`); } }
    catch { setNotice("A publicação não terminou. Tente novamente."); } finally { setShipping(""); }
  };
  const saveEdits = () => {
    if (!active) return;
    const result = applyEdits(active.code, edits);
    const next = { ...active, code: result.code, updatedAt: new Date().toISOString() };
    setActive(next); void persist(next); setEditing(false); setEdits([]); setFrameKey(k => k + 1);
    setNotice(result.missed ? `${edits.length - result.missed} alteração(ões) salvas; ${result.missed} não foram encontradas no código — peça essa mudança no chat.` : "Edições salvas no seu site.");
    if (result.code !== active.code) void syncGitHub(next);
  };
  const open = (project: Project) => { setEditing(false); setEdits([]); setActive(project); setInput(""); setNotice(""); setSaved("Salvo neste navegador"); setMView("chat"); setFrameKey(k => k + 1); };
  const send = async (text: string, forceBuild = false) => {
    if (!text.trim() || busy || !loaded) return;
    const project = active ?? newProject(text);
    const mode = forceBuild || wantsBuild(text, !!project.code) ? "build" : project.mode;
    const pending: Project = { ...project, title: project.messages.length === 0 && project.title === "Novo projeto" ? text.trim().slice(0, 64) : project.title, mode, messages: [...project.messages, { role: "user", text: text.trim() }], updatedAt: new Date().toISOString() };
    setActive(pending); setInput(""); setBusy(true); setNotice(""); await persist(pending);
    const id = ++requestId.current;
    try {
      const result = await generate({ data: { mode, code: project.code, history: pending.messages } });
      if (id !== requestId.current) return;
      if (result.error) { setNotice(result.error); return; }
      if (!result.text.trim()) { setNotice("A IA retornou uma resposta vazia. Tente novamente."); return; }
      const code = mode === "build" ? extractCode(result.text) : null;
      if (code && (result.text.match(/```/g) ?? []).length % 2) { setNotice("A resposta veio incompleta; seu site anterior foi mantido."); return; }
      const completed: Project = { ...pending, messages: [...pending.messages, { role: "model", text: result.text }], code: code ?? project.code, updatedAt: new Date().toISOString() };
      setActive(completed); await persist(completed);
      if (code) { setTab("preview"); setMView("app"); setFrameKey(k => k + 1); void syncGitHub(completed); }
    } catch { if (id === requestId.current) setNotice("A criação não terminou. Seu trabalho anterior continua salvo."); }
    finally { if (id === requestId.current) setBusy(false); setBalanceRefresh(k => k + 1); }
  };
  const composer = <form onSubmit={e => { e.preventDefault(); void send(input); }} className="border-t border-border p-3">
    {active && <div className="mb-2 flex gap-1" role="group" aria-label="Modo de criação">{(["chat", "build"] as const).map(mode => <Button key={mode} type="button" size="sm" variant={active.mode === mode ? "secondary" : "ghost"} aria-pressed={active.mode === mode} disabled={busy} onClick={() => update({ mode })}>{mode === "chat" ? <MessageCircle/> : <WandSparkles/>}{mode === "chat" ? "Conversar" : "Construir"}</Button>)}</div>}
    <div className="flex items-end gap-2 rounded-lg border border-border bg-background p-2 focus-within:border-primary"><textarea aria-label="Mensagem" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }} rows={2} placeholder={active ? (active.mode === "chat" ? "Vamos pensar na sua ideia…" : "O que vamos criar ou mudar?") : "Qual é a sua ideia?"} className="min-w-0 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"/>
      {busy ? <Button type="button" size="icon" variant="secondary" aria-label="Parar geração" onClick={() => { requestId.current++; setBusy(false); setNotice("Geração interrompida aqui; a solicitação já enviada pode ser cobrada pelo DeepSeek."); }}><Square className="h-4 w-4"/></Button> : <Button size="icon" type="submit" aria-label="Enviar mensagem" disabled={!input.trim() || !loaded}><Send className="h-4 w-4"/></Button>}
    </div></form>;
  return <div className="flex h-dvh flex-col bg-background text-foreground">
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3 md:px-5"><div className="flex min-w-0 items-center gap-2">{active && <Button variant="ghost" size="icon" aria-label="Meus projetos" disabled={busy} onClick={() => { setActive(null); setInput(""); }}><ArrowLeft className="h-4 w-4"/></Button>}<BatMark/><span className="font-display text-lg font-bold tracking-wider">BAT<span className="text-primary">DEV</span></span></div><div className="flex items-center gap-1 sm:gap-2"><ForgeBalance refresh={balanceRefresh}/>{active?.code && <Button variant="outline" size="sm" aria-label="Salvar no GitHub" disabled={!!shipping} onClick={() => active && (links.github ? syncGitHub(active, true) : setNotice("Falta conectar o GitHub. Me envie o token no chat do Lovable para eu deixar integrado."))}><Github className="h-4 w-4"/><span className="hidden lg:inline">{shipping === "github" ? "Salvando…" : "GitHub"}</span></Button>}{active?.code && <Button size="sm" aria-label="Publicar na Vercel" disabled={!!shipping} onClick={goLive}><Rocket className="h-4 w-4"/><span className="hidden sm:inline">{shipping === "vercel" ? "Publicando…" : "Publicar"}</span></Button>}{active?.code && <Button variant="outline" size="sm" aria-label="Baixar projeto ZIP" onClick={() => downloadZip(active.code)}><Download className="h-4 w-4"/><span className="hidden sm:inline">ZIP</span></Button>}</div></header>
    {notice && <div role="alert" className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-secondary px-4 py-2 text-sm"><span>{notice}</span><Button size="sm" variant="ghost" onClick={() => setNotice("")}>Fechar</Button></div>}
    {!active ? <main className="min-h-0 flex-1 overflow-y-auto"><div className="mx-auto max-w-5xl px-5 pb-12 pt-10 md:px-10 md:pt-16">
      <div className="mx-auto max-w-2xl"><div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary"><span className="h-px w-8 bg-primary"/> Central BatDev</div><h1 className="font-display text-4xl font-bold uppercase leading-none md:text-6xl">Uma ideia.<br/><span className="text-primary">Missão em execução.</span></h1><div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">{composer}</div><div className="mt-3 flex gap-2"><Button variant="ghost" size="sm" onClick={() => open(newProject())}><MessageCircle/> Nova conversa</Button><Button variant="ghost" size="sm" onClick={() => open({ ...newProject(), mode: "build" })}><Plus/> Novo projeto</Button></div></div>
      <section className="mt-12"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-semibold"><FolderOpen className="h-5 w-5 text-primary"/> Meus projetos <span className="text-sm text-muted-foreground">{projects.length}</span></h2><div className="flex gap-1"><Button variant="ghost" size="sm" disabled={!projects.length} onClick={() => exportBackup(projects)} title="Baixar cópia de segurança"><Download className="h-4 w-4"/> Backup</Button><Button variant="ghost" size="sm" onClick={() => uploadRef.current?.click()}><Upload className="h-4 w-4"/> Importar</Button><input ref={uploadRef} type="file" accept="application/json,.json" className="hidden" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { const incoming = parseBackup(JSON.parse(await file.text())); for (const project of incoming) await saveProject({ ...project, id: crypto.randomUUID() }); setProjects(await listProjects()); setNotice("Cópia de segurança importada."); } catch { setNotice("Arquivo inválido ou não foi possível importar."); } e.target.value = ""; }}/></div></div>
      {!loaded ? <p className="text-sm text-muted-foreground">Abrindo projetos…</p> : projects.length === 0 ? <div className="border-y border-border py-9 text-sm text-muted-foreground">Seu primeiro projeto começa com uma conversa.</div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map(project => <article key={project.id} className="overflow-hidden rounded-lg border border-border bg-card"><Button variant="ghost" onClick={() => open(project)} className="h-auto w-full flex-col items-start gap-0 rounded-none p-0 text-left"><div className="flex aspect-[2/1] w-full items-center justify-center border-b border-border bg-muted">{project.code ? <Code2 className="h-10 w-10 text-primary"/> : <MessageCircle className="h-10 w-10 text-muted-foreground"/>}</div><div className="w-full px-4 pt-4"><h3 className="truncate text-base font-semibold">{project.title}</h3><p className="mt-2 truncate text-xs font-normal text-muted-foreground">{chatText(project.messages.at(-1)?.text ?? "Conversa em aberto")}</p></div></Button><div className="flex items-center justify-between p-4 pt-3"><time className="text-xs text-muted-foreground">{new Date(project.updatedAt).toLocaleDateString("pt-BR")}</time><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Renomear ${project.title}`} onClick={() => { setRenameId(project.id); setRenameText(project.title); }}><Pencil className="h-3.5 w-3.5"/></Button><Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Excluir ${project.title}`} onClick={() => setDeleteId(project.id)}><Trash2 className="h-3.5 w-3.5"/></Button></div></div></article>)}</div>}
      <p className="mt-5 text-xs text-muted-foreground">Sincronizados com a sua nuvem Supabase · abra em qualquer aparelho com seu login.</p></section>
    </div></main> : <div className="flex min-h-0 flex-1">
      <aside className={`${mView === "chat" ? "flex" : "hidden"} w-full shrink-0 flex-col border-r border-border bg-card md:flex md:w-[380px]`}><div className="border-b border-border px-4 py-3"><h1 className="truncate text-sm font-semibold">{active.title}</h1><p className="mt-1 text-xs text-muted-foreground">{saved}</p></div><div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">{!active.messages.length && <h2 className="pt-5 text-xl font-semibold">O que vamos construir?</h2>}{active.messages.map((message,i) => <div key={i} className={message.role === "user" ? "ml-6 whitespace-pre-wrap break-words rounded-lg bg-secondary px-3 py-2 text-sm" : "whitespace-pre-wrap break-words text-sm leading-relaxed"}>{message.role === "model" && <Decisions text={message.text}/>}{message.role === "user" ? message.text : chatText(message.text)}{message.role === "model" && extractCode(message.text) && <Button size="sm" variant="outline" className="mt-3 md:hidden" onClick={() => { setMView("app"); setTab("preview"); }}><Eye/> Abrir Preview</Button>}</div>)}{busy && <WorkLog chat={active.mode === "chat"}/>}<div ref={endRef}/></div>{composer}</aside>
      <main className={`${mView === "app" ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex`}><div className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2 [&>*]:shrink-0"><Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMView("chat")}><ArrowLeft className="h-4 w-4"/> Chat</Button>{(["preview", "code"] as const).map(value => <Button key={value} size="sm" variant={tab === value ? "secondary" : "ghost"} onClick={() => setTab(value)}>{value === "preview" ? <Eye/> : <Code2/>}{value === "preview" ? "Preview" : "Código"}</Button>)}{active.code && tab === "preview" && !editing && <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Recarregar preview" onClick={() => setFrameKey(k => k + 1)}><RotateCw className="h-4 w-4"/></Button>}{active.code && tab === "preview" && (editing ? <div className="ml-auto flex items-center gap-1"><span className="hidden text-xs text-muted-foreground sm:inline">{edits.length ? `${edits.length} alteração(ões)` : "Toque num texto ou imagem"}</span><Button variant="ghost" size="sm" onClick={() => { setEditing(false); setEdits([]); setFrameKey(k => k + 1); }}><X className="h-4 w-4"/> Cancelar</Button><Button size="sm" disabled={!edits.length} onClick={saveEdits}><Check className="h-4 w-4"/> Salvar</Button></div> : <div className="ml-auto flex items-center gap-1">{active.siteUrl && <Button asChild variant="ghost" size="icon" className="h-7 w-7" aria-label="Abrir site publicado"><a href={active.siteUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4"/></a></Button>}<Button variant="outline" size="sm" disabled={busy} aria-label="Editar visualmente" onClick={() => setEditing(true)}><Pencil className="h-4 w-4"/><span className="hidden min-[400px]:inline">Editar</span></Button></div>)}</div><div className="min-h-0 flex-1 bg-muted">{!active.code ? <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center"><BatMark className="h-10 w-10"/><h2 className="font-display text-xl font-semibold uppercase">Da conversa à criação.</h2><Button disabled={busy || !active.messages.length} onClick={() => send("Construa o projeto que planejamos nesta conversa.", true)}><WandSparkles/> Construir projeto</Button></div> : tab === "preview" ? <ForgePreview key={frameKey} code={active.code} busy={busy} editing={editing} onEdit={edit => setEdits(list => [...list, edit])} onRepair={error => send(`Corrija este erro sem mudar o design: ${error}. Devolva o App completo.`, true)}/> : <pre className="h-full overflow-auto p-4 font-mono text-xs leading-relaxed"><code>{active.code}</code></pre>}</div></main>
    </div>}
    {(renameId || deleteId) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5 backdrop-blur-sm"><div role="dialog" aria-modal="true" aria-label={renameId ? "Renomear projeto" : "Excluir projeto"} className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-5"><h2 className="text-lg font-semibold">{renameId ? "Renomear projeto" : "Excluir este projeto?"}</h2>{renameId ? <input aria-label="Nome do projeto" value={renameText} onChange={e => setRenameText(e.target.value)} className="w-full rounded-md border border-border bg-background p-2"/> : <p className="text-sm text-muted-foreground">Esta ação remove a conversa e o site deste navegador.</p>}<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => { setRenameId(""); setDeleteId(""); }}>Cancelar</Button><Button disabled={!!renameId && !renameText.trim()} variant={deleteId ? "destructive" : "default"} onClick={async () => { if (renameId) { const project = projects.find(p => p.id === renameId); if (project) await persist({ ...project, title: renameText.trim(), updatedAt: new Date().toISOString() }); setRenameId(""); } else { try { await deleteProject(deleteId); void cDelete({ data: { id: deleteId } }).catch(() => {}); setProjects(p => p.filter(item => item.id !== deleteId)); setDeleteId(""); } catch { setNotice("Não foi possível excluir."); } } }}>{renameId ? "Salvar" : "Excluir"}</Button></div></div></div>}
  </div>;
}

const KIND_LABEL: Record<string, string> = { cor: "Cor", fonte: "Fonte", layout: "Layout", interacao: "Interação", "interação": "Interação", arquivo: "Arquivo", conteudo: "Conteúdo", "conteúdo": "Conteúdo", nota: "Nota" };
function Decisions({ text }: { text: string }) {
  const items = parseDecisions(text);
  if (!items.length) return null;
  return <ol className="mb-3 space-y-1.5 rounded-lg border border-border bg-background/60 p-3 text-xs">{items.map((d, i) => { const hex = d.text.match(/#[0-9a-f]{6}\b/i)?.[0]; return <li key={i} className="flex items-start gap-2"><span className="mt-0.5 shrink-0 rounded bg-primary/15 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-primary">{KIND_LABEL[d.kind] ?? d.kind}</span>{hex && <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border border-border" style={{ background: hex }}/>}<span className="text-muted-foreground">{d.text}</span></li>; })}</ol>;
}

function BatMark({ className = "h-6 w-6" }: { className?: string }) {
  return <svg viewBox="0 0 64 32" aria-hidden="true" className={`${className} shrink-0 fill-primary`}><path d="M32 6l3 6 4-5 1 7c6-6 14-8 24-5-6 3-9 8-9 15-5-4-11-4-16 0-2-3-5-4-7-4s-5 1-7 4c-5-4-11-4-16 0 0-7-3-12-9-15 10-3 18-1 24 5l1-7 4 5z"/></svg>;
}

const BUILD_STEPS = ["Lendo seu pedido", "Escolhendo paleta de cores e fontes", "Desenhando a versão para celular", "Criando o topo e o menu", "Montando as seções e os cartões", "Adicionando botões e interações", "Ajustando para telas maiores", "Revisando o código", "Finalizando o arquivo App.jsx"];
function WorkLog({ chat }: { chat: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => { if (chat) return; const t = setInterval(() => setStep(s => Math.min(s + 1, BUILD_STEPS.length - 1)), 7000); return () => clearInterval(t); }, [chat]);
  if (chat) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2 w-2 animate-pulse rounded-full bg-primary"/>Pensando com você…</div>;
  return <ol className="space-y-1.5 rounded-lg border border-border bg-background/50 p-3 text-xs" aria-live="polite">{BUILD_STEPS.slice(0, step + 1).map((s, i) => <li key={s} className={`flex items-center gap-2 ${i === step ? "text-foreground" : "text-muted-foreground"}`}><span className={`h-1.5 w-1.5 rounded-full ${i === step ? "animate-pulse bg-primary" : "bg-muted-foreground"}`}/>{s}{i === step ? "…" : " ✓"}</li>)}</ol>;
}
