# 🔄 Continuidade do Projeto — CRM Leandro Alonso

**Documento gerado em:** 14 de abril de 2026
**Motivo:** migração do trabalho do Claude.ai (Desktop + MCP Filesystem) para o **Claude CLI dentro do Antigravity**.
**Para:** o próximo agente (humano ou IA) que vai continuar o projeto.
**Ponto exato de retomada:** **Sub-bloco 3.2 — Tela de Configurações do Workspace**.

---

## 📖 Como usar este documento

Se você é o **Claude CLI** lendo isso pela primeira vez no Antigravity: leia o arquivo inteiro antes de escrever qualquer código. Ele tem 3 partes:

1. **Contexto do projeto** (o que é, stack, estado atual) — seções 1 a 5
2. **Regras de trabalho** (como o desenvolvedor espera que você atue) — seção 6
3. **Próximo passo imediato** (Sub-bloco 3.2 com decisões pendentes) — seção 7

Depois de ler, **leia também** os 2 documentos complementares:

1. **`docs/CONTINUIDADE-PROJETO-LEANDRO.md`** — **checkpoint estratégico completo** do projeto inteiro. Contém: schema SQL completo da tabela `properties` (40+ campos), análise detalhada do prompt atual da Dorinda (6 etapas + 4 problemas identificados), lições das 5 conversas do concorrente Caique Lima (o que faz bem vs mal), estrutura dos 3 workflows n8n a serem adaptados (Mariana_WhatsApp_v2, Chat_Widget_AI_v1, Mariana_FollowUp_Curto_v2), descobertas da planilha real do Leandro, cenário de integração com o site público, e os 8 passos do fluxo completo. **Leia este arquivo antes de planejar os sub-blocos 3.3+ e principalmente antes da Etapa 4 (Dorinda).**

2. **`docs/RELATORIO-PROJETO-CRM-LEANDRO.md`** (versão 1.2) — histórico técnico incremental do que já foi efetivamente codado (Etapas 1, 2 e Sub-bloco 3.1). Atualizado a cada sub-bloco concluído.

Este arquivo (`CONTINUIDADE-CLAUDE-CLI.md`) é um **resumo executivo focado no próximo passo imediato (Sub-bloco 3.2)**. Os outros dois são a referência profunda.

---

## 1. O projeto em 30 segundos

**CRM imobiliário** sob medida para **Leandro Alonso** (CRECI 300771-F, corretor de imóveis em Santos/SP). Gestão de imóveis (venda/locação/lançamentos), leads, funil de vendas, agenda e um agente de IA conversacional chamado **Dorinda**.

Arquitetura pensada desde o início pra virar **SaaS multi-tenant** (Fase B). Por isso todas as tabelas já têm `workspace_id` e RLS ativo.

**Desenvolvedor:** mtamarozzi

**Repositório:** `C:\Users\User\Documents\Leandro_CRM`
**Branch ativa:** `feat/backend-fase-a`
**Último commit:** `6d5e195 feat(infra): configura react-query com query keys e helpers`

Também há um repositório relacionado (site público do Leandro, será tocado nas Etapas 5 e 6):
`C:\Users\User\Documents\Leando_Alonso_Site` (o typo "Leando" sem "r" é intencional no nome da pasta)

---

## 2. Estratégia em 3 fases

| Fase | Escopo | Status |
|---|---|---|
| **A — Single-tenant funcional** (4-6 sem) | CRM funcional + Dorinda básica + catálogo no site | 🟡 2/6 etapas concluídas, 3 em andamento |
| **B — SaaS multi-tenant** (6-8 sem) | Cadastro público, billing, isolamento completo | ⏳ planejada |
| **C — Diferenciais contínuos** | WhatsApp Business API, IA avançada, portais | ⏳ futura |

### Estrutura da Fase A

