# StratOS Roadmap: From Retreat Tool to SaaS Leader

This roadmap outlines the evolution of the Strategic Operating System from its current state (Executive Retreat Tool) to a full-scale SaaS product.

## Phase 1: Foundation (Complete)
- [x] **Core Dashboard:** Executive view of 5 strategic pillars.
- [x] **Voice Assistant:** Gemini 2.5 Flash Native Audio with bidirectional streaming.
- [x] **Supabase Integration:** Persistent storage for plans, knowledge base, and collaborators.
- [x] **Architect Mode:** CRUD for pillars and tactical priorities.
- [x] **Collaborator UI:** Management panel for executive staff.
- [x] **Vercel Deployment:** Production builds with Vite 6 + Tailwind CSS v4.

## Phase 1.5: NotebookLM + Budget Intelligence (Complete)
- [x] **NotebookLM MCP Integration:** MCP server bridge connecting StratOS to NotebookLM notebooks via `notebooklm-mcp` proxy (port 3100).
- [x] **MCP Proxy Server:** Express-based REST proxy (`notebookLmProxy.mjs`) with proper JSON-RPC response parsing, add-notebook endpoint, 120s timeout for browser operations.
- [x] **NotebookLM Sync Pipeline:** Bidirectional sync between NotebookLM notebook and the StratOS knowledge base (Second Brain).
- [x] **NotebookLM Enterprise API:** Production-grade integration path via Google Discovery Engine API.
- [x] **Budget Intelligence Dashboard:** Upload and parse FY 2026 Budget Excel (SheetJS), with AI-powered analysis via Gemini.
- [x] **Voice Agent Budget Expertise:** Voice operator can discuss budget line items, revenue gaps, and financials with specific dollar amounts pulled from NotebookLM.
- [x] **Notebook Query Tool:** `query_notebook` function enables both text and voice agents to query NotebookLM in real-time with three-tier fallback (Enterprise API > MCP Proxy > Local KB).
- [x] **Notebook Sync Panel:** Full-featured UI modal for managing notebook connections, uploading budget files, and running sync operations.
- [x] **Tailwind CSS v4 Migration:** Updated from v3 directives to v4 `@import "tailwindcss"` syntax with `@tailwindcss/postcss` plugin.
- [x] **Google Auth for MCP:** Persistent Chrome profile authentication for NotebookLM access.
- [x] **Verified Query Pipeline:** Confirmed end-to-end: Voice Agent > MCP Proxy > NotebookLM > Budget data ($41.2M total, revenue breakdowns, expense categories).

## Phase 1.75: Production Hardening (Next)
- [ ] **MCP Proxy Production Hosting:** Deploy proxy server to a cloud host (Railway/Render) so deployed Vercel app can query NotebookLM without localhost dependency.
- [ ] **Excel Embedded Viewer:** In-app spreadsheet viewing with SheetJS or OnlyOffice for live budget manipulation.
- [ ] **Claude Excel Extension Bridge:** Integration path for Claude's Excel analysis capabilities within the strategic dashboard.
- [ ] **Automated NotebookLM Sync:** Scheduled cron job to keep knowledge base fresh with latest notebook data.
- [ ] **Error Boundary Improvements:** Graceful degradation when MCP proxy is unavailable.

## Phase 2: Professionalization (Q2 2026)
- [ ] **Multi-Tenant Architecture:** Database schema updates to support multiple organizations on a single platform.
- [ ] **Auth & RBAC:** Implementation of secure login (Auth0/Supabase Auth) with Role-Based Access Control (Admin vs. Contributor vs. Viewer).
- [ ] **Cascading KPIs:** Link tactical priorities to external data sources (Google Sheets, Salesforce, etc.) for automated progress updates.
- [ ] **AI Alignment Engine:** Automated analysis of tactical priorities against core objectives to ensure strategic coherence.

## Phase 3: Scaling & SaaS Readiness (Q3 2026)
- [ ] **Subscription Engine:** Integration with Stripe for tiered SaaS billing (Pro, Executive, Enterprise).
- [ ] **Meeting Ingestion:** "Listen-Mode" for the Strategic Operator to record meetings and automatically suggest 3-5 new action items.
- [ ] **The "Executive War Room":** A 4K optimized dashboard view for lobby/office displays showing organizational heartbeat in real-time.
- [ ] **Mobile OS App:** Native strategic companion app for ADs and Executives on the move.

## Phase 4: Intelligence & Prediction (2027+)
- [ ] **Strategic Forecasting:** Predictive modeling based on current execution velocity.
- [ ] **Benchmarking:** Anonymized data comparisons across organizations in similar industries.
- [ ] **Agentic Autonomy:** AI agents that can negotiate meetings between owners to resolve strategic blockers.

---

### PR Objectives
- **Aesthetics:** Maintain the "Black & Gold" high-major aesthetic while allowing for white-labeling.
- **Latency:** Sub-100ms response times for tactical updates.
- **Intelligence:** Shift from reactive task lists to proactive strategic guidance.
