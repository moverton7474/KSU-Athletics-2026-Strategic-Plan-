/**
 * ============================================================
 * OPTION 3: NotebookLM Enterprise API Integration
 * ============================================================
 *
 * Production-grade integration using Google's official
 * NotebookLM Enterprise API (discoveryengine.googleapis.com).
 *
 * Released September 2025. Provides:
 * - Programmatic notebook creation/management
 * - Source management (add/remove documents)
 * - Audio overview generation
 * - Proper IAM authentication
 *
 * PREREQUISITES:
 * 1. Google Workspace Enterprise license
 * 2. Google Cloud project with Discovery Engine API enabled
 * 3. Service account or OAuth2 credentials
 * 4. IAM roles: discoveryengine.editor, discoveryengine.viewer
 *
 * API BASE:
 *   https://discoveryengine.googleapis.com/v1alpha
 *
 * NOTEBOOK:
 *   projects/{project}/locations/{location}/collections/default_collection/
 *   engines/notebooklm/servingConfigs/default/answer
 *
 * DOCUMENTATION:
 *   https://cloud.google.com/generative-ai-app-builder/docs/notebooklm-enterprise
 */

// ── Configuration ────────────────────────────────────────────────

export const ENTERPRISE_CONFIG = {
  projectId: (process.env as any).GCLOUD_PROJECT_ID || '',
  location: (process.env as any).GCLOUD_LOCATION || 'us-central1',
  notebookId: '21aca734-f2a0-456e-9212-8d23bd325025',
  apiBase: 'https://discoveryengine.googleapis.com/v1alpha',

  // OAuth2 / Service Account
  credentialsPath: (process.env as any).GOOGLE_APPLICATION_CREDENTIALS || '',
  accessToken: (process.env as any).GCLOUD_ACCESS_TOKEN || '',
};

// ── Types ────────────────────────────────────────────────────────

export interface EnterpriseNotebook {
  name: string;
  displayName: string;
  createTime: string;
  updateTime: string;
  state: 'ACTIVE' | 'CREATING' | 'DELETING';
}

export interface EnterpriseSource {
  name: string;
  displayName: string;
  contentUri?: string;
  rawContent?: string;
  state: 'ACTIVE' | 'PROCESSING';
}

export interface EnterpriseAnswerRequest {
  query: string;
  notebookId: string;
  answerGenerationSpec?: {
    modelVersion?: string;
    includeCitations?: boolean;
  };
}

export interface EnterpriseAnswerResponse {
  answer: string;
  citations: Array<{
    startIndex: number;
    endIndex: number;
    sources: Array<{
      referenceId: string;
      title: string;
      uri?: string;
    }>;
  }>;
  answerSkippedReasons?: string[];
}

// ── Enterprise API Client ────────────────────────────────────────

export class NotebookLmEnterpriseClient {
  private config: typeof ENTERPRISE_CONFIG;
  private baseUrl: string;

  constructor(config = ENTERPRISE_CONFIG) {
    this.config = config;
    this.baseUrl = `${config.apiBase}/projects/${config.projectId}/locations/${config.location}`;
  }

