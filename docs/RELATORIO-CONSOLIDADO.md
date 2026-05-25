# Relatório Consolidado — CRM Leandro Alonso

> Documento único de leitura do projeto e guia de continuidade.
> Substitui: `RELATORIO-PROJETO-CRM-LEANDRO.md`, `CONTINUIDADE-CLAUDE-CLI.md`,
> `CONTINUIDADE-PROJETO-LEANDRO.md`, `RETOMADA-PROXIMA-SESSAO.md`,
> `HANDOFF.md`, `PLANO-CORRECOES-FINAIS.md`, `WEBAPP AUDITOR + CONTINUIDADE.md`.
>
> **Versão:** 1.4 — atualizado em 2026-05-25 (pivô Code Node, 4.6 parcial, 4.7 fechado, widget Etapa 5 deployado, DB Webhook criado, e2e real OK, catálogo Etapa 6 MVP)
> **Branch atual:** `feat/backend-fase-a`
> **Último commit (CRM):** `68d290f docs(dorinda): RETOMADA com estado do dia 2026-05-25`
> **Status global:** Fase A praticamente completa. **Backend Dorinda funcionando ponta a ponta em produção** (Code Node `Dorinda Brain`, workflow ATIVO, DB Webhook do Supabase disparando o n8n — e2e real validado em 2026-05-25). **Sub-blocos 4.1–4.5 + 4.7 fechados; 4.6 com 9/13 cenários validados + 1 parcial, 3 pendentes só por cota free-tier do Gemini.** **Etapa 5 (chat widget)** feita e deployada no site. **Etapa 6 (catálogo /imoveis)** com MVP pronto. Próximo: trocar key Gemini (Leandro) → fechar 4.6 → ajustar dados de preço do catálogo → launch.

---

## Índice

1. Visão geral do projeto
2. Estratégia em 3 fases
3. Stack e arquitetura
4. Estrutura de pastas (estado atual)
5. Estado funcional por módulo
6. Histórico de etapas concluídas (1, 2, 3.x)
7. Decisões de produto consolidadas
8. Checkpoint atual e bugs em aberto
9. Próximos passos — Etapa 4 (Dorinda backend)
10. Etapas 5 e 6 (resumo)
11. Regras de trabalho (cadência, git, conhecimento)
12. Como retomar tecnicamente
13. Referências internas e externas

---

## 1. Visão geral do projeto

CRM imobiliário sob medida para **Leandro Alonso** (corretor, CRECI 300771-F),
atendendo Santos, São Vicente, Praia Grande e Guarujá. Cliente-zero do produto.

Objetivos centrais:

- Substituir planilhas e atendimento manual por um CRM dedicado a corretor solo
- Ter uma **agente de IA** (Dorinda) atendendo o chat do site, qualificando leads
  e agendando visitas, com handoff humano nos casos certos
- Catálogo público de imóveis no site, alimentado pelo mesmo banco do CRM
- Base reaproveitável para outros corretores (visão de produto, fase posterior)

Estado de produto:

- **Cliente-zero ativo:** Leandro
- **Fase A** (CRM + Dorinda + Catálogo) — frontend pronto, backend da Dorinda
  é o último item para Fase A 100%

---

## 2. Estratégia em 3 fases

| Fase | Escopo | Status |
|---|---|---|
| **A** | CRM web + Dorinda no chat do site + catálogo público | Frontend OK; falta backend Dorinda |
| **B** | App mobile (corretor), notificações push, exportações | Não iniciada |
| **C** | WhatsApp Business API, multi-corretor, billing | Não iniciada |

### Estrutura da Fase A (6 etapas)

| Etapa | Tema | Status |
|---|---|---|
| 1 | Fundação Supabase (schema, RLS, storage) | Concluída |
| 2 | Cliente Supabase + autenticação | Concluída |
| 3 | Migração do `mockData` (CRM real) | Concluída (sub-blocos 3.1 a 3.7) |
| 4 | Backend Dorinda (n8n + Gemini + webhooks) | Quase fechada — 4.1–4.5 + 4.7 OK; 4.6 falta 3 cenários (cota Gemini) |
| 5 | Chat widget no site público | **MVP feito + deployado** (2026-05-25); e2e real OK |
| 6 | Catálogo público no site | **MVP feito** (`/imoveis`); pendente ajuste de dados + deploy final |

---

## 3. Stack e arquitetura

### Frontend (CRM)

| Camada | Tecnologia | Versão |
|---|---|---|
| UI | React | 19.0.0 |
| Build/dev | Vite | 6.2.0 |
| Linguagem | TypeScript | 5.8.2 |
| Estilo | Tailwind 4 + tokens CSS | 4.1.14 |
| Componentes | shadcn + Base UI | — |
| Animação | Motion (ex-Framer) | 12 |
| Roteamento | TanStack Router (file-based) | 1.168 |
| Estado de servidor | TanStack Query | 5.99 |
| Formulários | React Hook Form + Zod | 7.72 + 4.3 |
| Drag-and-drop | dnd-kit | 6.3 |
| Datas | date-fns + react-day-picker | 4 + 9.14 |
| Ícones | Lucide React | 0.546 |
| Gráficos | Recharts | 3.8 |
| Cor (picker) | react-colorful | 5.6 |
| Toasts | sonner | 2.0 |

