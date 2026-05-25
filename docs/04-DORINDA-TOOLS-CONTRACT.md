# Sub-bloco 4.4 — Contrato das tools do AI Agent da Dorinda

> **Status:** **v0.2 — aprovado para implementação** (Felipe, 2026-05-22). Próximo passo: migration `0008_dorinda_rpcs.sql`.
> **Workflow alvo:** `[LEANDRO] Chat_Widget_AI_v1` (ID `Db1qI76NKGnJB3x6`)
> **Schema base:** `supabase/migrations/0001_initial_schema.sql`
> **Provider LLM:** Google Gemini 2.5 Flash (importante: o n8n LangChain entrega os args de tool já como JSON; nada de parsing manual)
>
> **Decisões finais (2026-05-22):**
> 1. Autenticação: `anon` key + funções `SECURITY DEFINER`
> 2. Notificações: **reusar enums existentes** (`ai_handoff`, `new_lead`, `event_reminder`, `ai_insight`) com `metadata.source = 'dorinda'` — sem criar `dorinda_alert`
> 3. `reminder_minutes_before` padrão de visita: **90 min**
> 4. Janela máxima de agendamento futuro: **90 dias**
> 5. Dedup de lead por telefone: merge não-destrutivo, comparação normaliza ambos os lados (`regexp_replace(phone, '[^0-9]', '', 'g')`)
> 6. Conflito de horário: zona de exclusão de **60 min antes/depois** do `starts_at` para o mesmo `user_id`, considerando `type='visita'` e `status NOT IN ('cancelado','nao_compareceu')`

---

## 1. Visão geral

5 tools previstas no `docs/PROMPT-DORINDA.md`. Cada uma será uma **HTTP Request Tool** dentro do nó AI Agent do n8n, apontando para uma **RPC do Supabase** via PostgREST.

| Tool | Tabelas tocadas | Lê / Escreve |
|---|---|---|
| `consultar_imoveis` | `properties` (+ `media` p/ cover) | Lê |
| `consultar_imovel_por_id` | `properties` (+ `media`) | Lê |
| `criar_lead` | `leads`, `lead_properties`, `chat_conversations`, `interactions` | Escreve |
| `agendar_visita` | `events`, `leads`, `interactions`, sequência `protocol_seq` (nova) | Escreve |
| `notificar_corretor` | `notifications`, `chat_conversations` (mudar `status` p/ `human_mode` quando urgência alta) | Escreve |

Princípio: **toda RPC retorna JSON estruturado** que o AI Agent consome direto (sem precisar de parser intermediário no n8n).

---

## 2. Convenções

### 2.1 Segurança das funções

- `LANGUAGE plpgsql SECURITY DEFINER` em todas
- `SET search_path = public, pg_temp` (defesa contra search-path hijack)
- `GRANT EXECUTE` para `anon` (a credential do n8n vai usar a anon key — não a service-role)
- Validação de input dentro da função (workspace existe, tipos coerentes)
- RLS continua ativo nas tabelas; a função é a única "porta" autorizada

### 2.2 Resolução de workspace_id

Fase A é single-tenant. Em vez de pedir o ID em cada chamada, **um helper interno resolve**:

```sql
CREATE OR REPLACE FUNCTION public.dorinda_default_workspace_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id FROM public.workspaces ORDER BY created_at ASC LIMIT 1;
$$;
```

Quando virar multi-tenant (Fase C), vira `dorinda_resolve_workspace(p_visitor_id TEXT)` ou recebe `p_workspace_id` como argumento.

### 2.3 Resolução do user_id do corretor (Leandro)

A tabela `events` exige `user_id NOT NULL` (corretor responsável). Helper:

```sql
CREATE OR REPLACE FUNCTION public.dorinda_owner_user_id(p_workspace_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id FROM public.profiles
  WHERE workspace_id = p_workspace_id AND role = 'admin'
  ORDER BY created_at ASC LIMIT 1;
$$;
```

### 2.4 Geração do protocolo `VIS-2026-NNNN`

Nova sequência dedicada (sem usar `bigserial` da `events.id` pra não vazar volume real):

```sql
CREATE SEQUENCE IF NOT EXISTS public.dorinda_protocol_seq START 1;
```

Helper:

```sql
CREATE OR REPLACE FUNCTION public.dorinda_next_protocol_code()
RETURNS TEXT
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 'VIS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.dorinda_protocol_seq')::text, 4, '0');
$$;
```

Exemplo: `VIS-2026-0042`.

### 2.5 Configuração das HTTP Tools no n8n

Para cada tool:

| Campo | Valor |
|---|---|
| URL | `https://ompbnsrtnpgwiufanljp.supabase.co/rest/v1/rpc/<nome_da_funcao>` |
| Method | `POST` |
| Headers | `apikey: {{ $env.SUPABASE_LEANDRO_ANON_KEY }}`, `Authorization: Bearer {{ $env.SUPABASE_LEANDRO_ANON_KEY }}`, `Content-Type: application/json`, `Prefer: params=single-object` |
| Body | Objeto JSON com **um único parâmetro** `args` contendo o payload (compatível com PostgREST `params=single-object`) ou múltiplos parâmetros nominais (prefixo `p_`) |

> Recomendação: usar parâmetros nominais (`p_city`, `p_max_price`, etc.) — mais legível no n8n e mais fácil pro AI Agent acertar.

---

## 3. Contrato detalhado das 5 RPCs

### 3.1 `consultar_imoveis(filtros)` — read-only

**Quando o AI Agent chama:** lead descreve interesse ("apê em Santos, 2 quartos, até 600 mil").

**Assinatura:**

```sql
public.dorinda_consultar_imoveis(
  p_city TEXT DEFAULT NULL,
  p_neighborhood TEXT DEFAULT NULL,
  p_purpose property_purpose DEFAULT NULL,        -- 'venda' | 'locacao' | 'lancamento'
  p_kind property_kind DEFAULT NULL,              -- 'apartamento' | 'casa' | …
  p_min_bedrooms INTEGER DEFAULT NULL,
  p_max_bedrooms INTEGER DEFAULT NULL,
  p_max_sale_price NUMERIC DEFAULT NULL,
  p_max_rent_price NUMERIC DEFAULT NULL,
  p_pet_friendly BOOLEAN DEFAULT NULL,
  p_is_furnished BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 5                       -- nunca mais que 10
) RETURNS jsonb
```

**Output (exemplo):**

```json
{
  "ok": true,
  "count": 3,
  "results": [
    {
      "id": "uuid-...",
      "ref_code": "ALG-SP-014",
      "purpose": "venda",
      "kind": "apartamento",
      "status": "disponivel",
      "city": "Santos",
      "neighborhood": "Vila Mathias",
      "bedrooms": 2, "suites": 1, "parking_spots": 1,
      "usable_area_m2": 65,
      "sale_price": 750000,
      "condo_fee": 480,
      "iptu": 110,
      "rent_price": null,
      "pet_friendly": true,
      "is_furnished": false,
      "highlights": "Reformado, vista mar parcial",
      "cover_url": "https://...storage.../media/...jpg"
    }
  ]
}
```

**Regras:**

- Filtra `deleted_at IS NULL` AND `is_public = true` AND `status != 'indisponivel'`.
- Ordena por `is_featured DESC, updated_at DESC`.
- Junta `media` por `LEFT JOIN LATERAL` pegando `is_cover = true` ou primeiro por `display_order`.
- `p_limit` saturado em 10 (defesa contra prompt injection pedindo 1000).

### 3.2 `consultar_imovel_por_id(id_or_ref)` — read-only

**Quando o AI Agent chama:** lead pergunta detalhe de um imóvel específico ("conta mais do ALG-SP-014").

**Assinatura:**

```sql
public.dorinda_consultar_imovel_por_id(
  p_identifier TEXT          -- aceita UUID ou ref_code (ex.: 'ALG-SP-014')
) RETURNS jsonb
```

**Output:** mesmo objeto que vai dentro de `results[]` do `consultar_imoveis`, mais campos completos:

- `full_address`, `floor`, `garage_type`, `has_balcony`
- `payment_conditions` (venda) ou `guarantee_type` / `min_contract` / `availability` (locação)
- `development_name`, `developer` (lançamento)
- `public_description`
- `total_monthly`
- `media`: array com até 6 fotos `{ url, caption, display_order, is_cover }`