```
[A1] Fundação Supabase                       ✅ CONCLUÍDA
[A2] Cliente Supabase + Autenticação         ✅ CONCLUÍDA
[A3] Migração do mockData (React Query)      🟡 EM ANDAMENTO
     ├── 3.1 Fundação React Query             ✅ CONCLUÍDO
     ├── 3.2 Configurações do Workspace       ⏳ PRÓXIMO ← VOCÊ ESTÁ AQUI
     ├── 3.3 Imóveis/Empreendimentos          ⏳
     ├── 3.4 Leads + Funil                    ⏳
     └── 3.5 Dashboard + Agenda + cleanup     ⏳
[A4] Backend da Dorinda (n8n + OpenAI)       ⏳ planejada
[A5] Chat widget no site                     ⏳ planejada
[A6] Catálogo público no site                ⏳ planejada
```

---

## 3. Stack técnica

### Frontend (CRM)

| Camada | Tech | Versão | Notas |
|---|---|---|---|
| React | 19.0.0 | — | Cuidado com peer deps de libs React 18 (warnings ok, erros não) |
| Build | Vite | 6.2.0 | File-based routing via plugin |
| TS | 5.8.2 | — | `strict` ligado, paths com `@/*` |
| Styling | Tailwind 4 + CSS tokens | — | Design system em `src/styles/tokens.css` |
| UI | Shadcn + Base UI | — | Componentes em `components/ui/` |
| Animação | Motion (ex-Framer) | 12 | — |
| **Roteamento** | **TanStack Router** | 1.168 | File-based, autogeração via plugin |
| **Estado servidor** | **TanStack Query v5** | 5.99 | Configurado no Sub-bloco 3.1 |
| **Formulários** | **React Hook Form** | 7.72 | Decidido no 3.1 |
| **Validação** | **Zod 4** ⚠️ | 4.3 | **Zod 4, sintaxe diferente do Zod 3** (vide alerta abaixo) |
| **RHF + Zod** | @hookform/resolvers | 5.2 | Versão 5.x suporta Zod 4 |
| **Drag-and-drop** | @dnd-kit | 6.x | core + sortable + utilities |
| Ícones | Lucide React | 0.546 | — |
| Gráficos | Recharts | 3.8 | KI-001 aberta (ver seção 5.3) |

### Backend

- **Supabase** — projeto `CRM_Leandro` (separado do `CRM_FVC` do advogado)
  - URL: `https://ompbnsrtnpgwiufanljp.supabase.co`
  - Ref: `ompbnsrtnpgwiufanljp`
  - 11 tabelas, 11 enums, RLS ativo, 30+ policies, 3 storage buckets
- **n8n self-hosted** (compartilhado com outro projeto de advocacia — usar prefixo `[LEANDRO]` em todos os workflows)
- **OpenAI** — Leandro é assinante

### Hospedagem
- **Vercel** (free plan) — mesmo usado pelo site público do Leandro
- **Resend** (free, 3k/mês) — emails transacionais (ainda não configurado)

### ⚠️ Alerta Zod 4

O npm instalou Zod **4.3.6** (não 3.x como esperado inicialmente). Zod 4 tem breaking changes:

- `z.string().email()` virou `z.email()`
- `z.string().url()` virou `z.url()`
- API de erros mudou (`error.issues` estrutura diferente)
- Tutoriais/Stack Overflow ainda mostram Zod 3 majoritariamente

`@hookform/resolvers` 5.x foi lançada justamente pra suportar Zod 4. Está tudo compatível, só **não copie exemplos de blog antigo sem adaptar a sintaxe**.

---

## 4. O que já foi feito (etapas concluídas)

### ✅ Etapa 1 — Fundação Supabase
Commit: `8623003 feat(backend): estrutura inicial do banco de dados`

**O que foi criado:**
- 3 migrations SQL em `supabase/migrations/`:
  - `0001_initial_schema.sql` — 11 enums, 11 tabelas, 3 triggers
  - `0002_rls_policies.sql` — RLS + `current_workspace_id()` + 30+ policies
  - `0003_storage_setup.sql` — 3 buckets (`properties`, `avatars`, `logos`)
- `src/types/database.ts` gerado via `npx supabase gen types typescript --linked`
- `.env.example` reescrito sem variáveis legadas do Gemini
- `supabase/config.toml` criado via `supabase init`

**Decisão-chave do schema:** Tabela única `properties` com discriminador `purpose` (venda/locacao/lancamento). Lançamentos NÃO são tabela separada — são "venda com `development_name` + `developer` preenchidos". Essa decisão veio da análise da planilha real do Leandro.