**Atenção: Zod 4.x.** API ficou ligeiramente diferente. Casos com
`z.preprocess` + `@hookform/resolvers` ainda produzem ruído de tipos
(KI-002).

### Backend

- **Supabase** — projeto `CRM_Leandro`, ref `ompbnsrtnpgwiufanljp`
  - URL: `https://ompbnsrtnpgwiufanljp.supabase.co`
  - 11 tabelas, 11 enums, RLS ativo, 30+ policies, 3 storage buckets
  - Isolado do `CRM_FVC` (projeto irmão, advocacia)
- **n8n self-hosted** (compartilhado com `CRM_FVC` — usar prefixo `[LEANDRO]`
  em todos os workflows duplicados)
- **OpenAI** — Leandro é assinante
- **Resend** — email transacional, 3k/mês (free) — pendente onboarding

### Hospedagem

- **Vercel** — site Leandro já hospedado lá; CRM idem
- Repositório atual local: `C:\Users\User\Documents\08_Leandro_CRM`

### Arquitetura de alto nível

```
[Site público] ─── Chat widget ──► [n8n] ──► [OpenAI] ──► [Supabase]
       │                              │                       ▲
       │                              └─► WhatsApp Cloud ─────┤
       │                                                      │
       └─── Catálogo /imoveis ◄──── Supabase REST ────────────┘

[CRM web (Vite)] ──► Supabase (auth + DB + storage + realtime)
       │
       └─► Sino + popup + scheduler de lembretes (cliente puro)
```

Isolamento entre `CRM_Leandro` e `CRM_FVC`:

- Bancos Supabase separados
- Mesma instância n8n; workflows distintos via prefixo de nome
- Credenciais OpenAI ainda compartilhadas (decisão pendente — ver Etapa 4)

---

## 4. Estrutura de pastas (estado atual)

```
08_Leandro_CRM/
├── .env.local                       (gitignored: VITE_SUPABASE_*)
├── package.json
├── vite.config.ts                   (TanStackRouter plugin)
├── tsconfig.json                    (paths "@/*")
├── README.md
├── CLAUDE.md                        (instruções context-mode)
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 0001_initial_schema.sql
│       ├── 0002_rls_policies.sql
│       └── 0003_storage_setup.sql
│
├── docs/
│   ├── 01-DESIGN-SYSTEM.md … 10-GUIA-ANTIGRAVITY.md   (specs visuais)
│   ├── KNOWN-ISSUES.md                                 (tracker ativo)
│   ├── PROMPT-DORINDA.md                               (pronto p/ n8n)
│   ├── RELATORIO-CONSOLIDADO.md                        (este arquivo)
│   ├── Chat_Widget_AI_v1.json                          (workflow base)
│   ├── Mariana_FollowUp_Curto_v2.json
│   ├── Mariana_WhatsApp_v2.json
│   ├── prompt_glassmorphism.md
│   └── preview.html
│
├── public/imagens/
│   └── logo-preta.png
│
├── _archive/                        (relatórios antigos, fora do fluxo)
│
└── src/
    ├── main.tsx                     (RouterProvider)
    ├── App.tsx
    ├── index.css
    ├── routeTree.gen.ts             (auto-gerado, commitado)
    │
    ├── components/
    │   ├── ui/
    │   └── notifications/NotificationPopup.tsx
    │
    ├── contexts/
    │   └── AuthContext.tsx
    │
    ├── hooks/
    │   ├── useCurrentProfile.ts
    │   ├── useWorkspace.ts
    │   ├── useProperties.ts
    │   ├── useLeads.ts
    │   ├── useEvents.ts
    │   ├── useNotifications.ts
    │   ├── useDashboard.ts
    │   └── useReminderScheduler.ts
    │
    ├── lib/
    │   ├── supabase.ts
    │   ├── queryClient.ts
    │   ├── queryKeys.ts
    │   └── supabase-helpers.ts
    │
    ├── pages/
    │   ├── LoginPage.tsx
    │   └── ForgotPasswordPage.tsx
    │
    ├── routes/                      (TanStack Router file-based)
    │   ├── __root.tsx               (QueryClientProvider + NotificationPopupContainer + sonner)
    │   ├── login.tsx
    │   ├── forgot-password.tsx
    │   ├── _authenticated.tsx       (useReminderScheduler ativo aqui)
    │   └── _authenticated/index.tsx
    │
    ├── styles/                      (tokens.css + por tela)
    │   └── notifications.css        (popup azul)
    │
    └── types/
        └── database.ts              (auto-gerado do Supabase)
```

---

## 5. Estado funcional por módulo

