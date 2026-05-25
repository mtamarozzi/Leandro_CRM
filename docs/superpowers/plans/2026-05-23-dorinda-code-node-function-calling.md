# Dorinda Code Node (function-calling manual) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o bloco `AI Agent + toolHttpRequest` da Dorinda por um único Code Node no n8n que faz function-calling manual contra a API REST do Gemini e despacha tool_calls direto pras 5 RPCs do Supabase.

**Architecture:** Lógica pura (merge de turnos, schema de tools, parse do Gemini) desenvolvida e testada localmente em `scripts/dorinda-brain/` com `node:test`; um runner de integração valida o loop completo contra Gemini+Supabase reais; um build script inlina tudo (helpers + tools + prompt + secrets do `.env.local`) num único `jsCode` self-contained injetado no Code Node via MCP. O resto do workflow não muda.

**Tech Stack:** n8n (Code Node, `this.helpers.httpRequest`), Google Gemini `v1beta:generateContent`, Supabase PostgREST RPC, Node.js (`node:test`), PowerShell (smoke e2e).

**Spec:** `docs/superpowers/specs/2026-05-23-dorinda-code-node-function-calling-design.md`

---

## File Structure

| Arquivo | Responsabilidade | Commitado? |
|---|---|---|
| `scripts/dorinda-brain/helpers.js` | Funções puras: merge de roles, buildContents, parse de resposta Gemini, mapeamento nome→rpc | sim |
| `scripts/dorinda-brain/helpers.test.js` | Testes unitários das funções puras (`node:test`) | sim |
| `scripts/dorinda-brain/tools.js` | `FUNCTION_DECLARATIONS` (schema das 5 funções) | sim |
| `scripts/dorinda-brain/tools.test.js` | Testes do schema (nomes, required, tipos) | sim |
| `scripts/dorinda-brain/prompt.js` | Lê `docs/PROMPT-DORINDA.md`, extrai entre marcadores, substitui `{{ $now }}` | sim |
| `scripts/dorinda-brain/prompt.test.js` | Testes do loader do prompt | sim |
| `scripts/dorinda-brain/orchestrate.js` | O loop de function-calling (puro, recebe um `httpFn` injetável) | sim |
| `scripts/dorinda-brain/orchestrate.test.js` | Teste do loop com `httpFn` fake (tool_call → resposta; MAX_ITER; fallback) | sim |
| `scripts/dorinda-brain/run-integration.js` | Runner manual: roda o loop real contra Gemini+Supabase pra um `conversation_id` | sim |
| `scripts/dorinda-brain/build-n8n-code.js` | Concatena tudo + injeta secrets do `.env.local` → emite o `jsCode` | sim |
| `scripts/dorinda-brain/dorinda-brain.n8n.js` | **Artefato gerado** (contém secrets) — injetado no n8n | **NÃO** (gitignore) |

---

## Task 1: Fase 0 — Probe da capacidade HTTP do Code Node

