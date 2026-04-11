# 🧭 08 — Topbar & Logo

> **Por que começar aqui:** é o elemento mais visível e o que está mais "apagado" hoje. A primeira impressão do produto.

---

## Diagnóstico atual

- Logo preto sobre fundo branco, sem ar nem destaque
- Menu superior se confunde com a área de conteúdo (sem separação)
- Estado ativo é uma pílula clara, mas ainda discreta
- Notificações e avatar perdidos no canto

---

## Proposta

### 1. Topbar com glass + borda inferior luminosa
```css
.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 2rem;
  background: var(--surface);
  backdrop-filter: blur(24px) saturate(160%);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 0 rgba(0, 223, 252, 0.15); /* fio de luz na base */
}
```

### 2. Logo com halo
A logo recebe um glow radial atrás dela (pseudo-elemento) na cor `--cyan-300`, criando destaque sem alterar o arquivo da imagem.

```css
.logo-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.logo-wrapper::before {
  content: '';
  position: absolute;
  inset: -20% -10%;
  background: radial-gradient(ellipse at center,
    rgba(0, 223, 252, 0.25),
    transparent 70%);
  filter: blur(20px);
  z-index: -1;
}
```

### 3. Menu — estado ativo "iluminado"
```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  border-radius: var(--radius-pill);
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-weight: 500;
  transition: all .2s;
}
.nav-item:hover {
  color: var(--text-primary);
  background: rgba(0, 180, 204, 0.08);
}
.nav-item.active {
  color: var(--teal-900);
  background: linear-gradient(135deg,
    rgba(0, 223, 252, 0.18),
    rgba(0, 180, 204, 0.10));
  border: 1px solid rgba(0, 180, 204, 0.35);
  box-shadow:
    0 0 0 1px rgba(0, 223, 252, 0.2) inset,
    0 4px 16px rgba(0, 180, 204, 0.20);
}
```

No **dark mode** o `.active` usa `color: var(--cyan-300)` para destacar.

### 4. Toggle de tema (novo)
Adicionar antes do sino de notificações:

```html
<button class="theme-toggle" aria-label="Alternar tema">
  <svg class="icon-sun">...</svg>
  <svg class="icon-moon">...</svg>
</button>
```

```css
.theme-toggle {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--border);
  backdrop-filter: blur(12px);
  display: grid; place-items: center;
  cursor: pointer;
  transition: transform .3s;
}
.theme-toggle:hover { transform: rotate(20deg); }
```

### 5. Avatar com anel
```css
.avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--teal-700), var(--teal-500));
  color: white;
  display: grid; place-items: center;
  font-weight: 600;
  border: 2px solid var(--bg-base);
  box-shadow: 0 0 0 2px var(--teal-500);
}
```

---

## Checklist de implementação

- [ ] Wrapper `.topbar` com sticky e glass
- [ ] Halo na logo via pseudo-elemento
- [ ] Atualizar classes do menu para `.nav-item` + `.active`
- [ ] Adicionar botão `.theme-toggle` com SVGs sol/lua
- [ ] Avatar com anel teal
- [ ] Testar sticky no scroll (não deve ficar branco)
