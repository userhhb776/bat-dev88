import { z } from "zod";

export const siteConnectionSchema = z.object({
  url: z.string().url().refine(v => /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(v), "Use a URL HTTPS do projeto Supabase."),
  publicKey: z.string().min(20).max(2000).refine(isPublicKey, "Use somente a chave publishable ou anon, nunca service_role/secret."),
});
export type SiteConnection = z.infer<typeof siteConnectionSchema>;
export function isPublicKey(key: string) {
  if (key.startsWith("sb_publishable_")) return true;
  try {
    const part = key.split(".")[1];
    if (!part) return false;
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))).role === "anon";
  } catch { return false; }
}
export function connectionPrompt(connection?: SiteConnection) {
  return connection ? `\nConexão Supabase deste site: URL ${connection.url}, chave PÚBLICA ${connection.publicKey}. O objeto global supabase é o cliente deste projeto, pronto para uso. Nunca crie outro cliente nem use credenciais do workspace. Se forem necessárias tabelas/policies, devolva também um bloco sql completo separado do jsx, com CREATE TABLE, GRANT, ENABLE ROW LEVEL SECURITY e policies. SQL não é aplicado automaticamente: diga para executar no SQL Editor. Dados da vitrine podem ter SELECT anon estritamente limitado; alterações exigem sessão E papel admin validado por RLS com tabela user_roles separada e função has_role. Nunca conceda escrita a qualquer usuário só por estar logado; nunca deixe autoatribuir admin. /admin é uma URL válida e segura com auth real + RLS; dois sites separados podem compartilhar esta conexão. Pergunte se precisa de perfis antes de criar autenticação; papéis ficam em tabela separada. Login usa email real, onAuthStateChange, signInWithPassword e signOut; nunca senha fixa/localStorage como autorização. Storage exige bucket e policies configurados externamente, não invente sucesso. Lide com erros mostrando mensagem e preserve o formulário. Nunca invente dados do banco nem diga conectado se falhou.\n` : "\nSe o projeto precisar de Supabase, peça para conectar no botão Supabase antes de gerar CRUD real; não invente credenciais nem finja salvar no banco.\n";
}
export function extractSql(text: string) { return text.match(/```sql\s*\n([\s\S]*?)```/i)?.[1]?.trim() ?? ""; }