Se não achar: `{ "ok": false, "error": "not_found", "message": "Imóvel não encontrado ou indisponível." }`.

### 3.3 `criar_lead(...)` — escreve

**Quando o AI Agent chama:** após coletar nome + WhatsApp no final do fluxo (etapa 6 do prompt).

**Assinatura:**

```sql
public.dorinda_criar_lead(
  p_name TEXT,
  p_phone TEXT,
  p_interest TEXT DEFAULT NULL,                  -- texto livre: "comprar apê 2 dorm Vila Mathias"
  p_interest_purpose property_purpose DEFAULT NULL,
  p_property_ids UUID[] DEFAULT NULL,            -- imóveis de interesse mencionados
  p_conversation_id UUID DEFAULT NULL,           -- pra ligar a conversa do widget ao lead criado
  p_ai_summary TEXT DEFAULT NULL                 -- resumo curto da conversa
) RETURNS jsonb
```

**Comportamento:**

1. Valida `p_name` não-vazio, `p_phone` com 10-13 dígitos numéricos (normaliza removendo não-dígitos via `regexp_replace(p_phone, '[^0-9]', '', 'g')`).
2. **Dedup por telefone:** compara telefone normalizado contra `regexp_replace(leads.phone, '[^0-9]', '', 'g')` do workspace. Se já existe, **atualiza** ao invés de duplicar (merge não-destrutivo: `COALESCE(p_field, leads.field)` em cada coluna — nunca sobrescreve valor existente com NULL). Coluna `phone` continua guardando o formato original digitado, dedup só usa a versão normalizada.
3. INSERT em `leads` (origin = `chat_widget`, status = `novo`, `ai_summary` preenchido, `ai_analyzed_at = now()`).
4. INSERT em `lead_properties` para cada `property_id` válido.
5. Se `p_conversation_id` passado: UPDATE `chat_conversations.lead_id` + `visitor_name` + `visitor_phone`.
6. INSERT em `interactions` (`type='ai_action'`, content="Dorinda criou lead via chat widget", `metadata={ai_summary: ..., conversation_id: ...}`).

**Output:**

```json
{
  "ok": true,
  "lead_id": "uuid-...",
  "was_existing": false,
  "linked_properties": 2
}
```

### 3.4 `agendar_visita(...)` — escreve + retorna protocolo

**Quando o AI Agent chama:** lead confirmou data/hora da visita.

**Assinatura:**

```sql
public.dorinda_agendar_visita(
  p_property_id UUID,
  p_lead_phone TEXT,                             -- usado pra achar lead (pode ter sido criado em chamada anterior)
  p_lead_name TEXT,                              -- fallback: cria o lead se não existir
  p_starts_at TIMESTAMPTZ,
  p_duration_minutes INTEGER DEFAULT 60,
  p_conversation_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS jsonb
```

**Comportamento:**

1. Resolve `lead_id` por `phone` (dedup). Se não existir, cria lead novo via mesma lógica de `criar_lead` (chamada interna).
2. Valida `p_starts_at > now()` e `<= now() + interval '90 days'`.
3. Valida `p_property_id` existe + `deleted_at IS NULL` + `status != 'vendido'` e `!= 'alugado'`.
4. Gera `protocol_code` via `dorinda_next_protocol_code()`.
5. **Detecta conflito:** zona de exclusão `[p_starts_at - 60min, p_starts_at + 60min]` para o mesmo `user_id` do corretor, filtrando `type='visita'` e `status NOT IN ('cancelado','nao_compareceu')`. Se houver evento na janela, retorna `{ok:false, error:'conflict', conflicting_event_id, conflicting_starts_at}` e nada mais é gravado.
6. INSERT em `events` (`type='visita'`, `status='agendado'`, `title='Visita - <ref_code do imóvel>'`, `location` = `full_address` ou `city/neighborhood`, `user_id` = `dorinda_owner_user_id()`, `lead_id`, `property_id`, `protocol_code`, **`reminder_minutes_before=90`**).
7. UPDATE `leads.status = 'visita'` (a trigger `log_lead_status_change` já registra interaction).
8. INSERT em `interactions` (`type='visit'`, content="Visita agendada pela Dorinda", `metadata={event_id, protocol_code, conversation_id}`).