| Módulo | Estado | Observações |
|---|---|---|
| **Auth** | OK | Login, logout, sessão persistente, proteção de rotas, esqueci minha senha |
| **Configurações** | OK | Workspace: nome, telefone, logo upload, cor primária (só catálogo público), color picker `react-colorful` |
| **Imóveis** | OK | Wizard de 4 passos (criar e editar), soft-delete, cover real via JOIN `media`, upload de fotos, filtros, `ref_code` por RPC `generate_property_ref_code` |
| **Leads** | OK | Modal novo + detalhe com edição inline, timeline com `interactions` + eventos vinculados, filtros, sources |
| **Funil** | OK | 6 colunas, drag real via `dnd-kit`, sync com evento de visita, revert automático ao excluir evento (com guarda por `metadata.event_id`) |
| **Dashboard** | OK | 4 KPIs reais (`count: exact` em paralelo), BarChart funil, PieChart por origem, seção "imóveis em destaque" (`is_featured`) |
| **Agenda** | OK | Calendário mensal + lista lateral, `EventModal` completo, CRUD via `useEvents` |
| **Notificações (sino)** | OK | Badge unread, dropdown persistente, auto-criação ao agendar evento |
| **Popup de notificação** | OK | `NotificationPopup` custom (substitui `toast.info`), beep com `AudioContext` singleton + `resume()` pós-`await` |
| **Scheduler de lembretes** | OK | `useReminderScheduler` com polling de 30s, respeita `reminder_minutes_before`, dedup via `localStorage` (TTL 7 dias), re-check em `visibilitychange` |
| **Dorinda (backend)** | **Em produção** | Workflow `[LEANDRO] Chat_Widget_AI_v1` **ATIVO**. **Code Node `Dorinda Brain`** (pivô 2026-05-23): function-calling manual do Gemini → 5 RPCs. **4.7 (2026-05-25):** data calculada em runtime (`Intl` pt-BR, sem congelar `{{ $now }}`). **e2e real OK** (2026-05-25): widget → Supabase → DB Webhook → n8n → Gemini → resposta persistida. **4.6:** 9/13 cenários OK + 1 parcial; 3 pendentes (`desconto`/`fgts`/`humano`) só por 429 free-tier. Ver [[project-dorinda-codenode]] |
| **Chat widget (site)** | **MVP deployado** | `ChatWidget.jsx` no repo `07_Leando_Alonso_Site` (Vite/JSX/GSAP). Bolha → painel, insere em `chat_messages` via anon, resposta por polling. Abre vazio (Dorinda se apresenta no prompt). Ver [[project-leandro-site]] |
| **Catálogo público** | **MVP feito** | Página `/imoveis` (react-router-dom), query anon de `properties` públicas + `media`, cards no design system (obsidian/champagne/GSAP). ⚠️ dados de preço de teste pequenos (550/750) renderizam "R$ 550" — corrigir no CRM antes do launch |

---

## 6. Histórico de etapas concluídas

### Etapa 1 — Fundação Supabase
- Migrations `0001_initial_schema.sql`, `0002_rls_policies.sql`, `0003_storage_setup.sql`
- 11 tabelas + 11 enums + RLS + 3 buckets de storage

### Etapa 2 — Cliente Supabase + autenticação
- `@supabase/supabase-js`, contexto de auth, hook `useCurrentProfile`
- TanStack Router file-based, rotas `_authenticated/*`, login + forgot password
- Tela de login com DNA visual do CRM

### Etapa 3 — Migração do `mockData`

| Sub-bloco | Entrega |
|---|---|
| 3.1 | Fundação React Query: `queryClient`, `queryKeys`, `supabase-helpers`, `__root.tsx` com `QueryClientProvider`, devtools |
| 3.2 | Configurações do workspace (com hotfix 3.2.10 — coluna `phone`) |
| 3.3 | Imóveis: wizard 4 passos, RPC `generate_property_ref_code`, `PhotoUploader`, refator `PropertiesView` |
| 3.4 | Leads + Funil: hooks com optimistic update, modais Novo/Detalhe, timeline, drag real |
| 3.5 | Dashboard vivo + Agenda + cleanup de 783 linhas (`mockData.ts`, `types.ts`, `status-badge.tsx`, 5 deps órfãs) — KI-001 + KI-003 resolvidos |
| 3.6 | Polish + features extras: textareas/filtros dark, edição de imóvel, soft-delete, cover real, eventos na timeline, sino persistente, calendário mensal com lista |
| 3.7 | Scheduler de lembretes: `useReminderScheduler` (polling 30s + dedup localStorage), flag `silent` em `createNotification` para evitar disparo imediato |

Eventos extras pós-3.6/3.7 (commit `256cbab`):

- Bug #1: trocado `toast.info` do sonner por componente custom `NotificationPopup` + container montado no `__root.tsx`; Toaster sonner movido para `bottom-right` para não colidir
- Bug #2: `useDeleteEvent` reverte status do lead automaticamente quando deleta evento `type === 'visita'`, validando `metadata.event_id` e o status atual antes (não desfaz ação manual posterior)
- KI-004 fechado

### Etapa 4 — Backend da Dorinda (em andamento)

