# Independent Forge hosting

Workspace data lives in browser IndexedDB. Export a JSON backup before changing devices, clearing site data, or moving to another origin. Import it on the new origin. Incognito sessions may discard projects when closed.

No Lovable Cloud database, AI gateway or Cloud authentication is used by the workspace. DeepSeek calls go directly to its API through TanStack Start server functions. Generated sites export as standalone React/Vite projects.

## Hosting configuration

Deploy the application to a compatible server host, not a static-files-only host. Set these private environment variables:

- `DEEPSEEK_API_KEY`: your provider key.
- `FORGE_PASSWORD`: your private access password.
- `FORGE_SESSION_SECRET`: a strong random session-encryption secret of at least 32 characters.

Never prefix these with `VITE_`, commit values, or expose them in browser code. Install dependencies and use the package scripts. The current configuration targets this template's server runtime; other hosts may require adapting its deployment adapter.

Password access uses an encrypted HTTP-only session cookie. Backups contain code and chat history; treat them as private files. Rotate provider keys previously pasted or committed.

DeepSeek balance covers the entire account, including other apps. It is not a capacity percentage or per-project budget. Conversation mode limits output and excludes full source from context, but still incurs provider usage.

Uploads, external database connections, GitHub synchronization and Vercel publication are separate future integrations. No external database is configured yet.