# 🔖 Handoff — Redesign Glass (Leandro CRM)

> Documento para retomar o trabalho do **redesign "Glass"** em uma próxima sessão.
> Última atualização: **10/04/2026 — final do dia**.

---

## 🎯 Regra de ouro (nunca esquecer)

1. **`docs/preview.html` é a fonte da verdade visual.** Se qualquer `.md` de tela
   conflitar com o `preview.html`, o `preview.html` vence.
2. **Stack fixa, não trocar:** React 19 + Shadcn (Base UI) + Tailwind v4 + Recharts 3 + Motion.
3. **Quando o Tailwind puro não der conta** (ex.: `::before` com glow,
   `background-clip: text`, `conic-gradient`, stagger), usar **CSS customizado**
   dentro de `src/styles/<tela>.css` e importar em `src/index.css`.
4. **Um commit por ajuste**. Sempre com o rodapé:
   ```
   Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
   ```

---

## 📍 Onde paramos

- **Branch:** `feat/redesign-glass`
- **HEAD:** `6f58e1d chore(types): zera os 32 erros de typecheck pre-existentes`
- **Typecheck:** `npx tsc --noEmit` → **0 erros** ✅
- **Working tree:** limpo (exceto `.claude/settings.local.json` que pode ser
  ignorado ou committado à parte).

### Commits desta sessão (do mais recente para o mais antigo)

| Commit | Escopo |
|---|---|
| `6f58e1d` | **Cleanup TS:** adiciona `@types/react`, corrige `btn-primary`, `status-badge`, `glass-card` |
| `0ef663d` | **Prompt 8** — Tela Empreendimentos (`docs/06-TELA-EMPREENDIMENTOS.md`) |
| `3858f88` | **Fix Prompt 6** — caixas "Formato esperado" do Importar com `border-left` teal |
| `04c2952` | **Fix Prompt 5** — WhatsApp button ghost (substitui verde sólido) |
| `b01e190` | **Fix Prompt 5** — barra lateral 4px por status no card de Lead |
| `ad39798` | **Fix Prompt 5** — grid 1/2/3 cols + stagger animation nos Leads |
| `baa26d3` | **Fix Prompt 4** — Empreendimentos (dashboard) com border-left + `.lead-pill` |
| `71c4db6` | **Fix Prompt 4** — donut 6 cores exatas + glow 16px |
| `b47b8fa` | **Fix Prompt 4** — bar chart gradient #00DFFC→#008C9E + glow 16px |
| `99c1e6f` | **Fix Prompt 4** — KPIs com glows exatos + fonte 38px Sora |

### Telas aplicadas ✅

| # | Tela | Doc | Status |
|---|---|---|---|
| 1 | Planejamento geral | `docs/00-PLANEJAMENTO-GERAL.md` | — |
| 2 | Design System | `docs/01-DESIGN-SYSTEM.md` | ✅ |
| 3 | Dashboard | `docs/02-TELA-DASHBOARD.md` | ✅ (+ fixes Prompt 4) |
| 4 | Leads | `docs/03-TELA-LEADS.md` | ✅ (+ fixes Prompt 5) |
| 5 | Importar | `docs/04-TELA-IMPORTAR.md` | ✅ (+ fixes Prompt 6) |
| 6 | Funil | `docs/05-TELA-FUNIL.md` | ✅ |
| 7 | **Empreendimentos** | `docs/06-TELA-EMPREENDIMENTOS.md` | ✅ **(Prompt 8)** |

### Telas pendentes ⏳

| # | Tela | Doc | Prompt sugerido |
|---|---|---|---|
| 8 | **Agenda** | `docs/07-TELA-AGENDA.md` | **Próximo (Prompt 9)** |
| 9 | Topbar e Logo | `docs/08-TOPBAR-E-LOGO.md` | Prompt 10 |
| 10 | Dark mode | `docs/09-DARK-MODE.md` | Prompt 11 |

---

## 🚀 Prompt para colar amanhã

> Copie e cole o bloco abaixo no Claude Code (ou em outra sessão) para retomar:

```
Estou retomando o redesign "Glass" do Leandro CRM. Leia antes:
- docs/HANDOFF.md (contexto completo da última sessão)
- docs/preview.html (referência visual obrigatória — prioridade máxima)
- docs/07-TELA-AGENDA.md (doc da próxima tela)

Regras fixas:
1. docs/preview.html é a fonte da verdade. Se houver conflito com
   qualquer .md, preview.html vence.
2. Stack NÃO MUDA: React + Shadcn (Base UI) + Tailwind + Recharts +
   Motion. Nada de trocar por outras libs.
3. Quando Tailwind puro não conseguir replicar um efeito (::before
   com glow, background-clip text, conic-gradient, stagger, etc.),
   criar CSS customizado em src/styles/<tela>.css e importar no
   src/index.css.
4. Um commit por ajuste, com rodapé
   "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>".
5. Rodar `npx tsc --noEmit` ao final de cada tela; manter em 0 erros.

Estado atual:
- Branch: feat/redesign-glass
- HEAD: 6f58e1d (typecheck limpo em 0 erros)
- Última tela aplicada: Empreendimentos (Prompt 8, commit 0ef663d)

Tarefa: aplicar docs/07-TELA-AGENDA.md (Prompt 9). Antes de codar,
abra o preview.html e localize a seção da Agenda para identificar:
- Estrutura do calendário (grid de dias, cabeçalho, lateral de eventos)
- Badges/pills dos tipos de evento (Follow-up, Visita, Reunião)
- Cores, glows, border-left, gradient-text
- Animações de hover/stagger

Depois me mostre um plano resumido (bullets) antes de aplicar. Não
mexa em nenhuma outra tela nesta rodada.
```

---

## 🧩 Cheat-sheet do projeto

### Estrutura relevante

```
Leandro_CRM/
├─ src/
│  ├─ App.tsx                 ← TODAS as Views (DashboardView, LeadsView,
│  │                            ImportView, FunnelView, PropertiesView,
│  │                            AgendaView). ~870 linhas, um único arquivo.
│  ├─ index.css               ← @imports dos tokens + cada tela
│  ├─ mockData.ts             ← mockLeads, mockProperties, mockEvents
│  ├─ types.ts                ← Lead, Property, Event, LeadStatus
│  └─ styles/
│     ├─ tokens.css           ← --teal-*, --cyan-300, --border-strong, etc.
│     ├─ topbar.css
│     ├─ dashboard.css
│     ├─ leads.css
│     ├─ importar.css
│     ├─ funil.css
│     └─ empreendimentos.css  ← criado no Prompt 8
├─ components/ui/             ← Shadcn (button, card, dialog, etc.)
│  ├─ glass-card.tsx          ← variant: 'default' | 'lit' (+ `lit` alias)
│  ├─ btn-primary.tsx
│  ├─ btn-whatsapp.tsx        ← ghost pill (refatorado Prompt 7)
│  └─ status-badge.tsx
└─ docs/
   ├─ preview.html            ← REFERÊNCIA VISUAL OBRIGATÓRIA
   ├─ 00..10-*.md             ← docs por tela
   └─ HANDOFF.md              ← este arquivo
```

### Tokens principais (`src/styles/tokens.css`)

```
--teal-500:  #00B4CC   --cyan-300:  #00DFFC
--teal-700:  #008C9E   --teal-900:  #005F6B
--border-strong: rgba(0,95,107,.25)  [light] / rgba(0,223,252,.28) [dark]
--font-display: 'Sora'  --font-sans: 'Outfit'
```

### Status → cor (usado em Leads e Funil)

```
novo     #00B4CC
contato  #00DFFC
visita   #008C9E
proposta #005F6B
perdido  #6B7280
```

### Comandos úteis

```bash
# Rodar dev server
npm run dev          # http://localhost:3000

# Typecheck (deve ficar em 0)
npx tsc --noEmit

# Build de produção
npm run build
```

---

## ⚠️ Armadilhas conhecidas

1. **`@/*` no tsconfig aponta para `./*` (raiz)**, não para `./src/*`. Por isso
   `status-badge.tsx` importa `@/src/types` e não `@/types`. Cuidado ao criar
   arquivos novos em `components/ui/` que precisem de tipos do `src/`.

2. **O Shadcn usado (`@base-ui/react`) NÃO exporta `ButtonProps`.** Use
   `React.ComponentProps<typeof Button>` quando precisar estender.

3. **`docs/` não está no `.gitignore`**, mas antes do Prompt 8 estava sem
   arquivos versionados. Agora está versionado — qualquer mudança nos docs
   vai aparecer em `git status`.

4. **CRLF warnings** são normais no Windows e não bloqueiam commits.

5. **Glass blur**: o `card-glass` e `glass--lit` usam `backdrop-filter: blur()`.
   Em alguns navegadores antigos o fallback é um fundo sólido — ok para o escopo.

---

## 📋 Checklist padrão por tela (use sempre)

Quando for aplicar uma nova tela do doc:

- [ ] Ler `docs/preview.html` na seção correspondente **inteira**
- [ ] Ler o `docs/0N-TELA-XXX.md`
- [ ] Se os dois divergirem, seguir o `preview.html`
- [ ] Criar/atualizar `src/styles/<tela>.css` com as classes exatas do preview
- [ ] Importar o CSS novo em `src/index.css`
- [ ] Refatorar a `<Tela>View` em `src/App.tsx` com markup semântico
- [ ] Rodar `npx tsc --noEmit` (precisa ficar em 0)
- [ ] Testar visualmente no `npm run dev` (se possível)
- [ ] Um commit (ou dois, se houver fix complementar) com rodapé padrão