**Triggers importantes:**
- `handle_new_user()` — cria workspace + profile automaticamente quando usuário se cadastra em `auth.users`
- `log_lead_status_change()` — registra mudanças em `interactions`
- `update_updated_at_column()` — genérico em todas as tabelas

### ✅ Etapa 2 — Cliente Supabase + Autenticação
Commit: `58f1033 feat(auth): cliente supabase, roteamento tanstack e tela de login`

**O que foi criado (12 arquivos):**
```
src/lib/supabase.ts                     ← cliente Supabase tipado
src/contexts/AuthContext.tsx            ← provider + useAuth hook
src/hooks/useCurrentProfile.ts          ← profile + workspace
src/routes/__root.tsx                   ← rota raiz
src/routes/login.tsx                    ← /login (público)
src/routes/forgot-password.tsx          ← /forgot-password (público)
src/routes/_authenticated.tsx           ← layout guard
src/routes/_authenticated/index.tsx     ← home protegida
src/pages/LoginPage.tsx                 ← tela glassmorphism
src/pages/ForgotPasswordPage.tsx        ← tela reset
src/styles/auth.css                     ← estilos
docs/KNOWN-ISSUES.md                    ← registro de dívidas
```

**Arquivos modificados:**
- `vite.config.ts` — adiciona `TanStackRouterVite` plugin, REMOVE variáveis do Gemini
- `src/main.tsx` — usa `RouterProvider` em vez de `<App />` direto
- `src/index.css` — importa `styles/auth.css`
- `src/App.tsx` — adiciona `useAuth`, `useCurrentProfile`, `handleSignOut`, botão Sair na topbar

**Auto-gerado (commitado):**
- `src/routeTree.gen.ts` — gerado pelo plugin do TanStack Router

**Decisões tomadas:**
- Roteamento: TanStack Router (file-based, TS first-class)
- Login: só email+senha (sem cadastro público, admin cria manual)
- Inclui "Esqueci minha senha"
- Logo real do Leandro no login

### ✅ Sub-bloco 3.1 — Fundação React Query
Commit: `6d5e195 feat(infra): configura react-query com query keys e helpers`

**Dependências instaladas (8):**
```
@tanstack/react-query         ^5.99.0
@tanstack/react-query-devtools ^5.99.0
react-hook-form               ^7.72.1
zod                           ^4.3.6     ⚠️ Zod 4
@hookform/resolvers           ^5.2.2     (suporta Zod 4)
@dnd-kit/core                 ^6.3.1
@dnd-kit/sortable             ^10.0.0
@dnd-kit/utilities            ^3.2.2
```

**Arquivos criados (3):**
- `src/lib/queryClient.ts` — singleton com:
  - `staleTime: 30_000` (30s)
  - `gcTime: 5 * 60_000` (5min)
  - `retry: 1`, `refetchOnWindowFocus: false`, `refetchOnReconnect: true`
  - Mutations com `retry: 0`
- `src/lib/queryKeys.ts` — factory centralizada no padrão "Query Key Factory":
  - Entidades: `workspace`, `profile`, `properties`, `leads`, `events`, `notifications`, `dashboard`
  - Cada uma expõe: `all`, `lists()`, `list(filters)`, `details()`, `detail(id)`
  - Tipos exportados: `PropertyFilters`, `LeadFilters`, `EventFilters`
- `src/lib/supabase-helpers.ts` — utilitários:
  - `getCurrentWorkspaceId()` — pega via `profiles` do usuário logado
  - `assertNoError(error)` — joga `PostgrestError` como `Error` JS
  - `uploadFile(bucket, path, file, options)` — upload + retorna `{publicUrl, storagePath}`
  - `deleteFile(bucket, path)`
  - `generateUniqueFilename(originalName)` — `timestamp-slug.ext`

**Arquivo modificado (1):**
- `src/routes/__root.tsx` — envolve o app com `<QueryClientProvider>` **POR FORA** do `<AuthProvider>` + adiciona `<ReactQueryDevtools>` em DEV (canto inferior esquerdo)

