# 🔧 Plano de Correções Finais — CRM Leandro Alonso

> Execute os 4 blocos **em ordem**, validando cada um antes de passar pro próximo.
> Faça commit ao final de cada bloco.

---

## 📌 Regras gerais (válidas pra todos os blocos)

- **Stack:** React + Shadcn + Tailwind + Recharts (não trocar)
- **Referência visual:** `previews/preview.html` continua sendo a base de layout (densidade, espaçamentos, hierarquia) — só as cores mudam
- **Validação obrigatória:** após cada bloco, rode `npm run dev` e confira visualmente
- **Commits:** um commit por bloco, com mensagem descritiva

---

## 🎨 BLOCO 1 — Nova paleta (Cinza + Dourado)

### Contexto
O cliente solicitou mudança de paleta de teal → cinza com dourado como cor de destaque. Toda a estrutura de tokens já existe em CSS variables, então a mudança é centralizada.

### O que fazer

**1.1.** Abra o arquivo `src/styles/tokens.css` (ou onde quer que estejam os CSS variables do design system).

**1.2.** Substitua **TODOS** os valores das variáveis pelos novos abaixo. Mantenha os **nomes** das variáveis iguais (não renomeie `--teal-900` pra `--gold-900` agora — só troque o **valor**), porque assim você não precisa mexer em nenhum componente. O Tailwind/Shadcn vão pegar a cor nova automaticamente.

```css
:root, [data-theme="light"] {
  /* Neutros (substituem o ink/cinzas antigos) */
  --ink: #1F1F1F;

  /* Cor de destaque — antigos "teal" agora viram dourados */
  --teal-900: #8B6914;   /* dourado mais escuro    */
  --teal-700: #B8860B;   /* dourado escuro         */
  --teal-500: #D4A017;   /* DOURADO PRINCIPAL      */
  --cyan-300: #E8C547;   /* dourado claro / glow   */

  /* Status semânticos (escala harmônica dourada) */
  --status-novo:     #D4A017;
  --status-contato:  #E8C547;
  --status-visita:   #B8860B;
  --status-proposta: #8B6914;
  --status-perdido:  #6F6F6F;

  /* Backgrounds e superfícies */
  --bg-base: #F5F5F5;
  --surface: rgba(255, 255, 255, 0.65);
  --surface-strong: rgba(255, 255, 255, 0.85);
  --border: rgba(60, 60, 60, 0.10);
  --border-strong: rgba(212, 160, 23, 0.25);

  /* Textos */
  --text-primary: #1F1F1F;
  --text-secondary: #5E5E5E;
  --text-muted: #808080;

  /* Gradientes radiais do background — agora dourados sutis */
  --grad-radial-1: rgba(212, 160, 23, 0.10);
  --grad-radial-2: rgba(60, 60, 60, 0.05);
}

[data-theme="dark"] {
  --bg-base: #1A1A1A;
  --surface: rgba(45, 45, 45, 0.55);
  --surface-strong: rgba(45, 45, 45, 0.75);
  --border: rgba(212, 160, 23, 0.12);
  --border-strong: rgba(212, 160, 23, 0.30);
  --text-primary: #F5F5F5;
  --text-secondary: #B0B0B0;
  --text-muted: #808080;
  --grad-radial-1: rgba(212, 160, 23, 0.15);
  --grad-radial-2: rgba(60, 60, 60, 0.08);
}
```

**1.3.** Procure em todo o projeto por **valores hex hardcoded** que ainda referenciam o teal antigo:
- `#005F6B`, `#008C9E`, `#00B4CC`, `#00DFFC`
- `rgba(0, 95, 107, ...)`, `rgba(0, 180, 204, ...)`, `rgba(0, 223, 252, ...)`

Substitua **todos** pelos equivalentes dourados:
- `#005F6B` → `#8B6914`
- `#008C9E` → `#B8860B`
- `#00B4CC` → `#D4A017`
- `#00DFFC` → `#E8C547`
- `rgba(0, 95, 107, X)` → `rgba(139, 105, 20, X)`
- `rgba(0, 180, 204, X)` → `rgba(212, 160, 23, X)`
- `rgba(0, 223, 252, X)` → `rgba(232, 197, 71, X)`

**1.4.** Nos gráficos do **Dashboard** (Recharts):
- **Gráfico de barras:** o `linearGradient` deve ir de `#E8C547` (topo) → `#B8860B` (base)
- **Donut "Origem dos Leads":** as 6 fatias precisam de cores distintas. Use:
  ```js
  ['#D4A017', '#E8C547', '#1F1F1F', '#B8860B', '#808080', '#8B6914']
  ```
- Os `drop-shadow` dos gráficos: troque `rgba(0, 180, 204, ...)` por `rgba(212, 160, 23, ...)`

**1.5.** **Botão WhatsApp** — o verde do WhatsApp **NÃO MUDA**. Continue usando `#25D366`. É a cor oficial do WhatsApp e deve permanecer.

