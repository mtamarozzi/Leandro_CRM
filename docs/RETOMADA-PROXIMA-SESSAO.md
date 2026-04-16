# Retomada — proxima sessao (a partir de 2026-04-16)

> Cole esse arquivo (ou referencie) na primeira mensagem da proxima conversa.
> Ele tem TUDO que precisamos pra retomar do ponto exato em que paramos.

---

## Onde paramos

- **Branch:** `feat/backend-fase-a`
- **Ultimo commit:** `256cbab` — `feat(notif): popup custom, revert de visita no delete e scheduler de lembretes`
- **Bloco 1 pos-retomada:** CONCLUIDO. Os 2 bugs do sub-bloco 3.6 foram fechados.
- **Sub-bloco 3.7 (scheduler de lembretes):** CONCLUIDO no mesmo commit.
- **Relatorio:** `docs/RELATORIO-PROJETO-CRM-LEANDRO.md` em **v1.9**
- **Known issues:** `docs/KNOWN-ISSUES.md` — KI-001, KI-003, KI-004 RESOLVIDOS. So KI-002 (tsc errors) ainda pendente.
- **Status geral:** Etapa 3 + 3.6 + 3.7 FECHADAS. Proximo foco: **Etapa 4 — Backend da Dorinda (n8n + OpenAI + webhooks)**.

---

## O que foi fechado hoje (2026-04-15)

### Bug #1 — popup e beep (RESOLVIDO)
- Toast popup do sonner (`toast.info`) nao renderizava com `richColors`. Trocamos por **componente custom**:
  - `components/notifications/NotificationPopup.tsx` — card no top-right, slideIn, ícone de sino, badge, X, auto-dismiss 8s. API imperativa `showNotificationPopup(input)` com store externo via `useSyncExternalStore`.
  - Container montado no `src/routes/__root.tsx`. Toaster do sonner foi movido pra `bottom-right` pra nao colidir.
  - Estilos em `src/styles/notifications.css` (secao `.notification-popup*`).
- Beep: `AudioContext` singleton + `ctx.resume()` quando `state === 'suspended'` (resolve bloqueio do autoplay do Chrome apos `await`).

### Bug #2 — delete evento nao revertia status do lead (RESOLVIDO)
- `useDeleteEvent` em `src/hooks/useEvents.ts` agora:
  1. Le o evento antes de deletar.
  2. Se `type === 'visita'` e `lead_id` existe: procura a interaction `status_change` cuja `metadata.event_id` bate.
  3. So reverte se o status atual do lead ainda for o `metadata.to` registrado — caso contrario o Leandro ja mexeu a mao e nao queremos desfazer.
  4. Ao reverter: aplica `from`, insere interaction explicando, apaga a interaction gatilho pra nao poluir.
  5. Fallback conservador: se ja foi alterado, so registra nota informativa.

### Sub-bloco 3.7 — Scheduler de lembretes (BONUS, tambem resolvido)
- Antes: popup disparava **imediatamente** ao salvar o evento, ignorando `reminder_minutes_before`.
- Agora:
  - `createNotification` ganhou flag `silent: boolean`. Se `true`, persiste a row no banco (pra sino) mas pula popup + beep.
  - `useCreateEvent` passa `silent: true` quando `reminder_minutes_before > 0`. Sem lembrete, dispara na hora como antes.
  - Novo hook `src/hooks/useReminderScheduler.ts` — polling a cada 30s, lista eventos das proximas 24h com `reminder_minutes_before` definido, dispara popup + beep na janela `[starts_at - reminder_minutes_before, starts_at)`. Dedup via `localStorage['crm:fired-event-reminders']` (TTL 7 dias). Re-check no `visibilitychange`.
  - Hook montado em `src/routes/_authenticated.tsx`.
- Testado pelo Felipe: OK, dispara no horario correto.

---

## Scoping da Etapa 4 ja feito

Analise completa dos 3 workflows do n8n (ja presentes em `docs/`):

| Arquivo | Trigger | Funcao |
|---|---|---|
| `Chat_Widget_AI_v1.json` | Webhook POST `/chat-widget-message` | Recebe msg do widget do site, AI Agent responde, salva em `chat_messages`, atualiza lead |
| `Mariana_FollowUp_Curto_v2.json` | Cron a cada 5min | Busca leads com 12min+ de silencio apos msg IA, envia follow-up via WhatsApp + Widget |
| `Mariana_WhatsApp_v2.json` | Webhook Meta (WhatsApp Cloud) | Listener WhatsApp. Transcreve audio, OCR imagem, AI Agent responde, integra Chatwoot + Asaas |

**Tabelas usadas** entre os 3:
- `chat_conversations` — ✅ existe no Leandro
- `chat_messages` — ✅ existe no Leandro
- `leads` — ✅ existe no Leandro (com campos `ai_*`)
- `n8n_chat_histories` — ❌ **FALTA** no Leandro (storage de memoria do AI Agent do n8n)

**Servicos externos identificados:**
- WhatsApp Cloud API (Meta) — Phone ID `963849233485208` no FVC
- OpenAI API — chat + transcricao de audio
- Supabase Postgres + Storage
- Asaas (cobranca) — usado no workflow 3
- Chatwoot (helpdesk) — usado no workflow 3