Confirma se `this.helpers.httpRequest` funciona dentro de um Code Node nesta versão do n8n. Se falhar, o código final usa `fetch`. (Observação #1 do usuário.)

**Files:** nenhum local. Cria workflow temporário `[LEANDRO] _probe_http` via MCP.

- [ ] **Step 1: Criar workflow de probe via MCP**

Usar `mcp__n8n__n8n_create_workflow` com 2 nós: `Manual Trigger` → `Code` (`runOnceForAllItems`). jsCode do Code Node:

```javascript
const url = 'https://ompbnsrtnpgwiufanljp.supabase.co/rest/v1/chat_conversations?select=id&limit=1';
const anon = $env.SUPABASE_LEANDRO_ANON_KEY || 'PASTE_ANON_FOR_PROBE';
const headers = { apikey: anon, Authorization: 'Bearer ' + anon };
const out = {};
// método A: this.helpers.httpRequest
try {
  const r = await this.helpers.httpRequest({ method: 'GET', url, headers, json: true });
  out.helpers_ok = true; out.helpers_sample = Array.isArray(r) ? r.length : typeof r;
} catch (e) { out.helpers_ok = false; out.helpers_err = String(e.message || e); }
// método B: fetch nativo
try {
  const r2 = await fetch(url, { headers });
  out.fetch_ok = r2.ok; out.fetch_status = r2.status;
} catch (e) { out.fetch_ok = false; out.fetch_err = String(e.message || e); }
return [{ json: out }];
```

> Se `$env.SUPABASE_LEANDRO_ANON_KEY` não existir no servidor, trocar `PASTE_ANON_FOR_PROBE` pela anon key real antes de criar (key do `.env.local`).

- [ ] **Step 2: Executar e ler o resultado**

Pedir ao usuário pra abrir `[LEANDRO] _probe_http` no n8n e clicar **Test workflow** (uma vez). Depois ler via:

Run (MCP): `n8n_executions(action: "list", workflowId: "<id do probe>", limit: 1, includeData: true)`
Expected: um item com `helpers_ok` e `fetch_ok`. Registrar qual(is) `true`.

- [ ] **Step 3: Decidir o método HTTP e anotar**

Regra: se `helpers_ok=true` → método primário = `this.helpers.httpRequest`. Senão se `fetch_ok=true` → método = `fetch`. Anotar a decisão num comentário no topo de `scripts/dorinda-brain/orchestrate.js` (Task 6 usa).

- [ ] **Step 4: Deletar o workflow de probe**

Run (MCP): `n8n_delete_workflow(id: "<id do probe>")`
Expected: success. O canvas do projeto fica limpo.

---

## Task 2: Helpers puros (merge de roles, buildContents, parse)

**Files:**
- Create: `scripts/dorinda-brain/helpers.js`
- Test: `scripts/dorinda-brain/helpers.test.js`

- [ ] **Step 1: Escrever os testes que falham**

```javascript
// scripts/dorinda-brain/helpers.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { mergeConsecutiveRoles, buildContents, parseGeminiParts, rpcNameFor } = require('./helpers');

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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test scripts/dorinda-brain/helpers.test.js`
Expected: FAIL — `Cannot find module './helpers'`.

- [ ] **Step 3: Implementar `helpers.js`**

```javascript
// scripts/dorinda-brain/helpers.js
function mergeConsecutiveRoles(turns) {
  const out = [];
  for (const t of turns) {
    const last = out[out.length - 1];
    if (last && last.role === t.role) last.text += '\n\n' + t.text;
    else out.push({ role: t.role, text: t.text });
  }
  return out;
}

function buildContents(chatMessages) {
  const turns = chatMessages.map((m) => ({
    role: m.sender_type === 'visitor' ? 'user' : 'model',
    text: m.content || '',
  }));
  const merged = mergeConsecutiveRoles(turns);
  while (merged.length && merged[0].role === 'model') merged.shift(); // Gemini exige começar com user
  return merged.map((t) => ({ role: t.role, parts: [{ text: t.text }] }));
}

function parseGeminiParts(resp) {
  const content = resp?.candidates?.[0]?.content || { parts: [] };
  const parts = content.parts || [];
  const functionCalls = parts.filter((p) => p.functionCall).map((p) => p.functionCall);
  const text = parts.filter((p) => typeof p.text === 'string').map((p) => p.text).join('');
  return { functionCalls, text, modelContent: content };
}

function rpcNameFor(toolName) {
  return 'dorinda_' + toolName;
}

module.exports = { mergeConsecutiveRoles, buildContents, parseGeminiParts, rpcNameFor };
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test scripts/dorinda-brain/helpers.test.js`
Expected: PASS (6 testes).

- [ ] **Step 5: Commit**

```bash
git add scripts/dorinda-brain/helpers.js scripts/dorinda-brain/helpers.test.js
git commit -m "feat(dorinda): helpers puros para function-calling manual (merge roles, buildContents, parse)"
```

---

## Task 3: function_declarations das 5 tools

**Files:**
- Create: `scripts/dorinda-brain/tools.js`
- Test: `scripts/dorinda-brain/tools.test.js`

- [ ] **Step 1: Escrever os testes que falham**

```javascript
// scripts/dorinda-brain/tools.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { FUNCTION_DECLARATIONS } = require('./tools');

test('declara exatamente as 5 funções', () => {
  const names = FUNCTION_DECLARATIONS.map((d) => d.name).sort();
  assert.deepStrictEqual(names, ['agendar_visita', 'consultar_imovel_por_id', 'consultar_imoveis', 'criar_lead', 'notificar_corretor']);
});

test('cada função tem description e parameters object', () => {
  for (const d of FUNCTION_DECLARATIONS) {
    assert.ok(d.description && d.description.length > 10, `${d.name} sem description`);
    assert.strictEqual(d.parameters.type, 'object', `${d.name} parameters.type`);
  }
});

test('required bate com o contrato das RPCs', () => {
  const byName = Object.fromEntries(FUNCTION_DECLARATIONS.map((d) => [d.name, d]));
  assert.deepStrictEqual(byName['consultar_imovel_por_id'].parameters.required, ['p_identifier']);
  assert.deepStrictEqual(byName['criar_lead'].parameters.required.sort(), ['p_name', 'p_phone']);
  assert.deepStrictEqual(byName['agendar_visita'].parameters.required.sort(), ['p_lead_name', 'p_lead_phone', 'p_property_id', 'p_starts_at']);
  assert.deepStrictEqual(byName['notificar_corretor'].parameters.required.sort(), ['p_mensagem', 'p_tipo']);
  assert.deepStrictEqual(byName['consultar_imoveis'].parameters.required || [], []);
});

test('tipos numéricos e array corretos', () => {
  const ci = FUNCTION_DECLARATIONS.find((d) => d.name === 'consultar_imoveis').parameters.properties;
  assert.strictEqual(ci.p_min_bedrooms.type, 'integer');
  assert.strictEqual(ci.p_max_sale_price.type, 'number');
  assert.strictEqual(ci.p_pet_friendly.type, 'boolean');
  const cl = FUNCTION_DECLARATIONS.find((d) => d.name === 'criar_lead').parameters.properties;
  assert.strictEqual(cl.p_property_ids.type, 'array');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test scripts/dorinda-brain/tools.test.js`
Expected: FAIL — `Cannot find module './tools'`.

- [ ] **Step 3: Implementar `tools.js`**

Descrições reaproveitadas de `docs/04-DORINDA-TOOLS-CONTRACT.md` / `docs/04-DORINDA-TOOLS-N8N-SETUP.md`.

```javascript
// scripts/dorinda-brain/tools.js
const FUNCTION_DECLARATIONS = [
  {
    name: 'consultar_imoveis',
    description: 'Busca imóveis no catálogo do Leandro com filtros opcionais. Use sempre que o lead descrever o que procura. NUNCA invente imóvel — chame esta tool antes de citar características. Retorna {ok, count, results[]}.',
    parameters: {
      type: 'object',
      properties: {
        p_city: { type: 'string', description: 'Cidade (ex.: Santos). Omita se não mencionado.' },
        p_neighborhood: { type: 'string', description: 'Bairro. Omita se não mencionado.' },
        p_purpose: { type: 'string', description: 'venda ou locacao. Omita se não mencionado.', enum: ['venda', 'locacao'] },
        p_kind: { type: 'string', description: 'Tipo: apartamento, casa, cobertura, studio, etc. Omita se não mencionado.' },
        p_min_bedrooms: { type: 'integer', description: 'Mínimo de dormitórios.' },
        p_max_bedrooms: { type: 'integer', description: 'Máximo de dormitórios.' },
        p_max_sale_price: { type: 'number', description: 'Preço máximo de venda em reais (ex.: 800000).' },
        p_max_rent_price: { type: 'number', description: 'Aluguel máximo em reais.' },
        p_pet_friendly: { type: 'boolean', description: 'Aceita pet.' },
        p_is_furnished: { type: 'boolean', description: 'Mobiliado.' },
        p_limit: { type: 'integer', description: 'Máximo de resultados (default 5).' },
      },
    },
  },
  {
    name: 'consultar_imovel_por_id',
    description: 'Busca detalhes COMPLETOS de UM imóvel pelo UUID ou ref_code (ex.: LDR-2026-0002). Use quando o lead pedir mais detalhes. Retorna mesmo imóveis vendidos/alugados com campo status.',
    parameters: {
      type: 'object',
      properties: {
        p_identifier: { type: 'string', description: 'UUID do imóvel OU ref_code (ex.: LDR-2026-0002). Obrigatório.' },
      },
      required: ['p_identifier'],
    },
  },
  {
    name: 'criar_lead',
    description: 'Cria (ou atualiza pelo telefone) um lead no CRM. CHAME APENAS depois que o lead compartilhou nome completo E WhatsApp espontaneamente, na etapa final. Merge não-destrutivo. Retorna {ok, lead_id, was_existing, linked_properties}.',
    parameters: {
      type: 'object',
      properties: {
        p_name: { type: 'string', description: 'Nome completo do lead. Obrigatório.' },
        p_phone: { type: 'string', description: 'WhatsApp em qualquer formato (a função normaliza). Obrigatório.' },
        p_interest: { type: 'string', description: 'Resumo do interesse em 1 frase.' },
        p_interest_purpose: { type: 'string', description: 'venda ou locacao.', enum: ['venda', 'locacao'] },
        p_property_ids: { type: 'array', items: { type: 'string' }, description: 'Array de UUIDs dos imóveis de interesse. Use [] se nenhum.' },
        p_conversation_id: { type: 'string', description: 'UUID da conversa atual do widget.' },
        p_ai_summary: { type: 'string', description: 'Síntese da conversa em 1-2 frases.' },
      },
      required: ['p_name', 'p_phone'],
    },
  },
  {
    name: 'agendar_visita',
    description: 'Agenda visita do lead a um imóvel. Use SOMENTE quando o lead confirmou data/hora E forneceu nome + WhatsApp. Cria o lead automaticamente se não existir (não chame criar_lead antes). Retorna {ok, event_id, lead_id, protocol_code (VIS-2026-NNNN), human_readable}. SEMPRE inclua o protocol_code na confirmação. Em conflito de horário retorna {ok:false, error:"conflict"}; em erro de validação, JSON tem "stage".',
    parameters: {
      type: 'object',
      properties: {
        p_property_id: { type: 'string', description: 'UUID do imóvel (NÃO o ref_code — use o id retornado por consultar_imoveis). Obrigatório.' },
        p_lead_phone: { type: 'string', description: 'WhatsApp do lead. Obrigatório.' },
        p_lead_name: { type: 'string', description: 'Nome completo do lead. Obrigatório.' },
        p_starts_at: { type: 'string', description: 'Início em ISO 8601 com timezone (ex.: "2026-05-25T14:00:00-03:00"). Futuro, até 90 dias. Obrigatório.' },
        p_duration_minutes: { type: 'integer', description: 'Duração em minutos. Default 60.' },
        p_conversation_id: { type: 'string', description: 'UUID da conversa atual.' },
        p_notes: { type: 'string', description: 'Observações sobre a visita.' },
      },
      required: ['p_property_id', 'p_lead_phone', 'p_lead_name', 'p_starts_at'],
    },
  },
  {
    name: 'notificar_corretor',
    description: 'Aciona o Leandro (handoff). Use nos casos da seção HANDOFF do prompt. Com urgencia="alta", a conversa vira human_mode e você para de responder. Retorna {ok, notification_id, conversation_switched_to_human}.',
    parameters: {
      type: 'object',
      properties: {
        p_tipo: { type: 'string', description: 'Tipo da notificação (ex.: handoff, visita_agendada). Obrigatório.' },
        p_mensagem: { type: 'string', description: 'Mensagem pro corretor explicando o contexto. Obrigatório.' },
        p_urgencia: { type: 'string', description: 'baixa, media ou alta. Default media.', enum: ['baixa', 'media', 'alta'] },
        p_conversation_id: { type: 'string', description: 'UUID da conversa atual.' },
      },
      required: ['p_tipo', 'p_mensagem'],
    },
  },
];

module.exports = { FUNCTION_DECLARATIONS };
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test scripts/dorinda-brain/tools.test.js`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add scripts/dorinda-brain/tools.js scripts/dorinda-brain/tools.test.js
git commit -m "feat(dorinda): function_declarations das 5 tools com schema validado"
```

---

## Task 4: Loader do system prompt

**Files:**
- Create: `scripts/dorinda-brain/prompt.js`
- Test: `scripts/dorinda-brain/prompt.test.js`

- [ ] **Step 1: Escrever os testes que falham**

```javascript
// scripts/dorinda-brain/prompt.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { extractPrompt, nowPtBr } = require('./prompt');

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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test scripts/dorinda-brain/prompt.test.js`
Expected: FAIL — `Cannot find module './prompt'`.

- [ ] **Step 3: Implementar `prompt.js`**

```javascript
// scripts/dorinda-brain/prompt.js
const fs = require('node:fs');
const path = require('node:path');

const START_MARKER = '===== INÍCIO DO PROMPT =====';

function nowPtBr(date = new Date()) {
  // America/Sao_Paulo, formato legível pro modelo
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'short',
  }).format(date);
}

