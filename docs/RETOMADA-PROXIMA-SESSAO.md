# Retomada — próxima sessão (a partir de 2026-05-23 tarde)

> Cole esse arquivo (ou referencie) na primeira mensagem da próxima conversa.
> Substitui a versão antiga (em `_archive/RETOMADA-PROXIMA-SESSAO.md`, de abril).

---

## ✅ Sub-bloco 4.5 FECHADO em 2026-05-23 (pivô pra Code Node)

O `toolHttpRequest` foi **abandonado** (3 bugs distintos do runtime do n8n). A Dorinda agora roda num **único Code Node (`Dorinda Brain`)** que faz function-calling manual contra a API REST do Gemini e despacha as tool_calls direto pras 5 RPCs do Supabase.

**Validado em produção — execution `34384` SUCCESS** (pipeline completo: `Pausa Humanizada → Dorinda Brain → Preparar Resposta → Salvar Resposta IA`; resposta `ai/Dorinda` persistida em `chat_messages` com dados reais do LDR-2026-0002). Antes disso, os 3 cenários de integração (pergunta direta, busca, turnos consecutivos) passaram contra Gemini+Supabase reais via `scripts/dorinda-brain/run-integration.cjs`.

**Arquitetura e código:** ver memória `project_dorinda_codenode.md`, spec `docs/superpowers/specs/2026-05-23-dorinda-code-node-function-calling-design.md` e plano `docs/superpowers/plans/2026-05-23-dorinda-code-node-function-calling.md`. Fontes em `scripts/dorinda-brain/` (`.cjs`, 20/20 testes); jsCode gerado por `build-n8n-code.cjs` e injetado por `inject-to-n8n.cjs --apply`.

**Gotchas resolvidos nesta sessão:**
- `$env` é **bloqueado** no Code Node deste servidor → secrets hardcoded no jsCode (build-time, gitignored). Ver `feedback_n8n_codenode_env_blocked.md`.
- `chat_messages.workspace_id` é NOT NULL → `Preparar Resposta` agora deriva o `workspace_id` via subquery do `conversation_id` (fix em `fix-preparar-resposta.cjs`).
- Os 8 nós antigos (AI Agent, Gemini, Memory, 5 tools) ficam **desabilitados** (rollback fácil).

**Workflow `[LEANDRO] Chat_Widget_AI_v1` está `active: false`** (desativado ao fim da sessão; reativar só na 4.6/4.7).

---

## 🎯 Próximo passo: sub-bloco 4.6 — 3/13 validados, 10 PENDENTES por cota

Os 13 cenários do `PROMPT-DORINDA.md` agora são rodados de forma **automatizada** pelo `scripts/dorinda-brain/scenario-runner.cjs` (cria conversa via service-role, roda o cérebro com anon igual produção, loga as RPCs + respostas; multi-turno persiste a resposta entre turnos). Não precisa de n8n/Execute workflow.

**Validados em 2026-05-23 no modelo de produção (`gemini-2.5-flash`):**
- ✅ `saudacao` — responde sem pedir nome
- ✅ `preco` — pacote completo (preço + condomínio + IPTU, somou os mensais)
- 👁 `pergunta_direta` — acolheu e qualificou (comprar/alugar, dorms) mas **não** chamou `consultar_imoveis` no 1º turno; defensável pelo princípio "converse, não interrogue", mas a expectativa era apresentar — **reavaliar tom com o Leandro**

**10 pendentes** (`visita, desconto, fgts, humano, locacao, reservado, confusa, robo, audio, encerra`): bloqueados **só pela cota free-tier do Gemini** — `gemini-2.5-flash` tem **20 requisições/dia** na free-tier (key do Felipe), esgotada hoje. `2.0-flash` também 429; modelos lite/3.x dão 404 nessa tier. Ver `feedback_gemini_free_tier_daily_quota.md`.

**Como retomar (amanhã, após reset diário ~4h BRT):**
```
node scripts/dorinda-brain/scenario-runner.cjs visita,desconto,fgts,humano,locacao,reservado,confusa,robo,audio,encerra 8000
```
(8s de espaçamento respeita o RPM; o modelo default já é `2.5-flash`.) Conferir nos logs: `agendar_visita` retorna `protocol_code=VIS-2026-NNNN`; handoffs criam `notificar_corretor` com `human_mode=true`. Limpar depois com `node scripts/dorinda-brain/cleanup-test-data.cjs --apply`.

