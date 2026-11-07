import { z } from "zod";
import type { Msg } from "./forge";

export type Mode = "chat" | "build";
export type Project = { id: string; title: string; messages: Msg[]; code: string; mode: Mode; updatedAt: string; repo?: string; repoUrl?: string; siteUrl?: string };
const schema = z.object({ id: z.string(), title: z.string().min(1), messages: z.array(z.object({ role: z.enum(["user", "model"]), text: z.string() })), code: z.string(), mode: z.enum(["chat", "build"]), updatedAt: z.string(), repo: z.string().optional(), repoUrl: z.string().optional(), siteUrl: z.string().optional() });
export function parseBackup(value: unknown): Project[] {
  return z.object({ version: z.literal(1), projects: z.array(schema) }).parse(value).projects;
}
export function newProject(text = ""): Project {
  return { id: crypto.randomUUID(), title: text.trim().slice(0, 64) || "Novo projeto", messages: [], code: "", mode: "chat", updatedAt: new Date().toISOString() };
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("forge-projects", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("projects", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("projects", mode);
    const request = operation(tx.objectStore("projects"));
    tx.oncomplete = () => { resolve(request.result); db.close(); };
    tx.onabort = tx.onerror = () => { reject(tx.error); db.close(); };
  });
}
export async function listProjects() {
  const projects = await transaction("readonly", store => store.getAll());
  return z.array(schema).parse(projects).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export const saveProject = (project: Project) => transaction("readwrite", store => store.put(project));
export const deleteProject = (id: string) => transaction("readwrite", store => store.delete(id));
export function exportBackup(projects: Project[]) {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, projects }, null, 2)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = "batdev-projetos.json"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}