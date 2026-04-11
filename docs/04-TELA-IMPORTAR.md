# 📥 04 — Tela Importar Leads

## Diagnóstico
- Áreas de upload genéricas, sem feedback de drag-and-drop
- Textarea sem identidade
- Instruções "Como usar" perdidas no rodapé sem hierarquia

## Mudanças

### 1. Dropzone com borda animada

```css
.dropzone {
  padding: 3rem 2rem;
  border-radius: var(--radius-lg);
  background: var(--surface);
  backdrop-filter: blur(20px);
  border: 2px dashed var(--border-strong);
  text-align: center;
  cursor: pointer;
  transition: all .3s;
  position: relative;
  overflow: hidden;
}
.dropzone::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%,
    rgba(0, 223, 252, 0.1), transparent 60%);
  opacity: 0;
  transition: opacity .3s;
}
.dropzone:hover::before,
.dropzone.drag-over::before { opacity: 1; }
.dropzone.drag-over {
  border-color: var(--cyan-300);
  border-style: solid;
  box-shadow: 0 0 0 4px rgba(0, 223, 252, 0.15);
}
.dropzone-icon {
  width: 64px; height: 64px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--teal-700), var(--cyan-300));
  display: grid; place-items: center;
  color: white;
  box-shadow: 0 8px 24px rgba(0, 180, 204, 0.4);
}
```

### 2. Textarea de cola manual com mock visual
```css
.paste-area {
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--fs-sm);
  min-height: 180px;
  width: 100%;
  resize: vertical;
}
.paste-area:focus {
  outline: none;
  border-color: var(--teal-500);
  box-shadow: 0 0 0 3px rgba(0, 180, 204, 0.15);
}
```

### 3. "Como usar" como timeline numerada
Em vez de lista de texto, vira cards horizontais ou vertical com números grandes em círculos teal.

```html
<ol class="how-to">
  <li class="how-to__step">
    <span class="how-to__num">1</span>
    <div>
      <strong>Formato mínimo</strong>
      <p>Nome e Telefone obrigatórios. Email opcional.</p>
    </div>
  </li>
  ...
</ol>
```

```css
.how-to__num {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--teal-900), var(--teal-500));
  color: white;
  display: grid; place-items: center;
  font-family: var(--font-display);
  font-weight: 600;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 95, 107, 0.3);
}
```

## Checklist
- [ ] Dropzone com hover/drag-over
- [ ] Ícone circular com gradient
- [ ] Textarea estilizada
- [ ] Timeline numerada substituindo lista
