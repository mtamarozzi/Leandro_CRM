// scripts/dorinda-brain/scenario-runner.cjs
// Valida os 13 cenários do PROMPT-DORINDA.md (sub-bloco 4.6).
// Service-role: cria conversa, insere mensagens, flipa status (cenário reservado).
// Cérebro (orchestrate): roda com ANON (igual produção). Loga as RPCs chamadas + respostas.
// Uso: node scripts/dorinda-brain/scenario-runner.cjs [idDoCenario]   (sem arg = todos)
const fs = require('node:fs');
const path = require('node:path');
const { runConversation } = require('./orchestrate.cjs');
const { loadPrompt, nowPtBr } = require('./prompt.cjs');

const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../.env.local'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const URL = env.VITE_SUPABASE_URL, ANON = env.VITE_SUPABASE_ANON_KEY, SR = env.SUPABASE_SERVICE_ROLE_KEY, GEMINI = env.GEMINI_API_KEY;
const SYSTEM_PROMPT = loadPrompt(nowPtBr());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DELAY = Number(process.argv[3] || 12000); // espaçamento antes de cada chamada ao Gemini (free-tier rate limit)
const MODEL = process.argv[5] || 'models/gemini-2.5-flash'; // override p/ contornar cota diária do 2.5-flash

async function sr(method, pathQ, body, prefer) {
  const headers = { apikey: SR, Authorization: 'Bearer ' + SR, 'Content-Type': 'application/json' };
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(`${URL}/rest/v1/${pathQ}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`SR ${method} ${pathQ}: ${r.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}

async function getWorkspaceId() { return (await sr('GET', 'workspaces?select=id&limit=1'))[0].id; }

async function createConv(ws, label) {
  const row = await sr('POST', 'chat_conversations', {
    workspace_id: ws, visitor_id: 'v46-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    visitor_name: 'Cenário 4.6', source: 'chat_widget', status: 'ai_mode',
  }, 'return=representation');
  return row[0].id;
}
async function insertMsg(ws, convId, sender, content) {
  await sr('POST', 'chat_messages', { workspace_id: ws, conversation_id: convId, sender_type: sender, sender_name: sender === 'visitor' ? 'Cenário 4.6' : 'Dorinda', content });
}
async function setStatus(ref, status) { await sr('PATCH', `properties?ref_code=eq.${ref}`, { status }); }

// httpFn do cérebro (anon) que loga as RPCs chamadas + resposta
function makeBrainHttp(toolLog) {
  return async (opts) => {
    const r = await fetch(opts.url, {
      method: opts.method, headers: opts.headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const t = await r.text();
    if (!r.ok) { const e = new Error(t); e.statusCode = r.status; throw e; }
    const parsed = t ? JSON.parse(t) : null;
    if (opts.url.includes('/rest/v1/rpc/')) {
      toolLog.push({ name: opts.url.split('/rpc/')[1], resp: parsed });
    }
    return parsed;
  };
}

const LDR2 = 'LDR-2026-0002'; // Macuco, R$ 550k
const LDR1 = 'LDR-2026-0001'; // Embaré, R$ 750k

const SCENARIOS = [
  { id: 'saudacao', label: 'Saudação genérica ("oi") → não pede nome', turns: ['oi'] },
  { id: 'pergunta_direta', label: 'Pergunta direta → consulta tool e apresenta', turns: ['tem apê em Santos?'] },
  { id: 'preco', label: 'Pergunta sobre preço → pacote completo', turns: [`quanto sai tudo de custo no ${LDR2}? preço, condomínio, IPTU`] },
  { id: 'visita', label: 'Pedido de visita → agenda e gera protocolo', turns: [
    `quero visitar o apê do Macuco ${LDR2}, dá pra marcar?`,
    'pode ser na próxima sexta-feira às 15h',
    'meu nome é João Silva, WhatsApp (13) 99888-7777',
  ] },
  { id: 'desconto', label: 'Pedido de desconto → handoff', turns: [`no ${LDR2} de 550 mil, dá um desconto de 50 mil?`] },
  { id: 'fgts', label: 'Pergunta sobre FGTS → handoff', turns: ['posso usar meu FGTS pra comprar esse apê?'] },
  { id: 'humano', label: 'Pede pra falar com humano → handoff', turns: ['prefiro falar direto com o corretor, pode chamar ele pra mim?'] },
  { id: 'locacao', label: 'Locação → fala caução/fiador, não entrada', turns: ['quero ALUGAR um apê em Santos. como funciona a garantia?'] },
  { id: 'reservado', label: 'Imóvel reservado → status real + alternativa', turns: [`o apê do Embaré ${LDR1} ainda tá disponível?`],
    setup: () => setStatus(LDR1, 'reservado'), teardown: () => setStatus(LDR1, 'disponivel') },
  { id: 'confusa', label: 'Confusão repetida 3x → handoff', turns: ['??? não tô entendendo', 'continuo sem entender nada do que você falou', 'de novo não entendi, tá muito confuso'] },
  { id: 'robo', label: '"Você é robô?" → sem confirmar/negar elaboradamente', turns: ['você é um robô?'] },
  { id: 'audio', label: 'Áudio transcrito → tratado como texto', turns: ['oi tudo bem entao eu queria saber se vc tem apartamento em santos pra vender'] },
  { id: 'encerra', label: 'Encerra conversa → calor sem forçar', turns: ['valeu, por enquanto era só isso. tchau!'] },
];

function summarizeTools(toolLog) {
  return toolLog.map((t) => {
    const r = t.resp || {};
    const bits = [];
    if (r.protocol_code) bits.push('protocol=' + r.protocol_code);
    if (r.notification_id) bits.push('notif=' + String(r.notification_id).slice(0, 8));
    if (r.conversation_switched_to_human !== undefined) bits.push('human_mode=' + r.conversation_switched_to_human);
    if (r.count !== undefined) bits.push('count=' + r.count);
    if (r.lead_id) bits.push('lead=' + String(r.lead_id).slice(0, 8));
    if (r.ok === false) bits.push('ERRO:' + (r.error || r.stage || '?'));
    return `${t.name}(${bits.join(',')})`;
  }).join(' | ') || '(nenhuma)';
}

async function run(scenario, ws) {
  if (scenario.setup) await scenario.setup();
  const convId = await createConv(ws, scenario.label);
  const toolLog = [];
  let out;
  try {
    for (let i = 0; i < scenario.turns.length; i++) {
      await insertMsg(ws, convId, 'visitor', scenario.turns[i]);
      await sleep(DELAY);
      out = await runConversation({ geminiKey: GEMINI, supabaseUrl: URL, anon: ANON, model: MODEL, maxIter: 6, systemPrompt: SYSTEM_PROMPT, conversationId: convId, httpFn: makeBrainHttp(toolLog) });
      if (i < scenario.turns.length - 1) await insertMsg(ws, convId, 'ai', out.output);
    }
  } finally {
    if (scenario.teardown) await scenario.teardown();
  }
  console.log('\n══════════════════════════════════════════');
  console.log(`[${scenario.id}] ${scenario.label}`);
  console.log('turns:', JSON.stringify(scenario.turns));
  console.log('RPCs:', summarizeTools(toolLog));
  if (out._fallback) console.log('FALLBACK:', out._fallback);
  console.log('Dorinda →', out.output.replace(/\n+/g, ' ').slice(0, 600));
}

(async () => {
  const only = process.argv[2];
  const ids = only && only !== 'all' ? only.split(',') : null;
  const initialWait = Number(process.argv[4] || 0); // espera inicial p/ janela de cota limpar
  if (initialWait) { console.log(`aguardando ${initialWait}ms p/ cota resetar...`); await sleep(initialWait); }
  const ws = await getWorkspaceId();
  const list = ids ? SCENARIOS.filter((s) => ids.includes(s.id)) : SCENARIOS;
  for (const s of list) {
    try { await run(s, ws); } catch (e) { console.log(`\n[${s.id}] ERRO NO RUNNER:`, e.message); }
  }
  console.log('\n[fim]');
})();
