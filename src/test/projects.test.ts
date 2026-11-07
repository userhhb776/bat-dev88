import { describe, expect, it } from "vitest";
import { parseBackup } from "@/lib/projects";
describe("Project backups", () => {
  it("restores both the complete site and conversation", () => {
    const project = { id: "one", title: "Meu site", code: "function App(){return '2026'}", messages: [{ role: "user", text: "Meu pedido" }], mode: "chat", updatedAt: "2026-11-07" };
    expect(parseBackup({ version: 1, projects: [project] })).toEqual([project]);
  });
  it("rejects invalid backups before saving any projects", () => {
    expect(() => parseBackup({ version: 1, projects: [{ title: "Missing code" }] })).toThrow();
  });
});