| Sub-bloco | Entrega | Commit/Data |
|---|---|---|
| 4.1 | Migration `0007_n8n_chat_histories.sql` (memória do AI Agent) | `9f0f14c` |
| 4.2 | Credentials no n8n: Gemini do Felipe + `Supabase Leandro - Postgres` (com "Ignore SSL Issues") | 2026-05-13 |
| 4.3 | Workflow `[LEANDRO] Chat_Widget_AI_v1` (ID `Db1qI76NKGnJB3x6`) reconfigurado: trocado LLM OpenAI → Gemini 2.5 Flash, aplicado prompt Dorinda no AI Agent, ajustado `Preparar Resposta` (sender_name `Mariana` → `Dorinda`), sticky note reescrita. **Smoke test end-to-end passou** (webhook → Extrair Dados → Verificar Status → IA ativa? → Pausa → AI Agent → INSERT chat_messages) | 2026-05-13 |
| 4.4 | Migration `0008_dorinda_rpcs.sql` com **5 RPCs** (`dorinda_consultar_imoveis`, `dorinda_consultar_imovel_por_id`, `dorinda_criar_lead`, `dorinda_agendar_visita`, `dorinda_notificar_corretor`) + 5 helpers (`dorinda_default_workspace_id`, `dorinda_owner_user_id`, `dorinda_next_protocol_code`, `dorinda_normalize_phone`, `dorinda_format_ptbr`) + sequence `dorinda_protocol_seq` (formato `VIS-YYYY-NNNN`) + índice funcional `leads_phone_normalized_idx`. Contrato em `docs/04-DORINDA-TOOLS-CONTRACT.md` (v0.2). **Smoke test PowerShell em 13 cenários: 13/13 OK** (`scripts/smoke-dorinda-rpcs.ps1`). Geraram dados no banco: lead `ca3d0da2-...`, evento `4743a25a-...`, protocolo `VIS-2026-0001`, 2 notificações | 2026-05-22 |
| 4.5 | 5 HTTP Tools (`@n8n/n8n-nodes-langchain.toolHttpRequest` v1.1) adicionadas ao AI Agent via MCP (`mcp__n8n__n8n_update_partial_workflow`). Credential nova `Supabase Leandro REST API` (ID `apAhEeV5kqbOos6c`, tipo Header Auth, `Authorization: Bearer <anon>` + header `apikey` inline). **Bug do n8n descoberto e contornado**: `sendHeaders: true` autopreenchia `parametersHeaders.values: [{}]` (objeto vazio) que virava `properties[""]` no schema do Gemini → erro `key cannot be empty`. Fix: setar `parametersHeaders.values: []` desde a criação. Tools recriadas do zero com config minimal (placeholders reduzidos). **Smoke e2e bloqueado por 503 do Gemini (provider temporário, não bug nosso)** | 2026-05-22 (esta sessão) |

---

## 7. Decisões de produto consolidadas

### Dorinda (agente IA)
- Nome **Dorinda** (a do `CRM_FVC` é "Mariana" — projetos isolados; **prompt e workflows da Mariana NÃO são reaproveitados**)
- Atua 80% sozinha; handoff humano em casos definidos
- **Coleta nome completo só no final** da conversa (decisão baseada em análise de concorrente real — converte mais)
- Fase A: somente chat widget do site; WhatsApp manual via `wa.me/`
- Fase C: avaliar WhatsApp Business API (sem compromisso)
- **Provider LLM:** Google Gemini `models/gemini-2.5-flash` (com key provisória do Felipe; trocar pela do Leandro antes do deploy público)

### Exclusões permanentes de escopo
- **Asaas** (cobrança/billing) — fora de escopo em todas as fases
- **Chatwoot** (omnichannel) — fora de escopo em todas as fases
- Cobranças no setor imobiliário do Leandro rodam por boleto bancário/financiamento direto; o CRM próprio cumpre o papel de timeline/handoff humano que justificaria o Chatwoot no FVC

### Imóveis
- Tabela única `properties` com discriminador `purpose` (venda/aluguel)
- Lançamentos = venda + `development_name` + construtora preenchidos
- `ref_code` continua como apelido humano (ex.: `ALG-SP-001`), PK é UUID
- "Total mensal" é digitado, não calculado
- "Andar" é texto livre ("2º", "Sobreposta", "Térreo")

### WhatsApp (Fase A)
- `wa.me/` simples; Leandro responde manualmente
- Botão "+ Novo Lead" manual no CRM para cadastros retroativos

### Workspace
- `primary_color` aplica **somente** ao catálogo público
- Logo na topbar do CRM: pendente (decisão 7.2 da continuidade antiga — escolha entre (a) substituir, (b) só catálogo, (c) fallback)
- Primeiro login: pendente (banner sutil vs redirect vs nada)

### Criação de usuários
- Single-tenant na Fase A. Multi-tenant é Fase C.

---

## 8. Checkpoint atual e bugs em aberto

**Último commit funcional:** `256cbab feat(notif): popup custom, revert de visita no delete e scheduler de lembretes`

**Commits posteriores (docs apenas):**
- `f2fc6b9 docs(retomada): checkpoint do dia 2026-04-15 — Bloco 1 + 3.7 fechados, rumo Etapa 4`
- `0a5649c docs(dorinda): adiciona prompt adaptado e prepara retomada etapa 4`

**Etapa 3 + 3.6 + 3.7:** fechadas e validadas (Felipe).

### Bugs / dívidas técnicas em aberto

Fonte canônica: `docs/KNOWN-ISSUES.md`.

