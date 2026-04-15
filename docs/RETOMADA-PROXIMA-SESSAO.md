# 🔖 Retomada — próxima sessão (a partir de 2026-04-15)

> Cole esse arquivo (ou referencie) na primeira mensagem da próxima conversa.
> Ele tem TUDO que precisamos pra retomar do ponto exato em que paramos.

---

## 🎯 Onde paramos

- **Branch:** `feat/backend-fase-a`
- **Último commit:** `09b5c91` — `feat(notif): toast popup e som ao notificar mais sync evento visita ao funil`
- **Etapa 3 + Sub-bloco 3.6 (polish/extras):** ✅ concluídos formalmente, mas com **2 bugs abertos** descobertos no teste manual final
- **Relatório:** `docs/RELATORIO-PROJETO-CRM-LEANDRO.md` em **v1.8**
- **Known issues:** `docs/KNOWN-ISSUES.md` — apenas KI-002 (tsc errors) ainda registrado como pendência conhecida

---

## 🐞 Bugs em aberto (prioridade 1 ao retomar)

### Bug #1 — Sino de notificações não dispara

**Sintoma:** ao criar evento na agenda:
- Toast verde de sucesso aparece (ok)
- Mas **NÃO toca o beep**, **NÃO aparece o toast popup azul** da notificação, e o **sino não pisca com badge**

**O que já tentei:**
- Adicionei policy `notifications_insert_own` na migration `0006_notifications_insert_policy.sql` (aplicada)
- `createNotification()` em `src/hooks/useNotifications.ts` agora loga erro no console se INSERT falhar
- Implementei `playNotificationBeep()` via Web Audio API
- `toast.info(input.title, ...)` é chamado dentro de `createNotification`

**Hipóteses pra investigar amanhã (em ordem de probabilidade):**
1. **A notification está sendo criada mas o sino não atualiza** — checar Supabase Studio → table `notifications` se a row existe
2. **Web Audio bloqueado** — alguns browsers bloqueiam até interação. Testar com `window.AudioContext` manual no console
3. **A função `createNotification` está dando erro silencioso por outro motivo** — abrir DevTools → Console enquanto cria evento
4. **`toast.info` precisa de `<Toaster richColors>` configurado pra info funcionar** — verificar montagem do Toaster em `src/routes/__root.tsx`
5. **Workspace mismatch:** policy exige `workspace_id = current_workspace_id()` mas pode haver conflito com profile

**Comandos de diagnóstico:**
```sql
-- No Supabase Studio SQL Editor, ver últimas notificações inseridas
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- Ver se RLS tá bloqueando
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

```js
// No console do browser, depois de logado:
const { error } = await window.supabase.from('notifications').insert({
  workspace_id: '...', user_id: '...', type: 'system', title: 'Teste'
});
console.log(error);
```

### Bug #2 — Excluir evento não reverte status do lead no funil

**Sintoma:** criei um evento "Visita" com lead vinculado → lead foi pra coluna "Visita agendada" (✅ sync funcionou). Aí excluí o evento → o lead **continuou em "Visita agendada"** no funil em vez de voltar pro status anterior.

**Por que aconteceu:**
- `useDeleteEvent()` (em `src/hooks/useEvents.ts`) só faz `DELETE FROM events WHERE id = ?`
- Não tem lógica de "desfazer" a mudança de status

**Caminho de fix proposto:**
- Em `useDeleteEvent`, antes de deletar, ler o evento + sua metadata.
- Se foi um evento de visita que mudou status (existe `interaction status_change` com `event_id` no metadata), reverter o status do lead para `from` da metadata.
- Apagar a interaction `status_change` correlata.
- Cuidado: se o usuário mudou o status manualmente entre a criação e a exclusão, **NÃO** reverter (verificar com timestamp ou flag).

**Outra opção mais simples:** não reverter automaticamente, só registrar uma `interaction status_change` informando que o evento foi excluído, deixando pro usuário ajustar o status manualmente. Mais conservador, evita "magia" excessiva.

**Decisão pendente do desenvolvedor:** revert automático ou só notificar? Recomendar opção conservadora (apenas registra interação).

---

## 📋 Estado funcional (o que está OK)

- ✅ Login / logout / sessão persistente
- ✅ Configurações do workspace (nome, CRECI, telefone, cor primária, logo)
- ✅ **Imóveis:** wizard 4 etapas, criar, **editar**, **excluir**, upload de fotos com cover real, filtros (purpose/busca)
- ✅ **Leads:** modal completo de novo lead, detail com edit inline, timeline com **interactions + eventos vinculados**, filtros (status/origem/busca)
- ✅ **Funil:** drag-and-drop com optimistic update + status_change auto na timeline; sync evento-visita → coluna "Visita agendada"
- ✅ **Dashboard:** KPIs reais (total leads, leads do mês, conversão `ganho/(ganho+perdido)`, total imóveis), 2 charts (funil bar + origem pie), seção "Imóveis em destaque"
- ✅ **Agenda:** calendário mensal navegável + lista de próximos eventos lateral, EventModal completo (criar/editar/excluir, vincular lead/imóvel)
- ✅ **Sino de notificações:** componente montado na topbar com badge unread + dropdown — só falta o trigger de criação realmente funcionar (ver Bug #1)
- ✅ Toasts globais via `sonner`
- ✅ KI-001 e KI-003 (5 itens) totalmente resolvidos

---

## 📦 Estrutura de arquivos relevantes pra Etapa 3

```
src/
├── App.tsx                              monolítico ~1300 linhas, todas as views
├── hooks/
│   ├── useCurrentProfile.ts             [Etapa 2]
│   ├── useWorkspace.ts                  [3.2]
│   ├── useProperties.ts                 [3.3 + 3.6.4 cover via JOIN media]
│   ├── useLeads.ts                      [3.4 — optimistic + status_change]
│   ├── useEvents.ts                     [3.5 + 3.6.6 notif auto + 3.6.7+09b5c91 sync visita]
│   ├── useNotifications.ts              [3.6.6 + 09b5c91 toast/beep]
│   └── useDashboard.ts                  [3.5.1]
├── lib/
│   ├── supabase.ts, queryClient.ts, queryKeys.ts, supabase-helpers.ts
│   └── schemas/
│       ├── workspace-schema.ts
│       ├── property-schema.ts           [3.3.1 — 4 sub-schemas + completo]
│       ├── lead-schema.ts               [3.4.1]
│       ├── interaction-schema.ts        [3.4.1]
│       └── event-schema.ts              [3.5.3 — base + create + update]
├── styles/                              tokens.css + 1 css por feature
└── routes/                              TanStack Router file-based

