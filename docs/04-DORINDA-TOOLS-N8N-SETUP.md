# Sub-bloco 4.5 — Configuração das 5 HTTP Tools no AI Agent da Dorinda

> **Workflow:** `[LEANDRO] Chat_Widget_AI_v1` (ID `Db1qI76NKGnJB3x6`)
> **Nó alvo:** `AI Agent (Chat Web)` (`@n8n/n8n-nodes-langchain.agent`)
> **Tipo de cada tool:** `@n8n/n8n-nodes-langchain.toolHttpRequest` (typeVersion **1.1**)
> **Backend:** RPCs `dorinda_*` aplicadas na migration `0008_dorinda_rpcs.sql` (smoke test 13/13 OK em 2026-05-22)
> **URL base:** `https://ompbnsrtnpgwiufanljp.supabase.co/rest/v1/rpc/`

---

## 0. Pré-requisito manual: criar credential REST API no n8n

> Não dá pra criar credential via MCP — tem que ser pelo n8n UI uma vez.

1. n8n UI → `Credentials` → `+ Add credential`
2. Buscar: **HTTP Header Auth** *(mais simples — usa um header só com Bearer)*
   - **Não use** OAuth2 nem Generic API — a anon key do Supabase é um JWT longo, usar HTTP Header Auth com `Authorization: Bearer <anon>` é o caminho oficial do PostgREST.
3. **Name:** `Supabase Leandro REST API`
4. **Header Auth:**
   - Name: `Authorization`
   - Value: `Bearer <SUPABASE_LEANDRO_ANON_KEY>` *(cole o JWT inteiro precedido de `Bearer `)*
5. Salvar.
6. Anotar o **ID da credential** (aparece na URL ao editar — algo como `xxxYYYzzz`). Vai ser referenciado nos 5 nodes.

**Por que só Authorization e não também o `apikey`?** PostgREST aceita só o `Authorization: Bearer` quando o JWT for válido. O header `apikey` é redundante. Testei isso no smoke — funcionou com só `Authorization`.

> Se preferir mandar os dois (defesa contra mudança do Supabase), use credential do tipo **Custom Auth (também aparece como "HTTP Custom Auth" em versões antigas do n8n)** com:
> ```json
> { "headers": { "apikey": "<anon>", "Authorization": "Bearer <anon>" } }
> ```

---

## 1. Mapa visual da arquitetura final

```
                   ┌────────────────────────────────────┐
                   │      AI Agent (Chat Web)           │
                   │  ┌──────────────────────────────┐  │
                   │  │ Google Gemini Chat Model     │  │ ← ai_languageModel (já existe)
                   │  │ Memória Chat Web (Postgres)  │  │ ← ai_memory (já existe)
                   │  │                              │  │
                   │  │ Tools (ai_tool, NOVO):       │  │
                   │  │  • consultar_imoveis         │──┼──→ POST /rpc/dorinda_consultar_imoveis
                   │  │  • consultar_imovel_por_id   │──┼──→ POST /rpc/dorinda_consultar_imovel_por_id
                   │  │  • criar_lead                │──┼──→ POST /rpc/dorinda_criar_lead
                   │  │  • agendar_visita            │──┼──→ POST /rpc/dorinda_agendar_visita
                   │  │  • notificar_corretor        │──┼──→ POST /rpc/dorinda_notificar_corretor
                   │  └──────────────────────────────┘  │
                   └────────────────────────────────────┘
```

Posicionamento sugerido no canvas (relativo ao AI Agent em `[1328, -128]`):

| Tool | Posição sugerida |
|---|---|
| consultar_imoveis | `[1248, 320]` |
| consultar_imovel_por_id | `[1376, 320]` |
| criar_lead | `[1504, 320]` |
| agendar_visita | `[1632, 320]` |
| notificar_corretor | `[1760, 320]` |

(Tudo abaixo do AI Agent, mesmo Y do Google Gemini Chat Model que está em `[1296, 160]`.)

