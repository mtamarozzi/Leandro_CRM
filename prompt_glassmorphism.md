# Prompt: Aplicar efeito Glassmorphism em projeto web

Aplique o efeito **Glassmorphism moderno** (estilo iOS/Apple) neste projeto, com fundo de orbs coloridos borrados e cards translúcidos com backdrop-blur.

## Pré-requisitos que você deve validar antes de começar

1. **Stack**: o projeto deve usar Tailwind CSS. Se não usar, me avise antes de prosseguir.
2. **Modo escuro**: verifique se o projeto tem dark mode implementado (class `dark` ou `data-theme`). Aplique os ajustes em ambos os modos.
3. **Leia os arquivos principais primeiro** para entender quais componentes existem (cards, modais, header, nav, inputs). Só comece a editar depois de mapear tudo.
4. **Antes de escrever código**, me mostre: quais componentes vai alterar e qual será o plano. Só prossiga após minha aprovação.

## Etapa 1: Background com orbs coloridos

No wrapper raiz do app (geralmente o `<div>` mais externo do layout principal), adicione uma camada fixa com 4 orbs coloridos borrados:

```tsx
<div className="relative bg-zinc-100 dark:bg-[#1a1625] min-h-screen overflow-hidden">

  {/* --- Background Orbs (camada fixa, fica atrás de tudo) --- */}
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-0">
    {/* Orb 1 — ciano/teal, topo esquerdo */}
    <div
      className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-60 dark:opacity-60"
      style={{
        background: 'radial-gradient(circle, rgba(34,211,238,0.6) 0%, rgba(34,211,238,0) 70%)',
        filter: 'blur(80px)',
      }}
    />
    {/* Orb 2 — âmbar, centro direito */}
    <div
      className="absolute top-1/3 -right-40 w-[700px] h-[700px] rounded-full opacity-50 dark:opacity-55"
      style={{
        background: 'radial-gradient(circle, rgba(251,146,60,0.55) 0%, rgba(251,146,60,0) 70%)',
        filter: 'blur(100px)',
      }}
    />
    {/* Orb 3 — rosa/magenta, inferior central */}
    <div
      className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] rounded-full opacity-50 dark:opacity-55"
      style={{
        background: 'radial-gradient(circle, rgba(236,72,153,0.5) 0%, rgba(236,72,153,0) 70%)',
        filter: 'blur(90px)',
      }}
    />
    {/* Orb 4 — violeta, diagonal sutil */}
    <div
      className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full opacity-45 dark:opacity-45"
      style={{
        background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(139,92,246,0) 70%)',
        filter: 'blur(70px)',
      }}
    />
  </div>

  {/* Todo o conteúdo principal fica numa camada acima */}
  <div className="relative z-10">
    {/* ... header, main, etc ... */}
  </div>

</div>
```

**Regras importantes:**

- O wrapper raiz precisa de `relative overflow-hidden` para conter os orbs.
- Os orbs usam `filter: blur()` inline porque Tailwind não tem blurs arbitrários para filter (só para backdrop).
- Os tamanhos (`w-[600px] h-[600px]`) e posições negativas (`-top-40 -left-40`) fazem os orbs vazarem pelas bordas, dando efeito de luz ambiente.
- Todo conteúdo da página deve ficar em `<div className="relative z-10">` para ficar acima dos orbs.
- Se o projeto já tem alguma cor de fundo muito saturada, me pergunte antes de trocar. Caso contrário:
  - **Light**: `bg-zinc-100` (cinza bem claro, deixa os orbs respirarem).
  - **Dark**: `bg-[#1a1625]` (violeta escuro — **NÃO use preto puro**; preto engole os orbs).

## Etapa 2: Transformar cards em vidro

Para cada **card, painel, modal, header, nav, input de busca**, substitua o background sólido por glass. A fórmula é:

```
bg-white/60 dark:bg-white/10
border border-white/40 dark:border-white/15
backdrop-blur-xl
shadow-lg shadow-black/5 dark:shadow-black/40
```

**Valores por contexto:**