**Decisão de arquitetura:** `QueryClientProvider` fica POR FORA do `AuthProvider` porque o `AuthProvider` pode (no futuro) usar React Query internamente.

---

## 5. Estado atual do código (pós-3.1)

### 5.1 Estrutura de pastas relevante

```
Leandro_CRM/
├── .env.local                  ← gitignored, contém VITE_SUPABASE_*
├── package.json                ← 8 libs novas do 3.1
├── vite.config.ts              ← TanStackRouterVite plugin
├── tsconfig.json               ← paths: "@/*": ["./*"]
├── supabase/
│   ├── config.toml
│   └── migrations/            (3 arquivos)
├── docs/
│   ├── 00-10 (redesign visual, não tocar)
│   ├── HANDOFF.md
│   ├── KNOWN-ISSUES.md
│   ├── RELATORIO-PROJETO-CRM-LEANDRO.md   ← v1.2, FONTE DE VERDADE
│   └── CONTINUIDADE-CLAUDE-CLI.md         ← ESTE ARQUIVO
├── public/imagens/
│   └── logo-preta.png         ← logo real do Leandro
└── src/
    ├── main.tsx               ← RouterProvider
    ├── App.tsx                ← ~900 linhas, 6 views internas, usa mockData
    ├── mockData.ts            ← ← SERÁ DELETADO NO 3.5
    ├── types.ts
    ├── routeTree.gen.ts       ← AUTO-GERADO, commitado
    ├── index.css              ← importa todos os styles
    ├── contexts/
    │   └── AuthContext.tsx
    ├── hooks/
    │   └── useCurrentProfile.ts
    ├── lib/
    │   ├── supabase.ts
    │   ├── queryClient.ts     ← NOVO 3.1
    │   ├── queryKeys.ts       ← NOVO 3.1
    │   └── supabase-helpers.ts ← NOVO 3.1
    ├── pages/
    │   ├── LoginPage.tsx
    │   └── ForgotPasswordPage.tsx
    ├── routes/
    │   ├── __root.tsx          ← com QueryClientProvider
    │   ├── login.tsx
    │   ├── forgot-password.tsx
    │   ├── _authenticated.tsx
    │   └── _authenticated/
    │       └── index.tsx
    ├── styles/
    │   ├── tokens.css          ← NÃO TOCAR (design system)
    │   ├── topbar.css
    │   ├── dashboard.css
    │   ├── leads.css
    │   ├── importar.css
    │   ├── funil.css
    │   ├── empreendimentos.css
    │   ├── agenda.css
    │   └── auth.css
    └── types/
        └── database.ts         ← AUTO-GERADO do Supabase, commitado
```

### 5.2 Design system (tokens principais)

Em `src/styles/tokens.css`. Principais variáveis CSS já prontas:

```css
/* Cores principais */
--teal-500: #D4A017;     /* dourado principal */
--teal-700: #B8860B;     /* dourado hover */
--slate-900: #1A1A1A;    /* escuro */

/* Glassmorphism */
--glass-bg: rgba(255, 255, 255, 0.65);
--glass-border: rgba(255, 255, 255, 0.4);
--glass-blur: blur(12px);
--glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);

/* Tipografia */
--font-display: 'Sora', sans-serif;     /* títulos */
--font-sans: 'Outfit', sans-serif;      /* corpo */

/* Status de lead */
--status-novo, --status-contato, --status-visita, --status-proposta, --status-perdido
```

Dark mode via `[data-theme="dark"]` no `<html>`.

### 5.3 Dívidas técnicas abertas

Registradas em `docs/KNOWN-ISSUES.md`:

**KI-001 — Warning do Recharts ao desmontar gráficos**
- Severidade: cosmética (só aparece no console do dev)
- Causa: `<ResponsiveContainer>` tem width=0 durante transição de desmontagem
- **Resolver no Sub-bloco 3.5** durante refatoração do Dashboard
- Solução: `key={activeTab}` nos gráficos + condicionais de loading/empty

### 5.4 Limpezas pendentes pro Sub-bloco 3.5

