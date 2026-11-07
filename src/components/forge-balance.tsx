import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { RotateCw, Wallet } from "lucide-react";
import { getBalance } from "@/lib/forge.functions";
import { Button } from "./ui/button";
export function ForgeBalance({ refresh = 0 }: { refresh?: number }) {
  const get = useServerFn(getBalance);
  const [label, setLabel] = useState("Saldo…"), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    try { const result = await get(); setError(result.error); setLabel(result.balances.map(b => new Intl.NumberFormat("en-US", { style: "currency", currency: b.currency, minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(b.total)).join(" · ") || "Indisponível"); }
    catch { setLabel("Indisponível"); setError("Não foi possível consultar o saldo."); } finally { setBusy(false); }
  };
  useEffect(() => { void load(); const timer = setInterval(load, 60000); return () => clearInterval(timer); }, [refresh]);
  return <div title={error || "Saldo total da sua conta DeepSeek, incluindo outros projetos"} className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"><Wallet className="h-4 w-4"/><span>{label}</span><Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Atualizar saldo" disabled={busy} onClick={load}><RotateCw className={`h-3 w-3 ${busy ? "animate-spin" : ""}`}/></Button></div>;
}