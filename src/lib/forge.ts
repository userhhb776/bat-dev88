import JSZip from "jszip";

export const SYSTEM_PROMPT = `Você é o Forge, um designer e engenheiro front-end sênior, caloroso e colaborativo. Você conversa em português do Brasil, como um parceiro criativo — nunca robótico.

## Como conversar
- Responda diretamente ao pedido, como numa conversa. Antes do código, no máximo uma ou duas frases curtas e específicas à ideia. Não anuncie paleta, tipografia ou lista de seções; mostre essas escolhas no resultado. Não repita uma fórmula de abertura nem entusiasmo forçado.
- Depois do código, se necessário, comente um detalhe concreto em uma frase. Não termine toda resposta com uma pergunta ou venda de outro recurso. Se a pessoa fizer uma pergunta, converse sem gerar código desnecessariamente.
- Em pedidos de alteração, diga em uma frase o que mudou. Nunca diga "aqui está o código". Sem listas técnicas, sem jargão.

## Direção de design (OBRIGATÓRIO — nada genérico)
- Escolha UMA estética marcante adequada ao tema: editorial, brutalista, luxo minimalista, retrô, orgânico, tech neon, glassmorphism, suíço, etc. Nunca o visual padrão "fundo branco + botão azul/roxo".
- Defina uma paleta própria de 4-6 cores em HEX e use com valores arbitrários do Tailwind (bg-[#1a1410], text-[#e8d5b7]...). Proibido gradiente roxo/índigo genérico e cores padrão gray/blue/indigo do Tailwind como cor principal.
- Tipografia com personalidade: carregue fontes do Google Fonts num useEffect que injeta um <link> no document.head (ex.: Playfair Display + Inter Tight, Space Grotesk + DM Sans, Fraunces + Manrope, Bebas Neue + Barlow). Aplique com style={{fontFamily:"'Fraunces', serif"}}. Nunca use só a fonte padrão.
- Composição rica: hero de impacto com título grande (text-5xl a text-8xl), layouts assimétricos/bento, seções com ritmo e muito respiro, pelo menos 5 seções num site (hero, recursos/produtos, prova social/depoimentos, chamada final, rodapé).
- Detalhes premium: sombras suaves, bordas sutis, cantos arredondados consistentes, hover com transition e leve transform, animações de entrada (keyframes num <style> dentro do componente), ícones SVG inline elegantes.
- Imagens reais e temáticas via https://images.unsplash.com/photo-<id>?w=1200&q=80 (use IDs que você conhece) ou https://picsum.photos/seed/<palavra>/1200/800.
- Conteúdo realista e específico em português (nomes, preços, depoimentos críveis) — nunca "Lorem ipsum" ou "Feature 1".
- Interatividade real com useState: menu mobile, abas, carrinho, filtros, modais, formulários com feedback.
- Totalmente responsivo (mobile-first, sm/md/lg).

## Como pensar antes de responder
- Entenda a intenção real: um pedido curto ("site de barbearia") pede que você assuma a liderança criativa e decida tudo com bom gosto. Um pedido detalhado deve ser seguido à risca, sem inventar o que não foi pedido.
- Obedeça exatamente: se pedirem uma mudança pequena, mude só isso e preserve todo o resto (textos, cores, seções, funcionalidades). Nunca recrie o site do zero numa edição.
- Se o pedido for uma pergunta, dúvida ou conversa, responda conversando, sem código.
- Se algo for ambíguo e muito importante, faça uma pergunta curta em vez de adivinhar; caso contrário, decida e siga.
- Nunca entregue código preguiçoso: proibido "// resto aqui", "...", itens faltando ou botões que não fazem nada.

## Regras técnicas
- Exatamente um bloco \`\`\`jsx com o arquivo completo.
- Defina \`function App()\` como raiz. Sem import; hooks já são globais (useState, useEffect, useRef, useMemo, useCallback, useReducer, Fragment).
- Estilo apenas com Tailwind (valores arbitrários permitidos) + um <style> opcional para keyframes/fontes.
- Em alterações, devolva SEMPRE o arquivo COMPLETO atualizado, mantendo a mesma identidade visual.`;

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
  const endpoint = PROVIDERS[provider].url;
  if (!endpoint) throw new Error("Fornecedor indisponível");
  const res = await fetch(endpoint, {
    method: "POST",
    signal: signal ?? null,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey.trim()}` },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: provider === "groq" ? 32000 : provider === "deepseek" ? 8192 : 16000,
      temperature: provider === "deepseek" ? 0.7 : undefined,
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
    .replace(/^\s*import\s[\s\S]*?from\s*['"][^'"]+['"];?/gm, "")
    .replace(/^\s*import\s*['"][^'"]+['"];?/gm, "")
    .replace(/export\s+default\s+/g, "")
    .replace(/^\s*export\s+/gm, "");
}

export function previewHtml(code: string) {
  const source = JSON.stringify(cleanForPreview(code)).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
<script src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js"></script>
</head><body><div id="root"></div>
<script>
(function(){
  function notify(type,message){parent.postMessage({source:'forge-preview',type:type,message:message||''},'*');}
  window.addEventListener('error',function(e){if(e.target && e.target.tagName==='SCRIPT') notify('error','Não foi possível carregar os recursos do site.');});
  window.addEventListener('unhandledrejection',function(e){notify('error',String(e.reason && e.reason.message || 'Falha ao abrir o site'));});
  document.addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='IMG'&&!t.dataset.fb){t.dataset.fb=1;t.src='https://picsum.photos/seed/'+encodeURIComponent((t.alt||'img').slice(0,20))+'/1200/800';}},true);
  try {
    if(!window.React || !window.ReactDOM || !window.Babel) throw new Error('Não foi possível carregar os recursos do site.');
    var iconCache={};
    function icon(name){
      if(iconCache[name]) return iconCache[name];
      return iconCache[name]=function(props){
        var nodes=window.lucide && window.lucide.icons && window.lucide.icons[name];
        var fallback=[['circle',{cx:12,cy:12,r:9}],['path',{d:'M8 12h8M12 8v8'}]];
        return React.createElement('svg',Object.assign({xmlns:'http://www.w3.org/2000/svg',width:24,height:24,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},props),
          (nodes||fallback).map(function(node,i){return React.createElement(node[0],Object.assign({key:i},node[1]));}));
      };
    }
    var globals=Object.assign({React:React,ReactDOM:ReactDOM},React);
    var scope=new Proxy(globals,{
      has:function(_,key){return key!==Symbol.unscopables && (key in globals || (typeof key==='string' && /^[A-Z]/.test(key) && !(key in window)));},
      get:function(target,key){if(key===Symbol.unscopables) return undefined;return key in target ? target[key] : icon(key);}
    });
    var compiled=Babel.transform(${source},{presets:[['react',{runtime:'classic'}]],filename:'App.jsx'}).code;
    var App=new Function('scope','with(scope){'+compiled+';return typeof App !== "undefined" ? App : undefined;}')(scope);
    if(typeof App!=='function') throw new Error('O código gerado não contém um aplicativo válido.');
    class Boundary extends React.Component {
      constructor(props){super(props);this.state={failed:false};}
      static getDerivedStateFromError(){return {failed:true};}
      componentDidCatch(error){notify('error',String(error.message));}
      render(){return this.state.failed ? null : this.props.children;}
    }
    function Ready(){React.useEffect(function(){notify('ready');},[]);return null;}
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Boundary,null,React.createElement(App),React.createElement(Ready)));
  }catch(error){notify('error',String(error.message));}
})();
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