function extractPrompt(raw, nowStr) {
  const idx = raw.lastIndexOf(START_MARKER); // o marcador aparece 2x no .md (preâmbulo + divisor); pegar o último
  let body = idx >= 0 ? raw.slice(idx + START_MARKER.length) : raw;
  // remove um marcador de fim, se existir
  body = body.replace(/=====\s*FIM DO PROMPT\s*=====[\s\S]*$/i, '');
  return body.replace(/\{\{\s*\$now\s*\}\}/g, nowStr).trim();
}

function loadPrompt(nowStr = nowPtBr()) {
  const file = path.resolve(__dirname, '../../docs/PROMPT-DORINDA.md');
  return extractPrompt(fs.readFileSync(file, 'utf8'), nowStr);
}

module.exports = { extractPrompt, nowPtBr, loadPrompt };
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test scripts/dorinda-brain/prompt.test.js`
Expected: PASS (2 testes).

- [ ] **Step 5: Sanity check do prompt real**

Run: `node -e "console.log(require('./scripts/dorinda-brain/prompt').loadPrompt().slice(0,120))"`
Expected: imprime começando em `# IDENTIDADE` (sem cabeçalho do .md, sem `{{ $now }}`).

- [ ] **Step 6: Commit**

```bash
git add scripts/dorinda-brain/prompt.js scripts/dorinda-brain/prompt.test.js
git commit -m "feat(dorinda): loader do system prompt com substituição de data pt-BR"
```

