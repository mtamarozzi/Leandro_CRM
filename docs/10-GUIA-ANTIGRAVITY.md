# 🚀 10 — Guia de Execução no Antigravity

> Como aplicar todo o redesign usando o Antigravity (editor agêntico). Pense neste arquivo como o **briefing que você cola no agente**.

---

## Pré-requisitos

- Projeto do CRM aberto no Antigravity
- Estrutura de pastas identificada (onde estão CSS/HTML/JSX)
- Branch nova: `git checkout -b feat/redesign-glass`

---

## Ordem recomendada de prompts no Antigravity

Cada bloco abaixo é um **prompt independente**. Não cole tudo de uma vez — execute um por vez, valide e siga.

### Prompt 1 — Tokens e fundação

```
Crie um arquivo `src/styles/tokens.css` com as variáveis CSS de design system definidas
no documento docs/01-DESIGN-SYSTEM.md. Inclua os seletores :root e [data-theme="dark"].
Importe esse arquivo no entry point principal do projeto e adicione no <head> a fonte:
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
Aplique no body o background com gradientes radiais conforme o documento.
```

### Prompt 2 — Topbar e logo

```
Refatore o componente da topbar para aplicar:
1. Background glass (backdrop-filter blur 24px) com sticky no topo
2. Halo radial atrás da logo (pseudo-elemento ::before)
3. Estado .active dos itens do menu com borda e box-shadow ciano
4. Botão .theme-toggle (sol/lua SVG) antes do sino de notificações
5. Avatar circular com anel teal
Use exatamente as classes e CSS do arquivo docs/08-TOPBAR-E-LOGO.md.
```

### Prompt 3 — Componentes base

```
Crie os componentes reutilizáveis:
- Card (glass)
- Badge (variantes: novo, contato, visita, proposta, perdido)
- BtnPrimary
- BtnWhatsapp (estilo ghost com hover sólido)
Salve em src/components/ui/. Cada componente deve aceitar children e className.
```

### Prompt 4 — Tela Dashboard

```
Aplique o redesign do Dashboard conforme docs/02-TELA-DASHBOARD.md:
- 4 KPIs com classe .kpi-card, gradient text nos números, glow decorativo no canto
- Cada KPI com cor de glow diferente (teal-500, cyan-300, teal-700, teal-900)
- Barras do gráfico com gradient vertical e box-shadow luminoso
- Lista de empreendimentos como mini-cards com borda lateral colorida
Não altere a lógica de dados, só a apresentação.
```

### Prompt 5 — Tela Leads

```
Aplique o redesign de Leads conforme docs/03-TELA-LEADS.md:
- Adicione data-status em cada lead-card
- Borda lateral colorida via ::before com box-shadow
- Substitua o botão verde de WhatsApp pelo .btn-whatsapp ghost
- Cards com status="perdido" devem ter opacity 0.7 (1 no hover)
```

### Prompt 6 — Tela Importar

```
Redesenhe a tela Importar conforme docs/04-TELA-IMPORTAR.md:
- Dropzone com borda dashed e hover/drag-over animado
- Ícone circular com gradient teal->cyan
- Textarea com font monospace e focus ring ciano
- Substitua a lista "Como usar" por uma timeline numerada com círculos teal
```

### Prompt 7 — Tela Funil

```
Aplique o redesign do Funil conforme docs/05-TELA-FUNIL.md:
- data-stage em cada coluna
- Fio luminoso colorido no topo de cada coluna (::before)
- Contador da coluna como pílula com glow
- Substitua as 5 caixinhas de estatística por um termômetro horizontal segmentado
```

### Prompt 8 — Tela Empreendimentos

```
Redesenhe Empreendimentos conforme docs/06-TELA-EMPREENDIMENTOS.md:
- Cards com hover (translate-y -4px + zoom 1.05 na imagem)
- Tags semânticas posicionadas sobre a imagem com backdrop-filter
- Tag "Destaque" com glow dourado
- Preço com gradient text
- Botão "Ver Material" com seta animada no hover
```

### Prompt 9 — Tela Agenda

```
Aplique o redesign da Agenda conforme docs/07-TELA-AGENDA.md:
- Grid do calendário com células glass
- Dia atual com inset box-shadow teal
- Eventos como pílulas coloridas por tipo (followup, visita, reuniao)
- Cards de "Próximos Eventos" com timeline lateral colorida
```

### Prompt 10 — Dark mode

```
Implemente o dark mode conforme docs/09-DARK-MODE.md:
- Adicione o JS de toggle com persistência em localStorage
- Garanta que todos os componentes herdam dos tokens (não há cores hardcoded)
- Trate a logo (filter invert ou versão alternativa)
- Teste em todas as 6 telas
```

### Prompt 11 — Polimento

```
Adicione:
- Animação .stagger nos containers de cards (fadeInUp com delays)
- :focus-visible com outline ciano em todos os interativos
- @media (prefers-reduced-motion) para desativar animações
- Lighthouse audit para validar contraste e performance
```

---

## Validação após cada etapa

Depois de cada prompt:
1. ✅ Roda o servidor de dev (`npm run dev` ou similar)
2. ✅ Confere visualmente a tela alterada
3. ✅ Testa hover, focus, click
4. ✅ Compara com a amostra HTML em `previews/`
5. ✅ Commit pequeno: `git commit -m "feat: redesign <tela>"`

---

## Dicas pro Antigravity

- **Sempre referencie o arquivo .md correspondente** no prompt — o agente lê melhor com contexto explícito
- **Não peça tudo de uma vez** — uma tela por prompt mantém qualidade
- **Use os arquivos de preview HTML como referência visual** — você pode anexá-los nos prompts pra mostrar o resultado esperado
- **Se algo sair diferente do esperado**, peça ajuste pontual em vez de refazer tudo

---

## Rollback

Se algo der errado:
```bash
git checkout main
git branch -D feat/redesign-glass
```

Como cada prompt vira um commit, é fácil voltar uma etapa específica:
```bash
git revert <hash-do-commit>
```

---

## Quando terminar

- [ ] Merge da branch `feat/redesign-glass` na main
- [ ] Atualizar screenshots no README do projeto
- [ ] Anunciar a mudança pros usuários (changelog)
