# CLAUDE.md - Project Context for Claude Code

## Project Overview
**KSU Athletics 2026 Strategic Plan** ("Taking Flight to 2026") -- A voice-first strategic dashboard for KSU Athletics executive team. React 19 + Vite 6 + Tailwind CSS v4, deployed on Vercel.

## Key Technical Details

### Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite 6
- **AI**: Google Gemini 2.5 Flash Native Audio (voice), Gemini text chat with function calling
- **Database**: Supabase (PostgreSQL) -- tables: `strategic_plan`, `strategic_knowledge`, `strategic_collaborators`
- **NotebookLM**: `notebooklm-mcp` CLI via MCP proxy server (Express on port 3100)
- **Budget Parsing**: SheetJS (xlsx) for Excel ingestion
- **Deployment**: Vercel production

### Build & Deploy
- `npm run dev` -- Vite dev server on port 3000
- `npm run build` -- Production build
- `vercel --prod` -- Deploy to production
- `node server/notebookLmProxy.mjs` -- Start MCP proxy (port 3100)
- `node server/addNotebook.mjs` -- Register notebook in MCP library

### Critical Files
| File | Purpose |
|------|---------|
| `App.tsx` | Main orchestrator, state, Supabase sync |
| `components/VoiceAgent.tsx` | Gemini Live Audio, function calling, transcription |
| `components/StrategicAssistant.tsx` | Text chat, tool management, KB context |
| `components/NotebookSyncPanel.tsx` | Sync UI, connection status, file upload |
| `lib/notebookLmMcp.ts` | MCP client, query interface, batch extraction |
| `lib/notebookLmEnterprise.ts` | Enterprise API, unified `queryNotebookLm()` |
| `lib/notebookLmSync.ts` | Budget parsing, content extraction, persistence |
| `server/notebookLmProxy.mjs` | Express REST proxy for MCP (production) |
| `server/notebookLmProxy.ts` | TypeScript proxy (has ts-node caching issues) |
| `server/addNotebook.mjs` | Helper to register notebooks via stdio MCP |
| `knowledgeBase.ts` | Local KB with 5 strategic pillars |
| `postcss.config.js` | Tailwind v4 via `@tailwindcss/postcss` |

### NotebookLM Integration
- **Notebook ID**: `21aca734-f2a0-456e-9212-8d23bd325025`
- **Library file**: `C:\Users\mover\AppData\Local\notebooklm-mcp\Data\library.json`
- **Chrome profile**: `C:\Users\mover\AppData\Local\notebooklm-mcp\Data\chrome_profile`
- **Three-tier query fallback**: Enterprise API > MCP Proxy (localhost:3100) > Local KB
- **Auth**: Google account login via browser popup (persistent Chrome profile)

### Known Issues & Gotchas
- **ts-node caching**: `npx ts-node` and `npx tsx` aggressively cache compiled TS. Use `server/notebookLmProxy.mjs` (pure JS) instead.
- **Chrome profile corruption**: Killing the MCP proxy process can corrupt the Chrome profile. Fix: delete `chrome_profile` dir, restart proxy, re-authenticate.
- **NotebookLM library schema**: The `notebooklm-mcp` tool requires `topics` field in library.json entries, otherwise it crashes at startup with `Cannot read properties of undefined (reading 'map')`.
- **Tailwind CSS v4**: Uses `@import "tailwindcss"` syntax (not `@tailwind` directives). PostCSS config uses string-based `'@tailwindcss/postcss': {}` plugin format.
- **MCP proxy on Vercel**: The proxy only runs locally. Deployed app falls back to local KB. Production NotebookLM queries require either hosted proxy or Enterprise API.

### Environment Variables
- `API_KEY` / `GEMINI_API_KEY` -- Google Gemini API key
- `NOTEBOOKLM_PROXY_URL` -- MCP proxy URL (default: `http://localhost:3100`)
- `GCLOUD_PROJECT_ID` -- Google Cloud project (Enterprise API, optional)
- `GOOGLE_APPLICATION_CREDENTIALS` -- Service account path (Enterprise API, optional)

## Coding Conventions
- TypeScript with `@ts-nocheck` on server-side files
- ESM modules (`"type": "module"` in package.json)
- Tailwind CSS v4 utility classes
- Supabase client from `lib/supabase.ts`
- Knowledge base extended type in `lib/notebookLmSync.ts`
