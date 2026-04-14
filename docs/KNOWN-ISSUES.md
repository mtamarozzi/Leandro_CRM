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

## 🟡 KI-002 — `npm run lint` (tsc --noEmit) com 5 erros pré-existentes

**Descoberto em:** Sub-bloco 3.2.2 (Etapa 3, Fase A, backend)
**Componentes afetados:**
- `src/lib/supabase.ts` (linhas 15, 16) — `import.meta.env`
- `src/main.tsx` (linha 17) — TanStack Router exige `strictNullChecks`
- `src/routes/__root.tsx` (linha 32) — `import.meta.env`
- `src/routes/_authenticated.tsx` (linha 25) — API `redirect` mudou no TanStack Router

**Severidade:** leve (não quebra dev/build, só o type-check manual)

### Sintoma
Rodar `npm run lint` retorna exit 1 com 5 erros TypeScript:

```
src/lib/supabase.ts(15,33): error TS2339: Property 'env' does not exist on type 'ImportMeta'.
src/lib/supabase.ts(16,37): error TS2339: Property 'env' does not exist on type 'ImportMeta'.
src/main.tsx(17,29): error TS2345: ... "strictNullChecks must be enabled in tsconfig.json"
src/routes/__root.tsx(32,22): error TS2339: Property 'env' does not exist on type 'ImportMeta'.
src/routes/_authenticated.tsx(25,11): error TS2353: 'redirect' does not exist in type 'ParamsReducerFn<...>'
```

### Causa raiz
1. **`vite/client` types não importados** — falta `/// <reference types="vite/client" />` ou `"types": ["vite/client"]` no `tsconfig.json` → `import.meta.env` não tem tipagem
2. **`strictNullChecks: false` no tsconfig** — TanStack Router 1.166+ exige strict null checks pra inferir tipos do `createRouter`
3. **Breaking change no TanStack Router** — em algum bump entre 1.166 e 1.168, a API de `beforeLoad` deixou de aceitar `redirect` como objeto plano (agora é função `throw redirect()`)

### Por que é aceitável agora
- Vite roda normalmente em dev (`npm run dev` funciona) — Vite não usa `tsc`
- Build (`vite build`) também passa, pois Vite usa esbuild que ignora esses erros
- A aplicação funciona end-to-end (login OK, navegação OK)
- Sub-blocos posteriores conseguem trabalhar com `tsc` cirúrgico via `grep` por arquivo

### Como resolver (sub-bloco de cleanup futuro, sugestão: 3.6)
1. Em `tsconfig.json`, adicionar `"types": ["vite/client", "node"]` em `compilerOptions`
2. Habilitar `"strictNullChecks": true` (ou `"strict": true` se ainda não estiver)
3. Refatorar `_authenticated.tsx` pra usar `throw redirect({ to: '/login' })` dentro de `beforeLoad`
4. Rodar `npm run lint` e confirmar 0 erros

### Referências
- https://vitejs.dev/guide/features.html#client-types
- https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes

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
