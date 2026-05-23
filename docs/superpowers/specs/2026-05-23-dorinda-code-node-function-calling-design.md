# Design — Dorinda via Code Node com function-calling manual do Gemini

> Data: 2026-05-23 · Branch: `feat/backend-fase-a` · Sub-bloco 4.5 (replanejado)
> Substitui a abordagem `toolHttpRequest` (abandonada após 6 tentativas / 3 bugs distintos do runtime do n8n — ver `feedback_n8n_tool_supplydata_execute_bug.md`).

## 1. Problema

A combinação `AI Agent` + `toolHttpRequest` + Gemini é instável nesta versão do servidor n8n (`n8n.hubautomacao.pro`). Três bugs diferentes apareceram: header vazio rejeitado pelo Gemini, `supplyData/execute` no dispatcher, e Gemini retornando 0 itens. Nenhum é config nossa — são runtime issues do n8n.

**Decisão:** abandonar `toolHttpRequest`/`AI Agent`. Substituir o bloco de IA por um **único Code Node** que faz function-calling manual contra a API REST do Gemini e despacha as tool_calls direto para as RPCs do Supabase via HTTP.

## 2. Escopo

**Muda:** apenas a forma de conectar o Gemini às tools dentro do workflow `[LEANDRO] Chat_Widget_AI_v1` (`Db1qI76NKGnJB3x6`).

**Não muda:**
- As 5 RPCs do Supabase (migration `0008`, smoke isolado 13/13 OK).
- O resto do workflow: `Webhook → Extrair Dados → É msg do visitante? → Verificar Status → IA ativa? → Pausa Humanizada → [IA] → Preparar Resposta → Salvar Resposta IA → …`.
- O contrato de saída do bloco de IA: `{ output: <texto> }` (consumido por `Preparar Resposta`, que lê `$json.output`).

## 3. Arquitetura

```
Pausa Humanizada ──main──▶ Dorinda Brain (Code Node) ──main──▶ Preparar Resposta ──▶ Salvar Resposta IA
                                  │
                                  ├─ GET  /rest/v1/chat_messages   (carrega histórico)
                                  ├─ POST generativelanguage…:generateContent  (loop)
                                  └─ POST /rest/v1/rpc/dorinda_*   (despacho de tool_calls)
```

Os nós `AI Agent (Chat Web)`, `Google Gemini Chat Model`, `Memória Chat Web` e os 5 `toolHttpRequest` ficam **desabilitados e desconectados** (não deletados — rollback fácil; config antiga já está no git/docs).

### 3.1 Fonte de memória

`chat_messages` no Supabase é a fonte única de verdade. A mensagem do visitante já está inserida quando o webhook dispara (o trigger é o INSERT em `chat_messages`). O Code Node carrega o histórico ordenado e monta o `contents` do Gemini. A tabela `n8n_chat_histories` (migration 0007) fica dormente.

## 4. Code Node "Dorinda Brain"

- **Modo:** `runOnceForEachItem`.
- **HTTP:** `this.helpers.httpRequest` (primário). Fallback: `fetch` nativo — **decidido por um probe na Fase 0, antes de escrever o código completo**.
- **Entrada:** `conversation_id` (de `$('Extrair Dados').item.json.conversation_id`).

### 4.1 Constantes (topo do jsCode)

```
const GEMINI_API_KEY = $env.GEMINI_API_KEY || '<TEST_KEY_FELIPE>';   // TODO: remover hardcode antes do deploy
const SUPABASE_URL   = 'https://ompbnsrtnpgwiufanljp.supabase.co';
const SUPABASE_ANON  = $env.SUPABASE_LEANDRO_ANON_KEY || '<ANON_KEY>'; // TODO idem
const MODEL          = 'models/gemini-2.5-flash';
const MAX_ITER       = 6;
const SYSTEM_PROMPT  = `<prompt completo da Dorinda; {{ $now }} substituído por data pt-BR calculada em JS>`;
```

### 4.2 Passos internos

1. **Carregar histórico:** `GET {SUPABASE_URL}/rest/v1/chat_messages?conversation_id=eq.{id}&select=sender_type,content,created_at&order=created_at.asc`, headers `apikey` + `Authorization: Bearer`.
2. **Montar `contents`:** `visitor → role:'user'`, `ai → role:'model'`; cada msg vira `{role, parts:[{text}]}`. **Mesclar turnos consecutivos do mesmo role** concatenando os textos (Gemini exige alternância user/model). Garantir que `contents` começa com `user`.
3. **Montar `tools`:** um array `function_declarations` com as 5 funções (schema em §5). Nomes dos parâmetros = nomes das RPC (`p_*`) → despacho é passthrough.
4. **Request inicial:** `POST https://generativelanguage.googleapis.com/v1beta/{MODEL}:generateContent?key={KEY}` com `{ system_instruction:{parts:[{text:SYSTEM_PROMPT}]}, contents, tools:[{function_declarations}], generationConfig:{temperature:0.3} }`.
5. **Loop function-calling (até MAX_ITER):**
   - Ler `candidates[0].content.parts`.
   - Se houver `functionCall`: anexar o turno do modelo a `contents`; para cada call, despachar `POST {SUPABASE_URL}/rest/v1/rpc/dorinda_{name}` com body = `functionCall.args`; anexar `functionResponse` (com o JSON da RPC, **inclusive `{ok:false, stage}`** — o contrato foi desenhado pra IA ler erros) a `contents`; re-POST.
   - Se não houver `functionCall`: extrair texto e **sair**.
