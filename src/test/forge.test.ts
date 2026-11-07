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
    expect(prepareHistory([{ role: "model", text: previous }], "chat")[0].content).not.toContain("Private source");
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