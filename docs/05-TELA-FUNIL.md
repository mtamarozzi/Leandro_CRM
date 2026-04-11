# 🪜 05 — Tela Funil de Vendas (Kanban)

## Diagnóstico
- Colunas idênticas, sem identidade por etapa
- Cards rasos
- Estatísticas embaixo subutilizadas

## Mudanças

### 1. Colunas com cabeçalho colorido por etapa

```css
.kanban-column {
  min-width: 280px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}
.kanban-column__header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}
.kanban-column__header::before {
  /* fio luminoso superior */
  content: '';
  position: absolute;
  top: 0; left: 1.25rem; right: 1.25rem;
  height: 2px;
  background: var(--col-color);
  box-shadow: 0 0 12px var(--col-color);
  border-radius: 2px;
}

.kanban-column[data-stage="novo"]     { --col-color: var(--status-novo);     }
.kanban-column[data-stage="contato"]  { --col-color: var(--status-contato);  }
.kanban-column[data-stage="visita"]   { --col-color: var(--status-visita);   }
.kanban-column[data-stage="proposta"] { --col-color: var(--status-proposta); }
.kanban-column[data-stage="perdido"]  { --col-color: var(--status-perdido);  }
```

### 2. Contador na coluna como pílula glow
```css
.col-count {
  background: rgba(255,255,255,0.1);
  border: 1px solid var(--col-color);
  color: var(--col-color);
  padding: 0.15rem 0.6rem;
  border-radius: var(--radius-pill);
  font-size: var(--fs-xs);
  font-weight: 600;
  box-shadow: 0 0 8px var(--col-color);
}
```

### 3. Cards do kanban — versão compacta
Mesmo card de leads, mas menor e mais denso. Mantém a borda lateral semântica.

### 4. Estatísticas embaixo viram um "termômetro" horizontal
Em vez de 5 caixinhas iguais, uma barra única segmentada mostrando proporções (1/6 novo, 2/6 contato, etc) com cores semânticas e tooltip ao hover.

```html
<div class="funnel-meter">
  <div class="seg" style="--w: 16.7%; background: var(--status-novo)">
    <span>Novo · 1</span>
  </div>
  <div class="seg" style="--w: 33.3%; background: var(--status-contato)">
    <span>Em Contato · 2</span>
  </div>
  ...
</div>
```

```css
.funnel-meter {
  display: flex;
  height: 56px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border);
}
.seg {
  width: var(--w);
  display: grid; place-items: center;
  color: white;
  font-weight: 600;
  font-size: var(--fs-sm);
  transition: filter .2s;
}
.seg:hover { filter: brightness(1.15); }
```

## Checklist
- [ ] Atributo `data-stage` em cada coluna
- [ ] Fio luminoso colorido no topo
- [ ] Contador glow
- [ ] Termômetro horizontal substituindo as caixinhas
