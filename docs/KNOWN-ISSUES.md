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

## 🟡 KI-003 — Bugs de UX do wizard de imóveis (5 itens)

**Descoberto em:** Sub-bloco 3.3 — teste manual do wizard em 2026-04-14
**Componentes afetados:**
- `components/property-wizard/PropertyWizardModal.tsx`
- `components/property-wizard/Step1Identification.tsx`
- `components/property-wizard/Step4ValuesPhotos.tsx`
- `src/styles/property-wizard.css`
- `src/App.tsx` (cards de imóveis)

**Severidade:** cosmética + funcional (upload de fotos sem acesso claro)

### Sintomas

1. **Upload de fotos invisível após criar** — Modal mostra toast "Imóvel criado, você já pode adicionar fotos", mas o `PhotoUploader` é renderizado no final do step 4 (após todos os campos), exigindo scroll pra encontrá-lo. Usuário não descobriu onde subir as fotos.
2. **Título "Novo imóvel" não aparece** — Header do modal está vazio onde deveria mostrar título + subtítulo. Provavelmente `var(--text-primary)` não está definida em `tokens.css` ou está igual ao background.
3. **Selects nativos ilegíveis no dark mode** — As opções dos 3 `<select>` (Finalidade, Categoria, Situação) aparecem acinzentadas/ilegíveis no tema escuro. Browser não aplica CSS vars às options nativas.
4. **Botão "Ver detalhes" nos cards não faz nada** — Herdado do mock original. Tela de detalhe ainda não implementada.
5. **Setas estranhas no step bar** — Indicadores visuais (↑↓) aparecem no canto direito da barra de etapas, causados pelo `overflow-x: auto` em `.property-wizard__steps`.

### Causa raiz

1. PhotoUploader concatenado ao form; deveria **substituir** o conteúdo do step 4 quando `createdId` existe.
2. Possível ausência da variável CSS `--text-primary` — fallback seguro seria `var(--foreground)` (definida em `index.css`). Também pode ser conflito de z-index com o header do dialog.
3. Native `<select><option>` não herda `color`/`background` das CSS vars do dark theme no Chrome/Edge/Firefox. Solução: substituir pelo componente shadcn `Select` (já disponível em `components/ui/select.tsx`).
4. Botão `btn-material` permaneceu do mockup original quando a `PropertiesView` foi refatorada.
5. `overflow-x: auto` em container sem overflow real ativa scroll indicators nativos em alguns browsers.

### Por que é aceitável agora

- Criação de imóveis funciona (confirmado com `LDR-2026-0001` criado com sucesso)
- Lista renderiza, filtros funcionam, busca funciona
- Fotos **podem** ser adicionadas (basta scrollar), só não tem affordance clara
- Nenhum desses bugs bloqueia o sub-bloco 3.4 (Leads + Funil)

### Como resolver (sub-bloco de polish futuro)

Sugestão: virar **sub-bloco 3.3.8** ou agrupar com o cleanup do 3.5. 5 fixes isolados:

1. **Fotos em destaque após criar:** no `PropertyWizardModal`, quando `createdId !== null`, renderizar apenas o `PhotoUploader` dentro de step 4 (wrappear em novo componente `Step4PostCreate`).
2. **Título:** trocar `color: var(--text-primary)` por `color: var(--foreground)` em `.property-wizard__title` e `.property-wizard__subtitle`; mesmo para `.wizard-step__title`.
3. **Selects:** substituir os 3 `<select>` nativos no `Step1Identification` pelo `Select` do shadcn; se o 3.4 introduzir novos selects (lead.status, origin), fazer na mesma passada. Evitar native `<select>` daqui pra frente.
4. **"Ver detalhes":** remover o botão do card em `PropertiesView` OU transformar em "Editar" quando houver fluxo de edição (sub-bloco próprio).
5. **Step bar:** trocar `overflow-x: auto` por `flex-wrap: wrap` em `.property-wizard__steps`, ou usar `overflow-x: visible` + `scrollbar-width: none`.

### Referências
- Evidências visuais: pasta `Imagens/` (screenshots do teste de 2026-04-14)

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
