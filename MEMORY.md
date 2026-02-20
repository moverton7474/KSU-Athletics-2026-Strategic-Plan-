# System Memory: StratOS (KSU Athletics Strategic Dashboard)

## Current State (As of 2026-02-20)
- **Environment**: Production React 19 app on Vercel, Vite 6, Tailwind CSS v4
- **Database**: Supabase with `strategic_plan`, `strategic_knowledge`, `strategic_collaborators`
- **Intelligence**: Gemini 2.5 Flash Native Audio (voice), Gemini text chat
- **NotebookLM**: MCP proxy verified working -- queries return real budget data ($41.2M)
- **Knowledge Base**: Three-tier: Enterprise API > MCP Proxy > Local KB fallback

## Recent Updates
- **2026-02-20**: Fixed Tailwind CSS v4 build for Vercel (postcss config + import syntax)
- **2026-02-20**: Verified NotebookLM MCP integration end-to-end (query returns $41.2M budget data)
- **2026-02-20**: Created `notebookLmProxy.mjs` (pure JS proxy, avoids ts-node caching)
- **2026-02-20**: Created `addNotebook.mjs` (registers notebooks via MCP stdio)
- **2026-02-20**: Added express, cors, ts-node to dependencies
- **2026-02-20**: Created CLAUDE.md, SESSION_LOG.md, updated PRODUCT_DESCRIPTION.md and ROADMAP.md

## Key Lessons Learned
- **ts-node/tsx caching**: Both aggressively cache compiled TS. Always use `.mjs` files for server code that changes frequently.
- **NotebookLM library schema**: `notebooklm-mcp` crashes if notebook entries lack `topics` field. Use `addNotebook.mjs` to register properly.
- **Chrome profile corruption**: Force-killing MCP proxy corrupts Chrome profile. Delete `chrome_profile` dir and re-auth.
- **Tailwind v4**: Uses `@import "tailwindcss"` not `@tailwind` directives. PostCSS uses `'@tailwindcss/postcss': {}`.
- **Vercel builds**: Always test `npm run build` locally before `vercel --prod`.
- **Git merge conflicts**: When rebasing with remote changes, stash fails on `.claude/` dir (permission denied). Commit locally first, then `git pull --rebase`.

## Active Roadmap
- [ ] Host MCP proxy on cloud (Railway/Render) for production NotebookLM access
- [ ] Excel embedded viewer for live budget manipulation
- [ ] Multi-tenant architecture + Auth/RBAC
- [ ] Code-split xlsx and index bundles (>500KB warning)

## Technical Reference
- **NotebookLM Notebook ID**: `21aca734-f2a0-456e-9212-8d23bd325025`
- **MCP Library**: `C:\Users\mover\AppData\Local\notebooklm-mcp\Data\library.json`
- **Chrome Profile**: `C:\Users\mover\AppData\Local\notebooklm-mcp\Data\chrome_profile`
- **Voice Model**: `gemini-2.5-flash-native-audio-preview-12-2025`
- **Proxy Port**: 3100 (localhost)
- **Dev Port**: 3000