Vão ser feitas no fim da Etapa 3 (não agora):
- Deletar `src/mockData.ts`
- Remover `@google/genai` do `package.json` (legado do AI Studio)
- Remover `express` e `ffmpeg-static` (provavelmente não usados)
- Remover `@tanstack/router-vite-plugin` (instalado mas duplicado com `router-plugin`)

---

## 6. Regras de trabalho (importante)

O desenvolvedor tem preferências específicas sobre como o agente deve atuar. Estas regras foram estabelecidas durante as Etapas 1, 2 e 3.1.

### 6.1 Cadência
- **Quebrar trabalhos grandes em sub-blocos** (ex: Etapa 3 = 5 sub-blocos)
- **Cada sub-bloco é validado isoladamente** antes de seguir
- **Aguardar resposta antes de continuar** — não "deduzir e seguir". O desenvolvedor reclamou explicitamente de avanço sem confirmação em ciclos anteriores.
- **Um commit por sub-bloco**

### 6.2 Gestão de conhecimento
- **Atualizar `docs/RELATORIO-PROJETO-CRM-LEANDRO.md` ao final de cada sub-bloco/etapa**, ANTES de dar os comandos de commit
- O relatório é a **fonte de verdade do projeto** — vai versionado no git e precisa permanecer sempre atualizado
- Atualmente está na versão **1.2** (pós Sub-bloco 3.1)
- Registrar dívidas técnicas em `docs/KNOWN-ISSUES.md` com padrão `KI-NNN`

### 6.3 Segurança e credenciais
- **NUNCA** expor a `service_role` key do Supabase no frontend
- **NUNCA** comitar `.env.local` (já está no `.gitignore`)
- A `anon key` é segura por design (RLS protege)
- Ao tocar em code que vai pro git, passar pelo filtro mental "isso vazaria algo?"

### 6.4 Git
- Branch ativa: `feat/backend-fase-a`
- **Não mergear na main** até fechar toda a Fase A (ou antes, se o desenvolvedor decidir marcar checkpoint)
- Commits em **português**, formato convencional: `feat(escopo): descrição em minúsculas`
- Desenvolvedor roda os comandos git manualmente — você **passa os comandos**, não executa

### 6.5 Ambiente
- Máquina: **Windows + PowerShell**
- Cuidado com encoding: `Out-File -Encoding utf8` do PowerShell adiciona **BOM** (que quebra alguns parsers como o Supabase CLI)
- Redirecionamento `>` do PowerShell usa **UTF-16** por padrão (quebra TypeScript)
- Sempre preferir criar/editar arquivos via **filesystem tools** em vez de heredocs/redirects
- O desenvolvedor usa **VS Code** e **Antigravity** como IDE

### 6.6 Decisões de produto já tomadas (não mudar sem discussão)

**Sobre a Dorinda (agente IA):**
- Nome: **Dorinda** (a do CRM_FVC é "Mariana", projetos isolados)
- Atua 80% sozinha, handoff humano quando necessário
- **Coleta nome completo NO FINAL** da conversa (decisão baseada em análise de concorrente real — converte mais)
- Fase A: só chat widget do site (WhatsApp manual via `wa.me/`)
- Fase C: WhatsApp Business API

**Sobre imóveis:**
- Tabela única `properties` com discriminador `purpose`
- Lançamentos = venda + empreendimento/construtora preenchidos
- Campo `ref_code` mantido como apelido humano (ex: `ALG-SP-001`) mas PK é UUID
- "Total mensal" é digitado, não calculado (permite ajustes manuais)
- "Andar" é texto livre ("2º", "Sobreposta", "Térreo")

**Sobre WhatsApp na Fase A:**
- `wa.me/` simples, Leandro responde manualmente
- Botão "+ Novo Lead" manual no CRM pra cadastros retroativos

---

## 7. 🎯 Próximo passo: Sub-bloco 3.2 — Configurações do Workspace

Este é o **ponto exato de retomada**. Tudo do 3.1 está pronto, validado e commitado. Você deve começar o 3.2 do zero.

### 7.1 Objetivo do Sub-bloco 3.2

Criar a tela onde o Leandro personaliza o workspace dele:
- Nome da imobiliária/corretor
- CRECI
- Telefone
- Cor primária
- Upload de logo

