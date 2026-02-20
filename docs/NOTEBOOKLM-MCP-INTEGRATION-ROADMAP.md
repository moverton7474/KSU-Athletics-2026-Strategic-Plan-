# NotebookLM MCP Integration & Budget Intelligence — Development Roadmap

**Project:** KSU Athletics 2026 Strategic Plan — StratOS
**Branch:** `claude/notebook-lm-mcp-review-dQKpV`
**Date:** February 20, 2026
**Status:** Phase 1.5 Complete — Ready for QA

---

## Executive Summary

This document outlines the full integration plan connecting Google NotebookLM to the StratOS strategic dashboard via the Model Context Protocol (MCP), along with the new Budget Intelligence Dashboard. The integration enables real-time querying of KSU Athletics research notebooks, budget analysis with AI-powered insights, and voice-agent financial expertise — all within the existing React + Vite + TypeScript application.

---

## Architecture Overview

### Three Integration Options (All Delivered)

| Option | File | Method | Best For |
|--------|------|--------|----------|
| **Option 1: MCP Server** | `lib/notebookLmMcp.ts` | stdio bridge via `notebooklm-mcp` | Local dev, desktop Claude |
| **Option 2: Sync Pipeline** | `lib/notebookLmSync.ts` | SheetJS Excel parse + batch sync to Supabase | Budget upload, offline KB |
| **Option 3: Enterprise API** | `lib/notebookLmEnterprise.ts` | Google Discovery Engine REST API | Production, real-time queries |

### Supporting Infrastructure

| Component | File | Purpose |
|-----------|------|---------|
| MCP Proxy Server | `server/notebookLmProxy.ts` | Express server bridging browser ↔ MCP stdio |
| Budget Dashboard | `components/BudgetViewer.tsx` | Excel upload, AI analysis, revenue/expense views |
| Notebook Sync Panel | `components/NotebookSyncPanel.tsx` | UI for managing notebook connections + sync |
| Voice Agent Tools | `components/StrategicAssistant.tsx` | `query_notebook` tool + budget system prompts |
| Knowledge Base Schema | `knowledgeBase.ts` | Extended with budget intelligence fields |

---

## Detailed Roadmap

### Phase 1.5 — NotebookLM + Budget Intelligence (COMPLETE)

#### 1.5.1 MCP Client & Proxy Server
- [x] `NotebookLmMcpClient` class with `query()`, `listSources()`, `getNotebookInfo()`
- [x] Express proxy server (`npm run mcp-proxy`) with health check, CORS
- [x] Pre-configured notebook ID: `21aca734-f2a0-456e-9212-8d23bd325025`
- [x] Auto-reconnect on MCP process crash
- [x] Request/response logging for debugging

#### 1.5.2 Sync Pipeline + Excel Parser
- [x] `parseBudgetExcel()` — SheetJS-based parser for FY 2026 Budget FINAL
- [x] Revenue/expense category aggregation with subcategory breakdown
- [x] Capital projects extraction (items > $50K or "capital" keyword)
- [x] `syncNotebookToKnowledgeBase()` — MCP query → Supabase `strategic_knowledge` upsert
- [x] `syncBudgetToKnowledgeBase()` — Parsed budget → knowledge base merge
- [x] `runFullSync()` — Orchestrated sync of both notebook + budget data

#### 1.5.3 Enterprise API Integration
- [x] `NotebookLmEnterpriseClient` with Google Discovery Engine v1
- [x] OAuth2 + API key dual authentication support
- [x] `queryNotebookLm()` unified function with fallback chain: Enterprise → MCP → Local KB
- [x] Extractive and generative answer support
- [x] Source citation passthrough

#### 1.5.4 Budget Intelligence Dashboard
- [x] Excel file upload with drag-and-drop UX
- [x] 4-metric header: Total Revenue, Total Expenses, Net Position, Capital Projects
- [x] Tab navigation: Overview, Revenue, Expenses, Capital
- [x] AI Budget Analysis button (Gemini-powered executive insights)
- [x] Horizontal bar charts with percentage breakdowns
- [x] Capital project cards with category labels