### Validação do Bloco 1
Após implementar:
- [ ] Toda interface está cinza com dourado, sem nenhum vestígio de teal/ciano
- [ ] Botão "Novo Lead" agora é dourado
- [ ] Estado ativo do menu (item da topbar) está dourado
- [ ] Bordas laterais dos cards de leads usam tons de dourado/cinza
- [ ] Gráfico de barras tem gradient dourado
- [ ] Donut tem 6 fatias visualmente distintas
- [ ] Dark mode funciona e mantém legibilidade
- [ ] Logo preta no claro continua bem visível
- [ ] Botão WhatsApp continua verde

**Commit:** `feat: nova paleta cinza + dourado`

---

## 🖼️ BLOCO 2 — Logo real do cliente

### Contexto
Hoje a topbar usa um placeholder "LA" com texto "LEANDRO ALONSO" lado a lado. O cliente tem o arquivo da logo real (`Logo_Preta.png`) e quer usar a imagem oficial.

### O que fazer

**2.1. Copiar o arquivo pra dentro do projeto:**
O arquivo está em `C:\Users\User\Documents\Leandro_CRM\Imagens\Logo_Preta.png` (fora do projeto).

Crie a pasta `public/imagens/` no projeto e copie o arquivo pra lá:
```
public/
└── imagens/
    └── logo-preta.png
```

> ⚠ Use a pasta `public/` (não `src/assets/`) porque assim a referência fica simples: `/imagens/logo-preta.png`. O Vite serve essa pasta direto.

**2.2. Substituir o placeholder na topbar:**
Encontre o componente da topbar (provavelmente `src/components/Topbar.tsx` ou similar). Hoje tem algo assim:

```tsx
<div className="logo-wrapper">
  <div className="logo-mark">LA</div>
  <div>
    <div className="logo-sub">creci 300771-F</div>
    <div className="logo-text">LEANDRO ALONSO</div>
  </div>
</div>
```

Substitua por:

```tsx
<div className="logo-wrapper">
  <img
    src="/imagens/logo-preta.png"
    alt="Leandro Alonso — Corretor de Imóveis"
    className="logo-img"
  />
</div>
```

**2.3. CSS da logo:**
Adicione no CSS global:

```css
.logo-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.logo-wrapper::before {
  content: '';
  position: absolute;
  inset: -30% -20%;
  background: radial-gradient(
    ellipse at center,
    rgba(212, 160, 23, 0.25),
    transparent 70%
  );
  filter: blur(20px);
  z-index: -1;
}

.logo-img {
  height: 44px;
  width: auto;
  object-fit: contain;
  transition: filter 0.4s ease;
}

/* Dark mode: inverte a logo preta pra branca */
[data-theme="dark"] .logo-img {
  filter: invert(1) brightness(1.1);
}
```

**2.4. Remover o CSS do placeholder antigo:**
Procure e remova as classes antigas que não são mais usadas:
- `.logo-mark`
- `.logo-text`
- `.logo-sub`

### Validação do Bloco 2
- [ ] Logo real aparece na topbar em todas as 6 telas
- [ ] No modo claro: logo preta visível
- [ ] No modo escuro: logo aparece branca (filter invert)
- [ ] Logo tem o halo dourado sutil atrás
- [ ] Logo tem altura proporcional (não esticada)
- [ ] Não restou nenhum "LA" placeholder

**Commit:** `feat: logo real do cliente na topbar`

---

## 📐 BLOCO 3 — Compactar tela de Leads

### Contexto
A tela de Leads ficou com sensação de "zoom" — cards muito grandes, paddings excessivos, tipografia inflada. A densidade está muito menor que no preview.

### O que fazer

**3.1. Reduzir o padding interno do `lead-card`:**
Procure o componente que renderiza cada card de lead. Hoje provavelmente tem `p-6` ou `p-8`. Mude para `p-5` (20px) com padding-left maior pra acomodar a borda colorida: `pl-6`.

```tsx
<div className="lead-card glass p-5 pl-6">
```

**3.2. Reduzir tamanho dos textos:**
| Elemento | Atual (provável) | Correto |
|---|---|---|
| Nome do lead | `text-xl` (20px) | `text-base` (15-16px) |
| Badge de status | `text-sm` (14px) | `text-[10px]` |
| Linhas de info (telefone, email) | `text-base` (16px) | `text-xs` (12px) |
| Nota/observação | `text-sm` | `text-[11px]` |
| Botão WhatsApp | `text-sm py-3` | `text-xs py-2` |

**3.3. Reduzir gaps entre elementos:**
- Entre nome e badge: `gap-1`
- Entre cabeçalho e info: `mt-2`
- Entre linhas de info: `gap-1`
- Entre info e botão WhatsApp: `mt-3`

**3.4. Compactar o badge de status:**
```tsx
<span className="badge inline-flex items-center gap-1.5 px-2.5 py-1
                 rounded-full text-[10px] font-bold uppercase
                 tracking-wider">
  Em Contato
</span>
```

O ponto colorido (`::before`) deve ter `w-1.5 h-1.5` (6px), não mais que isso.

