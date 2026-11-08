import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, LoaderCircle, RotateCw, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { previewHtml, type VisualEdit } from "@/lib/forge";
import type { SiteConnection } from "@/lib/site-connection";

export function ForgePreview({ code, connection, onRepair, busy, editing = false, onEdit }: { code: string; connection?: SiteConnection | undefined; onRepair: (error: string) => void; busy: boolean; editing?: boolean; onEdit?: (edit: VisualEdit) => void }) {
  const editRef = useRef(onEdit); editRef.current = onEdit;
  const frame = useRef<HTMLIFrameElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const html = useMemo(() => previewHtml(code, connection), [code, connection]);

  useEffect(() => {
    setState("loading");
    setError("");
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.source !== "forge-preview") return;
      if (event.data.type === "ready") setState((previous) => previous === "error" ? previous : "ready");
      if (event.data.type === "change") { try { editRef.current?.(JSON.parse(event.data.message)); } catch { /* ignore malformed */ } }
      if (event.data.type === "error") {
        setState("error");
        setError(String(event.data.message).slice(0, 500));
      }
    };
    window.addEventListener("message", receive);
    const timeout = window.setTimeout(() => {
      setState((previous) => previous === "loading" ? "error" : previous);
      setError((previous) => previous || "timeout");
    }, 60000);
    return () => { window.removeEventListener("message", receive); window.clearTimeout(timeout); };
  }, [html, attempt]);

  useEffect(() => { if (state === "ready") frame.current?.contentWindow?.postMessage({ source: "batdev-host", edit: editing }, "*"); }, [editing, state]);

  return (
    <div className="relative h-full w-full">
      <iframe ref={frame} key={attempt} title="preview" sandbox="allow-scripts allow-forms allow-modals allow-popups" srcDoc={html} className="h-full w-full border-0 bg-card" />
      {state !== "ready" && (
        <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background p-6 text-center">
          {state === "loading" ? <><LoaderCircle className="h-6 w-6 animate-spin text-primary motion-reduce:animate-none" /><p className="text-sm">Abrindo seu site…</p></> : <>
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-sm">{error === "timeout" ? "A internet está lenta para abrir o preview. O código não tem culpa — toque em Recarregar." : "O site não abriu. Toque em Corrigir site para a IA consertar o erro exato."}</p>{error && error !== "timeout" && <p className="max-w-md break-words font-mono text-xs text-muted-foreground">{error.slice(0, 220)}</p>}
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setAttempt((value) => value + 1)}><RotateCw /> Recarregar</Button>
              {error !== "timeout" && <Button size="sm" disabled={busy} onClick={() => onRepair(error)}><Wrench /> Corrigir site</Button>}
            </div>
          </>}
        </div>
      )}
    </div>
  );
}