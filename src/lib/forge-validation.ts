import { parse } from "@babel/parser";
import { extractCode } from "./forge";
import { cleanGeneratedSource } from "./generated-source";

/** Never repair truncated streams by guessing closing tags or fences. */
export function validateGeneration(text: string): { code: string | null; error: string } {
  if (text.includes("[[BATDEV_ERRO:")) return { code: null, error: "A criação foi interrompida. Seu site anterior foi preservado; tente novamente." };
  const block = text.match(/```(?:jsx|tsx|javascript|js|react)?\s*\n[\s\S]*?```/i);
  if (!block) return { code: null, error: "A IA não terminou o arquivo completo. Seu site anterior foi preservado." };
  const code = extractCode(text);
  if (!code) return { code: null, error: "A IA não entregou um site. Seu site anterior foi preservado." };
  try {
    const ast = parse(cleanGeneratedSource(code), { sourceType: "script", plugins: ["jsx"] });
    const root = ast.program.body.some(node =>
      (node.type === "FunctionDeclaration" && node.id?.name === "App") ||
      (node.type === "VariableDeclaration" && node.declarations.some(declaration => declaration.id.type === "Identifier" && declaration.id.name === "App" && ["ArrowFunctionExpression", "FunctionExpression"].includes(declaration.init?.type ?? "")))
    );
    if (!root) return { code: null, error: "Falta a função App do site. Seu site anterior foi preservado." };
    return { code, error: "" };
  } catch (error) {
    return { code: null, error: `O novo código tem um erro e não substituiu seu site: ${error instanceof Error ? error.message.slice(0, 350) : "sintaxe inválida"}. Peça para corrigir esse erro no chat.` };
  }
}