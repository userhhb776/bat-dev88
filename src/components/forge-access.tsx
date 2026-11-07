import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Hammer, LockKeyhole } from "lucide-react";
import { accessStatus, unlockForge } from "@/lib/forge.functions";
import { Button } from "./ui/button";

export function ForgeAccess({ children }: { children: ReactNode }) {
  const status = useServerFn(accessStatus), unlock = useServerFn(unlockForge);
  const [ready, setReady] = useState(false), [allowed, setAllowed] = useState(false);
  const [password, setPassword] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { status().then(setAllowed).catch(() => setError("Não foi possível verificar seu acesso.")).finally(() => setReady(true)); }, []);
  if (!ready) return <div className="flex h-dvh items-center justify-center bg-background text-muted-foreground">Abrindo BatDev…</div>;
  if (allowed) return children;
  return <main className="flex min-h-dvh items-center justify-center bg-background p-6 text-foreground"><form className="w-full max-w-sm space-y-5" onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError("");
    try { const result = await unlock({ data: { password } }); if (result.ok) { setAllowed(true); setPassword(""); } else setError(result.error); }
    catch { setError("Não foi possível abrir o BatDev."); } finally { setBusy(false); }
  }}><Hammer className="h-9 w-9 text-primary"/><h1 className="font-display text-3xl font-bold">Central BatDev.</h1><label className="block text-sm">Senha de acesso<input autoComplete="current-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-md border border-border bg-card p-3 outline-none focus:border-primary"/></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={busy}><LockKeyhole/> {busy ? "Abrindo…" : "Entrar"}</Button></form></main>;
}