| ID | Severidade | Estado |
|---|---|---|
| KI-001 (warning Recharts) | leve | Resolvido em 3.5.2 |
| KI-002 (`tsc --noEmit` com erros pré-existentes) | leve | **Aberto** — `tsconfig` sem `vite/client` types, `strictNullChecks` desligado, breaking change TanStack Router, tipagem `z.preprocess` + `@hookform/resolvers`. Build e dev funcionam |
| KI-003 (5 bugs de UX no wizard) | médio | Resolvido em 3.5.6 + fix z-index dialog |
| KI-004 (popup/beep não disparava + delete não revertia) | médio | Resolvido em `256cbab` |

### Pendências de infraestrutura

| Item | Responsável |
|---|---|
| Leandro criar conta Supabase própria (hoje é do Felipe) | Leandro + dev |
| Leandro criar conta Vercel própria | Leandro + dev |
| Leandro criar conta Resend | Leandro + dev |
| Rotacionar credenciais expostas (n8n) | Dev |
| Configurar template "Reset Password" no Supabase | Dev |

### Arquivos não comitados detectados no `git status` inicial

```
M .claude/settings.local.json
M docs/RELATORIO-PROJETO-CRM-LEANDRO.md   (será arquivado)
?? Imagens/Teste 1.png, Teste 2.png, Teste 4.png
?? WEBAPP AUDITOR + CONTINUIDADE.md       (será arquivado)
?? docs/prompt_glassmorphism.md           (rascunho)
?? prompt_glassmorphism.md                (duplicata na raiz)
```

> Limpeza recomendada: revisar duplicata `prompt_glassmorphism.md` (raiz vs `docs/`) e decidir se imagens em `Imagens/` entram no repo.

---

## 9. Próximos passos — Etapa 4 (Backend da Dorinda)

### Visão geral

A Etapa 4 entrega o backend da Dorinda no n8n: um workflow que recebe mensagens do widget de chat do site, conversa via AI Agent (Google Gemini), consulta o catálogo e a base de leads do Supabase do Leandro, e devolve a resposta pelo Realtime do Supabase.

O escopo da fase foi reduzido em 2026-05-13: **WhatsApp Cloud API, Asaas e Chatwoot estão fora**; o canal único da Dorinda na Fase A é o widget do site. Os workflows da Mariana (`CRM_FVC`) **não são reaproveitados** — o `[LEANDRO] Chat_Widget_AI_v1` é o único workflow ativo do projeto.

### Tabelas usadas (todas no Supabase do Leandro)

- `chat_conversations` — conversas do widget, com campo `status` (`ai_mode` / `human_mode`)
- `chat_messages` — histórico visível ao visitante (sender_type: `visitor` / `ai` / `agent`)
- `leads` (com campos `ai_*`) — criados/atualizados pelas tools
- `n8n_chat_histories` — memória do AI Agent do n8n (migration `0007`)

### Ficha técnica do workflow Dorinda (estado em 2026-05-22)

Fonte única de verdade dos parâmetros do workflow. Atualizar aqui ao mudar qualquer credential, modelo ou ID.

| Campo | Valor |
|---|---|
| **Workflow** | `[LEANDRO] Chat_Widget_AI_v1` |
| **Workflow ID** | `Db1qI76NKGnJB3x6` |
| **Host n8n (UI/API)** | `https://n8n.hubautomacao.pro` |
| **Host de webhooks** | `https://webhook.hubautomacao.pro` |
| **Webhook de teste** | `https://webhook.hubautomacao.pro/webhook-test/c8590ef1-14e1-4d99-87ab-91521e7b63c2` |
| **Webhook de produção** | `https://webhook.hubautomacao.pro/webhook/c8590ef1-14e1-4d99-87ab-91521e7b63c2` |
| **Supabase DB Webhook** | **Criado e verificado** (2026-05-25): INSERT em `chat_messages` → POST no webhook de produção. Envelope `{type, table, record,...}`; nó `Extrair Dados` lê `body.record.*`. Ver [[project-supabase-db-webhook-missing]] |
| **Nós** | 21 (13 ativos do fluxo + `Dorinda Brain` Code Node; 8 nós antigos do AI Agent **desabilitados**, não deletados) |
| **Status do workflow** | **ATIVO** (ativado em 2026-05-25 — e2e real validado; ⚠️ `inject-to-n8n.cjs --apply` desativa, lembrar de reativar) |
| **Arquitetura da IA** | **Code Node `Dorinda Brain`** (pivô 2026-05-23) — function-calling manual contra Gemini REST, despacha pras 5 RPCs. Substituiu `AI Agent`+`toolHttpRequest`. Ver [[project-dorinda-codenode]] |
| **Estado funcional** | Smoke e2e **PASSOU** em 2026-05-23 (execution `34384`: webhook → Extrair Dados → Verificar Status → IA ativa? → Pausa → **Dorinda Brain** → Preparar Resposta → INSERT `chat_messages`). Smoke anterior do esqueleto sem tools havia passado em 2026-05-13 |
| **LLM provider** | Google Gemini (via nó n8n LangChain) |
| **Modelo** | `models/gemini-2.5-flash` |
| **Temperature** | `0.3` |
| **Credential Gemini** | API key **do Felipe** (provisória — trocar pela do Leandro antes do deploy público — ver [[project-dorinda-llm]]) |
| **Credential Postgres** | `Supabase Leandro - Postgres` (ID `NsidJAj8nAf1iyRL`), SSL `require` com **Ignore SSL Issues** marcado (resolveu `self-signed certificate in certificate chain`) |
| **Prompt do AI Agent** | `docs/PROMPT-DORINDA.md` (System Message — colado direto no campo do nó AI Agent; o cabeçalho do arquivo menciona GPT-4o por engano, ignorar) |
| **Memória da conversa** | `chat_messages` no Supabase (o `Dorinda Brain` carrega o histórico via REST anon). `n8n_chat_histories` (migration `0007`) ficou **dormente** com o pivô |
| **Sender renomeado** | Nó `Preparar Resposta`: `sender_name` `Mariana` → `Dorinda`; INSERT agora inclui `workspace_id` via subquery (chat_messages é NOT NULL) |
| **Tools (5 RPCs)** | Invocadas pelo `Dorinda Brain` via function-calling manual: `dorinda_consultar_imoveis`, `_consultar_imovel_por_id`, `_criar_lead`, `_agendar_visita`, `_notificar_corretor` |
| **Secrets no Code Node** | Hardcoded no jsCode (build-time do `.env.local`) — servidor bloqueia `$env` no Code Node. Ver [[n8n-codenode-env-blocked]] |
| **Isolamento do CRM_FVC** | Mesma instância n8n, separação via prefixo `[LEANDRO]` no nome + credentials dedicadas |

