<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Render generated JSX only after the full response completes; ForgePreview owns iframe loading, error reporting and explicit repair requests so incomplete streams never replace a working site.
- Keep generated code isolated in a sandboxed iframe and accept status messages only from its own window; transpile with Babel and resolve missing icon references within the preview scope.
- Persist the project library in IndexedDB with validated versioned JSON backups; no hosted database is required for the Forge workspace.
- Call DeepSeek only through password-session-protected TanStack server functions using DEEPSEEK_API_KEY, FORGE_PASSWORD and FORGE_SESSION_SECRET environment variables; portable server configuration avoids proprietary gateways and Cloud auth dependencies.
- Conversation mode sends code-free recent history with a small output budget; construction uses the latest saved source as its edit basis and never replaces it with incomplete output.
- Vercel publishing and GitHub saving run in password-protected server functions with VERCEL_TOKEN and GITHUB_TOKEN env vars; GitHub saves each built version as one commit via the Git Data API to a private repo stored on the project.
- Visual edits in the preview are captured inside the iframe and applied to the JSX source by exact text/URL replacement; unmatched edits are reported, never guessed.
- Project library syncs to the user's own Supabase via a private Storage bucket (one JSON per project) through password-session server functions using the admin client; IndexedDB stays the offline copy, newest updatedAt wins. Why: avoids schema migrations and Supabase Auth email flows.
- Login compares FORGE_EMAIL + FORGE_LOGIN_PASSWORD (fallback FORGE_PASSWORD) server-side; no Supabase Auth, so no verification codes.
- Build replies carry a ```decisoes block (kind: text lines) rendered as a design-decision timeline; extractCode ignores it.
