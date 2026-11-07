import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LockKeyhole, Mail } from "lucide-react";
import { accessStatus, unlockForge } from "@/lib/forge.functions";
import { Button } from "./ui/button";

export function ForgeAccess({ children }: { children: ReactNode }) {
  const status = useServerFn(accessStatus), unlock = useServerFn(unlockForge);
  const [ready, setReady] = useState(false), [allowed, setAllowed] = useState(false);
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { status().then(setAllowed).catch(() => setError("Não foi possível verificar seu acesso.")).finally(() => setReady(true)); }, []);
  if (!ready) return <div className="flex h-dvh items-center justify-center bg-background text-muted-foreground">Abrindo BatDev…</div>;
  if (allowed) return children;
  const field = "mt-2 w-full rounded-md border border-border bg-background/60 p-3 pl-10 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
  return <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background p-5 text-foreground">
    <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"/>
    <form className="relative w-full max-w-sm space-y-5 rounded-xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur" onSubmit={async e => {
      e.preventDefault(); setBusy(true); setError("");
      try { const result = await unlock({ data: { email, password } }); if (result.ok) { setAllowed(true); setPassword(""); } else setError(result.error === "Senha incorreta." ? "E-mail ou senha incorretos." : result.error); }
      catch { setError("Não foi possível abrir o BatDev."); } finally { setBusy(false); }
    }}>
      <div className="text-center"><svg viewBox="0 0 64 32" aria-hidden="true" className="mx-auto h-10 w-20 fill-primary"><path d="M32 6l3 6 4-5 1 7c6-6 14-8 24-5-6 3-9 8-9 15-5-4-11-4-16 0-2-3-5-4-7-4s-5 1-7 4c-5-4-11-4-16 0 0-7-3-12-9-15 10-3 18-1 24 5l1-7 4 5z"/></svg>
        <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-wider">Bat<span className="text-primary">Dev</span></h1><p className="mt-1 text-sm text-muted-foreground">Entre na sua central de criação.</p></div>
      <label className="block text-sm">E-mail<span className="relative block"><Mail className="absolute left-3 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input autoComplete="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className={field}/></span></label>
      <label className="block text-sm">Senha<span className="relative block"><LockKeyhole className="absolute left-3 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input autoComplete="current-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className={field}/></span></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button className="h-11 w-full font-semibold" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</Button>
    </form>
  </main>;
}
