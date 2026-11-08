import { describe, expect, it } from "vitest";
import { extractSql, siteConnectionSchema } from "@/lib/site-connection";
import { parseBackup } from "@/lib/projects";
import { extractCode, previewHtml, projectFiles } from "@/lib/forge";
const connection = { url: "https://example-project.supabase.co", publicKey: "sb_publishable_test_public_key" };

describe("generated site Supabase", () => {
  it("rejects privileged keys and only accepts publishable or anon credentials", () => {
    expect(siteConnectionSchema.safeParse(connection).success).toBe(true);
    expect(siteConnectionSchema.safeParse({...connection, publicKey:"sb_secret_very_private_key"}).success).toBe(false);
    const token = `header.${btoa(JSON.stringify({role:"service_role"}))}.signature`;
    expect(siteConnectionSchema.safeParse({...connection, publicKey:token}).success).toBe(false);
    const anon = `header.${btoa(JSON.stringify({role:"anon"}))}.signature`;
    expect(siteConnectionSchema.safeParse({...connection, publicKey:anon}).success).toBe(true);
  });
  it("preserves each project's connection and SQL in backups", () => {
    const project = { id:"one", title:"Loja", messages:[], code:"function App(){}", mode:"build", updatedAt:"2026-11-08", connection, sql:"select 1;" };
    expect(parseBackup({version:1,projects:[project]})[0]?.connection).toEqual(connection);
    expect(parseBackup({version:1,projects:[project]})[0]?.sql).toBe("select 1;");
  });
  it("exports the same connection and SQL with the required Supabase library", () => {
    const files = projectFiles("function App(){return <div/>}", connection, "select 1;");
    expect(JSON.parse(files["package.json"] ?? "{}").dependencies["@supabase/supabase-js"]).toBeDefined();
    expect(files["src/site-supabase.js"]).toContain(connection.url);
    expect(files["src/App.jsx"]).toContain('import { supabase }');
    expect(files["supabase/setup.sql"]).toBe("select 1;");
    expect(JSON.parse(files["vercel.json"] ?? "{}").rewrites[0].destination).toBe("/index.html");
  });
  it("uses a non-persistent session inside the isolated preview", () => {
    expect(previewHtml("function App(){}", connection)).toContain("persistSession:false");
    expect(previewHtml("function App(){}", connection)).toContain(connection.publicKey);
  });
  it("extracts database setup independently from app code", () => {
    expect(extractSql("```sql\nselect 1;\n```\n```jsx\nfunction App(){}\n```")).toBe("select 1;");
    expect(extractCode("```sql\nselect 1;\n```\nConfigure o banco.\n```jsx\nfunction App(){}\n```")).toBe("function App(){}");
  });
});