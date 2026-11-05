import JSZip from "jszip";

export const SYSTEM_PROMPT = `You are an expert React + Tailwind CSS engineer. Build what the user asks as a single React component file.
Rules:
- Output ONLY one \`\`\`jsx code block, no explanation outside it except one short sentence before it.
- Define \`function App()\` as the root component. No import statements; React hooks are available as globals (useState, useEffect, useRef, useMemo, useCallback).
- Style exclusively with Tailwind CSS utility classes. Modern, polished, responsive design.
- No external images except https://images.unsplash.com or https://picsum.photos URLs. Inline SVG for icons.
- When the user asks for changes, return the FULL updated file.`;

export type Msg = { role: "user" | "model"; text: string };

export function extractCode(text: string): string | null {
  const m = text.match(/```(?:jsx|tsx|javascript|js|react)?\s*\n([\s\S]*?)(```|$)/);
  return m?.[1] ? m[1].trim() : null;
}

// Accepts a raw key or a pasted cURL snippet and returns just the key.
export function cleanKey(input: string): string {
  const m = input.match(/(AQ\.[A-Za-z0-9_\-.]+|AIza[A-Za-z0-9_\-]+)/);
  return (m?.[1] ?? input).trim().replace(/^['"]|['"]$/g, "");
}

export async function streamGemini(
  apiKey: string,
  model: string,
  history: Msg[],
  onChunk: (full: string) => void,
  signal?: AbortSignal,
) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      signal: signal ?? null,
      headers: { "Content-Type": "application/json", "x-goog-api-key": cleanKey(apiKey) },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      }),
    },
  );
  if (!res.ok || !res.body) {
    let msg = `Erro ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      try {
        const j = JSON.parse(line.slice(5));
        const t = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
        full += t;
        onChunk(full);
      } catch {}
    }
  }
  return full;
}

export type Provider = "gemini" | "groq" | "openrouter" | "deepseek";

export const PROVIDERS: Record<Provider, { label: string; url?: string; keyUrl: string; placeholder: string; models: string[] }> = {
  groq: { label: "Groq", url: "https://api.groq.com/openai/v1/chat/completions", keyUrl: "https://console.groq.com/keys", placeholder: "gsk_…", models: ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"] },
  openrouter: { label: "OpenRouter", url: "https://openrouter.ai/api/v1/chat/completions", keyUrl: "https://openrouter.ai/keys", placeholder: "sk-or-v1-…", models: ["cohere/north-mini-code:free", "google/gemma-4-31b-it:free", "nvidia/nemotron-3-ultra-550b-a55b:free"] },
  deepseek: { label: "DeepSeek", url: "https://api.deepseek.com/chat/completions", keyUrl: "https://platform.deepseek.com/api_keys", placeholder: "sk-…", models: ["deepseek-chat", "deepseek-reasoner"] },
  gemini: { label: "Gemini", keyUrl: "https://aistudio.google.com/apikey", placeholder: "AIza… ou AQ.…", models: ["gemini-3.8-flash", "gemini-flash-latest", "gemini-pro-latest"] },
};

// Built-in keys (private app, per owner's request).
export const DEFAULT_KEYS: Record<Provider, string> = {
  groq: "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",
  openrouter: "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",
  deepseek: "sk-e971b60e1ab84e09bf79f6c9fcf32609",
  gemini: "",
};

// Fallback order: selected model first, then every other model; DeepSeek is last (reserve).
export function fallbackChain(selected: string, keys: Record<Provider, string>): [Provider, string][] {
  const order: Provider[] = ["groq", "openrouter", "gemini", "deepseek"];
  const all: [Provider, string][] = order.flatMap((p) => PROVIDERS[p].models.map((m) => [p, m] as [Provider, string]));
  const [sp, sm] = selected.split("|") as [Provider, string];
  const chain = [[sp, sm] as [Provider, string], ...all.filter(([p, m]) => !(p === sp && m === sm))];
  return chain.filter(([p]) => !!keys[p]);
}

export async function streamChat(
  provider: Provider,
  apiKey: string,
  model: string,
  history: Msg[],
  onChunk: (full: string) => void,
  signal?: AbortSignal,
) {
  if (provider === "gemini") return streamGemini(apiKey, model, history, onChunk, signal);
  const res = await fetch(PROVIDERS[provider].url!, {
    method: "POST",
    signal: signal ?? null,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey.trim()}` },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: provider === "groq" ? 32000 : 16000,
      ...(provider === "groq" ? { reasoning_effort: "low" } : {}),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map((m) => ({ role: m.role === "model" ? "assistant" : "user", content: m.text })),
      ],
    }),
  });
  if (!res.ok || !res.body) {
    let msg = `Erro ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        full += JSON.parse(data)?.choices?.[0]?.delta?.content ?? "";
        onChunk(full);
      } catch {}
    }
  }
  return full;
}

function cleanForPreview(code: string) {
  return code
    .replace(/^\s*import[^;]*;?\s*$/gm, "")
    .replace(/export\s+default\s+/g, "")
    .replace(/^\s*export\s+/gm, "");
}

export function previewHtml(code: string) {
  const safe = cleanForPreview(code).replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head><body><div id="root"></div>
<script>window.onerror=function(m){document.body.innerHTML='<pre style="color:#b91c1c;padding:16px;white-space:pre-wrap;font:13px monospace">'+m+'</pre>'}</script>
<script type="text/babel" data-presets="react">
const {useState,useEffect,useRef,useMemo,useCallback,useReducer,Fragment}=React;
${safe}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
</script></body></html>`;
}

export function projectFiles(code: string): Record<string, string> {
  const body = cleanForPreview(code);
  return {
    "package.json": JSON.stringify(
      {
        name: "forge-app",
        private: true,
        version: "0.0.1",
        type: "module",
        scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
        dependencies: { react: "^18.3.1", "react-dom": "^18.3.1" },
        devDependencies: {
          "@vitejs/plugin-react": "^4.3.4",
          vite: "^5.4.11",
          tailwindcss: "^3.4.17",
          postcss: "^8.4.49",
          autoprefixer: "^10.4.20",
        },
      },
      null,
      2,
    ),
    "vite.config.js": `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()] });\n`,
    "tailwind.config.js": `export default { content: ["./index.html", "./src/**/*.{js,jsx}"], theme: { extend: {} }, plugins: [] };\n`,
    "postcss.config.js": `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };\n`,
    "index.html": `<!doctype html>\n<html lang="pt-BR">\n<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Forge App</title></head>\n<body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>\n</html>\n`,
    "src/index.css": `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`,
    "src/main.jsx": `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App.jsx";\nimport "./index.css";\nReactDOM.createRoot(document.getElementById("root")).render(<App />);\n`,
    "src/App.jsx": `import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer, Fragment } from "react";\n\n${body}\n\nexport default App;\n`,
  };
}

export async function downloadZip(code: string) {
  const zip = new JSZip();
  for (const [p, c] of Object.entries(projectFiles(code))) zip.file(p, c);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "forge-app.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function deployVercel(token: string, code: string): Promise<string> {
  const files = Object.entries(projectFiles(code)).map(([file, data]) => ({ file, data }));
  const res = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "forge-app",
      files,
      target: "production",
      projectSettings: { framework: "vite", buildCommand: "vite build", outputDirectory: "dist", installCommand: "npm install" },
    }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error?.message ?? `Erro ${res.status}`);
  return `https://${j.url}`;
}
