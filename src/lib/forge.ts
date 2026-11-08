import JSZip from "jszip";
import { connectionPrompt, type SiteConnection } from "./site-connection";
import { createSiteTracking, trackingPrompt } from "./site-tracking";
import { cleanGeneratedSource } from "./generated-source";

export const SYSTEM_PROMPT = `Você é o BatDev, um designer e engenheiro front-end sênior, caloroso e colaborativo. Você conversa em português do Brasil, como um parceiro criativo — nunca robótico.

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
- Imagens: quando precisar de imagem exclusiva (ou o usuário pedir para gerar/criar uma imagem), GERE com IA via URL https://image.pollinations.ai/prompt/<descrição detalhada em inglês, codificada com %20>?width=1200&height=800&nologo=true (ajuste width/height ao formato). Também pode usar fotos reais https://images.unsplash.com/photo-<id>?w=1200&q=80. Se o usuário enviar uma URL de imagem/vídeo dele, use exatamente essa URL.
- Conteúdo específico em português, sem Lorem ipsum. Não invente depoimentos como reais, telefone ou horários. Identifique preços e nomes fictícios como demonstração na conversa.
- Interatividade real com useState: menu mobile, abas, carrinho, filtros, modais, formulários com feedback.

## Mobile-first (OBRIGATÓRIO — celular e computador com a mesma qualidade)
- Escreva primeiro para 360px de largura e só depois amplie com sm:/md:/lg:. Nunca use larguras fixas em px para blocos; use w-full, max-w-* e mx-auto.
- Todo conteúdo dentro de um container: \`mx-auto w-full max-w-6xl px-5 sm:px-8\`. Nada encostado na borda, nada vazando horizontalmente (adicione overflow-x-hidden na raiz).
- No celular, textos de destaque e chamadas ficam centralizados (text-center md:text-left) e alinhados ao mesmo eixo; títulos escalam (text-4xl sm:text-5xl lg:text-7xl) com leading-tight e break-words.
- Grids começam em uma coluna: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3. Flex em linha só a partir de md: (flex-col md:flex-row). Imagens com w-full, h-auto ou aspect-* + object-cover.
- Botões com área de toque mínima de 44px, w-full sm:w-auto no celular quando forem a ação principal. Espaçamento vertical generoso (py-16 sm:py-24).
- Menu: no celular, botão hambúrguer funcional com painel que abre e fecha; links completos só a partir de md:.

## Como pensar antes de responder
- Entenda a intenção real: um pedido curto ("site de barbearia") pede que você assuma a liderança criativa e decida tudo com bom gosto. Um pedido detalhado deve ser seguido à risca, sem inventar o que não foi pedido.
- Obedeça exatamente: se pedirem uma mudança pequena, mude só isso e preserve todo o resto (textos, cores, seções, funcionalidades). Nunca recrie o site do zero numa edição.
- Se o pedido for uma pergunta, dúvida ou conversa, responda conversando, sem código.
- Se algo for ambíguo e muito importante, faça uma pergunta curta em vez de adivinhar; caso contrário, decida e siga.
- Nunca entregue código preguiçoso: proibido "// resto aqui", "...", itens faltando ou botões que não fazem nada.

## Regras técnicas
- Apenas ao construir: ANTES do código, um bloco \`\`\`decisoes com 3 a 7 linhas no formato "tipo: descrição curta", onde tipo é cor, fonte, layout, interacao, arquivo ou conteudo (ex.: "cor: #0f1a14 verde-floresta como fundo", "arquivo: App.jsx — nova seção de preços"). Depois, exatamente um bloco \`\`\`jsx com o arquivo completo.
- Defina \`function App()\` como raiz. Sem import; hooks já são globais (useState, useEffect, useRef, useMemo, useCallback, useReducer, Fragment).
- Estilo apenas com Tailwind (valores arbitrários permitidos) + um <style> opcional para keyframes/fontes.
- Em alterações, devolva SEMPRE o arquivo COMPLETO atualizado, mantendo a mesma identidade visual.

## Qualidade obrigatória do código (o site é compilado com esbuild na publicação — um erro derruba tudo)
- Feche TODA string de atributo: className="..." sempre termina com aspas antes do >. Revise mentalmente cada tag antes de terminar.
- Cada tag aberta precisa ser fechada; tags vazias usam /> (img, input, br, path, circle). Um único elemento raiz no return.
- Nunca escreva { ou } soltos no texto JSX; use {"{"}. Use className, htmlFor, strokeWidth (camelCase), nunca class.
- Não deixe classes coladas ou erradas (ex.: "flexflex"). Não use variáveis, componentes ou funções que não definiu; ícones apenas como componentes lucide (ex.: <ArrowRight />) ou SVG inline.
- Desempenho: no máximo 4 imagens Pollinations por página e só onde forem essenciais; para fotos genéricas prefira Unsplash. Toda <img> com loading="lazy" (exceto a primeira) e alt. Nada de setInterval mais rápido que 1s, nem loops pesados no render.
- Ao corrigir um erro informado, ache a linha exata citada, conserte a causa e confira o arquivo inteiro por erros do mesmo tipo.`;