E resolver uma dívida pendente da Etapa 2: o nome genérico do workspace foi criado pelo trigger `handle_new_user` automaticamente e precisa ser editável.

**Por que essa tela vem antes das migrações de leads/imóveis (3.3 e 3.4)?**
1. Resolve o problema do nome genérico
2. É a **primeira tela que usa React Query "de verdade"** → serve de **referência** pras próximas
3. É pequena e auto-contida (só edita 1 tabela: `workspaces`)
4. Já implementa upload de imagem (logo → bucket `logos`), que será reusado pras fotos dos imóveis
5. Permite o Leandro personalizar logo no primeiro login

### 7.2 Arquivos a criar (6 novos)

```
src/hooks/useWorkspace.ts                    ← query + mutations (useQuery + useMutation)
src/lib/schemas/workspace-schema.ts          ← schema Zod (atenção: Zod 4 syntax)
src/routes/_authenticated/configuracoes.tsx  ← rota protegida /configuracoes
src/pages/WorkspaceSettingsPage.tsx          ← componente principal da tela
src/components/ui/ColorPicker.tsx            ← color picker (decisão pendente)
src/components/ui/LogoUploader.tsx           ← upload com preview
src/styles/workspace-settings.css            ← estilos dedicados
```

Nota: criar a pasta `src/lib/schemas/` não existe ainda.

### 7.3 Arquivos a modificar (2)

- `src/App.tsx` — adicionar botão de engrenagem (ícone `Settings` do lucide, já importado) na topbar, que leva a `/configuracoes` via `useNavigate`
- `src/index.css` — adicionar `@import "./styles/workspace-settings.css"` na lista

### 7.4 Decisões pendentes (o desenvolvedor NÃO respondeu ainda)

Essas 3 perguntas foram feitas no fim da conversa anterior mas o desenvolvedor dispensou sem responder (escolheu migrar para o Antigravity antes de decidir). **Você precisa perguntá-las novamente antes de escrever código.**

**Pergunta 1: Color picker**
Opções:
- (a) Nativo do browser (`<input type="color">`) — zero dependências, visual inconsistente entre OS
- (b) Custom com 3 presets do design system + input hex manual — design system first, mais código
- (c) Instalar `react-colorful` — ~3kb, interface tipo photoshop, leve

**Pergunta 2: Logo na topbar do CRM**
Após o usuário fazer upload da logo nas Configurações, ela deve:
- (a) Substituir a logo preta atual na topbar
- (b) Ficar só pro catálogo público (Etapa 6) — topbar continua com `logo-preta.png`
- (c) Aparecer se existir, com fallback pra `logo-preta.png`

**Nota importante:** se escolher (a) ou (c), o escopo cresce: vai precisar mexer no `App.tsx` pra usar `useWorkspace()` e ler `workspace.logo_url`.

**Pergunta 3: Primeiro login**
Quando o usuário loga pela primeira vez e o nome do workspace ainda é o genérico do trigger, deve:
- (a) Redirecionar automaticamente pra `/configuracoes` pra forçar personalização
- (b) Só deixar acessível pelo menu (sem redirect)
- (c) Mostrar um toast/banner sutil no Dashboard ("Complete seu perfil") com link

### 7.5 Schema Zod a criar (exemplo — atenção Zod 4)

```typescript
// src/lib/schemas/workspace-schema.ts
import { z } from 'zod';

export const workspaceUpdateSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo'),
  creci: z.string().max(20).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida (formato: #RRGGBB)'),
});

export type WorkspaceUpdateInput = z.infer<typeof workspaceUpdateSchema>;
```

⚠️ Cuidado: sintaxe acima é Zod 4-compatível. Se algum exemplo de blog usar `.email()` ou `.url()` direto em `z.string()`, ajuste pra `z.email()` / `z.url()`.

### 7.6 Estrutura esperada do hook `useWorkspace`

