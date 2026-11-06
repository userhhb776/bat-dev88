import { describe, expect, it } from "vitest";
import { extractCode, fallbackChain, previewHtml } from "@/lib/forge";

describe("Forge generation", () => {
  it("extracts the full JSX separately from conversation", () => {
    expect(extractCode('Vou criar a cafeteria.\n```jsx\nfunction App(){return <h1>Café</h1>}\n```\nPronto.')).toBe('function App(){return <h1>Café</h1>}');
  });
  it("keeps DeepSeek as the reserve after available providers", () => {
    const chain = fallbackChain("groq|openai/gpt-oss-120b", { groq: "test", openrouter: "test", gemini: "", deepseek: "test" });
    const firstReserve = chain.findIndex(([provider]) => provider === "deepseek");
    expect(firstReserve).toBeGreaterThan(0);
    expect(chain.slice(firstReserve).every(([provider]) => provider === "deepseek")).toBe(true);
  });
  it("keeps script closing tags in generated code inert", () => {
    const html = previewHtml('function App(){return <p>{"</script><script>BAD()</script>"}</p>}');
    expect(html).not.toContain('<script>BAD()');
    expect(html).toContain('\\u003c/script>');
  });
});