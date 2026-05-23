// scripts/dorinda-brain/inject-to-n8n.cjs
// Injeta o nó "Dorinda Brain" no workflow via API do n8n, lendo o jsCode de dorinda-brain.n8n.js
// (sem transcrição). Desabilita os nós antigos, religa Pausa→Brain→Preparar, desativa o workflow.
// Uso:
//   node scripts/dorinda-brain/inject-to-n8n.cjs --probe   (só inspeciona, não altera)
//   node scripts/dorinda-brain/inject-to-n8n.cjs --apply   (aplica as mudanças)
const fs = require('node:fs');
const path = require('node:path');

const WF_ID = 'Db1qI76NKGnJB3x6';
const BRAIN = 'Dorinda Brain';
const OLD_NODES = [
  'AI Agent (Chat Web)', 'Google Gemini Chat Model', 'Memória Chat Web',
  'consultar_imoveis', 'consultar_imovel_por_id', 'criar_lead', 'agendar_visita', 'notificar_corretor',
];

function env() {
  const e = {};
  for (const l of fs.readFileSync(path.resolve(__dirname, '../../.env.local'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].trim();
  }
  return e;
}

async function main() {
  const mode = process.argv[2] || '--probe';
  const e = env();
  const base = e.N8N_API_URL.replace(/\/$/, '');
  const headers = { 'X-N8N-API-KEY': e.N8N_API_KEY, 'content-type': 'application/json', accept: 'application/json' };

  const getRes = await fetch(`${base}/workflows/${WF_ID}`, { headers });
  if (!getRes.ok) { console.log('GET falhou', getRes.status, (await getRes.text()).slice(0, 300)); process.exit(1); }
  const wf = await getRes.json();

  console.log('active:', wf.active);
  console.log('nodes:', wf.nodes.map((n) => n.name + (n.disabled ? '(disabled)' : '')).join(' | '));
  console.log('connection sources:', Object.keys(wf.connections).join(' | '));

  if (mode === '--probe') { console.log('\n[PROBE] nada alterado.'); return; }

  // 1) adicionar Dorinda Brain (se ainda não existe)
  const jsCode = fs.readFileSync(path.join(__dirname, 'dorinda-brain.n8n.js'), 'utf8');
  if (!wf.nodes.find((n) => n.name === BRAIN)) {
    wf.nodes.push({
      name: BRAIN, type: 'n8n-nodes-base.code', typeVersion: 2, position: [1456, -288],
      parameters: { mode: 'runOnceForEachItem', jsCode },
    });
  } else {
    wf.nodes.find((n) => n.name === BRAIN).parameters.jsCode = jsCode;
  }

  // 2) desabilitar os nós antigos
  for (const n of wf.nodes) if (OLD_NODES.includes(n.name)) n.disabled = true;

  // 3) religar o fluxo main: Pausa Humanizada → Dorinda Brain → Preparar Resposta
  const c = wf.connections;
  c['Pausa Humanizada'] = { main: [[{ node: BRAIN, type: 'main', index: 0 }]] };
  c[BRAIN] = { main: [[{ node: 'Preparar Resposta', type: 'main', index: 0 }]] };
  // (mantém as conexões ai_* apontando pro AI Agent desabilitado — facilita rollback)

  // 4) PUT só com os campos que a API aceita. settings: só as chaves do schema público.
  const ALLOWED_SETTINGS = ['saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution', 'saveDataSuccessExecution', 'executionTimeout', 'errorWorkflow', 'timezone', 'executionOrder'];
  const cleanSettings = {};
  for (const k of ALLOWED_SETTINGS) if (wf.settings && wf.settings[k] !== undefined) cleanSettings[k] = wf.settings[k];
  const body = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: cleanSettings };
  const putRes = await fetch(`${base}/workflows/${WF_ID}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!putRes.ok) { console.log('PUT falhou', putRes.status, (await putRes.text()).slice(0, 500)); process.exit(1); }
  console.log('\n[PUT ok]');

  // 5) desativar o workflow (endpoint dedicado)
  const deact = await fetch(`${base}/workflows/${WF_ID}/deactivate`, { method: 'POST', headers });
  console.log('deactivate:', deact.status);
}

main().catch((e) => { console.log('ERR', e.message); process.exit(1); });
