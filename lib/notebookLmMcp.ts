/**
 * ============================================================
 * OPTION 1: NotebookLM MCP Server Integration Layer
 * ============================================================
 *
 * This module provides an MCP (Model Context Protocol) bridge
 * that connects the StratOS dashboard to a NotebookLM notebook
 * via the notebooklm-mcp server.
 *
 * SETUP INSTRUCTIONS:
 *
 * 1. Install the MCP server globally:
 *    npx notebooklm-mcp@latest
 *
 * 2. For Claude Code integration:
 *    claude mcp add notebooklm npx notebooklm-mcp@latest
 *
 * 3. For standalone use, configure in ~/.config/notebooklm-mcp/settings.json:
 *    {
 *      "profile": "standard",
 *      "disabled-tools": []
 *    }
 *
 * 4. Authenticate (one-time):
 *    Tell your agent: "Log me in to NotebookLM"
 *    A Chrome window opens for Google auth.
 *
 * ARCHITECTURE:
 *   Browser App → NotebookLM Proxy Server → notebooklm-mcp → NotebookLM
 *                                                              ↕
 *                                                     KSU Athletics Notebook
 *                                                     (21aca734-f2a0-456e-9212-8d23bd325025)
 */

// ── KSU Athletics NotebookLM Configuration ───────────────────────

export const NOTEBOOKLM_CONFIG = {
  notebookId: '21aca734-f2a0-456e-9212-8d23bd325025',
  notebookUrl: 'https://notebooklm.google.com/notebook/21aca734-f2a0-456e-9212-8d23bd325025',
  proxyBaseUrl: (process.env as any).NOTEBOOKLM_PROXY_URL || 'http://localhost:3100',
  profile: 'standard' as 'minimal' | 'standard' | 'full',

  // MCP Tool Profiles
  // minimal (5 tools): ask_question, list_notebooks, get_notebook, select_notebook, get_health
  // standard (10 tools): + add_notebook, update_notebook, search_notebooks, remove_notebook, setup_auth, list_sessions
  // full (16 tools): + cleanup_data, re_auth, reset_session, close_session, get_library_stats
};

// ── MCP Tool Types ───────────────────────────────────────────────

export interface NotebookLmQuery {
  question: string;
  notebookId?: string;
}

export interface NotebookLmResponse {
  answer: string;
  citations: NotebookCitation[];
  confidence: number;
  source: 'notebooklm-mcp';
}

export interface NotebookCitation {
  text: string;
  sourceTitle: string;
  pageOrSection?: string;
}

export interface NotebookMetadata {
  id: string;
  title: string;
  sourceCount: number;
  lastUpdated: string;
  tags: string[];
}

// ── MCP Proxy Client ─────────────────────────────────────────────
//
// The notebooklm-mcp server runs as a stdio-based MCP server.
// For browser access, we route through a lightweight proxy server.
// See: /server/notebookLmProxy.ts for the Express proxy.

export class NotebookLmMcpClient {
  private baseUrl: string;
  private notebookId: string;
  private isHealthy: boolean = false;

  constructor(config = NOTEBOOKLM_CONFIG) {
    this.baseUrl = config.proxyBaseUrl;
    this.notebookId = config.notebookId;
  }

  /** Check if the MCP server is running and authenticated */
  async checkHealth(): Promise<{ status: 'ok' | 'error'; message: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/mcp/health`);
      const data = await res.json();
      this.isHealthy = data.status === 'ok';
      return data;
    } catch {
      this.isHealthy = false;
      return { status: 'error', message: 'MCP proxy server unreachable' };
    }
  }

  /** Query the KSU Athletics NotebookLM notebook */
  async askQuestion(question: string): Promise<NotebookLmResponse> {
    const res = await fetch(`${this.baseUrl}/mcp/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        notebookId: this.notebookId,
      }),
    });

    if (!res.ok) {
      throw new Error(`MCP query failed: ${res.statusText}`);
    }

    return res.json();
  }

  /** List all notebooks in the authenticated account */
  async listNotebooks(): Promise<NotebookMetadata[]> {
    const res = await fetch(`${this.baseUrl}/mcp/notebooks`);
    return res.json();
  }

  /** Get details of the KSU Athletics notebook */
  async getNotebook(): Promise<NotebookMetadata & { sources: string[] }> {
    const res = await fetch(`${this.baseUrl}/mcp/notebooks/${this.notebookId}`);
    return res.json();
  }

  /** Select/activate the KSU Athletics notebook for queries */
  async selectNotebook(): Promise<{ success: boolean }> {
    const res = await fetch(`${this.baseUrl}/mcp/notebooks/${this.notebookId}/select`, {
      method: 'POST',
    });
    return res.json();
  }

  /** Trigger authentication flow (opens browser) */
  async authenticate(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.baseUrl}/mcp/auth`, { method: 'POST' });
    return res.json();
  }

  /** Batch query: ask multiple questions and aggregate results */
  async batchQuery(questions: string[]): Promise<NotebookLmResponse[]> {
    const results = await Promise.allSettled(
      questions.map(q => this.askQuestion(q))
    );
    return results
      .filter((r): r is PromiseFulfilledResult<NotebookLmResponse> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  /** Extract full notebook content for knowledge base sync */
  async extractForKnowledgeBase(): Promise<{
    budgetData: string;
    strategicContent: string;
    rawResponses: NotebookLmResponse[];
  }> {
    const extractionQueries = [
      'What is the complete FY 2026 budget breakdown for KSU Athletics?',
      'What are all revenue targets and their current status?',
      'What are the major expense categories and amounts?',
      'What is the total athletics budget and how is it allocated across sports?',
      'What are the capital project budgets including Wellstar Champions Complex?',
      'What are the NIL, transfer portal, and student-athlete support budgets?',
      'What are the staffing and compensation budget allocations?',
      'What are the facility and operations costs?',
      'What are the scholarship and financial aid allocations?',
      'What strategic initiatives have dedicated budget line items?',
    ];

    const responses = await this.batchQuery(extractionQueries);

    const budgetData = responses
      .filter(r => r.answer.match(/\$[\d,.]+/))
      .map(r => r.answer)
      .join('\n\n');

    const strategicContent = responses
      .map(r => r.answer)
      .join('\n\n');

    return { budgetData, strategicContent, rawResponses: responses };
  }

  get healthy() { return this.isHealthy; }
}

// ── Singleton Instance ───────────────────────────────────────────

export const notebookLmClient = new NotebookLmMcpClient();