> Memória correspondente: [[project-dorinda-workflow]] (lookup rápido sem precisar abrir este relatório).

### Sub-blocos

| Sub-bloco | Entrega | Status |
|---|---|---|
| 4.1 | Migration `n8n_chat_histories` no Supabase do Leandro | ✅ commit `9f0f14c` |
| 4.2 | Credentials no n8n (Gemini + Supabase Leandro Postgres) | ✅ 2026-05-13 |
| 4.3 | Workflow Chat Widget: trocar OpenAI por Gemini, aplicar prompt Dorinda, ajustar `Preparar Resposta` (Mariana → Dorinda), smoke test e2e via webhook | ✅ 2026-05-13 |
| 4.4 | RPCs Supabase + smoke test isolado (migration `0008_dorinda_rpcs.sql`, 5 RPCs + 5 helpers + sequence + índice; smoke PowerShell 13/13 OK) | ✅ 2026-05-22 |
| 4.5 | **Pivô para Code Node** (`Dorinda Brain`): `toolHttpRequest`/`AI Agent` abandonados após 3 bugs de runtime do n8n; function-calling manual do Gemini despachando pras 5 RPCs. Código testável em `scripts/dorinda-brain/` (20/20). **Smoke e2e PASSOU** (execution `34384`). Spec/plano em `docs/superpowers/` | ✅ 2026-05-23 |
| 4.6 | Validação manual do prompt — checklist de 13 cenários (via `scripts/dorinda-brain/scenario-runner.cjs`) | **9/13 OK + 1 parcial** (2026-05-25); 3 pendentes (`desconto`/`fgts`/`humano`) só por 429 free-tier — re-rodar com key do Leandro |
| 4.7 | Data em **runtime** no Code Node (sentinel `__DORINDA_NOW__` + `Intl` pt-BR, sem congelar `{{ $now }}`) + regra anti-markdown no prompt + workflow **ATIVADO** + DB Webhook do Supabase criado e verificado | ✅ 2026-05-25 |
| 4.8 | (opcional, fora da Fase A) Workflow de follow-up automático — sem reaproveitar o `Mariana_FollowUp_Curto`, projetar do zero se entrar em escopo | parking lot |
| ~~4.9~~ | ~~Workflow WhatsApp~~ — fora de escopo na Fase A (ver seção 7) | ❌ removido |

### Limpeza pendente no workflow

Herança da duplicação do template Mariana, **não afeta** a operação da Dorinda mas pode ser removida quando der:

- Branch `Tem #DADOS_COLETADOS?` → `Extrair Dados Lead`: lógica do fluxo Limpa Nome (tag de texto). A Dorinda usa tools, não tags — esses 2 nós ficam dormentes.

### Prompt da Dorinda

Aplicado no AI Agent do workflow (`docs/PROMPT-DORINDA.md`). Resumo:

- Identidade: Dorinda, atende pelo Leandro Alonso, CRECI 300771-F, litoral de SP
- Tom: humano, paulista litorâneo, sem soar robótica
- 5 princípios (destaque: não pede nome no início)
- Tools previstas (a configurar na 4.4): `consultar_imoveis`, `consultar_imovel_por_id`, `criar_lead`, `agendar_visita`, `notificar_corretor`
- Handoff humano em casos definidos (desconto, FGTS, confusão repetida, etc.)
- Provider efetivo: Google Gemini `models/gemini-2.5-flash` (o cabeçalho do prompt menciona gpt-4o; ignorar — decisão de provider está em [[project-dorinda-llm]])
- Temperature: 0.3
- **Data/hora (4.7):** o `{{ $now }}` NÃO é mais congelado em build-time — o Code Node calcula a data real em runtime (`Intl.DateTimeFormat` pt-BR / America/Sao_Paulo) via sentinel `__DORINDA_NOW__`
- **Sem markdown:** regra no prompt (FORMATAÇÃO E TOM) — o chat widget não renderiza markdown, então a Dorinda escreve texto puro