#### 1.5.5 Voice Agent Budget Expertise
- [x] `query_notebook` tool definition for function calling
- [x] Budget data injected into system prompt (top revenue/expense categories with dollar amounts)
- [x] Voice agent can answer: "What's our largest expense?" / "How much revenue from football?"
- [x] Quick action buttons: "Notebook Sync" and "Budget View"

#### 1.5.6 Notebook Sync Panel UI
- [x] Modal overlay with notebook connection status
- [x] Connection configuration (notebook ID, API key, project ID)
- [x] One-click sync with progress indicator
- [x] Sync history/status display
- [x] Budget file upload within sync panel

### Phase 2.0 — Excel Embedded Viewer (PLANNED)

| Task | Priority | Approach |
|------|----------|----------|
| In-app spreadsheet grid | Medium | Handsontable + SheetJS |
| Cell-level editing | Medium | Handsontable `afterChange` hooks |
| Formula support | Low | Handsontable HyperFormula plugin |
| Export modified .xlsx | Medium | SheetJS `writeFile()` |
| OnlyOffice full editor | Low | Self-hosted Document Server (Docker) |

### Phase 2.1 — Claude Excel Extension Bridge (PLANNED)

| Task | Priority | Approach |
|------|----------|----------|
| "Open in Excel" deep link | High | OneDrive/SharePoint URL with `action=edit` |
| Claude API spreadsheet analysis | Medium | Anthropic Files API + tool use |
| Programmatic tool calling | Low | Claude writes Python for multi-step Excel ops |
| MCP connectors for financial data | Low | S&P Global, FactSet via Claude Excel MCP |

### Phase 2.2 — Voice Agent with Dedicated STT/TTS (PLANNED)

| Task | Priority | Approach |
|------|----------|----------|
| Browser Web Speech API MVP | High | `webkitSpeechRecognition` + `speechSynthesis` |
| Deepgram STT integration | Medium | `@deepgram/sdk` for production-grade recognition |
| ElevenLabs/Cartesia TTS | Medium | Low-latency voice synthesis |
| LiveKit Agents framework | Low | Full real-time voice pipeline |
| Spreadsheet tool calling via voice | Medium | Claude API with `read_budget_range` tools |

---

## Data Flow: Knowledge Base ↔ NotebookLM MCP

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │   Dashboard   │  │ Budget View  │  │  Strategic Assistant  │  │
│  │   (App.tsx)   │  │  (Viewer)    │  │  (Voice + Text)       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬────────────┘  │
│         │                 │                      │               │
│         └─────────────────┼──────────────────────┘               │
│                           │                                      │
│                    ┌──────▼───────┐                               │
│                    │ Knowledge    │                               │
│                    │ Base (KB)    │                               │
│                    │ knowledgeBase│                               │
│                    │ .ts          │                               │
│                    └──────┬───────┘                               │
└───────────────────────────┼──────────────────────────────────────┘
                            │
              ┌─────────────┼──────────────┐
              │             │              │
     ┌────────▼───┐  ┌─────▼──────┐  ┌────▼──────────┐
     │  Option 1  │  │  Option 2  │  │   Option 3    │
     │  MCP       │  │  Sync      │  │   Enterprise  │
     │  Client    │  │  Pipeline  │  │   API         │
     │            │  │            │  │               │
     │  notebookLm│  │ notebookLm │  │ notebookLm   │
     │  Mcp.ts    │  │ Sync.ts    │  │ Enterprise.ts │
     └────────┬───┘  └─────┬──────┘  └────┬──────────┘
              │            │               │
     ┌────────▼───┐  ┌─────▼──────┐  ┌────▼──────────┐
     │  Express   │  │  SheetJS   │  │  Google       │
     │  Proxy     │  │  Excel     │  │  Discovery    │
     │  Server    │  │  Parser    │  │  Engine API   │
     │  :3001     │  │            │  │               │
     └────────┬───┘  └─────┬──────┘  └────┬──────────┘
              │            │               │
     ┌────────▼───┐  ┌─────▼──────┐  ┌────▼──────────┐
     │ notebooklm │  │  .xlsx     │  │  Google       │
     │ -mcp       │  │  Budget    │  │  Cloud        │
     │ (stdio)    │  │  File      │  │  Project      │
     └────────┬───┘  └────────────┘  └────┬──────────┘
              │                            │
              └──────────┬─────────────────┘
                         │
                ┌────────▼────────┐
                │   NotebookLM    │
                │   Notebook      │
                │   21aca734-...  │
                │                 │
                │  KSU Athletics  │
                │  Research Data  │
                └─────────────────┘
