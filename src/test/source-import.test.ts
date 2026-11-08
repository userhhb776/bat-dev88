import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { formatSources, isSourcePath, parseGitHubRepository, readSourceZip } from "@/lib/source-import";

describe("source import", () => {
  it("reads JSX and styles from ZIP without dependencies, repository metadata or secrets", async () => {
    const zip = new JSZip();
    zip.file("site/src/App.jsx", "function App(){return <h1>Loja</h1>}");
    zip.file("site/src/styles.css", "body { margin: 0 }");
    zip.file("site/.env", "SECRET=hidden");
    zip.file("site/node_modules/lib/index.js", "dependency");
    zip.file("site/.git/config", "metadata");
    const result = await readSourceZip(await zip.generateAsync({ type: "arraybuffer" }), "loja.zip");
    expect(result.count).toBe(2);
    expect(result.text).toContain("<h1>Loja</h1>");
    expect(result.text).not.toContain("SECRET=hidden");
    expect(result.text).not.toContain("dependency");
    expect(result.text).not.toContain("metadata");
  });
  it("only accepts public GitHub repository URLs on the exact HTTPS host", () => {
    expect(parseGitHubRepository("https://github.com/me/loja.git")).toEqual({owner:"me",repo:"loja",ref:undefined});
    expect(parseGitHubRepository("https://github.com/me/loja/tree/feature/catalog").ref).toBe("feature/catalog");
    expect(() => parseGitHubRepository("https://github.com.attacker.com/me/loja")).toThrow();
    expect(() => parseGitHubRepository("http://github.com/me/loja")).toThrow();
    expect(isSourcePath("../.env")).toBe(false);
  });
  it("reports truncation instead of silently claiming all source was imported", () => {
    const result = formatSources([{path:"App.jsx", content:"a".repeat(70000)}], "ZIP");
    expect(result.omitted).toBe(1);
    expect(result.text).not.toContain("a".repeat(60001));
  });
  it("rejects non-ZIP files", async () => {
    await expect(readSourceZip(new TextEncoder().encode("not a zip").buffer, "bad.zip")).rejects.toThrow();
  });
});