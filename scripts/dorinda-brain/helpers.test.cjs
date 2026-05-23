// scripts/dorinda-brain/helpers.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { mergeConsecutiveRoles, buildContents, parseGeminiParts, rpcNameFor } = require('./helpers.cjs');

test('mergeConsecutiveRoles junta turnos seguidos do mesmo role', () => {
  const input = [
    { role: 'user', text: 'oi' },
    { role: 'user', text: 'tem apê em Santos?' },
    { role: 'model', text: 'oi! tenho sim' },
  ];
  assert.deepStrictEqual(mergeConsecutiveRoles(input), [
    { role: 'user', text: 'oi\n\ntem apê em Santos?' },
    { role: 'model', text: 'oi! tenho sim' },
  ]);
});

test('buildContents mapeia sender_type e descarta model inicial', () => {
  const msgs = [
    { sender_type: 'ai', content: 'mensagem de boas-vindas automática' },
    { sender_type: 'visitor', content: 'tem apê?' },
    { sender_type: 'visitor', content: 'em Santos' },
  ];
  assert.deepStrictEqual(buildContents(msgs), [
    { role: 'user', parts: [{ text: 'tem apê?\n\nem Santos' }] },
  ]);
});

test('buildContents preserva alternância normal', () => {
  const msgs = [
    { sender_type: 'visitor', content: 'oi' },
    { sender_type: 'ai', content: 'oi!' },
    { sender_type: 'visitor', content: 'detalhe do LDR-2026-0002?' },
  ];
  const out = buildContents(msgs);
  assert.strictEqual(out.length, 3);
  assert.strictEqual(out[0].role, 'user');
  assert.strictEqual(out[1].role, 'model');
  assert.strictEqual(out[2].parts[0].text, 'detalhe do LDR-2026-0002?');
});

test('parseGeminiParts extrai functionCalls e texto', () => {
  const resp = { candidates: [{ content: { parts: [
    { functionCall: { name: 'consultar_imoveis', args: { p_city: 'Santos' } } },
  ] } }] };
  assert.deepStrictEqual(parseGeminiParts(resp), {
    functionCalls: [{ name: 'consultar_imoveis', args: { p_city: 'Santos' } }],
    text: '',
    modelContent: resp.candidates[0].content,
  });
});

test('parseGeminiParts concatena partes de texto', () => {
  const resp = { candidates: [{ content: { parts: [{ text: 'Olha ' }, { text: 'essa opção' }] } }] };
  assert.strictEqual(parseGeminiParts(resp).text, 'Olha essa opção');
});

test('rpcNameFor prefixa dorinda_', () => {
  assert.strictEqual(rpcNameFor('agendar_visita'), 'dorinda_agendar_visita');
});