```

---

## Files Delivered (12 files, +1,944 lines)

| File | Lines | Type |
|------|-------|------|
| `lib/notebookLmMcp.ts` | 198 | New — MCP client class |
| `server/notebookLmProxy.ts` | 256 | New — Express proxy bridge |
| `lib/notebookLmSync.ts` | 344 | New — Sync pipeline + Excel parser |
| `lib/notebookLmEnterprise.ts` | 252 | New — Enterprise API + unified query |
| `components/BudgetViewer.tsx` | 297 | New — Budget dashboard |
| `components/NotebookSyncPanel.tsx` | 268 | New — Sync modal UI |
| `App.tsx` | +109 | Modified — Budget view mode, sync wiring |
| `components/StrategicAssistant.tsx` | +161 | Modified — Budget tools, notebook query |
| `knowledgeBase.ts` | +12 | Modified — Budget schema extension |
| `package.json` | +6 | Modified — xlsx dep, mcp-proxy script |
| `package-lock.json` | +106 | Modified — Lock file update |
| `ROADMAP.md` | 11 | Modified — Phase 1.5 documentation |

---

## Environment & Configuration

### Required Environment Variables

```bash
# Google AI (existing — for Gemini voice/text agent)
VITE_GEMINI_API_KEY=your-gemini-key

# NotebookLM MCP (Option 1)
NOTEBOOKLM_NOTEBOOK_ID=21aca734-f2a0-456e-9212-8d23bd325025

# Google Discovery Engine (Option 3 — Enterprise)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
DISCOVERY_ENGINE_ID=your-engine-id

# Supabase (existing — for knowledge base persistence)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key
```

### Scripts

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run mcp-proxy    # Start NotebookLM MCP proxy on :3001
```

---

## Test Plan

- [ ] **Budget Upload:** Upload `FY 2026 Budget FINAL 061325.xlsx` → verify parsed metrics
- [ ] **Budget Tabs:** Click Revenue/Expenses/Capital tabs → verify data renders
- [ ] **AI Analysis:** Click "AI Budget Analysis" → verify Gemini response
- [ ] **Notebook Sync Panel:** Open from nav → verify connection UI
- [ ] **Voice Agent Budget Q&A:** Ask "What's our total revenue?" → verify dollar amount
- [ ] **query_notebook Tool:** Trigger in text mode → verify NotebookLM response
- [ ] **MCP Proxy:** Run `npm run mcp-proxy` → verify health endpoint
- [ ] **TypeScript:** `npx tsc --noEmit` → 0 errors
- [ ] **Build:** `npm run build` → success

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| NotebookLM MCP package not installed | Option 1 fails | Fallback to Option 2 (local sync) or Option 3 (Enterprise API) |
| Google Cloud credentials missing | Option 3 fails | Unified `queryNotebookLm()` auto-falls back to MCP → local KB |
| Large Excel files (>10MB) | Browser freeze | SheetJS streams; consider server-side parsing for production |
| Gemini API rate limits | AI analysis fails | Graceful error message; cache previous analyses |
| MCP process crash | Proxy hangs | Auto-restart logic in `McpProcessManager` |

---

*Generated for KSU Athletics Department — Taking Flight 2026 Strategic Plan*