---

## Task 5: Loop de orquestração (function-calling)

Loop puro e testável: recebe `httpFn` injetável (pra testar com fake e usar real em produção). Inclui retry de 503 e fallback não-silencioso com handoff (observação #2).

**Files:**
- Create: `scripts/dorinda-brain/orchestrate.js`
- Test: `scripts/dorinda-brain/orchestrate.test.js`

- [ ] **Step 1: Escrever os testes que falham**

```javascript
// scripts/dorinda-brain/orchestrate.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { runConversation } = require('./orchestrate');

function makeDeps(geminiSeq, rpcImpl) {
  // geminiSeq: array de respostas do Gemini, consumidas em ordem a cada POST generateContent
  let i = 0;
  const calls = { gemini: [], rpc: [] };
  const httpFn = async (opts) => {
    if (opts.url.includes('generativelanguage')) {
      calls.gemini.push(opts.body);
      const r = geminiSeq[i++];
      if (r && r.__throw) { const e = new Error('boom'); e.statusCode = r.__throw; throw e; }
      return r;
    }
    if (opts.url.includes('/rest/v1/rpc/')) {
      const name = opts.url.split('/rpc/')[1];
      calls.rpc.push({ name, body: opts.body });
      return rpcImpl(name, opts.body);
    }
    if (opts.url.includes('/rest/v1/chat_messages')) {
      return [{ sender_type: 'visitor', content: 'detalhe do LDR-2026-0002?' }];
    }
    throw new Error('url inesperada: ' + opts.url);
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test scripts/dorinda-brain/orchestrate.test.js`
Expected: FAIL — `Cannot find module './orchestrate'`.

- [ ] **Step 3: Implementar `orchestrate.js`**

```javascript
// scripts/dorinda-brain/orchestrate.js
// HTTP method decidido na Task 1 (Fase 0). httpFn é injetado pelo chamador:
//   - no n8n: wrapper sobre this.helpers.httpRequest (ou fetch)
//   - nos testes: fake
const { buildContents, parseGeminiParts, rpcNameFor } = require('./helpers');
const { FUNCTION_DECLARATIONS } = require('./tools');

const FALLBACK_TEXT = 'Tive um probleminha aqui pra puxar essa informação, mas já vou chamar o Leandro pra te ajudar direto, tá? Um instante 🙏';

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function geminiGenerate(cfg, contents) {
  const url = `https://generativelanguage.googleapis.com/v1beta/${cfg.model}:generateContent?key=${cfg.geminiKey}`;
  const body = {
    system_instruction: { parts: [{ text: cfg.systemPrompt }] },
    contents,
    tools: [{ function_declarations: FUNCTION_DECLARATIONS }],
    generationConfig: { temperature: 0.3 },
  };
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await cfg.httpFn({ method: 'POST', url, headers: { 'Content-Type': 'application/json' }, body, json: true });
    } catch (e) {
      lastErr = e;
      const code = e.statusCode || e.status || e.httpCode; // n8n usa .httpCode; fetch/testes usam .statusCode
      if (code === 503 || code === 429) { await sleep(1500); continue; }
      throw e;
    }
  }
  throw lastErr;
}

