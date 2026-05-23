// scripts/dorinda-brain/prompt.test.cjs
const { test } = require('node:test');
const assert = require('node:assert');
const { extractPrompt, nowPtBr } = require('./prompt.cjs');

test('extractPrompt pega o conteúdo após o marcador de início', () => {
  const raw = 'lixo de cabeçalho\n===== INÍCIO DO PROMPT =====\n# IDENTIDADE\nVocê é a Dorinda.\n{{ $now }}\nfim';
  const out = extractPrompt(raw, '2026-05-23 14:00 (sexta-feira)');
  assert.ok(out.startsWith('# IDENTIDADE'), 'deve começar no conteúdo do prompt');
  assert.ok(!out.includes('lixo de cabeçalho'), 'não deve incluir o cabeçalho');
  assert.ok(out.includes('2026-05-23 14:00 (sexta-feira)'), 'deve substituir {{ $now }}');
  assert.ok(!out.includes('{{ $now }}'), 'não deve sobrar placeholder');
});

test('nowPtBr produz string com data e hora', () => {
  const s = nowPtBr(new Date('2026-05-23T17:00:00Z'));
  assert.match(s, /2026/);
});