### Decisões já tomadas (fechamento das antigas perguntas bloqueantes)

1. **n8n:** mesma instância do FVC, prefixo `[LEANDRO]`, credentials separadas.
2. **Asaas + Chatwoot:** fora de escopo **permanentemente** (todas as fases).
3. **WhatsApp Cloud API:** fora de escopo **na Fase A**. Canal único é o widget do site.
4. **LLM:** Google Gemini com key provisória do Felipe — trocar pela do Leandro antes do deploy.
5. **Prompt da Mariana / workflows do FVC:** **não são reaproveitados** neste projeto. O `[LEANDRO] Chat_Widget_AI_v1` foi duplicado do template Mariana só como esqueleto, e teve LLM, prompt e nomes substituídos.

### Bug n8n descoberto em 2026-05-22 (sub-bloco 4.5)

Ao criar `@n8n/n8n-nodes-langchain.toolHttpRequest` v1.1 via MCP com `sendHeaders: true` + `headerParameters.parameters: [...]`, o n8n autopreenche `parametersHeaders.values: [{}]` (objeto vazio). Esse `{}` vira `properties[""]` (key vazia) no schema JSON enviado ao Google Gemini, que rejeita com:

```
GenerateContentRequest.tools[0].function_declarations[0].parameters.properties[]: key cannot be empty
```

**Fix:** ao criar a tool via MCP, incluir `parameters.parametersHeaders: { values: [] }` na config inicial. Setar via `updateNode` depois também resolve o erro do Gemini, mas pode trigger auto-sanitization que remove `headerParameters` (perdendo o header `apikey`) — recriação do zero é mais seguro.

**Mesma precaução** provavelmente vale pra `parametersQuery.values` e `parametersBody.values` se forem autocriados vazios.

### Decisões de produto consolidadas — RPCs da Dorinda (sub-bloco 4.4)

Contrato em `docs/04-DORINDA-TOOLS-CONTRACT.md` v0.2. 6 decisões registradas:

1. Auth: anon key + `SECURITY DEFINER` (não service_role)
2. Notificações: reusar enums existentes (`ai_handoff`, `new_lead`, `event_reminder`, `ai_insight`) com `metadata.source = 'dorinda'` — sem criar `dorinda_alert`
3. `reminder_minutes_before` padrão de visita: 90 min
4. Janela máxima de agendamento: 90 dias
5. Dedup de lead por telefone: merge não-destrutivo, normalização `regexp_replace(phone, '[^0-9]', '', 'g')` em ambos os lados
6. Conflito de horário: janela de exclusão de 60 min antes/depois, mesmo `user_id`, `type='visita'`, `status NOT IN ('cancelado','nao_compareceu')`

---

## 10. Etapas 5 e 6 (resumo)

### Etapa 5 — Chat widget no site — **MVP FEITO (2026-05-25)**
- `ChatWidget.jsx` global (montado no router do site `07_Leando_Alonso_Site`), `lib/supabase.js` com client anon + `WORKSPACE_ID`
- Fluxo: insere `chat_messages` (anon) → **Supabase DB Webhook** → n8n → Dorinda → resposta por **polling** (realtime não habilitado)
- Guard: sem env Supabase, widget se auto-desativa (não derruba o site). Abre vazio; input bloqueia enquanto aguarda (anti-duplicata)
- **e2e real validado.** Pendente: key do Leandro (free-tier 429 sob uso). Ver [[project-leandro-site]]

### Etapa 6 — Catálogo público — **MVP FEITO (2026-05-25)**
- `react-router-dom` (v6) + rota `/imoveis`; `vercel.json` com SPA rewrites; `.npmrc` `legacy-peer-deps` (React 19 RC)
- `pages/Catalog.jsx`: query anon `properties` (`is_public`, status `disponivel`/`reservado`) + embed `media` (cover), cards no design system + GSAP
- Verificado no browser (2 imóveis, foto via Storage anon). ⚠️ **dados de teste têm preços pequenos (550/750)** → renderizam "R$ 550" (formatBRL igual ao CRM, sem hack ×1000); corrigir os valores no CRM antes do launch
- Pendente: página de detalhe `/imoveis/:id`, filtros, CTA "Falar com a Dorinda", push/deploy

---

## 11. Regras de trabalho

### Cadência
- Quebrar trabalhos grandes em sub-blocos
- Validar cada sub-bloco isoladamente
- **Aguardar resposta antes de continuar** — não "deduzir e seguir"
- Um commit por sub-bloco

### Gestão de conhecimento
- Atualizar **este** relatório consolidado ao final de cada sub-bloco/etapa,
  antes de commitar
- Registrar dívidas em `docs/KNOWN-ISSUES.md` com padrão `KI-NNN`

### Git
- Branch ativa: `feat/backend-fase-a`
- Commits: convencional, idioma misto pt/en, descritivos
- PRs apenas quando explicitamente pedido pelo dev

