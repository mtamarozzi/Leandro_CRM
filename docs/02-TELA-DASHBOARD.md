# 📊 02 — Tela Dashboard

## Diagnóstico

| Elemento | Problema |
|---|---|
| Cards de KPI | Planos, ícones quase invisíveis, sem hierarquia entre número e label |
| Gráfico de barras | Monocromático teal, perde a chance de usar a escala da paleta |
| Gráfico de origem (donut) | OK, mas pode ganhar glow nas fatias |
| Lista "Empreendimentos Mais Trabalhados" | Texto corrido, sem visual |

---

## Mudanças

### 1. Cards de KPI — versão glass com ícone destacado

```html
<div class="kpi-card glass">
  <div class="kpi-icon"><svg>...</svg></div>
  <div class="kpi-label">Total de Leads</div>
  <div class="kpi-value">6</div>
  <div class="kpi-foot">Todos os tempos</div>
  <div class="kpi-spark">↗ +12%</div>
</div>
```

```css
.kpi-card {
  position: relative;
  padding: 1.5rem;
  overflow: hidden;
}
.kpi-card::after {
  /* glow decorativo no canto */
  content: '';
  position: absolute;
  top: -40%; right: -20%;
  width: 180px; height: 180px;
  background: radial-gradient(circle, rgba(0,223,252,.18), transparent 70%);
  pointer-events: none;
}
.kpi-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--teal-700), var(--teal-500));
  color: white;
  display: grid; place-items: center;
  box-shadow: 0 4px 16px rgba(0, 180, 204, 0.35);
}
.kpi-value {
  font-family: var(--font-display);
  font-size: var(--fs-3xl);
  font-weight: 700;
  background: linear-gradient(135deg, var(--teal-900), var(--teal-500));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  line-height: 1;
  margin: 0.4rem 0;
}
.kpi-label { color: var(--text-secondary); font-size: var(--fs-sm); }
.kpi-foot  { color: var(--text-muted);     font-size: var(--fs-xs); }
```

Cada KPI ganha uma cor de glow ligeiramente diferente:
- Total → `--teal-500`
- Leads do Mês → `--cyan-300`
- Taxa Conversão → `--teal-700`
- Empreendimentos → `--teal-900`

### 2. Gráfico de barras — degradê na vertical

Cada barra recebe um gradiente vertical de `--teal-900` (base) para `--cyan-300` (topo) + sombra interna luminosa:

```css
.bar {
  background: linear-gradient(180deg, var(--cyan-300), var(--teal-700));
  border-radius: 8px 8px 4px 4px;
  box-shadow:
    0 0 12px rgba(0, 180, 204, 0.4),
    inset 0 1px 0 rgba(255,255,255,0.5);
}
```

### 3. Lista de empreendimentos
Vira mini-cards horizontais com borda lateral colorida (acentos da paleta) + número de leads em pílula glass à direita.

---

## Checklist
- [ ] 4 KPIs com classe `.kpi-card`
- [ ] Sparkline ou variação % em cada card
- [ ] Gráfico de barras com gradient
- [ ] Donut com glow nas fatias
- [ ] Lista de empreendimentos como mini-cards