> Se quiser destravar HOJE: trocar a `GEMINI_API_KEY` por uma com billing (ou a do Leandro) no `.env.local`, rebuildar+reinjetar, e rodar o comando acima.

**TODO antes de produção (4.7):**
- Trocar `{{ $now }}` (hoje resolvido em build-time, data congelada) por cálculo de data em runtime no Code Node.
- Trocar a Gemini key do Felipe pela do Leandro (cota free-tier de 20/dia não sustenta produção) no `.env.local` e rebuildar+reinjetar.

---

## 🧭 Onde paramos (snapshot anterior — 2026-05-22 fim do dia)

- **Branch:** `feat/backend-fase-a`
- **Etapa atual:** **Sub-bloco 4.5 FECHADO** (Code Node validado em prod — ver topo); próximo é **4.6** (validação manual dos 13 cenários)
- **Workflow n8n:** `[LEANDRO] Chat_Widget_AI_v1` (ID `Db1qI76NKGnJB3x6`) — **INATIVO**, host `https://n8n.hubautomacao.pro`
- **Relatório:** `docs/RELATORIO-CONSOLIDADO.md` (atualizar p/ refletir o pivô Code Node)

**Cleanup de dados de teste:** ✅ feito em 2026-05-23 via `scripts/dorinda-brain/cleanup-test-data.cjs --apply` (37 conversas `v46-*/smoke-*/int-*` + 53 mensagens + 40 notifications de fallback). Banco limpo.

---

## ✅ O que está feito (estado real)

### Sub-bloco 4.4 — Fechado em 2026-05-22

- `supabase/migrations/0008_dorinda_rpcs.sql` aplicada no Supabase Leandro
  - **5 RPCs:** `dorinda_consultar_imoveis`, `dorinda_consultar_imovel_por_id`, `dorinda_criar_lead`, `dorinda_agendar_visita`, `dorinda_notificar_corretor`
  - **5 helpers:** `dorinda_default_workspace_id`, `dorinda_owner_user_id`, `dorinda_next_protocol_code`, `dorinda_normalize_phone`, `dorinda_format_ptbr`
  - **Sequence:** `dorinda_protocol_seq` (gera `VIS-YYYY-NNNN`)
  - **Índice funcional:** `leads_phone_normalized_idx`
- **Smoke test isolado:** `scripts/smoke-dorinda-rpcs.ps1` — **13/13 cenários OK** (consultas, criação de lead com dedup, agendamento com protocolo, conflito de horário, validações de erro com `stage`, notificações de handoff)
- Contrato em `docs/04-DORINDA-TOOLS-CONTRACT.md` v0.2

### Sub-bloco 4.5 — Em andamento (smoke e2e pendente)

- Credential nova no n8n: `Supabase Leandro REST API` (ID **`apAhEeV5kqbOos6c`**)
  - Tipo: Header Auth (`Authorization: Bearer <anon>`)
  - Allowed Domains: `ompbnsrtnpgwiufanljp.supabase.co`
- 5 HTTP Tools criadas no AI Agent via MCP:
  - `consultar_imoveis` — 4 placeholders (city, purpose, min_bedrooms, max_sale_price)
  - `consultar_imovel_por_id` — 1 placeholder (identifier)
  - `criar_lead` — 3 placeholders (name, phone, interest)
  - `agendar_visita` — 4 placeholders (property_id, lead_phone, lead_name, starts_at)
  - `notificar_corretor` — 3 placeholders (tipo, mensagem, urgencia)
- Tools conectadas via porta `ai_tool` ao AI Agent (5 conexões)
- Setup documentado em `docs/04-DORINDA-TOOLS-N8N-SETUP.md`

### Bug do n8n descoberto e contornado

`@n8n/n8n-nodes-langchain.toolHttpRequest` v1.1 com `sendHeaders: true` autopreenche `parametersHeaders.values: [{}]` (objeto vazio), que vira `properties[""]` no schema enviado ao Gemini → erro:

```
GenerateContentRequest.tools[0].function_declarations[0].parameters.properties[]: key cannot be empty
```

**Fix:** setar `parameters.parametersHeaders: { values: [] }` desde a criação via MCP. **Tools foram recriadas do zero** com essa precaução.

Memória registrada: `~/.claude/projects/.../memory/feedback_n8n_tool_http_empty_header.md`.

---

## 🔜 Próximo passo: repetir o smoke e2e

### Setup