**3.5. Compactar o botão WhatsApp:**
```tsx
<button className="btn-whatsapp w-full flex items-center justify-center
                   gap-2 py-2 px-4 rounded-full text-xs font-semibold">
  💬 WhatsApp
</button>
```

Altura final do botão: ~32px (não mais que isso).

**3.6. Grid de leads:**
Mantenha 3 colunas em desktop, mas reduza o gap:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
```
(`gap-5` = 20px, não `gap-8` que dá 32px)

**3.7. Linhas de informação:**
Cada linha (Interesse, Faixa, Região, Último contato) deve ter:
- Label em `text-muted` com largura fixa: `w-[70px]`
- Valor em `text-primary` com `font-semibold`
- Tudo em `text-xs`

```tsx
<div className="flex gap-1.5 text-xs text-secondary">
  <span className="w-[70px] text-muted">Interesse:</span>
  <strong className="text-primary font-semibold">Apartamento 2 dorms</strong>
</div>
```

### Validação do Bloco 3
- [ ] Cabem 6 cards confortavelmente em uma viewport de 1366px
- [ ] Cada card cabe inteiro (com botão WhatsApp) em ~380px de altura
- [ ] Nome do lead não está gigante
- [ ] Badge é compacto (não ocupa metade da largura)
- [ ] Botão WhatsApp não está enorme
- [ ] Densidade visual bate com `previews/preview.html` (compare lado a lado)

**Commit:** `fix: compactar tela de leads`

---

## 📅 BLOCO 4 — Header da Agenda

### Contexto
Na tela de Agenda, o título "Agenda", subtítulo "abril de 2026" e o botão "+ Novo Evento" estão amontoados verticalmente no canto superior esquerdo. Além disso, sumiram os botões "Anterior / Hoje / Próximo" que existiam no layout original.

### O que fazer

**4.1. Restaurar o `page-header` como flex row:**
Encontre o componente da tela de Agenda (provavelmente `src/pages/Agenda.tsx` ou similar). O header deve seguir o mesmo padrão das outras páginas:

```tsx
<div className="page-header flex justify-between items-end mb-7">
  {/* Lado esquerdo: título + subtítulo */}
  <div>
    <h1 className="page-title">Agenda</h1>
    <p className="page-subtitle">abril de 2026</p>
  </div>

  {/* Lado direito: navegação + botão novo */}
  <div className="flex items-center gap-2">
    <button className="btn-secondary">Anterior</button>
    <button className="btn-secondary">Hoje</button>
    <button className="btn-secondary">Próximo</button>
    <button className="btn-primary ml-2">
      <PlusIcon className="w-3.5 h-3.5" />
      Novo Evento
    </button>
  </div>
</div>
```

**4.2. Estilo dos botões secundários (Anterior/Hoje/Próximo):**
Crie ou ajuste a classe `.btn-secondary` se ainda não existir:

```css
.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 9px 16px;
  border-radius: 999px;
  background: var(--surface);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-family: inherit;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-secondary:hover {
  border-color: var(--border-strong);
  color: var(--text-primary);
  background: var(--surface-strong);
}
.btn-secondary.active {
  background: linear-gradient(135deg, var(--teal-900), var(--teal-700));
  color: white;
  border-color: transparent;
}
```

> Lembrete: como `--teal-900` e `--teal-700` agora são dourados (do Bloco 1), os botões automaticamente herdam a cor correta.

**4.3. Garantir que NÃO existe nenhum container que esteja forçando `flex-direction: column` no header.** Se existir um wrapper extra ao redor do título, remova-o.

### Validação do Bloco 4
- [ ] Título "Agenda" e subtítulo "abril de 2026" no canto superior esquerdo
- [ ] Botões "Anterior / Hoje / Próximo / + Novo Evento" no canto superior direito
- [ ] Tudo na mesma linha horizontal
- [ ] Botão "+ Novo Evento" tem estilo dourado (primário)
- [ ] Botões de navegação têm estilo glass (secundário)

**Commit:** `fix: header da tela de agenda`

---

## 🎯 Validação final (depois dos 4 blocos)

Antes de fechar:

1. Rode `npm run dev`
2. Navegue pelas 6 telas
3. Alterne claro/escuro em cada uma
4. Confira no mobile (DevTools responsive, 375px de largura)
5. Rode `npx tsc --noEmit` e confirme que não introduziu novos erros TS

Se tudo OK:
```bash
git checkout main
git merge feat/redesign-glass
```

---

## 📝 Notas finais

- **Botões e ações:** todo elemento clicável de destaque agora é dourado. Estado hover deve ter glow dourado em vez de ciano.
- **Status do funil:** as 5 cores ficaram dentro da escala dourada (do mais claro ao mais escuro) + cinza pra "perdido". Isso mantém harmonia mas ainda permite distinguir.
- **WhatsApp:** continua verde (#25D366). É marca registrada.
- **Logo:** sempre via `/imagens/logo-preta.png`. Dark mode usa filter invert.
- **Glassmorphism:** continua funcionando porque os gradientes radiais agora são dourados sutis (não cinza puro).