```typescript
// src/hooks/useWorkspace.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { queryKeys } from '@/src/lib/queryKeys';
import { getCurrentWorkspaceId, assertNoError, uploadFile, deleteFile, generateUniqueFilename } from '@/src/lib/supabase-helpers';
import type { Database } from '@/src/types/database';
import type { WorkspaceUpdateInput } from '@/src/lib/schemas/workspace-schema';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

// 1. Query: buscar o workspace atual
export function useCurrentWorkspace() {
  return useQuery({
    queryKey: queryKeys.workspace.current(),
    queryFn: async (): Promise<Workspace> => {
      const workspaceId = await getCurrentWorkspaceId();
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();
      assertNoError(error);
      return data!;
    },
  });
}

// 2. Mutation: atualizar dados
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: WorkspaceUpdateInput) => {
      const workspaceId = await getCurrentWorkspaceId();
      const { data, error } = await supabase
        .from('workspaces')
        .update({
          name: input.name,
          creci: input.creci || null,
          phone: input.phone || null,
          primary_color: input.primary_color,
        })
        .eq('id', workspaceId)
        .select()
        .single();
      assertNoError(error);
      return data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.all });
    },
  });
}

// 3. Mutation: upload de logo
export function useUploadWorkspaceLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const workspaceId = await getCurrentWorkspaceId();
      const filename = generateUniqueFilename(file.name);
      const path = `${workspaceId}/${filename}`;

      // Upload
      const { publicUrl, storagePath } = await uploadFile('logos', path, file, { upsert: true });

      // Atualiza o workspace com a URL
      const { data, error } = await supabase
        .from('workspaces')
        .update({ logo_url: publicUrl })
        .eq('id', workspaceId)
        .select()
        .single();
      assertNoError(error);
      return data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.all });
    },
  });
}
```

Isso é um ponto de partida — ajuste conforme necessário (tratamento de erro, loading states, etc).

### 7.7 Critérios de validação do 3.2

Antes de marcar como concluído:

- ✅ `npm run dev` roda sem erros de TypeScript
- ✅ Tela `/configuracoes` aparece quando autenticado
- ✅ Ícone de engrenagem na topbar leva pra lá
- ✅ Formulário carrega com valores atuais do workspace
- ✅ Ao editar e salvar, valores persistem (reload mantém)
- ✅ Upload de logo funciona e aparece a preview
- ✅ Validação Zod rejeita input inválido (ex: cor mal formatada)
- ✅ Estados de loading/saving/success/error visíveis
- ✅ Zero regressão nas outras telas (Dashboard, Leads etc continuam iguais)

### 7.8 Commit alvo

```
feat(workspace): tela de configuracoes com upload de logo

- Cria hook useWorkspace (query + mutations update e upload)
- Cria schema Zod para validacao do formulario
- Cria rota /configuracoes (protegida)
- Cria WorkspaceSettingsPage com glassmorphism
- Adiciona botao Settings na topbar
- Atualiza RELATORIO-PROJETO-CRM-LEANDRO.md para v1.3
```

### 7.9 Depois do commit do 3.2

- **Atualizar `docs/RELATORIO-PROJETO-CRM-LEANDRO.md` para v1.3** (marcar 3.2 concluído, listar arquivos)
- Incluir o relatório atualizado no mesmo commit
- Preparar o desenvolvedor pro Sub-bloco 3.3 (Imóveis/Empreendimentos)

---

## 8. Contexto adicional importante

### 8.1 Arquivo `App.tsx` atual

O `src/App.tsx` é um componente **monolítico de ~900 linhas** que contém todas as 6 views internas (Dashboard, Leads, Importar, Funil, Empreendimentos, Agenda) como funções no mesmo arquivo. Usa `useState('activeTab')` pra controlar qual view mostrar — navegação interna, não via router.

**Não refatore isso agora.** O plano é manter o `App.tsx` monolítico durante a Etapa 3 e só quebrar em arquivos separados se/quando necessário. Cada sub-bloco 3.3/3.4/3.5 vai trocar o `mockData` por hooks reais **dentro** de cada view, sem extrair pra arquivo.

A topbar dele já usa o hook `useCurrentProfile` e tem o botão Sair. O botão de engrenagem (Settings) vai ficar ao lado, usando `useNavigate({ to: '/configuracoes' })`.

### 8.2 Credenciais Supabase (anon key é seguro por design)

