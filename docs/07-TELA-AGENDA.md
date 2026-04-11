# 📅 07 — Tela Agenda

## Diagnóstico
- Eventos no calendário pequenos demais, sem destaque visual
- Painel lateral "Próximos Eventos" sem hierarquia entre tipos
- Dia atual marcado, mas pouco visível

## Mudanças

### 1. Calendário com células glass

```css
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
}
.cal-cell {
  background: var(--surface);
  backdrop-filter: blur(8px);
  min-height: 92px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: background .2s;
}
.cal-cell:hover { background: rgba(0, 180, 204, 0.08); }
.cal-cell--today {
  background: rgba(0, 180, 204, 0.12);
  box-shadow: inset 0 0 0 2px var(--teal-500);
}
.cal-cell--today .cal-day {
  color: var(--teal-900);
  font-weight: 700;
}
```

### 2. Eventos como pílulas coloridas por tipo

```css
.event-pill {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-left: 3px solid var(--evt-color);
  background: var(--evt-bg);
  color: var(--evt-color);
}
.event-pill[data-type="followup"] { --evt-color: #FFA726; --evt-bg: rgba(255,167,38,.15); }
.event-pill[data-type="visita"]   { --evt-color: var(--cyan-300); --evt-bg: rgba(0,223,252,.15); }
.event-pill[data-type="reuniao"]  { --evt-color: var(--teal-700); --evt-bg: rgba(0,140,158,.15); }
```

### 3. Próximos Eventos — cards com timeline lateral

```css
.upcoming-card {
  position: relative;
  padding: 1rem 1rem 1rem 1.25rem;
  border-radius: var(--radius-md);
  background: var(--surface);
  border: 1px solid var(--border);
  margin-bottom: 0.75rem;
}
.upcoming-card::before {
  content: '';
  position: absolute;
  left: 0; top: 1rem; bottom: 1rem;
  width: 3px;
  background: var(--evt-color);
  border-radius: 3px;
  box-shadow: 0 0 8px var(--evt-color);
}
.upcoming-card__type {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: var(--radius-pill);
  font-size: var(--fs-xs);
  font-weight: 600;
  background: var(--evt-bg);
  color: var(--evt-color);
  margin-bottom: 0.5rem;
}
```

### 4. Botão "Novo Evento" com ícone +
Mesmo padrão dos outros botões primários da topbar.

## Checklist
- [ ] Grid do calendário com células glass
- [ ] Dia atual destacado com glow
- [ ] Eventos como pílulas coloridas por tipo
- [ ] Cards de próximos eventos com timeline lateral
