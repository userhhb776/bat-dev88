# Adaptar a base do BatDev

Esta aplicação é uma base para copiar e adaptar, não uma integração obrigatória com seu painel. A geração continua usando sua própria DeepSeek. Não existe garantia de resultado perfeito: revisão de conteúdo, permissões, integrações e eventos reais continua necessária.

## Mapa da base

| Responsabilidade | Arquivos |
| --- | --- |
| Direção de design, histórico e formato JSX | `src/lib/forge.ts` |
| Conversão, consentimento, Meta Pixel e atribuição | `src/lib/site-tracking.ts` |
| Verificação de JSX completo antes de substituir o site | `src/lib/forge-validation.ts`, `src/lib/generated-source.ts` |
| Streaming da geração | `src/routes/api/generate.ts` |
| Login, DeepSeek, Supabase Storage, Vercel e GitHub | `src/lib/forge.functions.ts` |
| Chat, aplicação da resposta e exportação | `src/routes/index.tsx` |
| Preview isolado, erros e edição visual | `src/components/forge-preview.tsx` |
| Cópia offline e backups versionados | `src/lib/projects.ts` |
| Credenciais públicas do site e SQL manual | `src/lib/site-connection.ts` |
| Importação limitada de código | `src/lib/source-import.ts` |

## Contrato de geração

`POST /api/generate` recebe `{mode, code, history, connection?}` através de sessão de senha. A resposta é texto em streaming, não SSE no navegador. Decisões ficam em bloco `decisoes`, o arquivo completo em `jsx` e SQL opcional em `sql`. O código anterior é a base das edições. O consumidor só aplica uma resposta concluída, sem marcador `[[BATDEV_ERRO:...]]`, com bloco fechado, sintaxe JSX válida e função App. A validação não executa o código nem comprova todos os comportamentos: o iframe reporta falhas de execução separadamente.

Adapte a autorização à sessão e às permissões do seu SaaS antes de expor as funções à IA central. Nunca dê acesso irrestrito ou credenciais privadas ao código gerado. Mantenha checks de acesso e aprovação para publicação/ações com impacto.

## Preview e exportação

O formato suportado é um único App JSX usando hooks React, Tailwind, lucide, `supabase` e `batTracking`. FAQ, formulários, menus e modais usam React nativo. Pacotes arbitrários de repositórios importados exigem adaptação; não são executados no servidor. O ZIP exporta React/Vite, não Next.js, com dependências instaláveis e rewrites SPA. Vercel/GitHub usam os mesmos arquivos do ZIP.

O iframe usa CDNs, Babel e auth Supabase em memória: pode depender de internet. O site exportado usa dependências npm e sessão Supabase própria. O sandbox não transforma código gerado em código confiável; revise antes de publicar. Falhas de imagens não são ocultadas trocando o produto por uma foto aleatória.

## Pixel e UTMs

`batTracking.configure({pixelId})` aceita um ID real fornecido pelo usuário. `setConsent(true)` libera o script e PageView único; `setConsent(false)` revoga e bloqueia novos eventos deste helper. Não há autorização presumida nem persistência automática. Adapte à sua plataforma de consentimento. Recusar não bloqueia o site.

`track(event, params)` envia eventos somente após consentimento no site real. No preview apenas registra simulações. `Lead` depende de envio confirmado; `Purchase` de pagamento confirmado; clique de checkout usa `InitiateCheckout`. Não envie dados pessoais.

`attribution()` lê UTMs, IDs de clique e src/sck da URL atual sem armazenamento. `attributedUrl(url)` acrescenta somente esses parâmetros ao checkout, sem substituir os existentes; WhatsApp usa `whatsappUrl(numero,mensagem)` e inclui origem no texto. O helper não saneia conteúdo arbitrário dos valores: verifique sua política e URLs antes de publicar. CAPI, Reportana, Hotmart e outros serviços não são automaticamente conectados.

## Antes de usar em tráfego real

- Revisar oferta, preços, provas e garantias com dados reais; não usar escassez fictícia.
- Verificar menu, FAQ, formulários, checkout e WhatsApp em celular e computador.
- Aplicar e revisar SQL/RLS e usuários no Supabase do site; publicação não aplica permissões.
- Conferir consentimento e eventos no Meta Events Manager no domínio publicado, incluindo revogação e ausência de duplicação.
- Conferir UTMs no destino do checkout e na mensagem de WhatsApp.
- Testar o deploy real; aprovação de sintaxe não garante integração ou conversão.

Execute os testes de `src/test/` ao adaptar. Variáveis privadas e diferenças de hospedagem estão em `DEPLOYMENT.md`; nunca copie `.env`, tokens, dependências ou metadados Git para entregas de código.