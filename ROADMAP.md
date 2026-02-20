# StratOS Roadmap: From Retreat Tool to SaaS Leader

This roadmap outlines the evolution of the Strategic Operating System from its current state (Executive Retreat Tool) to a full-scale SaaS product with autonomous execution capabilities.

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

## Phase 2: Agentic Voice + Internet Research (Q2 2026)

### 2A: Voice Agent Internet Access
Give the voice agent the ability to search the internet in real-time when the user asks research questions, competitive analysis, or market intelligence queries.

- [ ] **Google Search Grounding:** Integrate Gemini's built-in Google Search grounding tool so the voice agent can pull live web data during conversation. When the user asks "What are peer institutions charging for football season tickets?", the agent searches the web and responds with current data.
- [ ] **Research Mode Toggle:** Voice command or UI toggle to switch the agent between "Internal Only" mode (knowledge base + NotebookLM) and "Research Mode" (adds internet access). This prevents unnecessary web calls for internal questions.
- [ ] **Source Attribution:** When the agent returns internet-sourced data, it cites the URLs/sources so the executive can verify. Displayed in the chat transcript alongside the voice response.
- [ ] **Research Report Generation:** When the agent performs a research query, it can compile findings into a structured report (PDF/markdown) saved to the knowledge base for future reference.

### 2B: Sub-Agent Architecture (Task Execution Engine)
Enable the voice agent to delegate complex, multi-step work to specialized sub-agents that autonomously execute strategic plan objectives.

- [ ] **Agent Orchestrator:** A central orchestration layer that receives high-level directives from the voice agent and decomposes them into sub-tasks, assigning each to the appropriate specialist agent. The orchestrator tracks progress, handles failures, and reports back to the user.
- [ ] **Planning Agent (Strategist):** When the user says "Draft a marketing plan to increase football season ticket revenue by $100K", this agent:
  1. Analyzes the current knowledge base (budget data, revenue gaps, historical performance)
  2. Researches peer institutions and industry benchmarks via internet access
  3. Builds a structured marketing plan with objectives, tactics, timeline, budget, and KPIs
  4. Saves the plan as a deliverable (viewable in dashboard, downloadable as PDF)
  5. Optionally creates action items in the relevant strategic pillar
- [ ] **Coding Agent (Builder):** A development-capable agent that can build technical assets to support plan execution:
  - Generate prospect pipeline databases (lead lists with contact info, segmentation, scoring)
  - Build landing pages, email templates, and campaign assets
  - Create tracking dashboards for campaign performance
  - Integrate with CRM systems (HubSpot, Salesforce) to push leads and track conversions
- [ ] **Outbound Execution Agent (Closer):** An agent that executes outreach campaigns defined by the Planning Agent:
  - **Calls:** Integrate with telephony APIs (Twilio, Bland.ai) to make AI-powered outbound calls to prospects with customized scripts based on the marketing plan
  - **Text/SMS:** Send personalized SMS campaigns to segmented prospect lists via Twilio
  - **Email:** Draft and send email sequences via Gmail/SendGrid API with personalization, A/B testing, and follow-up automation
  - **Compliance:** Built-in opt-out management, CAN-SPAM compliance, and call-time restrictions
- [ ] **Agent Status Dashboard:** A new UI panel showing active sub-agents, their current tasks, progress percentage, and results. Executives can monitor, pause, or redirect agents in real-time.
- [ ] **Voice Agent Delegation Commands:** Natural language commands to trigger sub-agents:
  - *"Build me a marketing plan to grow season ticket revenue by $100K"*
  - *"Create a prospect list of 500 local businesses for sponsorship outreach"*
  - *"Draft an email campaign for the Owls Fund targeting alumni donors"*
  - *"Start calling the top 50 prospects from yesterday's list"*
  - *"What's the status of the sponsorship outreach campaign?"*

### 2C: Professionalization
- [ ] **Multi-Tenant Architecture:** Database schema updates to support multiple organizations on a single platform.
- [ ] **Auth & RBAC:** Implementation of secure login (Auth0/Supabase Auth) with Role-Based Access Control (Admin vs. Contributor vs. Viewer).
- [ ] **Cascading KPIs:** Link tactical priorities to external data sources (Google Sheets, Salesforce, etc.) for automated progress updates.
- [ ] **AI Alignment Engine:** Automated analysis of tactical priorities against core objectives to ensure strategic coherence.

## Phase 3: Scaling & SaaS Readiness (Q3 2026)
- [ ] **Subscription Engine:** Integration with Stripe for tiered SaaS billing (Pro, Executive, Enterprise).
- [ ] **Meeting Ingestion:** "Listen-Mode" for the Strategic Operator to record meetings and automatically suggest 3-5 new action items.
- [ ] **The "Executive War Room":** A 4K optimized dashboard view for lobby/office displays showing organizational heartbeat in real-time.
- [ ] **Mobile OS App:** Native strategic companion app for ADs and Executives on the move.
- [ ] **Agent Marketplace:** Library of pre-built agent templates for common athletic department workflows (ticket sales, donor outreach, sponsorship prospecting, NIL management).

## Phase 4: Intelligence & Prediction (2027+)
- [ ] **Strategic Forecasting:** Predictive modeling based on current execution velocity.
- [ ] **Benchmarking:** Anonymized data comparisons across organizations in similar industries.
- [ ] **Agentic Autonomy:** AI agents that can negotiate meetings between owners to resolve strategic blockers.
- [ ] **Revenue Attribution Engine:** Track which agent-executed campaigns directly contributed to revenue growth, creating a closed-loop feedback system.
- [ ] **Cross-Organization Agent Network:** Agents from different StratOS instances can collaborate on shared initiatives (e.g., conference-level sponsorship packages).

---

### Example Workflow: "Increase Football Season Ticket Revenue by $100K"

```
User (Voice): "Build me a plan to increase football season ticket revenue by $100K"
                    |
                    v
          [Voice Agent] receives directive
                    |
                    v
          [Agent Orchestrator] decomposes into sub-tasks
                    |
        +-----------+-----------+
        |           |           |
        v           v           v
  [Planning     [Research    [Coding
   Agent]        Agent]       Agent]
        |           |           |
        |  "What do  |          |
        |  peers     |          |
        |  charge?"  |          |
        |           |           |
        v           v           v
  Marketing    Benchmark    Prospect
  Plan.pdf     Data         Pipeline DB
        |           |           |
        +-----------+-----------+
                    |
                    v
          [Outbound Execution Agent]
                    |
        +-----------+-----------+
        |           |           |
        v           v           v
    AI Calls    SMS Blasts   Email
    to Top 50   to 500       Sequences
    Prospects   Leads        to Alumni
        |           |           |
        +-----------+-----------+
                    |
                    v
          [Agent Status Dashboard]
          "Campaign Progress: 45%"
          "12 meetings booked"
          "$23K pipeline generated"
```

---

### PR Objectives
- **Aesthetics:** Maintain the "Black & Gold" high-major aesthetic while allowing for white-labeling.
- **Latency:** Sub-100ms response times for tactical updates.
- **Intelligence:** Shift from reactive task lists to proactive strategic guidance.
- **Autonomy:** Move from "tell me about the plan" to "execute the plan for me."
- **Revenue Impact:** Every agent action should be traceable to a revenue outcome.