---

## 2. Convenções para TODAS as 5 tools

Em cada nó `HTTP Request Tool`:

| Campo | Valor |
|---|---|
| **Authentication** | Predefined Credential Type *(se usar HTTP Header Auth)* OU Generic Credential Type → Custom Auth (também aparece como "HTTP Custom Auth" em versões antigas do n8n) |
| **Credential** | `Supabase Leandro REST API` (criada no passo 0) |
| **Method** | `POST` |
| **Send Headers** | `true` |
| **Headers** | `apikey` = `<anon key>` *(apenas se for HTTP Header Auth — pra PostgREST aceitar requests sem JWT signed-in, embora o Bearer já cubra)* |
| **Send Body** | `true` |
| **Specify Body** | `Using JSON` |
| **Optimize Response** | `true` *(reduz tokens enviados ao LLM)* |
| **typeVersion** | `1.1` |

**Sobre placeholders:** o LangChain do n8n troca `{placeholder}` no `jsonBody` pelos valores que o LLM gerar. A seção `placeholderDefinitions.values` **declara** cada placeholder com nome + tipo + descrição (essa descrição é o que o LLM vê pra decidir o que enviar).

---

## 3. Configuração detalhada de cada Tool

### 3.1 Tool 1 — `consultar_imoveis`

**name:** `consultar_imoveis`
**url:** `https://ompbnsrtnpgwiufanljp.supabase.co/rest/v1/rpc/dorinda_consultar_imoveis`

**toolDescription** (o que o LLM lê pra decidir usar):

```
Busca imóveis no catálogo do Leandro com filtros opcionais. Use sempre que o lead descrever
o que procura (cidade, bairro, tipo, dormitórios, faixa de preço, pet, mobiliado).
Retorna lista de até 5 imóveis com id, ref_code, preço, fotos. NUNCA invente imóvel —
sempre chame esta tool antes de citar qualquer característica de imóvel específico.
Argumentos são todos opcionais; passe só os que o lead mencionou.
```

**jsonBody:**

```json
{
  "p_city": "{p_city}",
  "p_neighborhood": "{p_neighborhood}",
  "p_purpose": "{p_purpose}",
  "p_kind": "{p_kind}",
  "p_min_bedrooms": {p_min_bedrooms},
  "p_max_bedrooms": {p_max_bedrooms},
  "p_max_sale_price": {p_max_sale_price},
  "p_max_rent_price": {p_max_rent_price},
  "p_pet_friendly": {p_pet_friendly},
  "p_is_furnished": {p_is_furnished},
  "p_limit": {p_limit}
}
```

**placeholderDefinitions.values:**

| name | type | description |
|---|---|---|
| `p_city` | string | Cidade (ex.: "Santos", "São Vicente"). Opcional. |
| `p_neighborhood` | string | Bairro (ex.: "Vila Mathias", "Macuco"). Opcional. |
| `p_purpose` | string | "venda", "locacao" ou "lancamento". Opcional. |
| `p_kind` | string | "apartamento", "casa", "cobertura", "studio", "sobrado", "terreno", "comercial", "sala_comercial", "galpao", "chacara", "outro". Opcional. |
| `p_min_bedrooms` | number | Mínimo de dormitórios. Opcional. |
| `p_max_bedrooms` | number | Máximo de dormitórios. Opcional. |
| `p_max_sale_price` | number | Preço máximo de venda em reais (ex.: 600000 para 600 mil). Opcional. |
| `p_max_rent_price` | number | Aluguel máximo mensal em reais. Opcional. |
| `p_pet_friendly` | boolean | true se o lead disse que tem pet. Opcional. |
| `p_is_furnished` | boolean | true se o lead pediu mobiliado. Opcional. |
| `p_limit` | number | Quantidade de resultados (1 a 10, default 5). |

---

### 3.2 Tool 2 — `consultar_imovel_por_id`

