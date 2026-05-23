// scripts/dorinda-brain/orchestrate.test.cjs
const { test } = require('node:test');
const assert = require('node:assert');
const { runConversation } = require('./orchestrate.cjs');

function makeDeps(geminiSeq, rpcImpl, opts = {}) {
  // geminiSeq: array de respostas do Gemini, consumidas em ordem a cada POST generateContent
  let i = 0;
  const calls = { gemini: [], rpc: [] };
  const httpFn = async (o) => {
    if (o.url.includes('generativelanguage')) {
      calls.gemini.push(o.body);
      const r = geminiSeq[i++];
      if (r && r.__throw) { const e = new Error('boom'); e.statusCode = r.__throw; throw e; }
      return r;
    }
    if (o.url.includes('/rest/v1/rpc/')) {
      const name = o.url.split('/rpc/')[1];
      calls.rpc.push({ name, body: o.body });
      return rpcImpl(name, o.body);
    }
    if (o.url.includes('/rest/v1/chat_messages')) {
      if (opts.historyThrows) { const e = new Error('supabase down'); e.statusCode = 500; throw e; }
      return opts.history || [{ sender_type: 'visitor', content: 'detalhe do LDR-2026-0002?' }];
    }
    throw new Error('url inesperada: ' + o.url);
  };
  return { httpFn, calls };
}

const CFG = { geminiKey: 'k', supabaseUrl: 'https://x.supabase.co', anon: 'a', model: 'models/gemini-2.5-flash', maxIter: 6, systemPrompt: 'PROMPT' };

test('tool_call único → despacha RPC e retorna texto final', async () => {
  const seq = [
    { candidates: [{ content: { parts: [{ functionCall: { name: 'consultar_imovel_por_id', args: { p_identifier: 'LDR-2026-0002' } } }] } }] },
    { candidates: [{ content: { parts: [{ text: 'É o da Vila Mathias, R$ 550 mil!' }] } }] },
  ];
  const { httpFn, calls } = makeDeps(seq, () => ({ ok: true, ref_code: 'LDR-2026-0002', city: 'Santos' }));
  const out = await runConversation({ ...CFG, conversationId: 'c1', httpFn });
  assert.strictEqual(out.output, 'É o da Vila Mathias, R$ 550 mil!');
  assert.strictEqual(calls.rpc.length, 1);
  assert.strictEqual(calls.rpc[0].name, 'dorinda_consultar_imovel_por_id');
});

test('erro de RPC (ok:false) volta pro Gemini, não lança', async () => {
  const seq = [
    { candidates: [{ content: { parts: [{ functionCall: { name: 'agendar_visita', args: {} } }] } }] },
    { candidates: [{ content: { parts: [{ text: 'Esse horário já tá ocupado, que tal outro?' }] } }] },
  ];
  const { httpFn } = makeDeps(seq, () => ({ ok: false, error: 'conflict' }));
  const out = await runConversation({ ...CFG, conversationId: 'c1', httpFn });
  assert.match(out.output, /outro/);
});

test('MAX_ITER esgotado → fallback handoff + notificar_corretor urgencia alta', async () => {
  // sempre devolve functionCall, nunca texto → estoura o limite
  const loopResp = { candidates: [{ content: { parts: [{ functionCall: { name: 'consultar_imoveis', args: {} } }] } }] };
  const seq = Array(10).fill(loopResp);
  const { httpFn, calls } = makeDeps(seq, () => ({ ok: true, results: [] }));
  const out = await runConversation({ ...CFG, maxIter: 3, conversationId: 'c1', httpFn });
  assert.match(out.output, /Leandro/);
  const notif = calls.rpc.find((c) => c.name === 'dorinda_notificar_corretor');
  assert.ok(notif, 'deve ter chamado notificar_corretor');
  assert.strictEqual(notif.body.p_urgencia, 'alta');
  assert.ok(out.output.length > 0, 'output nunca vazio');
});

