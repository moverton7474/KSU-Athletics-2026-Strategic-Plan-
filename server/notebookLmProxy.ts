// @ts-nocheck — Server-side code; express/cors types installed at deploy time
/**
 * ============================================================
 * NotebookLM MCP Proxy Server
 * ============================================================
 *
 * Lightweight Express server that bridges the browser-based
 * StratOS dashboard with the stdio-based notebooklm-mcp server.
 *
 * USAGE:
 *   npx ts-node server/notebookLmProxy.ts
 *
 * REQUIRES:
 *   npm install express cors
 *   npm install -g notebooklm-mcp
 *   npx notebooklm-mcp config set profile standard
 *
 * ARCHITECTURE:
 *   React App (port 3000) → This Proxy (port 3100) → notebooklm-mcp (stdio)
 *
 * The proxy spawns the notebooklm-mcp process and communicates
 * via the MCP stdio protocol, exposing REST endpoints for the browser.
 */

import { spawn, ChildProcess } from 'child_process';

// ── Types ────────────────────────────────────────────────────────

interface McpRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface McpResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

// ── MCP Process Manager ──────────────────────────────────────────

class McpProcessManager {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
  }>();
  private buffer = '';

  async start(): Promise<void> {
    if (this.process) return;

    this.process = spawn('npx', ['notebooklm-mcp@latest'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    this.process.stdout?.on('data', (chunk: Buffer) => {
      this.buffer += chunk.toString();
      this.processBuffer();
    });

    this.process.stderr?.on('data', (chunk: Buffer) => {
      console.error('[MCP stderr]', chunk.toString());
    });

    this.process.on('exit', (code) => {
      console.log(`[MCP] Process exited with code ${code}`);
      this.process = null;
      // Reject all pending requests
      for (const [id, { reject }] of this.pendingRequests) {
        reject(new Error('MCP process exited'));
        this.pendingRequests.delete(id);
      }
    });

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('[MCP] notebooklm-mcp process started');
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg: McpResponse = JSON.parse(line);
        if (msg.id !== undefined && this.pendingRequests.has(msg.id)) {
          const { resolve, reject } = this.pendingRequests.get(msg.id)!;
          this.pendingRequests.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message));
          } else {
            resolve(msg.result);
          }
        }
      } catch {
        // Non-JSON output, skip
      }
    }
  }

  async callTool(toolName: string, args: Record<string, unknown> = {}): Promise<unknown> {
    if (!this.process?.stdin) {
      throw new Error('MCP process not running');
    }

    const id = ++this.requestId;
    const request: McpRequest = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.process!.stdin!.write(JSON.stringify(request) + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`MCP tool call '${toolName}' timed out`));
        }
      }, 30000);
    });
  }

  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}

// ── Express Server ───────────────────────────────────────────────

async function startProxy() {
  // Dynamic imports for ESM compatibility
  const express = (await import('express')).default;
  const cors = (await import('cors')).default;

  const app = express();
  const mcp = new McpProcessManager();

  app.use(cors({ origin: ['http://localhost:3000', 'http://0.0.0.0:3000'] }));
  app.use(express.json());

  // Start MCP process
  await mcp.start();

  // ── Health Check ─────────────────────────────────────────────
  app.get('/mcp/health', async (_req, res) => {
    try {
      const result = await mcp.callTool('get_health');
      res.json({ status: 'ok', mcp: result });
    } catch (e: any) {
      res.json({ status: 'error', message: e.message });
    }
  });

  // ── Ask Question ─────────────────────────────────────────────
  app.post('/mcp/ask', async (req, res) => {
    const { question, notebookId } = req.body;
    if (!question) {
      res.status(400).json({ error: 'question is required' });
      return;
    }

    try {
      // Select notebook first if specified
      if (notebookId) {
        await mcp.callTool('select_notebook', { notebook_id: notebookId });
      }

      const result = await mcp.callTool('ask_question', { question });
      res.json({
        answer: (result as any)?.answer || String(result),
        citations: (result as any)?.citations || [],
        confidence: (result as any)?.confidence || 0.8,
        source: 'notebooklm-mcp',
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── List Notebooks ───────────────────────────────────────────
  app.get('/mcp/notebooks', async (_req, res) => {
    try {
      const result = await mcp.callTool('list_notebooks');
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Get Notebook Details ─────────────────────────────────────
  app.get('/mcp/notebooks/:id', async (req, res) => {
    try {
      const result = await mcp.callTool('get_notebook', {
        notebook_id: req.params.id,
      });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Select Notebook ──────────────────────────────────────────
  app.post('/mcp/notebooks/:id/select', async (req, res) => {
    try {
      await mcp.callTool('select_notebook', { notebook_id: req.params.id });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Authenticate ─────────────────────────────────────────────
  app.post('/mcp/auth', async (_req, res) => {
    try {
      const result = await mcp.callTool('setup_auth');
      res.json({ success: true, message: String(result) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Start Server ─────────────────────────────────────────────
  const PORT = process.env.MCP_PROXY_PORT || 3100;
  app.listen(PORT, () => {
    console.log(`[NotebookLM MCP Proxy] Running on http://localhost:${PORT}`);
    console.log(`[NotebookLM MCP Proxy] Endpoints:`);
    console.log(`  GET  /mcp/health`);
    console.log(`  POST /mcp/ask              { question, notebookId? }`);
    console.log(`  GET  /mcp/notebooks`);
    console.log(`  GET  /mcp/notebooks/:id`);
    console.log(`  POST /mcp/notebooks/:id/select`);
    console.log(`  POST /mcp/auth`);
  });

  // Cleanup on exit
  process.on('SIGINT', () => { mcp.stop(); process.exit(); });
  process.on('SIGTERM', () => { mcp.stop(); process.exit(); });
}

startProxy().catch(console.error);