**name:** `consultar_imovel_por_id`
**url:** `https://ompbnsrtnpgwiufanljp.supabase.co/rest/v1/rpc/dorinda_consultar_imovel_por_id`

**toolDescription:**

```
Busca detalhes COMPLETOS de UM imóvel específico pelo UUID OU pelo ref_code (ex.: ALG-SP-014).
Use quando o lead pedir mais detalhes de um imóvel já mencionado ("conta mais do LDR-2026-0002",
"esse de 750 mil tem garagem coberta?"). Retorna endereço, descrição pública, todas as fotos
e características exclusivas (venda: condições de pagamento; locação: garantia/contrato;
lançamento: nome do empreendimento e construtora). Retorna mesmo imóveis vendidos/alugados/
reservados com o campo status — assim você consegue dizer "esse foi vendido" e oferecer alternativa.
```

**jsonBody:**

```json
{
  "p_identifier": "{p_identifier}"
}
```

**placeholderDefinitions.values:**

| name | type | description |
|---|---|---|
| `p_identifier` | string | UUID do imóvel OU ref_code (ex.: "ALG-SP-014" ou "LDR-2026-0002"). Aceita ambos. Obrigatório. |

---

### 3.3 Tool 3 — `criar_lead`

**name:** `criar_lead`
**url:** `https://ompbnsrtnpgwiufanljp.supabase.co/rest/v1/rpc/dorinda_criar_lead`

**toolDescription:**

```
Cria (ou atualiza, se já existir pelo telefone) um lead no CRM do Leandro. CHAME APENAS quando
o lead já tiver compartilhado nome completo E WhatsApp espontaneamente, na etapa final da
conversa (depois de demonstrar interesse concreto). NÃO peça nome no início da conversa.
Se já existir lead com mesmo telefone (mesmo em formato diferente), atualiza com merge não-
destrutivo (campos passados como NULL não sobrescrevem valores existentes).
Retorna {ok, lead_id, was_existing, linked_properties}.
```

**jsonBody:**

```json
{
  "p_name": "{p_name}",
  "p_phone": "{p_phone}",
  "p_interest": "{p_interest}",
  "p_interest_purpose": "{p_interest_purpose}",
  "p_property_ids": {p_property_ids},
  "p_conversation_id": "{p_conversation_id}",
  "p_ai_summary": "{p_ai_summary}"
}
```

**placeholderDefinitions.values:**

| name | type | description |
|---|---|---|
| `p_name` | string | Nome completo do lead. Obrigatório. |
| `p_phone` | string | WhatsApp do lead em qualquer formato — a função normaliza. Ex.: "(13) 99876-5432" ou "13998765432". Obrigatório. |
| `p_interest` | string | Resumo do interesse declarado em uma frase, em português ("apê 2 dorm Vila Mathias até 600 mil"). Opcional. |
| `p_interest_purpose` | string | "venda" ou "locacao". Opcional. |
| `p_property_ids` | array | Array JSON de UUIDs dos imóveis que o lead demonstrou interesse durante a conversa. Ex.: `["uuid-1","uuid-2"]`. Pode passar `[]` se nenhum. |
| `p_conversation_id` | string | UUID da conversa do widget atual. Disponível em `{{ $json.conversation_id }}` do contexto da execução. |
| `p_ai_summary` | string | Sua síntese da conversa em 1-2 frases (perfil, objeções, urgência). Opcional. |

---

### 3.4 Tool 4 — `agendar_visita`

**name:** `agendar_visita`
**url:** `https://ompbnsrtnpgwiufanljp.supabase.co/rest/v1/rpc/dorinda_agendar_visita`

**toolDescription:**

