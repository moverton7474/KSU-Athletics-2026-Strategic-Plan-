# Visionary AI -- StratOS (Strategic Operating System)

## Project Purpose
**"Taking Flight to 2026"** is a voice-first strategic automation platform designed for the KSU Athletics Executive Team. It serves as a real-time "Command Cockpit" for the Power Four ascent, ensuring that the $41.2M budget, revenue pipeline, and institutional system strengths are tracked, managed, and executed with precision.

## Core Capabilities
- **Voice-First Orchestration**: Gemini 2.5 Flash Native Audio enables real-time, low-latency voice control of the strategic dashboard with bidirectional audio streaming.
- **NotebookLM MCP Integration**: Direct connection to Google NotebookLM via MCP proxy server, enabling the voice agent and text assistant to query budget documents, strategic plans, and institutional data in real-time.
- **Cognitive Knowledge Base ("Second Brain")**: Multi-layered intelligence combining the strategic playbook, NotebookLM notebook extracts, parsed budget data, and mission parameters.
- **Budget Intelligence**: Excel budget parsing (SheetJS) with AI-powered financial analysis -- total revenue ($41.2M), expenses ($41.2M), capital projects, NIL pool, and transfer portal costs.
- **Cloud Persistence**: Full Supabase integration for multi-user synchronization and data durability across `strategic_plan`, `strategic_knowledge`, and `strategic_collaborators` tables.
- **Strategic Visualization**: Real-time metrics tracking for Revenue Gaps, Pipeline Value, and Operational Efficiency across 5 strategic pillars.

## Technical Architecture
- **Frontend**: React 19, Tailwind CSS v4, Vite 6 (Executive High-Contrast Black & Gold Theme).
- **Intelligence**: Google Gemini 2.5 Flash Native Audio (Live voice), Gemini for text chat with function calling.
- **NotebookLM Bridge**: `notebooklm-mcp` CLI tool via stdio JSON-RPC, exposed through Express proxy server (port 3100). Three-tier query architecture: Enterprise API > MCP Proxy > Local KB fallback.
- **Persistence**: Supabase (PostgreSQL) + LocalStorage Fallback.
- **Budget Parsing**: SheetJS (xlsx) for Excel file ingestion and categorization.
- **Components**: Lucide Icons, Custom Audio Processing (16kHz input / 24kHz output), Web Audio API.
- **Deployment**: Vercel (production), with PostCSS + Tailwind CSS v4 build pipeline.

## Key Data Sources
- **NotebookLM Notebook** (ID: `21aca734-f2a0-456e-9212-8d23bd325025`): Contains FY 2026 Budget FINAL, strategic plan docs, capital project details (Wellstar Champions Complex), revenue targets, NIL pool allocations, and transfer portal analysis.
- **Supabase Tables**: `strategic_plan` (pillars + actions), `strategic_knowledge` (budget + notebook sync data), `strategic_collaborators` (team members).
- **Local Knowledge Base** (`knowledgeBase.ts`): Hardcoded strategic reference with 5 pillars, mission parameters, and revenue targets.

## Production URLs
- **Vercel**: https://ksu-athletics-2026-strategic-plan-l92e.vercel.app
- **GitHub**: https://github.com/moverton7474/KSU-Athletics-2026-Strategic-Plan-
