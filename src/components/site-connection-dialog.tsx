import { useState } from "react";
import { Database, Unplug } from "lucide-react";
import { siteConnectionSchema, type SiteConnection } from "@/lib/site-connection";
import { Button } from "./ui/button";

export function SiteConnectionDialog({ initial, onSave, onClose }: { initial?: SiteConnection | undefined; onSave: (value?: SiteConnection) => void; onClose: () => void }) {
  const [url, setUrl] = useState(initial?.url ?? ""), [key, setKey] = useState(initial?.publicKey ?? "");
  const [error, setError] = useState(""), [busy, setBusy] = useState(false);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
    <form role="dialog" aria-modal="true" aria-label="Supabase do projeto" className="max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-5" onSubmit={async e => {
      e.preventDefault(); setError("");
      const parsed = siteConnectionSchema.safeParse({ url: url.trim().replace(/\/$/, ""), publicKey: key.trim() });
      if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Dados inválidos."); return; }
      setBusy(true);
      try {
        const response = await fetch(`${parsed.data.url}/auth/v1/settings`, { headers: { apikey: parsed.data.publicKey }, signal: AbortSignal.timeout(12000) });
        if (!response.ok) { setError(`O Supabase recusou a conexão (${response.status}). Confira a URL e a chave pública.`); return; }
        onSave(parsed.data);
      } catch { setError("Não foi possível verificar a conexão. Confira a URL e sua internet."); }
      finally { setBusy(false); }
    }}>
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Database className="h-5 w-5 text-primary"/> Supabase do projeto</h2>
      <label className="block text-sm">URL do projeto<input required type="url" aria-label="URL do Supabase" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://seu-projeto.supabase.co" className="mt-2 w-full rounded-md border border-border bg-background p-3 outline-none focus:border-primary"/></label>
      <label className="block text-sm">Chave pública (publishable ou anon)<textarea required aria-label="Chave pública Supabase" rows={3} value={key} onChange={e => setKey(e.target.value)} className="mt-2 w-full resize-none break-all rounded-md border border-border bg-background p-3 font-mono text-xs outline-none focus:border-primary"/></label>
      <p className="text-xs text-muted-foreground">Encontre em Supabase → Settings → API Keys. Nunca envie service_role ou secret. Vitrine e painel separados podem usar os mesmos dados.</p>
      {error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">{initial && <Button type="button" variant="ghost" disabled={busy} onClick={() => onSave()}><Unplug className="h-4 w-4"/> Desconectar</Button>}<Button type="button" variant="ghost" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? "Verificando…" : "Conectar"}</Button></div>
    </form>
  </div>;
}