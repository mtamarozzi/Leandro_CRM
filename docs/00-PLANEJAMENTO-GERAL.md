# 📋 Planejamento Geral — Redesign CRM Leandro Alonso

> **Objetivo:** Reestilizar todas as telas do CRM imobiliário aplicando **glassmorphism** com a paleta atual, criando hierarquia visual, dark mode e identidade própria — sem alterar a estrutura/funcionalidades.

---

## 🎯 Diagnóstico das telas atuais

| Tela | Problemas identificados |
|---|---|
| **Topbar / Logo** | Logo preto sobre fundo branco sem destaque, menu sem separação visual da área de conteúdo, estado "ativo" pouco perceptível |
| **Dashboard** | KPIs planos, ícones quase invisíveis, gráfico de barras monocromático, lista de empreendimentos sem hierarquia |
| **Leads** | Cards muito uniformes, status (badges) pequenos e sem cor semântica, falta diferenciação por estágio |
| **Importar** | Áreas de upload genéricas, sem feedback visual de drag-and-drop, instruções "como usar" perdidas no rodapé |
| **Funil (Kanban)** | Colunas sem identidade visual por etapa, cards rasos, estatísticas finais subutilizadas |
| **Empreendimentos** | Badges "Em Obras / Lançamento / Pronto" sem cor semântica, cards sem profundidade |
| **Agenda** | Eventos do calendário tímidos demais, painel lateral sem hierarquia entre tipos de evento |

---

## 🎨 Direção estética escolhida

- **Estilo:** Glassmorphism (vidro fosco, blur, transparências em camadas)
- **Primária:** `#005F6B` (teal escuro)
- **Acentos:** `#008C9E`, `#00B4CC`, `#00DFFC` (escala teal → ciano)
- **Neutro escuro:** `#343838`
- **Modos:** Claro (padrão) + Escuro (novo)

### Princípios de design

1. **Hierarquia por blur e opacidade** — elementos importantes ficam mais sólidos; secundários, mais transparentes
2. **Profundidade em camadas** — backgrounds com gradientes radiais sutis criam "luz" por trás do vidro
3. **Cor semântica** — cada status do funil tem sua cor da paleta
4. **Microinterações restritas** — hover suave em cards, sem excessos
5. **Tipografia distintiva** — display + body com personalidade (não Inter/Roboto)

---

## 📦 Estrutura de entrega

```
crm-redesign/
├── docs/
│   ├── 00-PLANEJAMENTO-GERAL.md          ← este arquivo
│   ├── 01-DESIGN-SYSTEM.md               ← tokens, cores, tipografia, componentes base
│   ├── 02-TELA-DASHBOARD.md
│   ├── 03-TELA-LEADS.md
│   ├── 04-TELA-IMPORTAR.md
│   ├── 05-TELA-FUNIL.md
│   ├── 06-TELA-EMPREENDIMENTOS.md
│   ├── 07-TELA-AGENDA.md
│   ├── 08-TOPBAR-E-LOGO.md
│   ├── 09-DARK-MODE.md
│   └── 10-GUIA-ANTIGRAVITY.md            ← como aplicar tudo isso no Antigravity
└── previews/
    ├── dashboard.html
    ├── leads.html
    ├── importar.html
    ├── funil.html
    ├── empreendimentos.html
    └── agenda.html
```

---

## 🗺️ Roadmap de execução (etapas)

### **Etapa 1 — Fundação** ⏱ ~30 min
- [ ] Criar arquivo de variáveis CSS (`tokens.css`) com a paleta, modos claro/escuro, sombras, blurs e radii
- [ ] Importar fontes do Google Fonts no `index.html`
- [ ] Aplicar background base com gradiente radial em ambos os modos
- [ ] Criar classe utilitária `.glass` reutilizável

### **Etapa 2 — Topbar & Logo** ⏱ ~20 min
- [ ] Aplicar fundo glass na topbar com blur e borda inferior sutil
- [ ] Adicionar "halo" (glow) atrás da logo para destacá-la
- [ ] Estado ativo do menu: pílula glass com glow ciano
- [ ] Hover dos itens: leve elevação + mudança de cor

### **Etapa 3 — Componentes base** ⏱ ~40 min
- [ ] Card glass (usado em todas as telas)
- [ ] Badge semântico (cores por status)
- [ ] Botões primário / secundário / WhatsApp
- [ ] Inputs e selects glass

### **Etapa 4 — Telas (uma por vez)** ⏱ ~20 min cada
- [ ] Dashboard
- [ ] Leads
- [ ] Importar
- [ ] Funil
- [ ] Empreendimentos
- [ ] Agenda

### **Etapa 5 — Dark mode** ⏱ ~30 min
- [ ] Toggle no canto da topbar (ícone sol/lua)
- [ ] Persistir preferência no `localStorage`
- [ ] Ajustar contraste de textos e bordas
- [ ] Validar legibilidade de gráficos

### **Etapa 6 — Polimento** ⏱ ~20 min
- [ ] Microanimações de entrada (stagger nos cards)
- [ ] Estados focus visíveis (acessibilidade)
- [ ] Teste em diferentes resoluções

---

## 📐 Mapa de dependências entre as etapas

```
Etapa 1 (Fundação)
    │
    ├──> Etapa 2 (Topbar)
    │
    └──> Etapa 3 (Componentes)
              │
              ├──> Etapa 4.1 Dashboard
              ├──> Etapa 4.2 Leads
              ├──> Etapa 4.3 Importar
              ├──> Etapa 4.4 Funil
              ├──> Etapa 4.5 Empreendimentos
              └──> Etapa 4.6 Agenda
                        │
                        └──> Etapa 5 (Dark Mode)
                                  │
                                  └──> Etapa 6 (Polimento)
```

---

## ✅ Critérios de sucesso

- Cada elemento tem um motivo visual claro (não decoração gratuita)
- A logo e o nome da marca ficam imediatamente perceptíveis
- Status de leads identificáveis sem ler o texto (cor = significado)
- Modo escuro com contraste WCAG AA
- Performance: blur e gradientes não comprometem scroll
- O estilo é reconhecível como "do produto", não genérico

---

## 📚 Próximos arquivos

Leia em ordem:
1. `01-DESIGN-SYSTEM.md` — define todos os tokens
2. `08-TOPBAR-E-LOGO.md` — primeira mudança visível
3. Telas (02 a 07) — implementação por tela
4. `09-DARK-MODE.md` — quando o modo claro estiver fechado
5. `10-GUIA-ANTIGRAVITY.md` — como executar no editor