```powershell
# 1. Extrair env vars (se reiniciou o shell)
$env:SUPABASE_LEANDRO_URL = (Select-String -Path .env.local -Pattern '^VITE_SUPABASE_URL=').Line.Split('=',2)[1].Trim()
$env:SUPABASE_LEANDRO_ANON_KEY = (Select-String -Path .env.local -Pattern '^VITE_SUPABASE_ANON_KEY=').Line.Split('=',2)[1].Trim()
```

### Sequência do smoke e2e

1. **n8n UI** (`https://n8n.hubautomacao.pro`):
   - Abrir workflow `[LEANDRO] Chat_Widget_AI_v1`
   - Clicar no nó `Webhook — Nova Msg Widget` → botão **`Listen for test event`**

2. **Supabase SQL Editor** — criar conversa nova:
   ```sql
   INSERT INTO chat_conversations (workspace_id, visitor_id, visitor_name, source, status)
   VALUES (
     (SELECT id FROM workspaces LIMIT 1),
     'smoke-e2e-' || gen_random_uuid()::text,
     'Smoke E2E Retake',
     'chat_widget',
     'ai_mode'
   )
   RETURNING id;
   ```
   *(Copiar o UUID retornado.)*

3. **Disparar webhook** (substitua `<UUID>` pelo do passo 2):
   ```powershell
   $url = "https://webhook.hubautomacao.pro/webhook-test/c8590ef1-14e1-4d99-87ab-91521e7b63c2"
   $payload = @{
     record = @{
       conversation_id = "<UUID>"
       content = "Tem detalhe do imovel LDR-2026-0002?"
       sender_type = "visitor"
       sender_name = "Smoke E2E Retake"
     }
   } | ConvertTo-Json -Depth 5
   Invoke-RestMethod -Uri $url -Method Post -Body $payload -ContentType "application/json"
   ```

4. **Esperar ~15-30s** e conferir no SQL Editor:
   ```sql
   SELECT sender_type, sender_name, LEFT(content, 400) AS preview, created_at
   FROM chat_messages
   WHERE conversation_id = '<UUID>'
   ORDER BY created_at;
   ```
   **Sinal de sucesso:** linha `ai / Dorinda / <resposta mencionando LDR-2026-0002 com endereço Vila Mathias e preço R$ 550 mil>` — prova que `consultar_imovel_por_id` foi chamada e o Gemini usou o JSON.

### Segunda pergunta (se a primeira passou) — exercita `consultar_imoveis`

Repetir passos 1-4 com a mensagem:

> `Tô procurando apê em Santos até 800 mil. Tem alguma coisa?`

Esperado: Dorinda lista LDR-2026-0001 (Embaré, R$ 750k) e/ou LDR-2026-0002 (Macuco, R$ 550k) com dados corretos.

---

## 🆘 Plano B se 503 do Gemini persistir

O 503 foi temporário (provider overload), mas se voltar:

1. **Trocar temporariamente o modelo do Gemini** no nó `Google Gemini Chat Model` do workflow:
   - De: `models/gemini-2.5-flash`
   - Pra: `models/gemini-2.0-flash` (mais leve) ou `models/gemini-1.5-flash` (mais estável)
2. Repetir smoke
3. Reverter pra `2.5-flash` depois do provider estabilizar

Outra checagem: o Gemini API key do Felipe pode ter rate-limit. Console do Google AI Studio mostra quota usada.

---

## 📋 Depois do smoke passar — sub-bloco 4.6

Rodar checklist de **13 cenários do `docs/PROMPT-DORINDA.md`** seção "Checklist de validação":

- [ ] Saudação genérica ("oi") → não pede nome
- [ ] Pergunta direta sobre imóvel → consulta tool e apresenta
- [ ] Pergunta sobre preço → pacote completo (preço + condo + IPTU)
- [ ] Pedido de visita → agenda e gera protocolo `VIS-2026-NNNN`
- [ ] Pedido de desconto → handoff
- [ ] Pergunta sobre FGTS → handoff
- [ ] Lead pede pra falar com humano → handoff
- [ ] Conversa toda em locação → fluxo correto (caução/fiador, não entrada)
- [ ] Pergunta sobre imóvel reservado → status real + oferece alternativa
- [ ] Pergunta confusa repetida 3x → handoff
- [ ] "Você é robô?" → resposta sem confirmar nem negar
- [ ] Áudio (assumindo transcrição) → tratado como texto
- [ ] Encerra conversa → encerra com calor sem forçar

