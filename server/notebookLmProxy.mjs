import { spawn } from 'child_process';

class McpProcessManager {
  constructor() {
    this.process = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.buffer = '';
  }

  async start() {
    if (this.process) return;

    this.process = spawn('npx', ['notebooklm-mcp@latest'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    this.process.stdout.on('data', (chunk) => {
      this.buffer += chunk.toString();
      this.processBuffer();
    });

    this.process.stderr.on('data', (chunk) => {
      console.error('[MCP stderr]', chunk.toString());
    });

    this.process.on('exit', (code) => {
      console.log(`[MCP] Process exited with code ${code}`);
      this.process = null;
      for (const [id, { reject }] of this.pendingRequests) {
        reject(new Error('MCP process exited'));
        this.pendingRequests.delete(id);
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('[MCP] notebooklm-mcp process started');
  }

  processBuffer() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && this.pendingRequests.has(msg.id)) {
          const { resolve, reject } = this.pendingRequests.get(msg.id);
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

  async callTool(toolName, args = {}) {
    if (!this.process?.stdin) {
      throw new Error('MCP process not running');
    }

    const id = ++this.requestId;
    const request = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.process.stdin.write(JSON.stringify(request) + '\n');

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`MCP tool call '${toolName}' timed out`));
        }
      }, 120000);
    });
  }

  stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}

// Helper: extract answer text from MCP response
function extractAnswer(result) {
  try {
    const content = result?.content;
    if (Array.isArray(content) && content.length > 0) {
      const text = content[0].text;
      try {
        const parsed = JSON.parse(text);
        return {
          answer: parsed?.data?.answer || parsed?.answer || text,
          citations: parsed?.data?.citations || [],
          confidence: parsed?.data?.confidence || 0.8,
        };
      } catch {
        return { answer: text, citations: [], confidence: 0.8 };
      }
    }
  } catch {}
  return { answer: String(result), citations: [], confidence: 0.5 };
}

async function startProxy() {
  const express = (await import('express')).default;
  const cors = (await import('cors')).default;

  const app = express();
  const mcp = new McpProcessManager();

  app.use(cors({ origin: ['http://localhost:3000', 'http://0.0.0.0:3000'] }));
  app.use(express.json());

  await mcp.start();

  // Health Check
  app.get('/mcp/health', async (_req, res) => {
    try {
      const result = await mcp.callTool('get_health');
      res.json({ status: 'ok', mcp: result });
    } catch (e) {
      res.json({ status: 'error', message: e.message });
    }
  });

  // Ask Question
  app.post('/mcp/ask', async (req, res) => {
    const { question, notebookId } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    try {
      if (notebookId) {
        await mcp.callTool('select_notebook', { notebook_id: notebookId });
      }

      const result = await mcp.callTool('ask_question', { question });
      console.log('[DEBUG] Raw result type:', typeof result);
      console.log('[DEBUG] Raw result keys:', Object.keys(result || {}));

      const { answer, citations, confidence } = extractAnswer(result);
      res.json({ answer, citations, confidence, source: 'notebooklm-mcp' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add Notebook
  app.post('/mcp/add-notebook', async (req, res) => {
    const { url, name, description } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }
    try {
      const args = { url };
      if (name) args.name = name;
      if (description) args.description = description;
      const result = await mcp.callTool('add_notebook', args);
      res.json({ success: true, result });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // List Notebooks
  app.get('/mcp/notebooks', async (_req, res) => {
    try {
      const result = await mcp.callTool('list_notebooks');
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get Notebook Details
  app.get('/mcp/notebooks/:id', async (req, res) => {
    try {
      const result = await mcp.callTool('get_notebook', {
        notebook_id: req.params.id,
      });
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Select Notebook
  app.post('/mcp/notebooks/:id/select', async (req, res) => {
    try {
      await mcp.callTool('select_notebook', { notebook_id: req.params.id });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Authenticate
  app.post('/mcp/auth', async (_req, res) => {
    try {
      const result = await mcp.callTool('setup_auth');
      res.json({ success: true, message: String(result) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  const PORT = process.env.MCP_PROXY_PORT || 3100;
  app.listen(PORT, () => {
    console.log(`[NotebookLM MCP Proxy] Running on http://localhost:${PORT}`);
    console.log(`[NotebookLM MCP Proxy] Endpoints:`);
    console.log(`  GET  /mcp/health`);
    console.log(`  POST /mcp/ask              { question, notebookId? }`);
    console.log(`  POST /mcp/add-notebook     { url, name?, description? }`);
    console.log(`  GET  /mcp/notebooks`);
    console.log(`  GET  /mcp/notebooks/:id`);
    console.log(`  POST /mcp/notebooks/:id/select`);
    console.log(`  POST /mcp/auth`);
  });

  process.on('SIGINT', () => { mcp.stop(); process.exit(); });
  process.on('SIGTERM', () => { mcp.stop(); process.exit(); });
}

startProxy().catch(console.error);
