# 🐞 Known Issues — CRM Leandro

Arquivo de registro de problemas conhecidos que **não quebram a aplicação** mas precisam ser resolvidos em etapas futuras. Ordenado por prioridade.

---

## 🟡 KI-001 — Recharts warning ao desmontar gráficos

**Descoberto em:** Etapa 2 (Fase A, backend)
**Componentes afetados:** `<DashboardView>` em `src/App.tsx`
**Severidade:** cosmética

### Sintoma
Ao navegar para fora do Dashboard (ex: clicar em Sair, trocar de aba), o console do Vite mostra:

```
The width(-1) and height(-1) of chart should be greater than 0,
please check the style of container, or the props width(100%) and height(100%),
or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
height and width.
```

### Causa raiz
Durante a desmontagem do componente, o `<ResponsiveContainer>` do Recharts tenta recalcular suas dimensões enquanto o container pai está em estado transitório (width/height = 0). Isso é comum em aplicações que usam `motion` + Recharts + React Router.

### Por que é aceitável agora
- Não quebra funcionalidade
- Não aparece pro usuário final
- Só aparece no terminal do Vite em dev
- Navegação funciona normalmente

### Como resolver (Etapa 3)
Durante a troca de mockData por queries reais do Supabase:

1. Envolver cada gráfico em condicionais explícitas:
   ```tsx
   {data && data.length > 0 ? (
     <ResponsiveContainer width="100%" height={300}>
       ...
     </ResponsiveContainer>
   ) : (
     <EmptyChart />
   )}
   ```

2. Adicionar `key` único por gráfico baseado em `activeTab` pra forçar unmount/remount limpo:
   ```tsx
   <ResponsiveContainer key={`chart-${activeTab}`} ...>
   ```

3. Garantir que o container CSS tem `min-width: 0` e `min-height` explícitos em todas as cascatas.

### Referências
- https://github.com/recharts/recharts/issues/172
- https://stackoverflow.com/questions/70104738/

---

## Template para novos issues

```
## 🟡 KI-NNN — Título curto

**Descoberto em:** Etapa N
**Componentes afetados:** arquivo(s)
**Severidade:** cosmética | leve | média | crítica

### Sintoma
(o que o usuário/dev vê)

### Causa raiz
(entendimento técnico)

### Por que é aceitável agora
(justificativa pra adiar)

### Como resolver
(plano concreto)
```
