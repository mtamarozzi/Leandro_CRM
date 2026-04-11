# 🎨 01 — Design System

> Tokens, componentes base e utilitários reutilizáveis em todas as telas.

---

## 1. Paleta de cores

### Primárias (da paleta original)
```css
--ink:        #343838;  /* texto e elementos escuros   */
--teal-900:   #005F6B;  /* PRIMÁRIA — botões, ativos   */
--teal-700:   #008C9E;  /* hover, gráficos             */
--teal-500:   #00B4CC;  /* destaques, links            */
--cyan-300:   #00DFFC;  /* highlights, glow            */
```

### Semânticas (status)
```css
--status-novo:           #00B4CC;  /* ciano — fresco         */
--status-contato:        #00DFFC;  /* ciano claro — em ação  */
--status-visita:         #008C9E;  /* teal médio — agendado  */
--status-proposta:       #005F6B;  /* teal escuro — quente   */
--status-perdido:        #6B7280;  /* cinza — neutro frio    */
--status-ganho:          #10B981;  /* verde — só p/ vendas   */
```

### Modo claro
```css
--bg-base:       #F0F4F5;
--bg-gradient-1: #E0F2F5;
--bg-gradient-2: #FFFFFF;
--surface:       rgba(255, 255, 255, 0.55);
--surface-solid: #FFFFFF;
--border:        rgba(0, 95, 107, 0.12);
--border-strong: rgba(0, 95, 107, 0.25);
--text-primary:  #1A2628;
--text-secondary:#5C6B6E;
--text-muted:    #8A9598;
```

### Modo escuro
```css
--bg-base:       #0A1416;
--bg-gradient-1: #0F2024;
--bg-gradient-2: #051013;
--surface:       rgba(20, 35, 38, 0.45);
--surface-solid: #142326;
--border:        rgba(0, 223, 252, 0.12);
--border-strong: rgba(0, 223, 252, 0.28);
--text-primary:  #E8F4F6;
--text-secondary:#9BB0B4;
--text-muted:    #5F7378;
```

---

## 2. Tipografia

```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
```

```css
--font-display: 'Sora', sans-serif;     /* títulos, números KPI */
--font-body:    'Outfit', sans-serif;   /* corpo, labels        */
```

**Por quê:** Sora tem personalidade geométrica que combina com a paleta tech/teal sem ser genérica como Inter. Outfit é leve e moderna no corpo do texto.

### Escala tipográfica
```css
--fs-xs:   0.75rem;   /* 12px - labels, badges      */
--fs-sm:   0.875rem;  /* 14px - texto secundário    */
--fs-base: 1rem;      /* 16px - corpo               */
--fs-lg:   1.125rem;  /* 18px - card titles         */
--fs-xl:   1.5rem;    /* 24px - section headers     */
--fs-2xl:  2rem;      /* 32px - page title          */
--fs-3xl:  2.5rem;    /* 40px - KPI numbers         */
```

---

## 3. Glassmorphism — receita base

```css
.glass {
  background: var(--surface);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.4) inset,    /* highlight superior */
    0 8px 32px rgba(0, 95, 107, 0.08);          /* sombra colorida   */
}

/* Variante "ligada" — usada em cards ativos / em hover */
.glass--lit {
  border-color: var(--border-strong);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.5) inset,
    0 8px 32px rgba(0, 180, 204, 0.18),
    0 0 0 1px rgba(0, 180, 204, 0.15);
}
```

⚠ **Atenção:** glassmorphism só funciona se houver algo **atrás** do vidro. O background da página precisa ter gradiente, pois um fundo branco sólido tornará o efeito invisível.

---

## 4. Background base (com profundidade)

```css
body {
  background:
    radial-gradient(ellipse 80% 60% at 20% 0%,  rgba(0, 180, 204, 0.15), transparent 50%),
    radial-gradient(ellipse 60% 50% at 100% 100%, rgba(0, 95, 107, 0.12), transparent 50%),
    var(--bg-base);
  min-height: 100vh;
}
```

No modo escuro os mesmos gradientes ficam mais saturados (`0.25` em vez de `0.15`) porque há menos competição com o branco.

---

## 5. Raios e espaçamentos

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 18px;
--radius-xl: 24px;
--radius-pill: 999px;

--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.5rem;
--space-6: 2rem;
--space-8: 3rem;
```

---

## 6. Sombras

```css
--shadow-sm:  0 2px 8px rgba(0, 95, 107, 0.06);
--shadow-md:  0 8px 24px rgba(0, 95, 107, 0.10);
--shadow-lg:  0 16px 48px rgba(0, 95, 107, 0.14);
--shadow-glow: 0 0 24px rgba(0, 223, 252, 0.35);
```

---

## 7. Componentes base

### 7.1 Botão primário
```css
.btn-primary {
  background: linear-gradient(135deg, var(--teal-900), var(--teal-700));
  color: #fff;
  padding: 0.7rem 1.4rem;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-weight: 500;
  border: 1px solid rgba(0, 223, 252, 0.3);
  box-shadow: var(--shadow-md), 0 0 0 1px rgba(0,180,204,0.2) inset;
  transition: transform .2s, box-shadow .2s;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}
```

### 7.2 Badge de status
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.7rem;
  border-radius: var(--radius-pill);
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.02em;
}
.badge::before {
  content: '';
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}
.badge--novo     { color: var(--status-novo);     background: rgba(0,180,204,.12); }
.badge--contato  { color: var(--status-contato);  background: rgba(0,223,252,.12); }
.badge--visita   { color: var(--status-visita);   background: rgba(0,140,158,.14); }
.badge--proposta { color: var(--status-proposta); background: rgba(0,95,107,.16);  }
.badge--perdido  { color: var(--status-perdido);  background: rgba(107,114,128,.14);}
```

### 7.3 Card glass
```css
.card {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  /* herda .glass */
  transition: transform .25s ease, box-shadow .25s ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

---

## 8. Microanimações

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0);    }
}
.stagger > * {
  animation: fadeInUp .5s ease both;
}
.stagger > *:nth-child(1) { animation-delay: .05s; }
.stagger > *:nth-child(2) { animation-delay: .10s; }
.stagger > *:nth-child(3) { animation-delay: .15s; }
.stagger > *:nth-child(4) { animation-delay: .20s; }
.stagger > *:nth-child(5) { animation-delay: .25s; }
.stagger > *:nth-child(6) { animation-delay: .30s; }
```

---

## 9. Acessibilidade

- Contraste mínimo 4.5:1 para texto normal (validar dark mode)
- `:focus-visible` com outline ciano de 2px e offset 2px
- `prefers-reduced-motion`: desativar animações de entrada
- Tamanho mínimo de toque: 44×44px nos botões