```
Agenda uma visita do lead a um imóvel específico. Use SOMENTE quando o lead confirmou data
e hora concretas E forneceu nome + WhatsApp. Se o lead ainda não existir no CRM, esta tool
cria automaticamente (não chame criar_lead antes). Retorna {ok, event_id, lead_id,
protocol_code (formato VIS-2026-NNNN), starts_at, human_readable}. SEMPRE inclua o
protocol_code na sua mensagem de confirmação para o lead. Em caso de conflito de horário
(janela de 60min do mesmo corretor), retorna {ok:false, error:"conflict", conflicting_starts_at}
— neste caso, proponha outro horário ao lead. Em caso de erro de validação, o JSON terá
"stage" indicando em que etapa falhou (validation, property_lookup, lead_resolution,
conflict_check).
```

**jsonBody:**

```json
{
  "p_property_id": "{p_property_id}",
  "p_lead_phone": "{p_lead_phone}",
  "p_lead_name": "{p_lead_name}",
  "p_starts_at": "{p_starts_at}",
  "p_duration_minutes": {p_duration_minutes},
  "p_conversation_id": "{p_conversation_id}",
  "p_notes": "{p_notes}"
}
```

**placeholderDefinitions.values:**

| name | type | description |
|---|---|---|
| `p_property_id` | string | UUID do imóvel a visitar (NÃO o ref_code — use o `id` retornado por `consultar_imoveis`). Obrigatório. |
| `p_lead_phone` | string | WhatsApp do lead em qualquer formato. Obrigatório. |
| `p_lead_name` | string | Nome completo do lead. Obrigatório. |
| `p_starts_at` | string | Horário de início da visita em ISO 8601 com timezone (ex.: "2026-05-25T14:00:00-03:00"). Calcule a partir do dia/hora que o lead falou usando `{{ $now }}` como referência. Tem que ser futuro e até 90 dias. Obrigatório. |
| `p_duration_minutes` | number | Duração em minutos. Default 60. |
| `p_conversation_id` | string | UUID da conversa atual do widget. |
| `p_notes` | string | Observações sobre a visita (ex.: "lead quer ver de noite", "tem 2 acompanhantes"). Opcional. |

---

### 3.5 Tool 5 — `notificar_corretor`

**name:** `notificar_corretor`
**url:** `https://ompbnsrtnpgwiufanljp.supabase.co/rest/v1/rpc/dorinda_notificar_corretor`

**toolDescription:**

```
Envia notificação ao Leandro (aparece no sino do CRM). Use nos casos de handoff humano
previstos no seu prompt: pedido de desconto, FGTS/MCMV/jurídico, lead pediu falar com humano,
confusão repetida, off-topic recorrente. Se urgencia="alta" E você passar conversation_id,
a conversa vira "human_mode" e VOCÊ PARA DE RESPONDER automaticamente (o Leandro assume).
```

**jsonBody:**

```json
{
  "p_tipo": "{p_tipo}",
  "p_mensagem": "{p_mensagem}",
  "p_urgencia": "{p_urgencia}",
  "p_conversation_id": "{p_conversation_id}",
  "p_lead_id": "{p_lead_id}",
  "p_metadata": {p_metadata}
}
```

**placeholderDefinitions.values:**

| name | type | description |
|---|---|---|
| `p_tipo` | string | Um de: "handoff" (precisa atendimento humano agora), "novo_lead" (informa Leandro que cadastrou), "visita_agendada" (confirmação), "situacao_complexa" (insight sem urgência). Obrigatório. |
| `p_mensagem` | string | Mensagem clara em PT-BR explicando o motivo (1-2 frases). Ex.: "Lead pediu desconto de 50k no imóvel LDR-2026-0002 - quer falar com você direto." Obrigatório. |
| `p_urgencia` | string | "baixa", "media" ou "alta". Use "alta" só pra handoffs urgentes (desconto, conflito, "quero falar com humano"). Default "media". |
| `p_conversation_id` | string | UUID da conversa atual — só passe se quiser que urgencia="alta" pause você. |
| `p_lead_id` | string | UUID do lead se já criado. Opcional. |
| `p_metadata` | object | JSON com info extra (ex.: `{"protocol_code":"VIS-2026-0007"}`). Default `{}`. |

---

## 4. Como conectar cada tool ao AI Agent