export type Msg = { role: "user" | "model"; text: string };

export type Decision = { kind: string; text: string };
/** Reads the design-decision notes the model writes before the code. */
export function parseDecisions(text: string): Decision[] {
  const block = text.match(/```decis[oõ]es\s*\n([\s\S]*?)```/i)?.[1] ?? "";
  return block.split("\n").map(l => l.replace(/^[-•*\s]+/, "").trim()).filter(Boolean).map(l => {
    const i = l.indexOf(":");
    return i > 0 && i < 20 ? { kind: l.slice(0, i).trim().toLowerCase(), text: l.slice(i + 1).trim() } : { kind: "nota", text: l };
  }).slice(0, 10);
}

export function extractCode(text: string): string | null {
  text = text.replace(/```(?:decis[oõ]es|sql)\s*\n[\s\S]*?```/gi, "");
  const m = text.match(/```(?:jsx|tsx|javascript|js|react)?\s*\n([\s\S]*?)(```|$)/);
  return m?.[1] ? m[1].trim() : null;
}

const BUILD_WORDS = /\b(crie|cria|criar|crio|fa[cç]a|faz|fazer|gere|gera|gerar|monte|monta|montar|construa|constr[oó]i|construir|desenvolva|desenvolver|produza|bote|pode criar|pode fazer|manda ver)\b/i;
const EDIT_WORDS = /\b(mude|muda|mudar|troque|troca|trocar|altere|altera|alterar|adicione|adiciona|adicionar|coloque|coloca|colocar|remova|remove|tire|tira|aumente|diminua|deixe|deixa|corrija|corrige|ajuste|ajusta|melhore|melhora|substitua|centralize|inclua)\b/i;
/** Decides when a message is a construction request, regardless of the selected mode. */
export function wantsBuild(text: string, hasCode: boolean) {
  const t = text.trim();
  if (/\?\s*$/.test(t) && !/^(pode|consegue)\b/i.test(t)) return false;
  return BUILD_WORDS.test(t) || (hasCode && EDIT_WORDS.test(t));
}

export type VisualEdit = { kind: "text" | "img"; from: string; to: string };
const jsxText = (value: string) => value.replace(/[{}<>]/g, "");
/** Applies visual edits from the preview back to the JSX source by exact replacement. */
export function applyEdits(code: string, edits: VisualEdit[]) {
  let next = code, missed = 0;
  for (const edit of edits) {
    const from = edit.from.trim(), to = edit.kind === "text" ? jsxText(edit.to.trim()) : edit.to.trim();
    if (!from || from === to) continue;
    if (next.includes(from)) { next = next.replace(from, to); continue; }
    const loose = new RegExp(from.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+"));
    if (loose.test(next)) next = next.replace(loose, to); else missed++;
  }
  return { code: next, missed };
}

export function buildPrompt(mode: "chat" | "build", date: Date, code = "", connection?: SiteConnection) {
  return `${SYSTEM_PROMPT}
${connectionPrompt(connection)}
${trackingPrompt}
Data atual: ${date.toISOString().slice(0, 10)}. Use o ano ${date.getUTCFullYear()} em coleções e copyright, exceto se o usuário pedir outra data. Não alegue acesso a notícias ou à internet.
${mode === "chat" ? "MODO CONVERSA: apenas converse e planeje. Nunca gere código, nem quando pedirem para criar. Não envie o arquivo atual nem o reescreva. Responda em até 120 palavras, naturalmente, em 1 ou 2 parágrafos. Não dê checklist de identidade, paleta ou fontes; fale do objetivo da pessoa. No máximo UMA pergunta, apenas se a resposta for necessária. Não repita a instrução de escolher Construir a cada mensagem." : "MODO CONSTRUÇÃO: implemente o pedido; devolva um único bloco jsx completo. Preserve as partes não mencionadas em alterações."}
${mode === "build" && code ? `Site atual (base obrigatória para alterações):\n${code}` : ""}`;
}
export function prepareHistory(history: Msg[], mode: "chat" | "build") {
  // Previous full sources are redundant: buildPrompt carries the current version.
  return history.slice(mode === "chat" ? -16 : -24).map(m => ({
    role: m.role === "model" ? "assistant" : "user",
    content: m.text.replace(/```[\s\S]*?(```|$)/g, "[Site salvo no projeto]").trim() || "Site atualizado.",
  }));
}