async function callRpc(cfg, toolName, args) {
  const url = `${cfg.supabaseUrl}/rest/v1/rpc/${rpcNameFor(toolName)}`;
  return cfg.httpFn({
    method: 'POST', url, json: true,
    headers: { apikey: cfg.anon, Authorization: `Bearer ${cfg.anon}`, 'Content-Type': 'application/json' },
    body: args || {},
  });
}

async function loadHistory(cfg) {
  const url = `${cfg.supabaseUrl}/rest/v1/chat_messages?conversation_id=eq.${cfg.conversationId}&select=sender_type,content,created_at&order=created_at.asc`;
  return cfg.httpFn({ method: 'GET', url, json: true, headers: { apikey: cfg.anon, Authorization: `Bearer ${cfg.anon}` } });
}

async function handoffFallback(cfg, reason) {
  try {
    await callRpc(cfg, 'notificar_corretor', {
      p_tipo: 'handoff', p_urgencia: 'alta', p_conversation_id: cfg.conversationId,
      p_mensagem: 'Falha técnica no atendimento automático da Dorinda: ' + reason + '. Assumir a conversa.',
    });
  } catch (_) { /* não deixa o fallback quebrar a resposta */ }
  return { output: FALLBACK_TEXT, conversation_id: cfg.conversationId, _fallback: reason };
}

async function runConversation(cfg) {
  let contents;
  try {
    const history = await loadHistory(cfg);
    contents = buildContents(Array.isArray(history) ? history : []);
  } catch (e) {
    return handoffFallback(cfg, 'load_history_falhou:' + (e.statusCode || e.message)); // output nunca vazio
  }
  if (!contents.length) contents.push({ role: 'user', parts: [{ text: 'oi' }] });

  let resp;
  try {
    resp = await geminiGenerate(cfg, contents);
  } catch (e) {
    return handoffFallback(cfg, 'gemini_indisponivel:' + (e.statusCode || e.message));
  }

  for (let iter = 0; iter < cfg.maxIter; iter++) {
    const { functionCalls, text, modelContent } = parseGeminiParts(resp);
    if (!functionCalls.length) {
      return { output: text || FALLBACK_TEXT, conversation_id: cfg.conversationId };
    }
    contents.push(modelContent);
    const responseParts = [];
    for (const fc of functionCalls) {
      let result;
      try { result = await callRpc(cfg, fc.name, fc.args); }
      catch (e) { result = { ok: false, error: 'rpc_http_error', message: String(e.statusCode || e.message) }; }
      responseParts.push({ functionResponse: { name: fc.name, response: result } });
    }
    contents.push({ role: 'user', parts: responseParts });
    try { resp = await geminiGenerate(cfg, contents); }
    catch (e) { return handoffFallback(cfg, 'gemini_indisponivel_no_loop:' + (e.statusCode || e.message)); }
  }
  return handoffFallback(cfg, 'max_iter_excedido');
}

module.exports = { runConversation, FALLBACK_TEXT };
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test scripts/dorinda-brain/orchestrate.test.js`
Expected: PASS (5 testes).

> Se o teste de 503 falhar por causa do `sleep(1500)` deixar o teste lento: aceitável (≈3s). Não reduzir o backoff só pra teste.

- [ ] **Step 5: Rodar a suíte toda**

Run: `node --test scripts/dorinda-brain/`
Expected: PASS (todos os arquivos `.test.js`).

- [ ] **Step 6: Commit**

```bash
git add scripts/dorinda-brain/orchestrate.js scripts/dorinda-brain/orchestrate.test.js
git commit -m "feat(dorinda): loop de function-calling com retry 503 e fallback handoff não-silencioso"
```

---

## Task 6: Runner de integração (Gemini + Supabase reais)

Valida o loop completo contra serviços reais antes de tocar no n8n. Cobre critérios de sucesso 2, 3 e 4 do spec (incluindo turnos consecutivos — observação #3).

**Files:**
- Create: `scripts/dorinda-brain/run-integration.js`

- [ ] **Step 1: Implementar o runner**

```javascript
// scripts/dorinda-brain/run-integration.js
// Uso: node scripts/dorinda-brain/run-integration.js <conversation_id>
// Lê GEMINI_API_KEY e VITE_SUPABASE_* do .env.local.
const fs = require('node:fs');
const path = require('node:path');
const { runConversation } = require('./orchestrate');
const { loadPrompt, nowPtBr } = require('./prompt');

