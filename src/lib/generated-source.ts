/** Normalizes the supported single-file JSX format identically for preview and exports. */
export function cleanGeneratedSource(code: string) {
  return code
    .replace(/^\s*import\s[\s\S]*?from\s*['"][^'"]+['"];?/gm, "")
    .replace(/^\s*import\s*['"][^'"]+['"];?/gm, "")
    .replace(/export\s+default\s+/g, "")
    .replace(/^\s*export\s+/gm, "");
}