Cada nó HTTP Request Tool sai pela **porta superior do nó** (`ai_tool`) conectada à **porta inferior do AI Agent** (também `ai_tool`).

No editor:
- Clica e arrasta da bolinha em cima do `consultar_imoveis` (cor ferramenta — `ai_tool`)
- Solta na bolinha inferior do `AI Agent (Chat Web)` (mesma cor)
- Repete pras 5

No JSON do workflow, vai aparecer:

```json
"connections": {
  "consultar_imoveis": {
    "ai_tool": [[{ "node": "AI Agent (Chat Web)", "type": "ai_tool", "index": 0 }]]
  },
  "consultar_imovel_por_id": { ... mesma estrutura ... },
  ...
}
```

---

## 5. Smoke test após configuração

### 5.1 Testar tools isoladamente (modo dev do n8n)

No nó HTTP Request Tool, clique **Execute Node** com input manual:

```json
{
  "query": "apê 2 dorm Santos até 600 mil"
}
```

Pra cada tool, definir input manual que exercite os placeholders mínimos. A resposta tem que ser JSON do PostgREST com `ok:true` (ou `ok:false` com `error` claro).

### 5.2 Testar conversa completa

Reaproveitar o smoke do workflow já feito em 2026-05-13:

1. Criar nova `chat_conversations` no Supabase (modo `ai_mode`)
2. Disparar via PowerShell o webhook de teste (`/webhook-test/c8590ef1-...`)
3. Mandar uma frase tipo: `"Oi! Tô procurando apê 2 dormitórios em Santos até 600 mil. Tem alguma coisa?"`
4. Conferir em `chat_messages` que a resposta `ai/Dorinda` cita imóveis reais do catálogo (LDR-2026-0001 ou LDR-2026-0002 com preço correto)
5. Continuar a conversa pedindo visita; conferir que `events` ganha registro com `protocol_code` `VIS-2026-NNNN`

---

## 6. Aplicação via MCP (próximo passo opcional)

Após a credential `Supabase Leandro REST API` estar criada e seu ID anotado, eu (Claude) consigo adicionar os 5 nodes + as 5 conexões ao workflow via uma única chamada `mcp__n8n__n8n_update_partial_workflow` com 10 operations (5 `addNode` + 5 `addConnection`).

Felipe me passa o `credentialId` e eu rodo a operação automaticamente. Workflow continua **inativo** (como está hoje) até passar nos smoke tests.

---

## 7. Decisões de produto fixadas

- **Status do workflow durante 4.5:** continua `inactive`. Só vira `active` em 4.6 (após validação manual completa).
- **Não é necessário** o n8n estar acessível pelo site público ainda — testes ocorrem via webhook de teste.
- **Credential pode ser reaproveitada** quando o n8n receber RPCs futuras do CRM Leandro (ex.: cron de follow-up).

---

## 8. Checklist de aprovação antes de ativar (4.6)

- [ ] Credential `Supabase Leandro REST API` criada e testada
- [ ] 5 HTTP Tools adicionadas e conectadas ao AI Agent
- [ ] Cada tool retorna JSON válido em modo Execute Node
- [ ] Conversa de smoke pelo webhook test cita imóvel real (LDR-2026-*) com preço/área corretos
- [ ] Visita de smoke gera `VIS-2026-NNNN` no Supabase + aparece na Agenda do CRM
- [ ] Handoff de smoke gera notificação no sino do CRM e muda conversa pra human_mode
- [ ] Felipe valida o tom da Dorinda em 5+ cenários do checklist em `PROMPT-DORINDA.md` seção "Checklist de validação"
- [ ] Dados do smoke (`SMOKE_LEAD_ID`, `SMOKE_EVENT_ID`, `VIS-2026-0001`) limpos

---

**Próxima atualização:** após Felipe criar a credential e me passar o `credentialId`, ou após Felipe configurar as 5 tools manualmente e me avisar pra validar.
