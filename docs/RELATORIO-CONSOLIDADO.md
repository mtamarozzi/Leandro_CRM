# Relatório Consolidado — CRM Leandro Alonso

> Documento único de leitura do projeto e guia de continuidade.
> Substitui: `RELATORIO-PROJETO-CRM-LEANDRO.md`, `CONTINUIDADE-CLAUDE-CLI.md`,
> `CONTINUIDADE-PROJETO-LEANDRO.md`, `RETOMADA-PROXIMA-SESSAO.md`,
> `HANDOFF.md`, `PLANO-CORRECOES-FINAIS.md`, `WEBAPP AUDITOR + CONTINUIDADE.md`.
>
> **Versão:** 1.0 (consolidação) — gerado em 2026-05-13
> **Branch atual:** `feat/backend-fase-a`
> **Último commit:** `0a5649c docs(dorinda): adiciona prompt adaptado e prepara retomada etapa 4`
> **Status global:** Fase A funcionalmente completa no frontend. Próximo foco: Etapa 4 (backend Dorinda).

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
| 4 | Backend Dorinda (n8n + OpenAI + webhooks) | **PRÓXIMA** |
| 5 | Chat widget no site público | Não iniciada |
| 6 | Catálogo público no site | Não iniciada |

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
| **Dorinda (backend)** | Não iniciado | Próxima etapa |
| **Catálogo público** | Não iniciado | Etapa 6 |

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

---

## 7. Decisões de produto consolidadas

### Dorinda (agente IA)
- Nome **Dorinda** (a do `CRM_FVC` é "Mariana" — projetos isolados)
- Atua 80% sozinha; handoff humano em casos definidos
- **Coleta nome completo só no final** da conversa (decisão baseada em análise de concorrente real — converte mais)
- Fase A: somente chat widget do site; WhatsApp manual via `wa.me/`
- Fase C: WhatsApp Business API

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

Trazer para o `CRM_Leandro` os 3 workflows que hoje rodam para a Mariana
no `CRM_FVC`, **renomeados com prefixo `[LEANDRO]`**, apontando para a
instância Supabase do Leandro e com o prompt da Dorinda.

| Workflow | Trigger | Função |
|---|---|---|
| `Chat_Widget_AI_v1.json` | Webhook POST `/chat-widget-message` | Recebe msg do widget do site, AI Agent responde, salva em `chat_messages`, atualiza lead |
| `Mariana_FollowUp_Curto_v2.json` | Cron a cada 5 min | Busca leads com 12 min+ de silêncio após mensagem da IA, envia follow-up |
| `Mariana_WhatsApp_v2.json` | Webhook Meta (WhatsApp Cloud) | Listener WhatsApp; transcreve áudio, OCR imagem, AI Agent responde; integra Chatwoot + Asaas |

### Tabelas usadas (já existem no Leandro, exceto uma)

- `chat_conversations` — existe
- `chat_messages` — existe
- `leads` (com campos `ai_*`) — existe
- `n8n_chat_histories` — **falta** (memória do AI Agent do n8n)

### Sub-blocos planejados

| Sub-bloco | Entrega |
|---|---|
| 4.1 | Migration `n8n_chat_histories` no Supabase do Leandro |
| 4.2 | Credenciais no n8n: Supabase Leandro, OpenAI, WhatsApp Meta |
| 4.3 | Workflow 1 (Chat Widget) — duplicar, renomear, apontar Supabase, testar |
| 4.4 | Workflow 2 (Follow-up) — duplicar, trocar "Mariana" por "Dorinda", testar cron |
| 4.5 | Workflow 3 (WhatsApp) — duplicar; decidir escopo Asaas/Chatwoot (MVP vs completo) |
| 4.6 | Prompt da Dorinda no AI Agent (já em `docs/PROMPT-DORINDA.md`) |
| 4.7 | Teste end-to-end: mensagem → IA → lead criado/atualizado → timeline → notificação |

### Prompt da Dorinda

Pronto para colar no campo "System Message" do AI Agent no n8n. Está em
`docs/PROMPT-DORINDA.md`. Resumo:

- Identidade: atende pelo Leandro Alonso, CRECI 300771-F, litoral de SP
- Tom: humano, paulista litorâneo, sem soar robótica
- 5 princípios fundamentais (com destaque: não pede nome no início)
- Tools previstas: `consultar_imoveis`, `consultar_imovel_por_id`, `agendar_visita`
- Handoff humano em casos definidos (desconto, FGTS, confusão repetida, etc.)
- Modelo recomendado: `gpt-4o-mini` (custo) ou `gpt-4o` (qualidade)
- Temperature: 0.3
- Variável `{{ $now }}` é resolvida pelo n8n (Luxon)

### 5 perguntas bloqueantes antes de iniciar 4.x

Felipe precisa responder antes de qualquer código:

1. **n8n hospedado onde?** Leandro e FVC compartilham instância? URL/host?
2. **Asaas + Chatwoot:** Leandro tem contas? Cortamos do MVP e focamos só em
   WhatsApp + OpenAI + Supabase?
3. **WhatsApp Cloud API:** Leandro tem Phone Number ID + token Meta próprios?
   Ou usamos o do FVC temporariamente?
4. **OpenAI API key:** mesma do FVC ou separada? (custo + isolamento de contexto)
5. **Prompt da Mariana:** texto/print do AI Agent dos workflows 1 e 3 — sem
   isso a comparação fica incompleta.

---

## 10. Etapas 5 e 6 (resumo)

### Etapa 5 — Chat widget no site (1 semana)
- `<ChatWidget>` no `src/App.jsx` do site
- Webhook → n8n → Dorinda
- Persistência em `chat_conversations` + `chat_messages`
- Notificação no CRM via Supabase Realtime

### Etapa 6 — Catálogo público (1 semana)
- Roteamento no site (React Router ou similar)
- Páginas `/imoveis` e `/imoveis/:id`
- Filtros funcionais
- CTA "Falar com a Dorinda"

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

```bash
cd C:\Users\User\Documents\08_Leandro_CRM
git status
git log --oneline -5     # último commit funcional: 256cbab
npm install              # se nunca rodou nesta máquina
npm run dev              # http://localhost:3000
```

Login com o usuário de teste de sempre.

Smoke test rápido (1 minuto) — confirmar que tudo continua de pé:

1. Login carrega
2. Dashboard mostra KPIs reais (não 0/0/0 estáticos)
3. Criar evento com `reminder_minutes_before = 2` → esperar 2 min → popup azul
   no canto superior direito + beep
4. Excluir esse evento (do tipo visita, com lead vinculado) → status do lead
   no funil volta automaticamente

Se passar nos 4 itens, o estado pós-`256cbab` está íntegro.

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
- `Chat_Widget_AI_v1.json`, `Mariana_FollowUp_Curto_v2.json`,
  `Mariana_WhatsApp_v2.json` — workflows n8n base para Etapa 4

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

Fase A do CRM Leandro está com **frontend completo e estável**
(Etapa 3 + 3.6 + 3.7 fechadas); o próximo passo é a **Etapa 4 — backend
da Dorinda no n8n**, destravada por 5 perguntas listadas na seção 9.

**Próxima atualização:** ao final do sub-bloco 4.1 (migration
`n8n_chat_histories`) ou após resposta das 5 perguntas bloqueantes.