### Segurança e credenciais
- `.env.local` é gitignored; nunca commitar
- `VITE_SUPABASE_ANON_KEY` é seguro por design (RLS protege)
- Service-role key nunca aparece no front

### Ambiente
- Node + npm; `npm run dev` em `:3000`
- Supabase CLI 2.90+
- Windows; PowerShell para comandos de mutação, `ctx_execute` para análise

### Decisões de produto já tomadas (não mudar sem discussão)
Ver seção 7 deste documento.

---

## 12. Como retomar tecnicamente

### Frontend

```bash
cd C:\Users\User\Documents\08_Leandro_CRM
git status
git log --oneline -5     # último commit funcional: 270cfd1
npm install              # se nunca rodou nesta máquina
npm run dev              # http://localhost:3000
```

Login com o usuário de teste de sempre.

Smoke test do frontend (1 minuto):

1. Login carrega
2. Dashboard mostra KPIs reais (não 0/0/0 estáticos)
3. Criar evento com `reminder_minutes_before = 2` → esperar 2 min → popup azul
   no canto superior direito + beep
4. Excluir esse evento (do tipo visita, com lead vinculado) → status do lead
   no funil volta automaticamente

### Backend Dorinda (n8n)

Smoke test do workflow `[LEANDRO] Chat_Widget_AI_v1` (~30 segundos):

1. Abrir o workflow no n8n (`https://n8n.hubautomacao.pro`)
2. Clicar no nó **Webhook — Nova Msg Widget** → **Listen for test event**
3. Criar uma conversa de teste no Supabase:
   ```sql
   INSERT INTO chat_conversations (workspace_id, visitor_id, visitor_name, source, status)
   VALUES ((SELECT id FROM workspaces LIMIT 1), 'visitor-smoke', 'Smoke Test', 'chat_widget', 'ai_mode')
   RETURNING id;
   ```
4. Disparar pelo PowerShell:
   ```powershell
   $url = "https://webhook.hubautomacao.pro/webhook-test/c8590ef1-14e1-4d99-87ab-91521e7b63c2"
   $payload = @{
     record = @{
       conversation_id = "<UUID_DO_PASSO_3>"
       content = "Oi, tudo bem?"
       sender_type = "visitor"
       sender_name = "Smoke Test"
     }
   } | ConvertTo-Json -Depth 5
   Invoke-RestMethod -Uri $url -Method Post -Body $payload -ContentType "application/json"
   ```
5. Esperar ~15s, conferir no Supabase:
   ```sql
   SELECT sender_type, sender_name, LEFT(content, 200) FROM chat_messages
   WHERE conversation_id = '<UUID>' ORDER BY created_at DESC LIMIT 5;
   ```
   Deve aparecer uma linha `ai / Dorinda / <resposta>`.

### Comandos úteis

```bash
npm run dev              # vite dev server
npm run build            # build de produção
npm run lint             # tsc --noEmit (atenção: KI-002 produz ruído)
npx supabase --version   # CLI
```

---

## 13. Referências

### Documentos ativos em `docs/`
- `RELATORIO-CONSOLIDADO.md` — **este arquivo (fonte única de verdade)**
- `KNOWN-ISSUES.md` — tracker de bugs/dívidas
- `PROMPT-DORINDA.md` — system prompt pronto para n8n
- `01-DESIGN-SYSTEM.md` … `10-GUIA-ANTIGRAVITY.md` — specs visuais do redesign
- Workflows do CRM_FVC (`Chat_Widget_AI_v1`, `Mariana_FollowUp_Curto_v2`, `Mariana_WhatsApp_v2`) — **não são reaproveitados** no projeto Leandro. Mencionados apenas como referência histórica do template duplicado.

### Documentos arquivados em `_archive/`
Substituídos por este consolidado:
- `RELATORIO-PROJETO-CRM-LEANDRO.md` (v1.9)
- `CONTINUIDADE-CLAUDE-CLI.md`
- `CONTINUIDADE-PROJETO-LEANDRO.md`
- `RETOMADA-PROXIMA-SESSAO.md`
- `HANDOFF.md`
- `PLANO-CORRECOES-FINAIS.md`
- `WEBAPP AUDITOR + CONTINUIDADE (VITE + TANSTACK ROUTER).md`

### Externas
- TanStack Router — https://tanstack.com/router
- TanStack Query — https://tanstack.com/query
- Supabase — https://supabase.com/docs
- n8n — https://docs.n8n.io
- shadcn/ui — https://ui.shadcn.com
- Zod 4 — https://zod.dev

---

## Resumo em uma frase

Fase A do CRM Leandro está **praticamente completa**: frontend estável, **Dorinda em produção ponta a ponta** (Code Node `Dorinda Brain` + 5 RPCs, workflow ATIVO, DB Webhook do Supabase disparando o n8n — e2e real validado em 2026-05-25), **chat widget deployado** no site e **catálogo `/imoveis`** com MVP pronto. Faltam só: trocar a key Gemini do Felipe pela do Leandro (free-tier 429 sob uso), fechar os 3 cenários restantes do 4.6, corrigir os valores de preço de teste, e o deploy final do catálogo.

**Próxima atualização:** após a troca da key do Leandro + fechamento do 4.6 (13/13) + launch público do site.