**Renomeacoes necessarias** (Mariana -> Dorinda):
- 8 ocorrencias no workflow FollowUp (frases SQL tipo "Opa, Mariana aqui...")
- 11 ocorrencias no workflow WhatsApp (node name `Memória_Mariana` + historico)

**IMPORTANTE:** o **prompt do AI Agent** NAO esta nos JSONs — fica na config do no AI Agent dentro do proprio n8n, que nao serializa.

---

## 5 perguntas bloqueantes pra destravar Etapa 4

Felipe precisa responder isso antes de codar qualquer coisa da Etapa 4:

1. **n8n hospedado onde?** Leandro e FVC compartilham a mesma instancia ou cada um tem a sua? Qual URL/host?
2. **Asaas e Chatwoot:** o Leandro tem contas nesses servicos? Se nao, podemos **cortar essas integracoes do MVP** e focar so em WhatsApp + OpenAI + Supabase?
3. **WhatsApp Cloud API:** Leandro ja tem Phone Number ID + token da Meta proprios? Ou vamos usar o mesmo do FVC temporariamente?
4. **OpenAI API key:** mesma key do FVC ou separada? (custo + isolamento de contexto)
5. **Prompt da Mariana:** me manda **texto ou screenshot** da config do no "AI Agent" nos workflows 1 e 3. Sem isso a Dorinda nao existe.

---

## Mini-plano de sub-blocos 4.x (a validar apos respostas)

- **4.1** — Migration `n8n_chat_histories` no Supabase do Leandro
- **4.2** — Setup de credenciais no n8n (Supabase Leandro, OpenAI, WhatsApp Meta)
- **4.3** — Workflow 1 (Chat Widget) — duplicar, renomear, apontar pra Supabase Leandro, testar
- **4.4** — Workflow 2 (Follow-up) — duplicar, trocar frases "Mariana" -> "Dorinda", testar cron
- **4.5** — Workflow 3 (WhatsApp) — duplicar, decisao sobre Asaas/Chatwoot (MVP vs escopo completo), testar
- **4.6** — Escrever o prompt da Dorinda (personalidade + regras do Leandro: CRECI 300771-F, Santos/SP, foco em imoveis residenciais)
- **4.7** — Teste end-to-end completo (mensagem chega -> IA responde -> lead criado/atualizado -> timeline registra -> notificacao opcional)

Estimativa bruta: 1 a 2 semanas dependendo das respostas.

---

## Estado funcional (o que esta OK)

- Login / logout / sessao persistente
- Configuracoes do workspace
- Imoveis: wizard 4 etapas, criar, editar, excluir, upload, cover, filtros
- Leads: modal completo, detail com edit inline, timeline com interactions + eventos, filtros
- Funil: drag-and-drop, sync evento-visita, **revert automatico no delete** (novo hoje)
- Dashboard: KPIs reais, 2 charts, imoveis em destaque
- Agenda: calendario mensal + lista lateral, EventModal completo
- **Sino de notificacoes:** badge unread + dropdown + **popup azul custom + beep** (novo hoje)
- **Scheduler de lembretes:** respeita `reminder_minutes_before` (novo hoje)
- Toasts globais via sonner no bottom-right (move hoje pra nao colidir com popup)

---

## Como retomar tecnicamente

```bash
cd C:\Users\User\Documents\Leandro_CRM
git status
git log --oneline -5   # deve comecar com 256cbab
npm run dev
```

Login com o user de teste de sempre. Se quiser validar o que foi feito hoje, cria um evento com `reminder_minutes_before = 2`, espera 2min, popup azul deve disparar com beep.

Depois, responder as 5 perguntas bloqueantes acima pra partir pra Etapa 4.

---

## Arquivos relevantes adicionados/modificados hoje

**Novos:**
- `components/notifications/NotificationPopup.tsx`
- `src/hooks/useReminderScheduler.ts`

**Modificados:**
- `src/hooks/useNotifications.ts` — flag `silent`, export `playNotificationBeep`, AudioContext singleton, badge map
- `src/hooks/useEvents.ts` — revert automatico em `useDeleteEvent`, `silent` em `useCreateEvent`
- `src/routes/__root.tsx` — `<NotificationPopupContainer />` montado, Toaster em `bottom-right`
- `src/routes/_authenticated.tsx` — `useReminderScheduler()` ativo
- `src/styles/notifications.css` — estilos `.notification-popup*`
- `docs/RELATORIO-PROJETO-CRM-LEANDRO.md` — v1.9 no changelog
- `docs/KNOWN-ISSUES.md` — KI-004 marcado como RESOLVIDO

---

## Frase para colar na proxima sessao

> Estou continuando o desenvolvimento do CRM imobiliario do Leandro Alonso.
> Antes de fazer qualquer coisa, leia o arquivo `docs/RETOMADA-PROXIMA-SESSAO.md`
> e me confirme que entendeu onde paramos. Depois me ajude a iniciar a
> **Etapa 4 (Backend da Dorinda)** a partir das 5 perguntas bloqueantes
> listadas no documento.

---

**Documento gerado em:** 15 de abril de 2026, fim da sessao
**Proxima sessao prevista:** 16 de abril de 2026