const cleanForPreview = cleanGeneratedSource;

export function previewHtml(code: string, connection?: SiteConnection) {
  const source = JSON.stringify(cleanForPreview(code)).replace(/</g, "\\u003c");
  const connectionJson = JSON.stringify(connection ?? null).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="preconnect" href="https://cdn.jsdelivr.net"/>
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js"></script>
<script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lucide@0.468.0/dist/umd/lucide.min.js"></script>
${connection ? '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>' : ""}
</head><body><div id="root"></div>
<script>
(function(){
  function notify(type,message){parent.postMessage({source:'forge-preview',type:type,message:message||''},'*');}
  window.addEventListener('error',function(e){if(e.target && e.target.tagName==='SCRIPT') notify('error','Não foi possível carregar os recursos do site.');});
  window.addEventListener('unhandledrejection',function(e){notify('error',String(e.reason && e.reason.message || 'Falha ao abrir o site'));});
  var editing=false,current=null;
  var css=document.createElement('style');css.textContent='.bd-edit [data-bd-hover]{outline:2px dashed #ffd600!important;outline-offset:2px;cursor:text}.bd-edit img[data-bd-hover]{cursor:pointer}[contenteditable=true]{outline:2px solid #ffd600!important;outline-offset:2px}';document.head.appendChild(css);
  function leaf(el){if(!el||el===document.body||el.id==='root')return null;if(el.tagName==='IMG')return el;var t=(el.textContent||'').trim();if(!t||t.length>600)return null;for(var i=0;i<el.children.length;i++){var c=el.children[i];if(!/^(B|I|EM|STRONG|SPAN|BR|SVG)$/.test(c.tagName))return null;}return el;}
  document.addEventListener('mouseover',function(e){if(!editing)return;var el=leaf(e.target);document.querySelectorAll('[data-bd-hover]').forEach(function(n){n.removeAttribute('data-bd-hover');});if(el)el.setAttribute('data-bd-hover','');},true);
  document.addEventListener('click',function(e){if(!editing)return;var el=leaf(e.target);e.preventDefault();e.stopPropagation();if(!el)return;
    if(el.tagName==='IMG'){var from=el.getAttribute('src')||'';var to=prompt('Cole a URL da nova imagem OU descreva a imagem que a IA deve gerar:',from);if(to&&!/^(https?:|data:)/.test(to.trim()))to='https://image.pollinations.ai/prompt/'+encodeURIComponent(to.trim())+'?width=1200&height=800&nologo=true';if(to&&to!==from){el.src=to;notify('change',JSON.stringify({kind:'img',from:from,to:to}));}return;}
    if(current===el)return;current=el;var before=el.innerText;el.contentEditable='true';el.focus();
    el.addEventListener('blur',function done(){el.removeEventListener('blur',done);el.contentEditable='false';current=null;var after=el.innerText;if(after.trim()!==before.trim())notify('change',JSON.stringify({kind:'text',from:before,to:after}));});
  },true);
  document.addEventListener('keydown',function(e){if(current&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();current.blur();}},true);
  window.addEventListener('message',function(e){if(e.source!==parent||!e.data||e.data.source!=='batdev-host')return;editing=!!e.data.edit;document.documentElement.classList.toggle('bd-edit',editing);if(!editing&&current)current.blur();});
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
    var config=${connectionJson};
    var client=config && window.supabase ? window.supabase.createClient(config.url,config.publicKey,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}}) : null;
    if(config && !client) throw new Error('Não foi possível carregar o Supabase.');
    var batTracking=(${createSiteTracking.toString()})(window,true);
    var globals=Object.assign({React:React,ReactDOM:ReactDOM,supabase:client,batTracking:batTracking},React);
    var scope=new Proxy(globals,{
      has:function(_,key){return key!==Symbol.unscopables && (key in globals || (typeof key==='string' && /^[A-Z]/.test(key) && !(key in window)));},
      get:function(target,key){if(key===Symbol.unscopables) return undefined;return key in target ? target[key] : icon(key);}
    });
    var compiled;try{compiled=Babel.transform(${source},{presets:[['react',{runtime:'classic'}]],filename:'App.jsx'}).code;}catch(se){throw new Error('Erro de sintaxe no código: '+String(se.message).split('\\n').slice(0,6).join(' | '));}
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

export function projectFiles(code: string, connection?: SiteConnection, sql = ""): Record<string, string> {
  const body = cleanForPreview(code);
  return {
    "package.json": JSON.stringify(
      {
        name: "batdev-app",
        private: true,
        version: "0.0.1",
        type: "module",
        scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
        dependencies: { react: "^18.3.1", "react-dom": "^18.3.1", "lucide-react": "^0.468.0", ...(connection ? { "@supabase/supabase-js": "^2.119.0" } : {}) },
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
    "index.html": `<!doctype html>\n<html lang="pt-BR">\n<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>BatDev App</title></head>\n<body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>\n</html>\n`,
    "src/index.css": `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`,
    "src/main.jsx": `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App.jsx";\nimport "./index.css";\nReactDOM.createRoot(document.getElementById("root")).render(<App />);\n`,
    "src/icons.jsx": `import * as L from "lucide-react";\nexport const icon = (name) => L[name] || L[name + "Icon"] || L.Circle;\n`,
    "src/site-supabase.js": connection ? `import { createClient } from "@supabase/supabase-js";\nexport const supabase = createClient(${JSON.stringify(connection.url)}, ${JSON.stringify(connection.publicKey)});\n` : "export const supabase = null;\n",
    "src/site-tracking.js": `export const batTracking = (${createSiteTracking.toString()})(window, false);\n`,
    "TRACKING.md": "O objeto batTracking é compartilhado entre preview e exportação. Configure um ID real com configure({pixelId}); conceda/revogue autorização com setConsent(true/false). O Pixel só carrega após autorização explícita. A preferência não é persistida automaticamente: adapte à sua plataforma de consentimento e política de privacidade. No preview os eventos são simulados, sem envio à Meta. attribution() lê somente os parâmetros permitidos da URL atual; attributedUrl(url) preserva parâmetros existentes no checkout; whatsappUrl(numero,mensagem) acrescenta a origem na mensagem. Nenhum dado pessoal deve ser enviado em track(event,params). Lead e Purchase exigem confirmação real. CAPI e outras ferramentas não estão conectadas. Verifique os eventos no Meta Events Manager no seu domínio publicado antes de anunciar.\n",
    "src/App.jsx": `import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer, Fragment } from "react";\nimport { supabase } from "./site-supabase.js";\nimport { batTracking } from "./site-tracking.js";\nimport { icon } from "./icons.jsx";\n${missingComponents(body).map(n => `const ${n} = icon("${n}");`).join("\n")}\n\n${body}\n\nexport default App;\n`,
    "vercel.json": JSON.stringify({ rewrites: [{ source: "/((?!assets/).*)", destination: "/index.html" }] }),
    ...(sql ? { "supabase/setup.sql": sql, "SUPABASE-SETUP.md": "Execute supabase/setup.sql no SQL Editor do seu projeto Supabase e revise as políticas antes de publicar. Configure os usuários administradores e os buckets solicitados. A publicação não aplica SQL automaticamente. Em Authentication > URL Configuration, autorize os endereços publicados para confirmação de email/recuperação. /admin e sites separados exigem as mesmas políticas de segurança no banco.\n" } : {}),
  };
}

export async function downloadZip(code: string, connection?: SiteConnection, sql = "") {
  const zip = new JSZip();
  for (const [p, c] of Object.entries(projectFiles(code, connection, sql))) zip.file(p, c);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "batdev-app.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "site";

/** Capitalized JSX tags the generated code uses but never declares — the preview resolves them as lucide icons, so the export must too. */
export function missingComponents(code: string) {
  const used = new Set([...code.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].flatMap(m => m[1] ? [m[1]] : []));
  const builtin = new Set(["React", "Fragment", "App"]);
  return [...used].filter(n => !builtin.has(n) && !new RegExp(`(?:function|class|const|let|var)\\s+${n}\\b|[{,]\\s*${n}\\s*[,}=]`).test(code));
}