  private get headers(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
      'X-Goog-User-Project': this.config.projectId,
    };
  }

  /** Check if Enterprise API is configured and accessible */
  async isAvailable(): Promise<boolean> {
    if (!this.config.projectId || !this.config.accessToken) {
      return false;
    }
    try {
      const res = await fetch(`${this.baseUrl}/collections/default_collection/engines/notebooklm`, {
        headers: this.headers,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Query the notebook using the Enterprise Answer API */
  async answer(query: string): Promise<EnterpriseAnswerResponse> {
    const url = `${this.baseUrl}/collections/default_collection/engines/notebooklm/servingConfigs/default:answer`;

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        query: { text: query },
        answerGenerationSpec: {
          includeCitations: true,
        },
        session: `projects/${this.config.projectId}/locations/${this.config.location}/collections/default_collection/engines/notebooklm/sessions/-`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Enterprise API error (${res.status}): ${err}`);
    }

    return res.json();
  }

  /** List all notebooks in the project */
  async listNotebooks(): Promise<EnterpriseNotebook[]> {
    const url = `${this.baseUrl}/collections/default_collection/engines/notebooklm/notebooks`;
    const res = await fetch(url, { headers: this.headers });

    if (!res.ok) throw new Error(`Failed to list notebooks: ${res.statusText}`);
    const data = await res.json();
    return data.notebooks || [];
  }

  /** Get a specific notebook's details */
  async getNotebook(notebookId: string): Promise<EnterpriseNotebook> {
    const url = `${this.baseUrl}/collections/default_collection/engines/notebooklm/notebooks/${notebookId}`;
    const res = await fetch(url, { headers: this.headers });

    if (!res.ok) throw new Error(`Failed to get notebook: ${res.statusText}`);
    return res.json();
  }

  /** Add a source document to a notebook */
  async addSource(notebookId: string, source: {
    displayName: string;
    contentUri?: string;
    rawContent?: string;
  }): Promise<EnterpriseSource> {
    const url = `${this.baseUrl}/collections/default_collection/engines/notebooklm/notebooks/${notebookId}/sources`;

    const body: any = { displayName: source.displayName };
    if (source.contentUri) body.contentUri = source.contentUri;
    if (source.rawContent) body.rawDocument = { content: btoa(source.rawContent), mimeType: 'text/plain' };

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Failed to add source: ${res.statusText}`);
    return res.json();
  }

  /** List sources in a notebook */
  async listSources(notebookId: string): Promise<EnterpriseSource[]> {
    const url = `${this.baseUrl}/collections/default_collection/engines/notebooklm/notebooks/${notebookId}/sources`;
    const res = await fetch(url, { headers: this.headers });

    if (!res.ok) throw new Error(`Failed to list sources: ${res.statusText}`);
    const data = await res.json();
    return data.sources || [];
  }

  /** Batch query the notebook with multiple questions */
  async batchAnswer(queries: string[]): Promise<EnterpriseAnswerResponse[]> {
    const results = await Promise.allSettled(
      queries.map(q => this.answer(q))
    );
    return results
      .filter((r): r is PromiseFulfilledResult<EnterpriseAnswerResponse> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  /**
   * Push budget data as a source into the NotebookLM notebook.
   * This syncs the StratOS knowledge base INTO NotebookLM (bidirectional).
   */
  async pushBudgetToNotebook(notebookId: string, budgetMarkdown: string): Promise<void> {
    await this.addSource(notebookId, {
      displayName: `KSU Athletics FY 2026 Budget - Auto-synced ${new Date().toISOString()}`,
      rawContent: budgetMarkdown,
    });
  }
}

// ── Singleton ────────────────────────────────────────────────────

export const enterpriseClient = new NotebookLmEnterpriseClient();

// ── Unified Query Interface ──────────────────────────────────────
//
// Falls back through: Enterprise API → MCP Proxy → Local KB

export async function queryNotebookLm(
  question: string,
  localKb: any
): Promise<{ answer: string; source: 'enterprise' | 'mcp' | 'local' }> {
  // Try Enterprise API first (production)
  try {
    if (await enterpriseClient.isAvailable()) {
      const result = await enterpriseClient.answer(question);
      return { answer: result.answer, source: 'enterprise' };
    }
  } catch { /* fall through */ }

  // Try MCP proxy (development)
  try {
    const { notebookLmClient } = await import('./notebookLmMcp');
    const health = await notebookLmClient.checkHealth();
    if (health.status === 'ok') {
      const result = await notebookLmClient.askQuestion(question);
      return { answer: result.answer, source: 'mcp' };
    }
  } catch { /* fall through */ }

  // Fall back to local knowledge base
  return {
    answer: `Based on the strategic knowledge base: ${JSON.stringify(localKb).slice(0, 2000)}`,
    source: 'local',
  };
}
