import { spawn } from 'child_process';

const proc = spawn('npx', ['notebooklm-mcp@latest'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true,
});

let buffer = '';
let requestId = 0;

proc.stderr.on('data', (d) => {
  const text = d.toString();
  if (text.includes('Ready to receive')) {
    console.log('MCP ready, adding notebook...');
    sendRequest('add_notebook', {
      url: 'https://notebooklm.google.com/notebook/21aca734-f2a0-456e-9212-8d23bd325025',
      name: 'KSU Athletics - Taking Flight to 2026',
      description: 'KSU Athletics FY2026 Strategic Plan - Budget, Revenue Targets, Capital Projects'
    });
  }
});

proc.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      console.log('Response:', JSON.stringify(msg, null, 2));
      // After add_notebook, ask a test question
      if (msg.id === 1 && !msg.error) {
        console.log('\nNotebook added! Now testing a query...');
        sendRequest('ask_question', { question: 'What is the total FY 2026 budget?' });
      } else if (msg.id === 2) {
        console.log('\nQuery test complete!');
        proc.kill();
        process.exit(0);
      }
    } catch {}
  }
});

function sendRequest(tool, args) {
  const id = ++requestId;
  const req = { jsonrpc: '2.0', id, method: 'tools/call', params: { name: tool, arguments: args } };
  proc.stdin.write(JSON.stringify(req) + '\n');
}

setTimeout(() => { console.log('Timeout'); proc.kill(); process.exit(1); }, 180000);