No `.env.local` (não commitado):
```
VITE_SUPABASE_URL=https://ompbnsrtnpgwiufanljp.supabase.co
VITE_SUPABASE_ANON_KEY=<eyJ... formato legado>
```

A anon key usa formato legado (eyJ...) por compatibilidade com o n8n. **Não converter para o novo formato.**

### 8.3 Usuário de teste

Já existe um usuário criado manualmente no painel Supabase durante a Etapa 2. Trigger `handle_new_user` criou workspace + profile automaticamente. Login funciona. Leandro ainda não tem acesso próprio.

### 8.4 Limitações conhecidas

- Recharts warning (KI-001) — cosmético, resolver no 3.5
- Tela de Importar Leads ainda vai com mockData — será decidido no 3.5 se implementa ou vira placeholder
- Template de email "Reset Password" no Supabase ainda não foi configurado (tela de forgot-password existe mas email não sai)

---

## 9. Checklist mental antes de escrever a primeira linha de código

Antes de começar o 3.2, confirme mentalmente:

- [ ] Li o arquivo inteiro
- [ ] Abri `docs/RELATORIO-PROJETO-CRM-LEANDRO.md` e li as seções da Etapa 3
- [ ] Verifiquei que `git status` está limpo (sem mudanças pendentes)
- [ ] Verifiquei que estou na branch `feat/backend-fase-a`
- [ ] Confirmei que `npm run dev` está rodando e o CRM abre
- [ ] Confirmei que consigo logar com o usuário de teste
- [ ] **Perguntei ao desenvolvedor** as 3 decisões pendentes da seção 7.4
- [ ] Tenho as respostas das 3 decisões antes de criar qualquer arquivo
- [ ] Planejei a ordem dos arquivos (sugestão: schema → hook → componentes UI → página → rota → App.tsx → CSS → index.css)

---

## 10. Referências e documentação

### Documentos do projeto (fonte de verdade interna)
- **Checkpoint estratégico completo:** `docs/CONTINUIDADE-PROJETO-LEANDRO.md` — schema SQL, Dorinda, workflows n8n, análise de concorrente, planilha, cenário de integração. **Fonte primária pra tudo relacionado a negócio e decisões de produto.**
- **Relatório incremental (técnico):** `docs/RELATORIO-PROJETO-CRM-LEANDRO.md` (v1.2) — histórico do que foi codado em cada etapa/sub-bloco
- **Plano de execução da Etapa 4 (Dorinda):** `docs/PLANO-DORINDA-ETAPA-4.md` — guia completo pra implementar o backend da Dorinda no n8n, com 5 sub-blocos planejados, análise das adaptações do prompt original, definição das tools, sistema de handoff humano e critérios de validação
- **Prompt da Dorinda (pronto pra uso):** `docs/PROMPT-DORINDA.md` — prompt completo adaptado, pronto pra colar no AI Agent do n8n. Inclui checklist de testes obrigatórios
- **Issues conhecidas:** `docs/KNOWN-ISSUES.md`
- **Redesign original:** `docs/00-*.md` até `10-*.md` (cuidado: estado visual do redesign anterior, não contém nada sobre backend)

### Documentação externa
- **TanStack Query v5:** https://tanstack.com/query/latest/docs/framework/react/overview
- **React Hook Form:** https://react-hook-form.com/
- **Zod 4 docs:** https://zod.dev/v4 (ATENÇÃO: não usar exemplos do Zod 3)
- **Supabase JS client:** https://supabase.com/docs/reference/javascript/introduction
- **dnd-kit:** https://docs.dndkit.com/

---

## 📌 Resumo em uma frase

**Você está pegando um CRM imobiliário do zero até estar funcional, exatamente no ponto em que a infraestrutura (banco + auth + React Query) está pronta e falta começar a trocar dados mockados por queries reais, começando pela tela de Configurações do Workspace, aguardando 3 decisões de UX do desenvolvedor antes de escrever código.**

---

**Boa sorte. Aja com cuidado, uma decisão por vez, validando com o desenvolvedor entre cada sub-bloco. Ele valoriza mais consistência e transparência do que velocidade.**

— Claude (Claude.ai Desktop, 14/abr/2026)