test('Gemini 503 → 1 retry e depois sucesso', async () => {
  const seq = [
    { __throw: 503 },
    { candidates: [{ content: { parts: [{ text: 'oi! tudo bem?' }] } }] },
  ];
  const { httpFn, calls } = makeDeps(seq, () => ({}));
  const out = await runConversation({ ...CFG, conversationId: 'c1', httpFn });
  assert.strictEqual(out.output, 'oi! tudo bem?');
  assert.strictEqual(calls.gemini.length, 2); // 1 falha + 1 retry
});

test('Gemini 503 persistente → fallback handoff', async () => {
  const seq = [{ __throw: 503 }, { __throw: 503 }, { __throw: 503 }];
  const { httpFn, calls } = makeDeps(seq, () => ({ ok: true }));
  const out = await runConversation({ ...CFG, conversationId: 'c1', httpFn });
  assert.match(out.output, /Leandro/);
  assert.ok(calls.rpc.some((c) => c.name === 'dorinda_notificar_corretor'));
});

test('history vazio → injeta "oi" e responde', async () => {
  const seq = [{ candidates: [{ content: { parts: [{ text: 'Oi! Como posso ajudar?' }] } }] }];
  const { httpFn } = makeDeps(seq, () => ({}), { history: [] });
  const out = await runConversation({ ...CFG, conversationId: 'c1', httpFn });
  assert.strictEqual(out.output, 'Oi! Como posso ajudar?');
});

test('múltiplos functionCalls num turno → despacha todos', async () => {
  const seq = [
    { candidates: [{ content: { parts: [
      { functionCall: { name: 'consultar_imoveis', args: { p_city: 'Santos' } } },
      { functionCall: { name: 'consultar_imovel_por_id', args: { p_identifier: 'LDR-2026-0001' } } },
    ] } }] },
    { candidates: [{ content: { parts: [{ text: 'Achei essas opções!' }] } }] },
  ];
  const { httpFn, calls } = makeDeps(seq, () => ({ ok: true }));
  const out = await runConversation({ ...CFG, conversationId: 'c1', httpFn });
  assert.strictEqual(out.output, 'Achei essas opções!');
  assert.strictEqual(calls.rpc.length, 2);
  assert.deepStrictEqual(calls.rpc.map((c) => c.name).sort(), ['dorinda_consultar_imoveis', 'dorinda_consultar_imovel_por_id']);
});

test('loadHistory falha → fallback handoff', async () => {
  const { httpFn, calls } = makeDeps([], () => ({ ok: true }), { historyThrows: true });
  const out = await runConversation({ ...CFG, conversationId: 'c1', httpFn });
  assert.match(out.output, /Leandro/);
  assert.ok(calls.rpc.some((c) => c.name === 'dorinda_notificar_corretor'));
});

test('injeta conversation_id nos tools de escrita (sobrescreve o do Gemini)', async () => {
  const seq = [
    { candidates: [{ content: { parts: [{ functionCall: { name: 'agendar_visita', args: { p_property_id: 'x', p_conversation_id: 'alucinado' } } }] } }] },
    { candidates: [{ content: { parts: [{ text: 'Visita confirmada VIS-2026-0001' }] } }] },
  ];
  const { httpFn, calls } = makeDeps(seq, () => ({ ok: true, protocol_code: 'VIS-2026-0001' }));
  await runConversation({ ...CFG, conversationId: 'conv-xyz', httpFn });
  const call = calls.rpc.find((c) => c.name === 'dorinda_agendar_visita');
  assert.strictEqual(call.body.p_conversation_id, 'conv-xyz');
  assert.strictEqual(call.body.p_property_id, 'x'); // preserva os demais args do Gemini
});

test('NÃO injeta conversation_id em tools read-only', async () => {
  const seq = [
    { candidates: [{ content: { parts: [{ functionCall: { name: 'consultar_imoveis', args: { p_city: 'Santos' } } }] } }] },
    { candidates: [{ content: { parts: [{ text: 'achei' }] } }] },
  ];
  const { httpFn, calls } = makeDeps(seq, () => ({ ok: true, results: [] }));
  await runConversation({ ...CFG, conversationId: 'conv-xyz', httpFn });
  const call = calls.rpc.find((c) => c.name === 'dorinda_consultar_imoveis');
  assert.strictEqual(call.body.p_conversation_id, undefined);
});
