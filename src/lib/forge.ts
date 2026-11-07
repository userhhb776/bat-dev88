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
- Construa a experiência apropriada: ferramentas e dashboards abrem no produto funcional, não numa landing page. Sites editoriais têm ritmo e hierarquia, sem forçar seções desnecessárias. Use imagens temáticas, nunca fotos aleatórias como produto.
- Detalhes premium: sombras suaves, bordas sutis, cantos arredondados consistentes, hover com transition e leve transform, animações de entrada (keyframes num <style> dentro do componente), ícones SVG inline elegantes.
- Imagens reais e temáticas via https://images.unsplash.com/photo-<id>?w=1200&q=80 (use IDs que você conhece) ou https://picsum.photos/seed/<palavra>/1200/800.
- Conteúdo específico em português, sem Lorem ipsum. Não invente depoimentos como reais, telefone ou horários. Identifique preços e nomes fictícios como demonstração na conversa.
- Interatividade real com useState: menu mobile, abas, carrinho, filtros, modais, formulários com feedback.
- Totalmente responsivo (mobile-first, sm/md/lg).

## Como pensar antes de responder
- Entenda a intenção real: um pedido curto ("site de barbearia") pede que você assuma a liderança criativa e decida tudo com bom gosto. Um pedido detalhado deve ser seguido à risca, sem inventar o que não foi pedido.
- Obedeça exatamente: se pedirem uma mudança pequena, mude só isso e preserve todo o resto (textos, cores, seções, funcionalidades). Nunca recrie o site do zero numa edição.
- Se o pedido for uma pergunta, dúvida ou conversa, responda conversando, sem código.
- Se algo for ambíguo e muito importante, faça uma pergunta curta em vez de adivinhar; caso contrário, decida e siga.
- Nunca entregue código preguiçoso: proibido "// resto aqui", "...", itens faltando ou botões que não fazem nada.

## Regras técnicas
- Apenas ao construir: exatamente um bloco \`\`\`jsx com o arquivo completo.
- Defina \`function App()\` como raiz. Sem import; hooks já são globais (useState, useEffect, useRef, useMemo, useCallback, useReducer, Fragment).
- Estilo apenas com Tailwind (valores arbitrários permitidos) + um <style> opcional para keyframes/fontes.
- Em alterações, devolva SEMPRE o arquivo COMPLETO atualizado, mantendo a mesma identidade visual.`;

export type Msg = { role: "user" | "model"; text: string };

export function extractCode(text: string): string | null {
  const m = text.match(/```(?:jsx|tsx|javascript|js|react)?\s*\n([\s\S]*?)(```|$)/);
  return m?.[1] ? m[1].trim() : null;
}

export function buildPrompt(mode: "chat" | "build", date: Date, code = "") {
  return `${SYSTEM_PROMPT}
Data atual: ${date.toISOString().slice(0, 10)}. Use o ano ${date.getUTCFullYear()} em coleções e copyright, exceto se o usuário pedir outra data. Não alegue acesso a notícias ou à internet.
${mode === "chat" ? "MODO CONVERSA: apenas converse e planeje. Nunca gere código, nem quando pedirem para criar. Não envie o arquivo atual nem o reescreva. Responda em até 100 palavras, naturalmente, em 1 ou 2 parágrafos. Não dê checklist de identidade, paleta ou fontes; fale do objetivo da pessoa. No máximo UMA pergunta, apenas se a resposta for necessária. Não repita a instrução de escolher Construir a cada mensagem." : "MODO CONSTRUÇÃO: implemente o pedido; devolva um único bloco jsx completo. Preserve as partes não mencionadas em alterações."}
${mode === "build" && code ? `Site atual (base obrigatória para alterações):\n${code}` : ""}`;
}
export function prepareHistory(history: Msg[], mode: "chat" | "build") {
  // Previous full sources are redundant: buildPrompt carries the current version.
  return history.slice(mode === "chat" ? -16 : -24).map(m => ({
    role: m.role === "model" ? "assistant" : "user",
    content: m.text.replace(/```[\s\S]*?(```|$)/g, "[Site salvo no projeto]").trim() || "Site atualizado.",
  }));
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