function readEnvLocal() {
  const file = path.resolve(__dirname, '../../.env.local');
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

async function httpFn(opts) {
  const res = await fetch(opts.url, {
    method: opts.method,
    headers: opts.headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const txt = await res.text();
  if (!res.ok) { const e = new Error(txt); e.statusCode = res.status; throw e; }
  return txt ? JSON.parse(txt) : null;
}

(async () => {
  const conversationId = process.argv[2];
  if (!conversationId) { console.error('uso: node run-integration.js <conversation_id>'); process.exit(1); }
  const env = readEnvLocal();
  const cfg = {
    geminiKey: env.GEMINI_API_KEY,
    supabaseUrl: env.VITE_SUPABASE_URL,
    anon: env.VITE_SUPABASE_ANON_KEY,
    model: 'models/gemini-2.5-flash',
    maxIter: 6,
    systemPrompt: loadPrompt(nowPtBr()),
    conversationId,
    httpFn,
  };
  const out = await runConversation(cfg);
  console.log('\n=== OUTPUT DA DORINDA ===\n' + out.output);
  if (out._fallback) console.log('\n[FALLBACK acionado: ' + out._fallback + ']');
})();
```

- [ ] **Step 2: Criar conversa de teste no Supabase (cenário pergunta direta)**

Pedir ao usuário pra rodar no SQL Editor e colar o UUID:

```sql
INSERT INTO chat_conversations (workspace_id, visitor_id, visitor_name, source, status)
VALUES ((SELECT id FROM workspaces LIMIT 1), 'int-test-' || gen_random_uuid()::text, 'Integração', 'chat_widget', 'ai_mode')
RETURNING id;
```
Depois inserir a mensagem do visitante (substituir `<UUID>`):
```sql
INSERT INTO chat_messages (conversation_id, sender_type, sender_name, content)
VALUES ('<UUID>', 'visitor', 'Integração', 'Tem detalhe do imovel LDR-2026-0002?');
```

- [ ] **Step 3: Rodar o runner — cenário pergunta direta**

Run: `node scripts/dorinda-brain/run-integration.js <UUID>`
Expected: output menciona LDR-2026-0002 / Vila Mathias / R$ 550 mil. **Aqui se valida o formato real do `functionResponse`/role do Gemini** — se der erro de role, ajustar em `orchestrate.js` (ex.: trocar `role:'user'` por `role:'function'`) e re-rodar a suíte da Task 5.

- [ ] **Step 4: Cenário busca (consultar_imoveis)**

Inserir nova mensagem na mesma conversa e re-rodar:
```sql
INSERT INTO chat_messages (conversation_id, sender_type, sender_name, content)
VALUES ('<UUID>', 'visitor', 'Integração', 'Tô procurando apê em Santos até 800 mil');
```
Run: `node scripts/dorinda-brain/run-integration.js <UUID>`
Expected: lista LDR-2026-0001 e/ou 0002 com dados corretos.

- [ ] **Step 5: Cenário turnos consecutivos do visitante (observação #3)**

Inserir DUAS mensagens do visitante seguidas, sem resposta da IA entre elas:
```sql
INSERT INTO chat_messages (conversation_id, sender_type, sender_name, content) VALUES
('<UUID>', 'visitor', 'Integração', 'oi'),
('<UUID>', 'visitor', 'Integração', 'tem cobertura em Santos?');
```
Run: `node scripts/dorinda-brain/run-integration.js <UUID>`
Expected: responde sem erro de alternância de roles (o merge da Task 2 funcionou contra o Gemini real).

- [ ] **Step 6: Commit**

```bash
git add scripts/dorinda-brain/run-integration.js
git commit -m "test(dorinda): runner de integração contra Gemini+Supabase reais"
```

---

## Task 7: Build do jsCode final + injeção no n8n

**Files:**
- Create: `scripts/dorinda-brain/build-n8n-code.js`
- Create (gerado, gitignored): `scripts/dorinda-brain/dorinda-brain.n8n.js`
- Modify: `.gitignore`

- [ ] **Step 1: Ignorar o artefato gerado**

Adicionar ao `.gitignore`:
```
# artefato gerado com secrets inline (Dorinda Code Node)
scripts/dorinda-brain/dorinda-brain.n8n.js
```

- [ ] **Step 2: Implementar `build-n8n-code.js`**

Inlina helpers + tools + prompt + secrets do `.env.local`, e o corpo `runOnceForEachItem`. `httpFn` no n8n usa o método decidido na Task 1.

```javascript
// scripts/dorinda-brain/build-n8n-code.js
// Gera o jsCode self-contained pro Code Node do n8n (modo: Run Once for Each Item).
const fs = require('node:fs');
const path = require('node:path');

const dir = __dirname;
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const stripExports = (s) => s.replace(/\nmodule\.exports[\s\S]*$/m, '\n');
const env = {};
for (const line of fs.readFileSync(path.resolve(dir, '../../.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const { loadPrompt, nowPtBr } = require('./prompt');
const prompt = loadPrompt(nowPtBr());

// httpFn pro n8n: this.helpers.httpRequest já devolve o body parseado quando json:true.
const HTTP_FN = `
async function httpFn(opts) {
  return await this.helpers.httpRequest({
    method: opts.method, url: opts.url, headers: opts.headers,
    body: opts.body, json: true,
  });
}
const boundHttp = httpFn.bind(this);
`;

const jsCode = `
// ===== GERADO por build-n8n-code.js — NÃO editar à mão =====
${stripExports(read('helpers.js'))}
${stripExports(read('tools.js'))}
${stripExports(read('orchestrate.js')).replace(/^const \{[^}]*\} = require\([^)]*\);\s*$/gm, '')}
${HTTP_FN}
const SYSTEM_PROMPT = ${JSON.stringify(prompt)};
const cfg = {
  geminiKey: ($env.GEMINI_API_KEY || ${JSON.stringify(env.GEMINI_API_KEY)}),
  supabaseUrl: ${JSON.stringify(env.VITE_SUPABASE_URL)},
  anon: ($env.SUPABASE_LEANDRO_ANON_KEY || ${JSON.stringify(env.VITE_SUPABASE_ANON_KEY)}),
  model: 'models/gemini-2.5-flash',
  maxIter: 6,
  systemPrompt: SYSTEM_PROMPT,
  conversationId: $('Extrair Dados').item.json.conversation_id,
  httpFn: boundHttp,
};
const result = await runConversation(cfg);
return { json: result };
`.trim();

const outFile = path.join(dir, 'dorinda-brain.n8n.js');
fs.writeFileSync(outFile, jsCode);
console.log('Gerado: ' + outFile + ' (' + jsCode.length + ' chars)');
```

> Nota: o `stripExports` em `orchestrate.js` remove os `require(...)` do topo (regex acima) porque helpers/tools já estão inlinados antes dele. Verificar no Step 4 que não sobrou nenhum `require(`.

- [ ] **Step 3: Gerar o artefato**

Run: `node scripts/dorinda-brain/build-n8n-code.js`
Expected: imprime `Gerado: …dorinda-brain.n8n.js (N chars)`.

- [ ] **Step 4: Validar o artefato (sintaxe + sem require + sem placeholders)**

Run: `node --check scripts/dorinda-brain/dorinda-brain.n8n.js && grep -c "require(" scripts/dorinda-brain/dorinda-brain.n8n.js`
Expected: sem erro de sintaxe; `grep` retorna `0`.

> `node --check` valida sintaxe mesmo com `$env`/`$()` porque são identificadores válidos (vão existir só no runtime do n8n). Se `--check` reclamar de `await` no top-level, embrulhar o corpo num `(async () => { … })()` no build — mas o Code Node do n8n aceita await top-level, então `--check` pode acusar; nesse caso validar com `node --check --input-type=module` ou aceitar e pular pro Step 5.

- [ ] **Step 5: Injetar no workflow via MCP**

1. Ler o conteúdo de `dorinda-brain.n8n.js`.
2. `mcp__n8n__n8n_update_partial_workflow` no workflow `Db1qI76NKGnJB3x6`:
   - Adicionar nó `Dorinda Brain` (`n8n-nodes-base.code`, typeVersion 2, `mode: runOnceForEachItem`, `jsCode: <conteúdo>`), posição ex.: `[1328, -128]` (onde estava o AI Agent, deslocado).
3. Validar: `mcp__n8n__n8n_validate_workflow(id)` — sem erros novos no nó Code.

- [ ] **Step 6: Commit (sem o artefato)**

```bash
git add .gitignore scripts/dorinda-brain/build-n8n-code.js
git commit -m "build(dorinda): gerador do jsCode self-contained pro Code Node n8n"
```

---

## Task 8: Rewire do workflow (desabilitar antigos, conectar Code Node)

**Files:** workflow n8n `Db1qI76NKGnJB3x6` (via MCP).

- [ ] **Step 1: Desconectar e desabilitar os nós antigos**

Via `n8n_update_partial_workflow`:
- Remover conexões: `Pausa Humanizada → AI Agent`, `AI Agent → Preparar Resposta`, `Google Gemini Chat Model → AI Agent` (ai_languageModel), `Memória Chat Web → AI Agent` (ai_memory), e as 5 `*toolHttpRequest → AI Agent` (ai_tool).
- Marcar `disabled: true` em: `AI Agent (Chat Web)`, `Google Gemini Chat Model`, `Memória Chat Web`, `consultar_imoveis`, `consultar_imovel_por_id`, `criar_lead`, `agendar_visita`, `notificar_corretor`.

- [ ] **Step 2: Conectar o Code Node no fluxo**

Adicionar conexões main: `Pausa Humanizada → Dorinda Brain` e `Dorinda Brain → Preparar Resposta`.

- [ ] **Step 3: Validar topologia**

Run (MCP): `n8n_get_workflow(id, mode: "structure")`
Expected: `Pausa Humanizada → Dorinda Brain → Preparar Resposta` no caminho main; os 8 nós antigos `disabled` e sem conexões.

Run (MCP): `n8n_validate_workflow(id)`
Expected: sem erros de conexão (warnings de community node/tool somem, já que não há mais tools).

---

## Task 9: Smoke e2e via webhook

Reproduz o smoke real (critério de sucesso 6 do spec). Mesmo padrão de colaboração das sessões anteriores.

**Files:** nenhum. Usa PowerShell + n8n + Supabase.

- [ ] **Step 1: Limpar a conversa de teste anterior (opcional)**

Conversa pendente `82a1b9f7-…` e as `int-test-*` da Task 6 — limpar via SQL do `RETOMADA-PROXIMA-SESSAO.md` se quiser. Não obrigatório.

- [ ] **Step 2: Criar conversa nova + pedir Listen**

Pedir ao usuário: abrir o workflow no n8n, clicar **Execute workflow** (canvas), e avisar. Em paralelo criar conversa via SQL (visitor_id `smoke-codenode-…`, status `ai_mode`), copiar UUID.

- [ ] **Step 3: Disparar o webhook (pergunta direta)**

```powershell
$url = "https://webhook.hubautomacao.pro/webhook-test/c8590ef1-14e1-4d99-87ab-91521e7b63c2"
$payload = @{ record = @{ conversation_id = "<UUID>"; content = "Tem detalhe do imovel LDR-2026-0002?"; sender_type = "visitor"; sender_name = "Smoke CodeNode" } } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri $url -Method Post -Body $payload -ContentType "application/json"
```
Expected: `{ message: "Workflow was started" }`.

- [ ] **Step 4: Verificar execução**

Run (MCP): `n8n_executions(action: "list", workflowId: "Db1qI76NKGnJB3x6", limit: 1)`
Expected: `status: success`. Se `error`, abrir com `mode: "error"` e ver o nó `Dorinda Brain`.

- [ ] **Step 5: Verificar a resposta persistida**

Pedir SELECT no SQL Editor:
```sql
SELECT sender_type, sender_name, LEFT(content, 500) AS preview, created_at
FROM chat_messages WHERE conversation_id = '<UUID>' ORDER BY created_at;
```
Expected: linha `ai / Dorinda / <resposta citando LDR-2026-0002, Vila Mathias, R$ 550 mil>`.

- [ ] **Step 6: Segunda pergunta (consultar_imoveis)**

Repetir Steps 2-5 com `content = "Tô procurando apê em Santos até 800 mil. Tem alguma coisa?"`.
Expected: Dorinda lista imóveis reais do catálogo.

---

## Task 10: Documentação e memória

**Files:**
- Modify: `docs/RELATORIO-CONSOLIDADO.md`
- Modify: `docs/RETOMADA-PROXIMA-SESSAO.md`
- Create: `~/.claude/projects/.../memory/project_dorinda_codenode.md` + atualizar `MEMORY.md` e `project_dorinda_workflow.md`

- [ ] **Step 1: Atualizar RELATORIO-CONSOLIDADO**

Bumpar versão; registrar o pivô de `toolHttpRequest` → Code Node, motivo (3 bugs do runtime), e a nova arquitetura. Atualizar a ficha técnica do workflow (nó `Dorinda Brain`, nós antigos desabilitados).

- [ ] **Step 2: Atualizar RETOMADA-PROXIMA-SESSAO**

Substituir a seção "🚨 Estado" pelo resultado do smoke. Marcar 4.5 como fechado (se passou) e apontar pra 4.6.

- [ ] **Step 3: Atualizar memória**

- Criar `project_dorinda_codenode.md`: arquitetura Code Node, arquivos em `scripts/dorinda-brain/`, como rebuildar (`node build-n8n-code.js`), método HTTP decidido na Fase 0.
- Atualizar `project_dorinda_workflow.md`: tools agora via Code Node, não toolHttpRequest.
- Adicionar linha no `MEMORY.md`.

- [ ] **Step 4: Commit**

```bash
git add docs/RELATORIO-CONSOLIDADO.md docs/RETOMADA-PROXIMA-SESSAO.md
git commit -m "docs(dorinda): fecha 4.5 com Code Node function-calling; registra pivô do toolHttpRequest"
```

---

## Notas de execução

- **Extensão `.cjs` (decidido na execução):** o `package.json` raiz tem `"type": "module"`, então Node trata `.js` como ESM. Todos os arquivos de `scripts/dorinda-brain/` usam **`.cjs`** (CommonJS com `require`/`module.exports`) — `helpers.cjs`, `tools.cjs`, `prompt.cjs`, `orchestrate.cjs`, `run-integration.cjs`, `build-n8n-code.cjs`, e os `*.test.cjs`. Os `require('./x')` viram `require('./x.cjs')`. O build script lê os `.cjs` e tira `require`/`module.exports` ao inlinar (o jsCode final no n8n é só corpo de função, sem módulos). O artefato gerado continua `dorinda-brain.n8n.js`.
- **Pré-requisito:** `.env.local` tem `GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (confirmado).
- **TODO pré-deploy (fora deste plano):** trocar a Gemini key do Felipe pela do Leandro; preferir `$env` no servidor a hardcode.
- **Rollback:** reabilitar os 8 nós antigos e reconectar; remover o Code Node. Tudo preservado.
- **Dependência entre tasks:** 2-5 são puras e independentes do n8n (podem rodar offline). 6 precisa de Gemini+Supabase reais. 7-9 precisam do n8n. 1 (probe) deve vir antes de 7 (define o método HTTP no build).