| Elemento | Light bg | Dark bg | Border light | Border dark | Blur |
|---|---|---|---|---|---|
| Cards principais (stats, painéis) | `white/60` | `white/10` | `white/40` | `white/15` | `backdrop-blur-xl` |
| Header / nav fixa | `white/40` | `white/10` | `white/40` | `white/15` | `backdrop-blur-2xl` |
| Inputs (search, etc) | `white/40` | `white/10` | `white/40` | `white/15` | `backdrop-blur-md` |
| Cards interativos menores (ex: itens de lista, cards de tarefa) | `white/70` | `white/15` | `white/40` | `white/20` | `backdrop-blur-xl` |
| Modais / overlays | `white/80` | `white/15` | `white/40` | `white/20` | `backdrop-blur-2xl` |
| Containers de agrupamento (ex: colunas kanban) | `white/30` | `white/10` | `white/40` dashed | `white/15` dashed | `backdrop-blur-md` |

**Backdrop de modais (o fundo preto do overlay):**
- Antigo: `bg-black/40 backdrop-blur-sm`
- Novo: `bg-black/50 backdrop-blur-md`

## Etapa 3: Ajustes de texto e contraste

Quando o fundo de botões/abas ativas fica translúcido, o texto precisa ser revisto:

- Abas inativas: text `zinc-600 dark:zinc-300` (não `dark:zinc-400` — fica ilegível sobre vidro).
- Aba ativa (estado selecionado): `bg-white/80 dark:bg-white/20` para destacar.
- Texto dentro de cards: manter as cores originais do projeto (geralmente `zinc-900 dark:white`).

## Etapa 4: Regras Tailwind importantes

- **Opacidades válidas** no Tailwind: `/5`, `/10`, `/15`, `/20`, `/25`, `/30`, `/40`, `/50`, `/60`, `/70`, `/80`, `/90`. **Nunca use `/8`, `/12`, `/35`**, etc — não existem por padrão e não renderizam.
- **Não use `blur-*` do Tailwind em divs com `background`**: o Tailwind `blur-3xl` aplica em elemento filho, não em background. Use `filter: 'blur(80px)'` inline nos orbs.
- **`backdrop-blur-*` só funciona se o elemento tiver `background` translúcido**. Um `backdrop-blur-xl` sobre `bg-white` (opaco) não faz nada visível.

## Etapa 5: Validação

Depois de aplicar tudo:

1. **Verifique sintaticamente** que todas as tags JSX estão fechadas (se você adicionou um `<div>` externo e uma camada `<div className="relative z-10">` interna, precisa fechar ambas).
2. **Teste em ambos os modos** (light e dark) rodando `npm run dev`.
3. Se o **dark mode ficar muito escuro e os cards invisíveis**: aumente as opacidades dos cards (`white/10` → `white/15` ou `/20`) e dos orbs (adicione 10-15%).
4. Se o **light mode ficar com orbs fracos**: aumente as opacidades dos orbs light (regra: mantenha os orbs em ~45-60% em ambos os modos).
5. Se o **fundo dark ficar chapado**: troque para tons violeta/azul/teal escuro (nunca preto puro).

## O que NÃO fazer

- Não aplique glass em **botões pequenos** (editar, deletar, fechar) — fica visualmente confuso.
- Não remova as shadows dos cards — elas dão profundidade essencial.
- Não use glass em **ícones coloridos** (ex: badges de prioridade, status) — mantém cores sólidas neles.
- Não troque fonte, paleta de acentos, ou layout — o escopo é SÓ o efeito glass.
- Não use purple gradient on white background — é o cliché AI que estamos evitando.
- Não gere código sem primeiro mapear o projeto e me mostrar o plano.

## Checklist de entrega

- [ ] Background do root com 4 orbs + `bg-zinc-100 dark:bg-[#1a1625]` + `relative overflow-hidden`.
- [ ] Wrapper `<div className="relative z-10">` envolvendo todo o conteúdo.
- [ ] Todos os cards/painéis convertidos para glass.
- [ ] Header/nav fixa com `backdrop-blur-2xl`.
- [ ] Modais com `backdrop-blur-2xl` e overlay `bg-black/50 backdrop-blur-md`.
- [ ] Inputs com glass leve.
- [ ] Texto em abas/botões revisado para contraste (`zinc-300` no dark).
- [ ] Testado em light e dark mode em tela cheia.
- [ ] Sem erros de build / sintaxe JSX.