Cada cenário gera dados reais no banco. **Limpar TUDO de uma vez ao final** (ver seção abaixo).

---

## 🧹 Dados de smoke pendentes de cleanup

Não foi feito cleanup ao longo da sessão. SQLs prontos pra colar no SQL Editor quando quiser limpar:

```sql
-- Lead/evento/protocolo do smoke isolado das RPCs (13/05/2026 ou 22/05/2026)
DELETE FROM events WHERE id = '4743a25a-fd32-4fd6-be94-253ba3c37e0b';
DELETE FROM interactions WHERE lead_id = 'ca3d0da2-0620-4703-b8ab-12ad63bd9213';
DELETE FROM lead_properties WHERE lead_id = 'ca3d0da2-0620-4703-b8ab-12ad63bd9213';
DELETE FROM notifications WHERE metadata->>'lead_id' = 'ca3d0da2-0620-4703-b8ab-12ad63bd9213';
DELETE FROM leads WHERE id = 'ca3d0da2-0620-4703-b8ab-12ad63bd9213';

-- Conversas de smoke e2e (qualquer visitor_id começando com 'smoke-')
DELETE FROM chat_messages WHERE conversation_id IN (
  SELECT id FROM chat_conversations WHERE visitor_id LIKE 'smoke-%'
);
DELETE FROM chat_conversations WHERE visitor_id LIKE 'smoke-%';

-- Resetar sequence de protocolo (opcional — só se quiser que produção comece em VIS-2026-0001)
ALTER SEQUENCE public.dorinda_protocol_seq RESTART WITH 1;
```

> Recomendado fazer cleanup só depois que 4.6 passar — preserva trilha de auditoria do que foi testado.

---

## 🔧 Estado técnico (snapshot)

### Workflow n8n

| Campo | Valor |
|---|---|
| Workflow | `[LEANDRO] Chat_Widget_AI_v1` |
| Workflow ID | `Db1qI76NKGnJB3x6` |
| Status | **inactive** |
| Nós | 20 (15 originais + 5 HTTP Tools) |
| Conexões | 17 (12 main + 5 ai_tool) |
| Webhook test URL | `https://webhook.hubautomacao.pro/webhook-test/c8590ef1-14e1-4d99-87ab-91521e7b63c2` |
| LLM | `models/gemini-2.5-flash` @ temp 0.3 |
| Credentials | Gemini (Felipe), `Supabase Leandro - Postgres` (`NsidJAj8nAf1iyRL`), `Supabase Leandro REST API` (`apAhEeV5kqbOos6c`) |

### Supabase

- Migration `0008_dorinda_rpcs.sql` aplicada via `npx supabase db push` (após dry-run preview)
- Migration history `0001..0008` em sync local↔remote

### Repositório local

- Pasta: `C:\Users\User\Documents\08_Leandro_CRM`
- Branch: `feat/backend-fase-a`
- Pendente de commit ao final desta sessão (ver `git status`)

---

## 📚 Arquivos criados/modificados nesta sessão (2026-05-22)

**Novos:**
- `supabase/migrations/0008_dorinda_rpcs.sql`
- `docs/04-DORINDA-TOOLS-CONTRACT.md` (v0.2)
- `docs/04-DORINDA-TOOLS-N8N-SETUP.md`
- `docs/RETOMADA-PROXIMA-SESSAO.md` (este arquivo)
- `scripts/smoke-dorinda-rpcs.ps1`

**Modificados:**
- `docs/RELATORIO-CONSOLIDADO.md` (v1.1 → v1.3)

**Memórias atualizadas** (em `~/.claude/.../memory/`):
- `project_dorinda_workflow.md` (ficha técnica)
- `feedback_check_real_state.md` (lição: confiar em git+RELATORIO, não em RETOMADA antigos)
- `feedback_n8n_tool_http_empty_header.md` (bug do parametersHeaders)
- `MEMORY.md` (índice atualizado)

---

## 🎯 Frase para colar na próxima sessão

> Estou continuando o desenvolvimento do CRM imobiliário do Leandro Alonso.
> Antes de fazer qualquer coisa, leia `docs/RETOMADA-PROXIMA-SESSAO.md` e
> me confirme que entendeu onde paramos. Depois me ajude a **repetir o smoke
> e2e do sub-bloco 4.5** seguindo a sequência documentada (Listen for test
> event no Webhook + criar conversa SQL + disparar PowerShell + conferir
> `chat_messages`).
