import { useEffect, useMemo, useRef, useState } from "react";
import { previewHtml } from "@/lib/forge";
import type { SiteConnection } from "@/lib/site-connection";

/** Miniatura viva do site: renderiza o preview em escala reduzida, só quando o cartão aparece na tela. */
export function ForgeThumb({ code, connection }: { code: string; connection?: SiteConnection | undefined }) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false), [scale, setScale] = useState(0.3);
  const html = useMemo(() => (visible ? previewHtml(code, connection) : ""), [visible, code, connection]);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setVisible(true); io.disconnect(); } }, { rootMargin: "200px" });
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1280));
    io.observe(el); ro.observe(el);
    return () => { io.disconnect(); ro.disconnect(); };
  }, []);
  return <div ref={box} aria-hidden className="pointer-events-none relative h-full w-full overflow-hidden">
    {html && <iframe title="miniatura" tabIndex={-1} sandbox="allow-scripts" srcDoc={html} className="absolute left-0 top-0 origin-top-left border-0" style={{ width: 1280, height: 640, transform: `scale(${scale})` }}/>}
  </div>;
}
