# 🌙 09 — Dark Mode

## Estratégia

Usar **atributo `data-theme`** no `<html>` em vez de classe — mais limpo e permite media query como fallback.

```html
<html data-theme="light"> <!-- ou "dark" -->
```

```css
:root,
[data-theme="light"] {
  --bg-base: #F0F4F5;
  --surface: rgba(255,255,255,.55);
  /* ... resto dos tokens claros */
}

[data-theme="dark"] {
  --bg-base: #0A1416;
  --surface: rgba(20,35,38,.45);
  /* ... resto dos tokens escuros */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    /* aplica dark se usuário não escolheu manualmente */
  }
}
```

## JavaScript do toggle

```js
const toggle = document.querySelector('.theme-toggle');
const root = document.documentElement;

// inicialização
const saved = localStorage.getItem('theme');
const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
root.dataset.theme = saved || (prefersDark ? 'dark' : 'light');

toggle.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('theme', next);
});
```

## Ajustes específicos por tela no dark mode

| Tela | Ajuste |
|---|---|
| **Topbar** | Logo precisa de filtro `invert()` ou versão branca alternativa |
| **Dashboard** | Gradient text dos KPIs aumenta saturação (mais ciano) |
| **Gráficos** | Aumentar opacidade das barras pra 0.95, glow mais intenso |
| **Leads** | Borda lateral fica mais luminosa (glow forte) |
| **Importar** | Dropzone fica com borda ciano em vez de teal escuro |
| **Funil** | Backgrounds das colunas mais saturados |
| **Agenda** | Pílulas de evento ganham mais contraste no texto |

## Validação de contraste

Usar ferramentas como Stark, Coolors ou Chrome DevTools (Lighthouse) pra validar:
- Texto normal: 4.5:1 mínimo
- Texto grande: 3:1 mínimo
- UI components: 3:1 mínimo

## Cuidados com glassmorphism no dark

⚠ Vidro escuro pode "sumir" se o background não tiver gradiente suficiente. Por isso os gradientes radiais ficam mais saturados (`0.25` em vez de `0.15`).

⚠ Evitar texto branco puro `#FFFFFF` — usar `#E8F4F6` (com toque ciano) pra reduzir fadiga visual.

## Checklist
- [ ] Tokens duplicados em `[data-theme="dark"]`
- [ ] Toggle JS com persistência
- [ ] Logo com versão dark ou filtro
- [ ] Validar contraste em todas as telas
- [ ] Testar `prefers-color-scheme`
