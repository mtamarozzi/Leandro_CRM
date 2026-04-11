# 🏢 06 — Tela Empreendimentos

## Diagnóstico
- Badges "Em Obras / Lançamento / Pronto / Destaque" sem cor semântica
- Cards sem profundidade
- Botão "Ver Material de Vendas" sem destaque

## Mudanças

### 1. Card com overlay glass sobre a imagem

```css
.empreendimento-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  transition: transform .3s, box-shadow .3s;
}
.empreendimento-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg), 0 0 32px rgba(0, 180, 204, 0.15);
}

.empreendimento-card__image {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}
.empreendimento-card__image img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform .6s;
}
.empreendimento-card:hover img { transform: scale(1.05); }
.empreendimento-card__image::after {
  /* gradiente de baixo pra integrar com o card */
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.4));
}
```

### 2. Badges semânticos sobre a imagem

```css
.tag-stack {
  position: absolute;
  top: 1rem; left: 1rem;
  display: flex; gap: 0.5rem;
}
.tag {
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-pill);
  font-size: var(--fs-xs);
  font-weight: 600;
  backdrop-filter: blur(12px);
  border: 1px solid currentColor;
}
.tag--em-obras    { color: #FFA726; background: rgba(255,167,38,.18);  }
.tag--lancamento  { color: var(--cyan-300); background: rgba(0,223,252,.18); }
.tag--pronto      { color: #10B981; background: rgba(16,185,129,.18);  }
.tag--destaque    {
  color: #FFD54F; background: rgba(255,213,79,.18);
  box-shadow: 0 0 12px rgba(255,213,79,.4);
}
```

### 3. Conteúdo do card — preço com destaque
```css
.empreendimento-card__price {
  font-family: var(--font-display);
  font-weight: 600;
  background: linear-gradient(135deg, var(--teal-500), var(--cyan-300));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: var(--fs-lg);
}
```

### 4. Botão "Ver Material" com seta animada
```css
.btn-material {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem;
  background: rgba(0, 95, 107, 0.08);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  color: var(--teal-900);
  font-weight: 500;
  transition: all .2s;
}
.btn-material:hover {
  background: linear-gradient(135deg, var(--teal-900), var(--teal-700));
  color: white;
  border-color: transparent;
}
.btn-material svg { transition: transform .2s; }
.btn-material:hover svg { transform: translateX(4px); }
```

## Checklist
- [ ] Cards com hover (translate + zoom imagem)
- [ ] Badges semânticos com cores únicas
- [ ] Destaque com glow dourado
- [ ] Preço com gradient text
- [ ] Botão com seta animada