**Output:**

```json
{
  "ok": true,
  "event_id": "uuid-...",
  "lead_id": "uuid-...",
  "protocol_code": "VIS-2026-0042",
  "starts_at": "2026-05-23T14:00:00-03:00",
  "human_readable": "sexta-feira, 23 de maio às 14h"
}
```

Em conflito (visita já no mesmo horário pro mesmo corretor): retorna `{ "ok": false, "error": "conflict", "conflicting_event_id": "..." }` — a Dorinda pode propor outro horário.

### 3.5 `notificar_corretor(...)` — escreve

**Quando o AI Agent chama:** handoff humano (desconto, FGTS, "quero falar com humano", confusão repetida).

**Assinatura:**

```sql
public.dorinda_notificar_corretor(
  p_tipo TEXT,                                   -- 'handoff' | 'visita_agendada' | 'lead_quente'
  p_urgencia TEXT DEFAULT 'media',               -- 'baixa' | 'media' | 'alta'
  p_mensagem TEXT,
  p_conversation_id UUID DEFAULT NULL,
  p_lead_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS jsonb
```

**Mapeamento `p_tipo` → `notification_type` (decisão #2 aprovada):**

| `p_tipo` | `notification_type` | `title` padrão |
|---|---|---|
| `handoff` | `ai_handoff` | `🟠 Dorinda pediu sua ajuda — <p_mensagem trunc 60>` |
| `novo_lead` | `new_lead` | `🟢 Novo lead pelo chat — <nome se disponível>` |
| `visita_agendada` | `event_reminder` | `📅 Visita agendada pela Dorinda — <protocolo>` |
| `situacao_complexa` | `ai_insight` | `💡 Dorinda detectou algo no atendimento` |

Qualquer outro valor de `p_tipo` → erro `{ok:false, error:'invalid_tipo'}`.

**Comportamento:**

1. Resolve destinatário: `user_id = dorinda_owner_user_id(workspace)`.
2. Mapeia `p_tipo` → `notification_type` pela tabela acima.
3. INSERT em `notifications`:
   - `type`: do mapeamento
   - `title`: padrão da tabela (ou customizado via `p_metadata.title`)
   - `body`: `p_mensagem`
   - `metadata`: merge de `p_metadata` + `{source:'dorinda', subtipo:p_tipo, urgencia, conversation_id, lead_id}`
   - `link`: deep-link pro lead/conversa (ex.: `/leads/<lead_id>` ou `/chat/<conversation_id>` — quando essa rota existir)
4. **Se `p_urgencia = 'alta'` E `p_conversation_id` foi passado:** UPDATE `chat_conversations.status = 'human_mode'` (faz a Dorinda parar de responder — comportamento esperado pelo prompt).
5. Se `p_lead_id` foi passado: INSERT em `interactions` (`type='ai_action'`, content="Dorinda acionou: <tipo>", metadata={subtipo,urgencia,source:'dorinda'}).

**Output:**

```json
{
  "ok": true,
  "notification_id": "uuid-...",
  "conversation_switched_to_human": true
}
```

---

## 4. Roadmap concreto pro sub-bloco 4.4

| Passo | O quê | Onde | Status |
|---|---|---|---|
| 1 | Contrato revisado e aprovado | aqui | ✅ 2026-05-22 |
| 2 | Migration `supabase/migrations/0008_dorinda_rpcs.sql` com helpers + 5 funções + sequence + índice funcional de dedup | repo | 🔜 próximo |
| 3 | Aplicar migration no Supabase Leandro (`supabase db push` ou SQL Editor) | Supabase | pendente |
| 4 | Smoke test cada RPC isoladamente via PowerShell `Invoke-RestMethod`, validar JSON de retorno | dev local | pendente |
| 5 | Configurar 5 HTTP Request Tools no AI Agent do workflow `[LEANDRO] Chat_Widget_AI_v1` | n8n | pendente |
| 6 | Smoke test e2e: conversa de teste no widget chamando cada tool | n8n + Supabase | pendente |
| 7 | Bumpar `RELATORIO-CONSOLIDADO.md` pra v1.3 fechando 4.4 + memória `project_dorinda_workflow` atualizada (tools = configuradas) | docs | pendente |