components/
├── ui/                                  shadcn-ish + ColorPicker, LogoUploader, PhotoUploader
├── property-wizard/                     4 steps + PropertyWizardModal (cria/edita)
├── leads/                               NewLeadModal + LeadDetailModal
├── events/                              EventModal
└── notifications/                       NotificationsBell

supabase/migrations/
├── 0001_initial_schema.sql              tabelas + enums + triggers
├── 0002_rls_policies.sql                30+ policies RLS
├── 0003_storage_setup.sql               buckets logos/properties/avatars
├── 0004_add_workspace_phone.sql         coluna phone (3.2.10 hotfix)
├── 0005_property_ref_code.sql           generate_property_ref_code() RPC
└── 0006_notifications_insert_policy.sql RLS INSERT (corrigir bug #1)
```

---

## 🎯 Plano sugerido pra próxima sessão

### Bloco 1 — Fix dos 2 bugs do polish (estimado ~1h)

1. **Bug #1 (sino):** abrir DevTools, criar evento, ver console. Se aparecer erro do `createNotification` no log, debugar. Se não aparecer e a row está no banco, problema é de invalidação de query do `useUnreadNotificationsCount`. Se a row NÃO está no banco, é RLS ainda. Roda os comandos de diagnóstico do bloco do Bug #1 acima.

2. **Bug #2 (delete evento não reverte):** decidir entre revert automático ou só registrar interaction. Implementar em `useDeleteEvent`.

### Bloco 2 — Próximos passos da Fase A → B

Opções (escolher 1):

**(a) Etapa 4 — Backend da Dorinda (n8n + OpenAI + webhooks)** ~1-2 sem
- Duplicar 3 workflows do CRM_FVC com prefixo `[LEANDRO]`
- Adaptar SQL pras tabelas novas
- Reescrever prompt da Dorinda
- Conectar n8n ao Supabase do Leandro
- Testar fluxo end-to-end

**(b) Etapa 5 — Chat widget no site** ~1 sem
- Componente `<ChatWidget>` no `src/App.jsx` do site externo
- Webhook → n8n → Dorinda
- Persistência em `chat_conversations` + `chat_messages`

**(c) Etapa 6 — Catálogo público no site** ~1 sem
- Roteamento no site externo
- Páginas `/imoveis` e `/imoveis/:id` consumindo Supabase
- Filtros públicos
- CTA "Falar com a Dorinda"

**(d) Sub-bloco 3.7 — KI-002 cleanup do tsc** ~1-2h
- Adicionar `vite/client` types
- Habilitar `strictNullChecks`
- Refatorar `_authenticated.tsx` pra `throw redirect()`
- Investigar tipagens de `z.preprocess` + `@hookform/resolvers`

**Recomendação ao retomar:** começar pelo **Bloco 1 (fix dos 2 bugs)** porque são pequenos e travam a confiança no que já está pronto. Depois ir pra **(a) Etapa 4** que é o desbloqueio mais valioso pro Leandro.

---

## 🔧 Como retomar tecnicamente

```bash
cd C:\Users\User\Documents\Leandro_CRM
git status                              # confirmar limpeza
git log --oneline -5                    # ver últimos commits, deve começar com 09b5c91
npm run dev                             # subir o vite na :3000
```

Login no CRM com o user de teste de sempre. Reproduzir o Bug #1 abrindo o DevTools (F12) → Console antes de criar um novo evento.

---

## 💬 Frase para colar na próxima sessão

> Estou continuando o desenvolvimento do CRM imobiliário do Leandro Alonso.
> Antes de fazer qualquer coisa, leia o arquivo `docs/RETOMADA-PROXIMA-SESSAO.md`
> e me confirme que entendeu onde paramos. Depois me ajude com o **Bloco 1**
> (fix dos 2 bugs descritos no documento).

---

**Documento gerado em:** 14 de abril de 2026, fim da sessão
**Próxima sessão prevista:** 15 de abril de 2026
