# 📊 Relatório do Projeto — CRM Leandro Alonso

**Data do relatório:** 14 de abril de 2026
**Cliente:** Leandro Alonso (CRECI 300771-F, Santos/SP)
**Desenvolvedor:** mtamarozzi
**Fase atual:** Fase A — Backend (Etapa 3 em andamento, Sub-bloco 3.1 concluído)
**Branch ativa:** `feat/backend-fase-a`
**Versão do relatório:** 1.2

---

## 📑 Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Estratégia em 3 Fases](#2-estratégia-em-3-fases)
3. [Stack e Arquitetura Definida](#3-stack-e-arquitetura-definida)
4. [O Que Foi Feito Antes deste Ciclo](#4-o-que-foi-feito-antes-deste-ciclo)
5. [Etapa 1 — Fundação Supabase](#5-etapa-1--fundação-supabase)
6. [Etapa 2 — Cliente Supabase + Autenticação](#6-etapa-2--cliente-supabase--autenticação)
7. [Etapa 3 — Migração do mockData (em andamento)](#7-etapa-3--migração-do-mockdata-em-andamento)
8. [Decisões de Produto](#8-decisões-de-produto)
9. [Análise de Materiais Externos](#9-análise-de-materiais-externos)
10. [Estado Atual do Código](#10-estado-atual-do-código)
11. [Próximos Passos — Etapas 4 a 6](#11-próximos-passos--etapas-4-a-6)
12. [Dívidas Técnicas e Pendências](#12-dívidas-técnicas-e-pendências)
13. [Lições Aprendidas](#13-lições-aprendidas)

---

## 1. Visão Geral do Projeto

### O que é
Um **CRM imobiliário** feito sob medida pro corretor Leandro Alonso, que atende o litoral de São Paulo (Santos, São Vicente, Praia Grande, Guarujá). O produto combina:

- **Gestão de imóveis** (venda, locação e lançamentos)
- **Gestão de leads** (com funil de vendas visual)
- **Agente de IA conversacional** (Dorinda) pra qualificar leads no chat do site
- **Catálogo público** integrado ao site existente do Leandro
- **Agenda integrada** com agendamento automático de visitas

### Quem é o cliente-zero
**Leandro Alonso**, corretor autônomo com CRECI 300771-F, atuando na região de Santos/SP. Já tem:
- Site institucional publicado (`https://leandro-alonso.vercel.app/`)
- Assinatura OpenAI
- Planilha Excel com imóveis cadastrados (fonte de verdade atual)

Não tem ainda:
- Número WhatsApp Business API
- Conta própria no Supabase/Vercel (está sendo usado o login do desenvolvedor por enquanto)

### Visão de futuro
O projeto é desenhado desde o início pra virar um **SaaS multi-tenant** na Fase B, permitindo que outras imobiliárias usem o mesmo sistema. Por isso toda a arquitetura já tem `workspace_id` em todas as tabelas, RLS ativo, e preparação pra cadastro multi-empresa.

---

## 2. Estratégia em 3 Fases

| Fase | Duração estimada | Escopo | Status |
|---|---|---|---|
| **A — Single-tenant funcional** | 4–6 semanas | CRM funcional pro Leandro + Dorinda básica + catálogo no site | 🟡 em andamento (2/6 etapas concluídas, 3 iniciada) |
| **B — SaaS multi-tenant** | 6–8 semanas | Cadastro público, billing, isolamento completo entre workspaces | ⏳ planejada |
| **C — Diferenciais contínuos** | contínuo | WhatsApp Business API, IA avançada, integrações com portais | ⏳ futura |

### Estrutura da Fase A (6 etapas)

```
[A1] Fundação Supabase ─────────────────────────────────── ✅ CONCLUÍDA
[A2] Cliente Supabase + Autenticação ──────────────────── ✅ CONCLUÍDA
[A3] Migração do mockData (React Query + CRUD) ────────── 🟡 EM ANDAMENTO
       ├── 3.1 Fundação React Query                         ✅ CONCLUÍDO
       ├── 3.2 Tela de Configurações do Workspace           ⏳ PRÓXIMO
       ├── 3.3 Migração: Empreendimentos/Imóveis            ⏳
       ├── 3.4 Migração: Leads + Funil                      ⏳
       └── 3.5 Dashboard + Agenda + cleanup                 ⏳
[A4] Backend da Dorinda (n8n workflows adaptados) ─────── ⏳ planejada
[A5] Chat widget no site ──────────────────────────────── ⏳ planejada
[A6] Catálogo público no site ─────────────────────────── ⏳ planejada
```

---

## 3. Stack e Arquitetura Definida

### Tecnologias escolhidas

| Camada | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| **Frontend CRM** | React | 19.0.0 | Já existia, mantido |
| **Build/dev** | Vite | 6.2.0 | Rápido, TypeScript nativo |
| **Linguagem** | TypeScript | 5.8.2 | Tipagem de ponta a ponta |
| **Estilo** | Tailwind + CSS tokens | Tailwind 4 | Design system já estabelecido |
| **Componentes UI** | Shadcn + Base UI | — | Já existia |
| **Animações** | Motion (ex-Framer) | 12 | Já existia |
| **Roteamento** | **TanStack Router** | 1.168 | Escolhido na Etapa 2 — TS first-class, file-based |
| **Estado de servidor** | **TanStack Query (React Query)** | 5.x | Adicionado no Sub-bloco 3.1 — gerencia cache, loading, mutations |
| **Formulários** | **React Hook Form + Zod** | 7.x + 3.x | Adicionado no Sub-bloco 3.1 — padrão da indústria, type-safe |
| **Drag-and-drop** | **dnd-kit** | 6.x | Adicionado no Sub-bloco 3.1 — moderno, acessível, ativo |
| **Ícones** | Lucide React | 0.546 | Já existia |
| **Gráficos** | Recharts | 3.8 | Já existia (dashboard) |
| **Backend** | **Supabase** | — | Postgres + Auth + Storage + Realtime em uma stack |
| **Automação/IA** | n8n self-hosted + OpenAI | — | n8n compartilhado com outro projeto (CRM_FVC) |
| **Hospedagem** | Vercel | free | Já usada pelo site do Leandro |
| **Email transacional** | Resend | free | 3k emails/mês |

### Arquitetura de alto nível

```
┌─────────────────────────┐
│  Supabase CRM_Leandro   │  (projeto separado do CRM_FVC do advogado)
│                         │
│  - Auth                 │
│  - DB (11 tabelas)      │
│  - Storage (fotos)      │
│  - Row Level Security   │
└────────────┬────────────┘
             │
             ├────────────────┬──────────────────┐
             │                │                  │
             ▼                ▼                  ▼
    ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐
    │  CRM Web    │  │  n8n agent   │  │  Site público     │
    │  (Vercel)   │  │  (Dorinda)   │  │  (Vercel)         │
    │             │  │              │  │                   │
    │  React +    │  │  Workflows   │  │  Catálogo +       │
    │  Vite +     │  │  prefix      │  │  Chat widget      │
    │  Tailwind   │  │  [LEANDRO]   │  │  (Fase A5/A6)     │
    └─────────────┘  └──────────────┘  └───────────────────┘
```

### Isolamento entre projetos

O Leandro compartilha o **mesmo n8n** com outro projeto de advocacia (CRM_FVC), mas usa **Supabase completamente separado**:
- ✅ Contas diferentes no Supabase
- ✅ Workflows n8n com prefixo `[LEANDRO]` vs `[FVC]`
- ✅ Credenciais n8n isoladas por workflow
- ✅ Zero risco de vazamento cruzado de dados

---

## 4. O Que Foi Feito Antes deste Ciclo

### Redesign visual completo do CRM (concluído anteriormente)

Antes deste ciclo de backend, o projeto passou por um **redesign visual completo** executado no Antigravity com metodologia "um prompt por vez, validação, commit". Resultado:

- **Paleta definida:** cinza (#808080→#3C3C3C) + dourado (#D4A017)
- **Estilo:** glassmorphism (vidro fosco, blur, transparências)
- **Dark mode** funcional
- **Logo real** do cliente (arquivo `logo-preta.png`)
- **6 telas redesenhadas:** Dashboard, Leads, Importar, Funil, Empreendimentos, Agenda

Arquivos de design salvos em `docs/`:
- `00-PLANEJAMENTO-GERAL.md` → `10-GUIA-ANTIGRAVITY.md`
- `HANDOFF.md`
- `PLANO-CORRECOES-FINAIS.md`
- `preview.html` (amostra standalone)

### Análise de repositórios existentes

O desenvolvedor liberou acesso via Filesystem MCP aos 2 projetos:
- `C:\Users\User\Documents\Leandro_CRM` — o CRM em si
- `C:\Users\User\Documents\Leando_Alonso_Site` — o site público do Leandro

**Descobertas importantes do CRM:**
- React 19 + Vite 6 + Tailwind 4
- Componente `App.tsx` monolítico (~900 linhas, todas as 6 telas em views internas)
- Gerenciamento de estado simples com `useState` + mockData
- Design system em `src/styles/tokens.css`
- `@google/genai` no package.json (legado do AI Studio, não usado em produção — será removido)
- `express` + `ffmpeg-static` no package.json (provavelmente não usado, investigar depois)

**Descobertas importantes do site:**
- React 19 RC + Vite 5 + Tailwind 3 + GSAP + Lucide
- **Super enxuto:** toda a landing page em `src/App.jsx` + `src/main.jsx`
- Sem React Router, sem Supabase, sem Shadcn
- Bundle total: ~342 KB
- Arquivo `GeminiMD--Sites--Cinematográficos.md` (prompt usado pra gerar o site)
- Arquivo `copy_landing_page_leandro_alonso.md` (tom de voz do Leandro)

---

## 5. Etapa 1 — Fundação Supabase

**Duração:** ~1h30 (com tropeços de encoding)
**Status:** ✅ Concluída e commitada
**Commit:** `feat(backend): estrutura inicial do banco de dados`

### Objetivo
Preparar toda a infraestrutura de banco de dados no Supabase remoto, sem tocar no frontend. "Preparar o terreno."

### O que foi criado

#### Arquivo `supabase/migrations/0001_initial_schema.sql`

**11 tipos ENUM:**
- `lead_status`, `lead_origin`, `property_purpose`, `property_kind`, `property_status`
- `event_type`, `event_status`, `interaction_type`, `notification_type`
- `conversation_status`, `chat_sender_type`

**11 tabelas:** `workspaces`, `profiles`, `properties`, `media`, `leads`, `lead_properties`, `interactions`, `events`, `notifications`, `chat_conversations`, `chat_messages`

**Triggers e funções:**
1. `update_updated_at_column()` — atualiza `updated_at` automaticamente
2. `handle_new_user()` — cria workspace + profile ao cadastrar usuário
3. `log_lead_status_change()` — registra mudanças de status em `interactions`

**Decisão importante:** Unificação de venda/locação/lançamento na tabela `properties` (em vez de 3 tabelas separadas). Discriminador `purpose`.

#### Arquivo `supabase/migrations/0002_rls_policies.sql`

**RLS ativo em todas as tabelas. 30+ policies criadas.**
- Função helper: `current_workspace_id()`
- Autenticados → só veem dados do próprio workspace
- Anônimos → leem imóveis públicos + criam conversas de chat

#### Arquivo `supabase/migrations/0003_storage_setup.sql`

**3 Storage Buckets:**
| Bucket | Uso | Limite |
|---|---|---|
| `properties` | Fotos de imóveis | 10 MB |
| `avatars` | Fotos de perfil | 2 MB |
| `logos` | Logo do workspace | 2 MB |

#### Outros
- `.env.example` reescrito (sem variáveis do Gemini)
- `src/types/database.ts` gerado pela CLI
- `supabase/config.toml` criado

### Problemas encontrados
1. **BOM no `.env.local`** — PowerShell adiciona por padrão, Supabase CLI não parseia
2. **`database.ts` em UTF-16** — `>` no PowerShell usa UTF-16 por padrão

Ambos resolvidos via Filesystem MCP (UTF-8 sem BOM).

### Validação
✅ 11 tabelas no Table Editor
✅ RLS ativo (badge verde)
✅ 30+ policies em Authentication → Policies
✅ 3 buckets em Storage
✅ 11 enums em Database → Types
✅ `database.ts` populado

---

## 6. Etapa 2 — Cliente Supabase + Autenticação

**Duração:** ~2h
**Status:** ✅ Concluída e commitada
**Commit:** `feat(auth): cliente supabase, roteamento tanstack e tela de login`

### Objetivo
Conectar o CRM ao Supabase, adicionar autenticação real, criar tela de login. Sem tocar no conteúdo das telas internas.

### Decisões tomadas

| Decisão | Escolha | Por quê |
|---|---|---|
| Roteamento | TanStack Router | TS first-class, file-based |
| Login | Email + senha | Simples pra Fase A |
| Cadastro público | Não, só login | Manual no painel |
| Nome do workspace | Tela Configurações (3.2) | Escalável pra Fase B |
| Esqueci minha senha | Incluído | Reset via Supabase |
| Identidade visual | Logo real do Leandro | Mesma do CRM |

### Arquivos criados (12)

```
src/lib/supabase.ts                     ← cliente Supabase singleton
src/contexts/AuthContext.tsx            ← provider + hook useAuth
src/hooks/useCurrentProfile.ts          ← hook profile + workspace
src/routes/__root.tsx                   ← rota raiz com AuthProvider
src/routes/login.tsx                    ← rota pública /login
src/routes/forgot-password.tsx          ← rota pública /forgot-password
src/routes/_authenticated.tsx           ← layout guard (protege rotas)
src/routes/_authenticated/index.tsx     ← home protegida (carrega App)
src/pages/LoginPage.tsx                 ← tela de login glassmorphism
src/pages/ForgotPasswordPage.tsx        ← tela de recuperação
src/styles/auth.css                     ← estilo das telas de auth
docs/KNOWN-ISSUES.md                    ← registro de dívidas técnicas
```

### Arquivos modificados (4)

```
vite.config.ts    → adiciona TanStackRouterVite, remove Gemini
src/main.tsx      → usa RouterProvider em vez de <App /> direto
src/index.css     → importa styles/auth.css
src/App.tsx       → imports, hooks, handleSignOut, botão Sair na topbar
```

### Auto-gerado
```
src/routeTree.gen.ts    ← gerado pelo plugin do TanStack Router
```

### Dependências instaladas (Etapa 2)
```
@supabase/supabase-js         ^2.103.0    (runtime)
@tanstack/react-router        ^1.168.19   (runtime)
@tanstack/router-devtools     ^1.166.13   (dev)
@tanstack/router-plugin       ^1.167.21   (dev)
@tanstack/router-vite-plugin  ^1.166.36   (dev, não usado)
```

### Problemas encontrados
1. **Botão Sair não funcionava** — `signOut()` sem `navigate()`. Solução: criar `handleSignOut`.
2. **Warning do Recharts** ao desmontar — registrado como **KI-001** em `KNOWN-ISSUES.md`.

### Validação
✅ Tela de login glassmorphism perfeita
✅ Login funciona, trigger cria workspace + profile
✅ Letra do avatar reflete o nome
✅ Botão Sair redireciona pra `/login`
✅ RLS isolando dados por workspace

---

## 7. Etapa 3 — Migração do mockData (em andamento)

**Status:** 🟡 Em andamento — Sub-bloco 3.1 iniciado
**Commit alvo:** múltiplos (1 por sub-bloco)

### Estrutura em 5 sub-blocos

```
[3.1] Fundação React Query + utilitários            ──── ✅ CONCLUÍDO
[3.2] Configurações do Workspace (tela nova)        ──── ⏳ PRÓXIMO
[3.3] Migração: Empreendimentos/Imóveis             ──── ⏳ planejado
[3.4] Migração: Leads + Funil                       ──── ⏳ planejado
[3.5] Migração: Dashboard + Agenda + cleanup       ──── ⏳ planejado
```

### Decisões tomadas (transversais a toda Etapa 3)

| Decisão | Escolha | Justificativa |
|---|---|---|
| **Estado de servidor** | TanStack Query (React Query) v5 | Padrão da indústria, cache automático, otimistic updates |
| **Formulários** | React Hook Form + Zod | TS-safe, performance excelente, comunidade massiva |
| **Validação** | Zod | Type inference, integração nativa com RHF |
| **Drag-and-drop** | dnd-kit | Moderno, acessível, ativo, suporte mobile |
| **Modal vs Rota** | Modal centralizado | Reuso, não muda URL |

### Sub-bloco 3.1 — Fundação React Query ✅

**Status:** ✅ Concluído e validado
**Duração:** ~30min (tranquilo, zero tropeços)
**Commit alvo:** `feat(infra): configura react-query com query keys e helpers`

**Dependências instaladas (8):**
```
@tanstack/react-query         ^5.99.0
@tanstack/react-query-devtools ^5.99.0
react-hook-form               ^7.72.1
zod                           ^4.3.6     ⚠️ Zod 4, sintaxe diferente do Zod 3
@hookform/resolvers           ^5.2.2     (versão 5 suporta Zod 4)
@dnd-kit/core                 ^6.3.1
@dnd-kit/sortable             ^10.0.0
@dnd-kit/utilities            ^3.2.2
```

**Arquivos criados (3):**
- `src/lib/queryClient.ts` — singleton do QueryClient com configurações sensatas:
  - `staleTime: 30s` — dados frescos por 30s
  - `gcTime: 5min` — cache garbage-collected após 5min sem uso
  - `retry: 1` — 1 tentativa de retry (não 3 default)
  - `refetchOnWindowFocus: false` — não refaz ao focar a janela
  - `refetchOnReconnect: true` — refaz ao reconectar internet
  - Mutations com `retry: 0`
- `src/lib/queryKeys.ts` — fábrica centralizada de chaves (padrão "Query Key Factory"):
  - Hierarquia: `workspace`, `profile`, `properties`, `leads`, `events`, `notifications`, `dashboard`
  - Cada entidade expõe: `all`, `lists()`, `list(filters)`, `details()`, `detail(id)`
  - Permite invalidação em cascata (`invalidateQueries({ queryKey: queryKeys.leads.all })`)
  - Exporta tipos `PropertyFilters`, `LeadFilters`, `EventFilters`
- `src/lib/supabase-helpers.ts` — utilitários tipados:
  - `getCurrentWorkspaceId()` — pega workspace via `profiles`
  - `assertNoError(error)` — joga `PostgrestError` como Error JS
  - `uploadFile(bucket, path, file, options)` — upload + URL pública
  - `deleteFile(bucket, path)` — remoção de arquivo
  - `generateUniqueFilename(originalName)` — evita colisões

**Arquivos modificados (1):**
- `src/routes/__root.tsx` — envolve o app com `<QueryClientProvider>` por fora do `<AuthProvider>` e adiciona `<ReactQueryDevtools>` em DEV (canto inferior esquerdo)

**Decisão de arquitetura:** `QueryClientProvider` fica POR FORA do `AuthProvider` porque o AuthProvider pode (no futuro) usar React Query internamente.

**Validação:**
- ✅ `npm run dev` roda sem erros
- ✅ Tela de login aparece normal
- ✅ Login funciona
- ✅ CRM protegido aparece
- ✅ DevTools React Query no canto inferior esquerdo
- ✅ DevTools Router no canto inferior direito
- ✅ Botão Sair funciona
- ✅ Zero mudança visual (sub-bloco puramente de infraestrutura)

**Alerta técnico sobre Zod 4:**
- O npm instalou **Zod 4** (não 3). É uma versão recente com breaking changes
- `@hookform/resolvers` 5.x foi lançada justamente pra suportar Zod 4
- Sintaxe mudou em alguns pontos: `z.string().email()` virou `z.email()`
- Tutoriais/Stack Overflow ainda mostram Zod 3 majoritariamente
- Anotado pra lembrar enquanto escrevemos schemas nos próximos sub-blocos

### Sub-blocos 3.2 a 3.5 — visão geral

**3.2 Tela de Configurações do Workspace**
- Hook `useWorkspace` + mutations
- Rota `/configuracoes` protegida
- Formulário com nome, CRECI, telefone, cor primária, upload de logo
- Resolve o nome genérico do workspace (problema pendente da Etapa 2)

**3.3 Migração: Empreendimentos/Imóveis**
- Hooks completos (CRUD + media)
- Wizard de cadastro em 4 passos
- Upload de fotos com preview
- Refatoração da tela "Empreendimentos" (renomeada internamente pra "Imóveis")

**3.4 Migração: Leads + Funil**
- Hooks completos
- Modal "+ Novo Lead"
- Drag-and-drop no funil com otimistic updates
- Modal de detalhe com timeline de interações

**3.5 Dashboard + Agenda + Cleanup**
- KPIs reais e gráficos com dados agregados
- CRUD de eventos na agenda
- Resolver KI-001 (Recharts)
- Deletar `mockData.ts`, `@google/genai`, deps órfãs

---

## 8. Decisões de Produto

### Sobre a Dorinda (agente IA)

- **Nome:** Dorinda (não "Mariana" — essa é do CRM_FVC de advocacia)
- **Autonomia:** atua 80% sozinha, Leandro só entra quando ela aciona handoff
- **Coleta de dados:** nome completo NO FINAL da conversa, depois de criar rapport
- **Canais Fase A:** só chat widget do site (WhatsApp manual via wa.me/)
- **Canais Fase C:** WhatsApp Business API com número virgem (requisito Meta)
- **Funções automáticas:** qualifica funil, agenda visitas, gera protocolo, notifica handoff

### Sobre imóveis

- Tabela única `properties` com `purpose` discriminador
- Lançamentos = vendas com `development_name` + `developer` preenchidos
- 21 campos comuns entre venda/locação, 5 exclusivos venda, 6 exclusivos locação
- `ref_code` (ex: ALG-SP-001) mantido como apelido humano
- "Destaques" é uso interno + Dorinda
- Total mensal digitado, não calculado
- Andar é texto livre

### Sobre o site existente

- Não vai ser refeito — já está publicado
- Recebe 2 adições: chat widget (3.5) e catálogo público (3.6)
- Stack: React 19 RC + Vite 5 + Tailwind 3 + GSAP

### Sobre WhatsApp na Fase A

- `wa.me/` (link simples, sem API)
- Botão "+ Novo Lead" manual no CRM pra cadastros retroativos
- Migração pra API oficial só na Fase C

### Sobre criação de usuários

- Admin cria manualmente no painel Supabase
- Trigger `handle_new_user` cria workspace + profile
- Tela de Configurações (3.2) permite editar nome, logo, CRECI, cor

---

## 9. Análise de Materiais Externos

### Prompt da Dorinda (do concorrente)

Recebido como `Prompt_CRMLeandro.md`. Problemas identificados pra adaptação na Etapa 4:
- ❌ Pede nome na etapa 1 (contradiz decisão)
- ❌ Sem gatilhos de handoff
- ❌ Só venda (sem locação)
- ❌ Desqualifica cedo
- 🟡 Tool `aptDispo` precisa renomear

### Conversas de concorrente (5 prints)

**Corretor:** Caique Lima (SP)

**Lições positivas:**
- ✅ Coletou nome no final
- ✅ Ofereceu venda + aluguel simultaneamente
- ✅ Identificou imóveis reservados
- ✅ Notificação formatada pro corretor

**Lições negativas (Dorinda evita):**
- ❌ Repetiu informações 4x
- ❌ Sempre terminou com "quer agendar?"
- ❌ Zero rapport
- ❌ Não mandou fotos
- ❌ Nome do lead sumiu no meio

### Workflows n8n (CRM_FVC)

3 workflows pra adaptar:
1. **Mariana_WhatsApp_v2** (41 nós) — WhatsApp + Whisper + AI
2. **Chat_Widget_AI_v1** (15 nós) — webhook do widget
3. **Mariana_FollowUp_Curto_v2** (5 nós) — cron de follow-up

---

## 10. Estado Atual do Código

### Estrutura de pastas (após Etapas 1, 2 e início da 3)

```
Leandro_CRM/
├── .env.example                           [Etapa 1]
├── .env.local                             [Etapa 1, gitignored]
├── package.json                           [Etapas 1, 2, 3.1]
├── vite.config.ts                         [Etapa 2]
├── index.html
│
├── docs/
│   ├── 00-PLANEJAMENTO-GERAL.md           [redesign]
│   ├── ... (10 arquivos do redesign)
│   ├── KNOWN-ISSUES.md                    [Etapa 2]
│   └── RELATORIO-PROJETO-CRM-LEANDRO.md   [Etapa 3.1 — ESTE ARQUIVO]
│
├── supabase/                               [Etapa 1]
│   ├── config.toml
│   └── migrations/
│       ├── 0001_initial_schema.sql
│       ├── 0002_rls_policies.sql
│       └── 0003_storage_setup.sql
│
├── public/imagens/
│   └── logo-preta.png
│
└── src/
    ├── main.tsx                            [Etapa 2]
    ├── App.tsx                             [Etapa 2]
    ├── index.css                           [Etapa 2]
    ├── mockData.ts                         [removido em 3.5]
    ├── types.ts
    ├── routeTree.gen.ts                    [auto-gerado Etapa 2]
    │
    ├── contexts/                           [Etapa 2]
    │   └── AuthContext.tsx
    │
    ├── hooks/                              [Etapa 2]
    │   └── useCurrentProfile.ts
    │
    ├── lib/                                [Etapa 2 + ampliado em 3.1]
    │   ├── supabase.ts                     [Etapa 2]
    │   ├── queryClient.ts                  [3.1 — a criar]
    │   ├── queryKeys.ts                    [3.1 — a criar]
    │   └── supabase-helpers.ts             [3.1 — a criar]
    │
    ├── pages/                              [Etapa 2]
    │   ├── LoginPage.tsx
    │   └── ForgotPasswordPage.tsx
    │
    ├── routes/                             [Etapa 2]
    │   ├── __root.tsx                      [a atualizar em 3.1]
    │   ├── login.tsx
    │   ├── forgot-password.tsx
    │   ├── _authenticated.tsx
    │   └── _authenticated/
    │       └── index.tsx
    │
    ├── styles/
    │   ├── tokens.css
    │   ├── ... (8 arquivos do redesign)
    │   └── auth.css                        [Etapa 2]
    │
    └── types/                              [Etapa 1]
        └── database.ts
```

### Estado do git

```
Branches:
├── main                         ← inclui redesign (mergeado na Etapa 2)
├── feat/redesign-glass          ← sinônimo da main
└── feat/backend-fase-a          ← HEAD, Etapas 1+2 commitadas, 3.1 em curso
```

**Commits da Fase A até agora:**
1. `feat(backend): estrutura inicial do banco de dados` (Etapa 1)
2. `feat(auth): cliente supabase, roteamento tanstack e tela de login` (Etapa 2)

### Estado do Supabase

**Projeto:** CRM_Leandro
**URL:** `https://ompbnsrtnpgwiufanljp.supabase.co`

- ✅ 11 tabelas + 11 enums + RLS + 30+ policies
- ✅ 3 buckets de storage
- ✅ Triggers de negócio rodando
- ✅ 1 usuário de teste (workspace + profile criados pelo trigger)

---

## 11. Próximos Passos — Etapas 4 a 6

### 🟦 Etapa 4 — Backend da Dorinda (n8n + OpenAI + webhooks)
**Duração:** 1-2 semanas
- Duplicar 3 workflows do CRM_FVC com prefixo `[LEANDRO]`
- Adaptar SQL pras tabelas novas
- Reescrever prompt da Dorinda (juntos, seção por seção)
- Conectar n8n ao Supabase do Leandro
- Testar fluxo end-to-end

### 🟦 Etapa 5 — Chat widget no site
**Duração:** 1 semana
- Componente `<ChatWidget>` no `src/App.jsx` do site
- Webhook → n8n → Dorinda
- Persistência em `chat_conversations` + `chat_messages`
- Notificação no CRM via Realtime

### 🟦 Etapa 6 — Catálogo público no site
**Duração:** 1 semana
- Roteamento no site (React Router ou similar)
- Páginas `/imoveis` e `/imoveis/:id`
- Filtros funcionais
- CTA "Falar com a Dorinda"

---

## 12. Dívidas Técnicas e Pendências

### Registradas em `docs/KNOWN-ISSUES.md`

**KI-001 — Warning do Recharts**
- Severidade: cosmética
- Resolver em: Sub-bloco 3.5 (cleanup)

### Pendências de infraestrutura

| Item | Responsável | Prazo |
|---|---|---|
| Leandro criar conta Supabase própria | Leandro + dev | Antes do deploy |
| Leandro criar conta Vercel própria | Leandro + dev | Antes do deploy |
| Leandro obter credenciais OpenAI | Já tem | — |
| Leandro criar conta Resend | Leandro + dev | Etapa 3 |
| Rotacionar credenciais expostas (n8n) | Dev | Quando possível |
| Deletar `@google/genai` do package.json | Dev | Sub-bloco 3.5 |
| Deletar `express`/`ffmpeg-static` se não usados | Dev | Sub-bloco 3.5 |
| Deletar `@tanstack/router-vite-plugin` | Dev | Sub-bloco 3.5 |
| Configurar template "Reset Password" no Supabase | Dev | Etapa 3 |

---

## 13. Lições Aprendidas

### Sobre planejamento
1. Descobertas atrasam execução, mas salvam retrabalho
2. Decisões "menores" têm impacto enorme (ex: nome no final)
3. Sempre existe um "momento certo" pra cada decisão (ex: adiar Configurações pra 3.2)

### Sobre execução
1. Windows + PowerShell + encoding é armadilha — usar Filesystem MCP sempre
2. Migrations incrementais economizam tempo
3. TypeScript tipado do banco vale muito (`supabase gen types`)
4. Validação visual importa, mesmo em "ações de backend"

### Sobre colaboração
1. Limites de ferramentas forçam checkpoints saudáveis
2. Perguntas de múltipla escolha economizam tokens
3. Avisar antes de agir é mais importante que acertar de primeira

### Sobre gestão de conhecimento
1. **Manter relatório atualizado a cada sub-bloco** é uma disciplina nova introduzida na Etapa 3 — garante que o projeto nunca tenha "memória dispersa"

---

## 📌 Conclusão até este ponto

Estado técnico do projeto:

- ✅ **Infraestrutura sólida:** banco modelado, RLS, storage
- ✅ **Autenticação funcional:** login, logout, sessão persistente, proteção
- ✅ **Código limpo:** TypeScript em tudo, separação de responsabilidades
- ✅ **Design consistente:** tela de login segue o DNA visual do CRM
- ✅ **Histórico git organizado**
- ✅ **Dívidas técnicas registradas**
- 🟡 **Etapa 3 iniciada:** Sub-bloco 3.1 em execução

**Estimativa realista de conclusão da Fase A:** 4-6 semanas a partir de agora.

---

**Documento atualizado em:** 14 de abril de 2026
**Versão do relatório:** 1.2
**Próxima atualização:** ao fim do Sub-bloco 3.2