6. **Saída:** `{ json: { output: <texto final>, conversation_id } }`.

### 4.3 Tratamento de erro

- **Gemini 5xx (ex.: 503):** 1 retry com backoff curto (~1.5s). Persistindo → ver fallback abaixo.
- **Erro de RPC (HTTP ou `{ok:false}`):** **não lança** — devolve o JSON como `functionResponse` pro Gemini reagir conforme o prompt.
- **MAX_ITER esgotado OU Gemini indisponível após retry — fallback NÃO-silencioso (obrigatório):**
  - A Dorinda responde algo como: *"Tive um probleminha aqui pra puxar essa informação, mas já vou chamar o Leandro pra te ajudar direto, tá? Um instante."*
  - O Code Node chama `dorinda_notificar_corretor` com `p_tipo='handoff'`, `p_urgencia='alta'`, `p_mensagem` explicando o erro técnico + `p_conversation_id`.
  - `output` = a mensagem de handoff acima. **Nunca retornar sem `output`.**

## 5. function_declarations (schema enviado ao Gemini)

Todas com `parameters: { type:'object', properties:{…}, required:[…] }`. Tipos JSON-Schema: `string`, `integer`, `number`, `boolean`, `array`.

| Função (declarada) | RPC despachada | params (obrigatórios em **negrito**) |
|---|---|---|
| `consultar_imoveis` | `dorinda_consultar_imoveis` | p_city, p_neighborhood, p_purpose, p_kind, p_min_bedrooms (int), p_max_bedrooms (int), p_max_sale_price (num), p_max_rent_price (num), p_pet_friendly (bool), p_is_furnished (bool), p_limit (int) — todos opcionais |
| `consultar_imovel_por_id` | `dorinda_consultar_imovel_por_id` | **p_identifier** |
| `criar_lead` | `dorinda_criar_lead` | **p_name**, **p_phone**, p_interest, p_interest_purpose, p_property_ids (array), p_conversation_id, p_ai_summary |
| `agendar_visita` | `dorinda_agendar_visita` | **p_property_id**, **p_lead_phone**, **p_lead_name**, **p_starts_at**, p_duration_minutes (int), p_conversation_id, p_notes |
| `notificar_corretor` | `dorinda_notificar_corretor` | **p_tipo**, **p_mensagem**, p_urgencia, p_conversation_id, p_metadata |

Descrições de cada função e parâmetro: reaproveitar as `toolDescription`/placeholder descriptions já escritas em `docs/04-DORINDA-TOOLS-CONTRACT.md` e `docs/04-DORINDA-TOOLS-N8N-SETUP.md`.

## 6. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| `this.helpers.httpRequest` indisponível no Code Node desta versão | **Fase 0:** probe com GET simples antes do código completo; cair pra `fetch` se falhar |
| Formato exato de `functionResponse`/role no Gemini v1beta | Validar no primeiro teste com 1 tool_call; ajustar role (`user` vs `function`/`tool`) conforme erro |
| Turnos consecutivos do mesmo role quebram o Gemini | Mesclar no passo 2; **teste explícito:** 2 mensagens seguidas do visitante antes da resposta |
| Prompt grande (~8KB) inline no jsCode | Aceitável; verificar que não estoura limite do Code Node |
| Loop infinito de tool_calls | MAX_ITER=6 + fallback com handoff |

## 7. Critérios de sucesso (smoke e2e)

1. **Probe HTTP (Fase 0):** GET no Supabase de dentro do Code Node retorna dados → método HTTP confirmado.
2. **Pergunta direta:** `"Tem detalhe do imovel LDR-2026-0002?"` → Dorinda chama `consultar_imovel_por_id` e responde com Vila Mathias / R$ 550 mil (dados reais).
3. **Busca:** `"Tô procurando apê em Santos até 800 mil"` → chama `consultar_imoveis`, lista LDR-2026-0001/0002 corretos.
4. **Turnos consecutivos:** 2 mensagens do visitante seguidas → Code Node mescla, Gemini responde sem erro.
5. **Fallback:** simular Gemini indisponível → Dorinda responde handoff + `dorinda_notificar_corretor(urgencia='alta')` registra notificação; `output` nunca vazio.
6. Resposta persiste em `chat_messages` como `ai/Dorinda` (fluxo downstream intacto).

## 8. Fora de escopo

- Atualizar/abrir issue no servidor n8n.
- Trocar a credential Gemini do Felipe pela do Leandro (continua TODO pré-deploy).
- Remover os nós antigos (ficam desabilitados).
- Sub-bloco 4.6 (checklist de 13 cenários) — só depois deste smoke passar.
