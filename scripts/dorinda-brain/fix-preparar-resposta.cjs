// scripts/dorinda-brain/fix-preparar-resposta.cjs
// Patch cirúrgico no nó "Preparar Resposta": inclui workspace_id no INSERT em chat_messages,
// derivando-o do conversation_id via subquery (chat_messages.workspace_id é NOT NULL).
// Uso: node ... --show   (mostra o trecho atual)  |  node ... --apply  (aplica)
const fs = require('node:fs');
const path = require('node:path');

const WF_ID = 'Db1qI76NKGnJB3x6';
const OLD = "INSERT INTO chat_messages (conversation_id, sender_type, sender_name, content) SELECT '${convId}', 'ai', 'Dorinda', '${safeOutput}'";
const NEW = "INSERT INTO chat_messages (workspace_id, conversation_id, sender_type, sender_name, content) SELECT (SELECT workspace_id FROM chat_conversations WHERE id = '${convId}'), '${convId}', 'ai', 'Dorinda', '${safeOutput}'";

function env() {
  const e = {};
  for (const l of fs.readFileSync(path.resolve(__dirname, '../../.env.local'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim();
  }
  return e;
}

async function main() {
  const mode = process.argv[2] || '--show';
  const e = env();
  const base = e.N8N_API_URL.replace(/\/$/, '');
  const headers = { 'X-N8N-API-KEY': e.N8N_API_KEY, 'content-type': 'application/json', accept: 'application/json' };

  const wf = await (await fetch(`${base}/workflows/${WF_ID}`, { headers })).json();
  const node = wf.nodes.find((n) => n.name === 'Preparar Resposta');
  if (!node) { console.log('nó Preparar Resposta não encontrado'); process.exit(1); }
  const code = node.parameters.jsCode;

  if (code.includes(NEW)) { console.log('[já aplicado] o INSERT já inclui workspace_id.'); return; }
  const occurrences = code.split(OLD).length - 1;
  console.log('ocorrências do trecho OLD:', occurrences);
  const idx = code.indexOf('INSERT INTO chat_messages');
  console.log('--- trecho atual (160 chars) ---');
  console.log(idx >= 0 ? code.slice(idx, idx + 160) : '(não achei INSERT INTO chat_messages)');

  if (mode !== '--apply') { console.log('\n[SHOW] nada alterado.'); return; }
  if (occurrences !== 1) { console.log('ABORT: esperava exatamente 1 ocorrência, achei', occurrences); process.exit(1); }

  node.parameters.jsCode = code.replace(OLD, NEW);
  const ALLOWED = ['saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution', 'saveDataSuccessExecution', 'executionTimeout', 'errorWorkflow', 'timezone', 'executionOrder'];
  const settings = {};
  for (const k of ALLOWED) if (wf.settings && wf.settings[k] !== undefined) settings[k] = wf.settings[k];
  const body = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings };
  const put = await fetch(`${base}/workflows/${WF_ID}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!put.ok) { console.log('PUT falhou', put.status, (await put.text()).slice(0, 400)); process.exit(1); }
  console.log('\n[PUT ok] workspace_id incluído no INSERT.');
}

main().catch((e) => { console.log('ERR', e.message); process.exit(1); });
