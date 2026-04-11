# 👥 03 — Tela Leads

## Diagnóstico
- 6 cards visualmente idênticos: difícil identificar o status sem ler
- Badges pequenos e sem cor semântica
- Botão WhatsApp ocupa muito espaço e quebra a estética

## Mudanças

### 1. Card de lead com borda lateral semântica

```css
.lead-card {
  position: relative;
  padding: 1.25rem 1.25rem 1.25rem 1.5rem;
  /* herda .glass */
}
.lead-card::before {
  content: '';
  position: absolute;
  left: 0; top: 16px; bottom: 16px;
  width: 4px;
  border-radius: 4px;
  background: var(--status-color, var(--teal-500));
  box-shadow: 0 0 12px var(--status-color, var(--teal-500));
}
.lead-card[data-status="novo"]     { --status-color: var(--status-novo);     }
.lead-card[data-status="contato"]  { --status-color: var(--status-contato);  }
.lead-card[data-status="visita"]   { --status-color: var(--status-visita);   }
.lead-card[data-status="proposta"] { --status-color: var(--status-proposta); }
.lead-card[data-status="perdido"]  { --status-color: var(--status-perdido);  }
```

A barra lateral vira identificador imediato — você sabe o status pela cor antes de ler.

### 2. Badges (ver Design System §7.2)

### 3. Botão WhatsApp redesenhado
Em vez de barra verde berrante:
```css
.btn-whatsapp {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(37, 211, 102, 0.12);
  color: #25D366;
  border: 1px solid rgba(37, 211, 102, 0.35);
  border-radius: var(--radius-pill);
  font-weight: 500;
  transition: all .2s;
}
.btn-whatsapp:hover {
  background: #25D366;
  color: white;
  box-shadow: 0 0 16px rgba(37, 211, 102, 0.5);
}
```

### 4. Linhas de informação com ícones inline
`📞 11987654321` vira `<svg>` + texto, alinhamento consistente, label cinza + valor primário.

### 5. Card "Perdido" com opacidade reduzida
```css
.lead-card[data-status="perdido"] { opacity: 0.7; }
.lead-card[data-status="perdido"]:hover { opacity: 1; }
```

## Checklist
- [ ] Atributo `data-status` em cada card
- [ ] Borda lateral colorida via `::before`
- [ ] Badges semânticos
- [ ] Botão WhatsApp ghost-style
- [ ] Card perdido com opacidade
