import { describe, expect, it } from "vitest";
import { buildPrompt, extractCode, prepareHistory, previewHtml } from "@/lib/forge";

describe("Forge generation", () => {
  it("extracts the full JSX separately from conversation", () => {
    expect(extractCode('Vou criar a cafeteria.\n```jsx\nfunction App(){return <h1>Café</h1>}\n```\nPronto.')).toBe('function App(){return <h1>Café</h1>}');
  });
  it("supplies the current year rather than a stale training year", () => {
    expect(buildPrompt("build", new Date("2026-11-07T14:41:00Z"))).toContain("Use o ano 2026");
  });
  it("avoids sending previous full sites in economical conversation mode", () => {
    const previous = 'Site pronto.\n```jsx\nfunction App(){return <h1>Private source</h1>}\n```';
    expect(prepareHistory([{ role: "model", text: previous }], "chat")[0]?.content).not.toContain("Private source");
    expect(buildPrompt("chat", new Date("2026-11-07"), "CURRENT_CODE")).not.toContain("CURRENT_CODE");
  });
  it("preserves the current source as the basis for build edits", () => {
    expect(buildPrompt("build", new Date("2026-11-07"), "function App(){return 'Original'}")).toContain("function App(){return 'Original'}");
  });
  it("keeps script closing tags in generated code inert", () => {
    const html = previewHtml('function App(){return <p>{"</script><script>BAD()</script>"}</p>}');
    expect(html).not.toContain('<script>BAD()');
    expect(html).toContain('\\u003c/script>');
  });
});
import { applyEdits, wantsBuild } from "@/lib/forge";
describe("BatDev rules", () => {
  it("builds when asked to create, even in conversation mode", () => {
    expect(wantsBuild("Crie um site para minha barbearia", false)).toBe(true);
    expect(wantsBuild("faça uma landing page", false)).toBe(true);
  });
  it("stays in conversation for questions", () => {
    expect(wantsBuild("O que você acha de tons escuros?", true)).toBe(false);
  });
  it("treats change requests as builds only when a site exists", () => {
    expect(wantsBuild("troque a cor do botão", true)).toBe(true);
    expect(wantsBuild("troque a cor do botão", false)).toBe(false);
  });
  it("applies visual text and image edits to the source", () => {
    const code = '<h1>Café Aurora</h1><img src="https://a.com/1.jpg"/>';
    const out = applyEdits(code, [{ kind: "text", from: "Café Aurora", to: "Café {Lua}" }, { kind: "img", from: "https://a.com/1.jpg", to: "https://b.com/2.jpg" }, { kind: "text", from: "Inexistente", to: "x" }]);
    expect(out.code).toBe('<h1>Café Lua</h1><img src="https://b.com/2.jpg"/>');
    expect(out.missed).toBe(1);
  });
});

import { parseDecisions as pd, extractCode as ec } from "@/lib/forge";
describe("decisions", () => {
  const reply = "Ok.\n```decisoes\ncor: #112233 fundo\narquivo: App.jsx — topo\n```\n```jsx\nfunction App(){return <div/>}\n```";
  it("reads design decisions", () => { expect(pd(reply)).toEqual([{ kind: "cor", text: "#112233 fundo" }, { kind: "arquivo", text: "App.jsx — topo" }]); });
  it("ignores decisions when extracting code", () => { expect(ec(reply)).toBe("function App(){return <div/>}"); });
});

import { missingComponents } from "@/lib/forge";
describe("export icons", () => {
  it("declares undeclared icon tags for the Vercel build, but not local components", () => {
    expect(missingComponents(`function Card(){return <Star/>} function App(){return <div><Card/><ShoppingBag className="x"/></div>}`).sort()).toEqual(["ShoppingBag", "Star"]);
  });
});
