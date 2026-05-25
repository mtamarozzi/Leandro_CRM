import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { queryKeys, type EventFilters } from '@/src/lib/queryKeys';
import { assertNoError, getCurrentWorkspaceId } from '@/src/lib/supabase-helpers';
import type { Database } from '@/src/types/database';
import type {
  EventCreateInput,
  EventUpdateInput,
} from '@/src/lib/schemas/event-schema';
import { EVENT_TYPE_LABELS } from '@/src/lib/schemas/event-schema';
import { createNotification } from './useNotifications';

// ============================================================================
// useEvents.ts — Hooks CRUD da agenda (`events`)
// ============================================================================

type EventRow = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventUpdate = Database['public']['Tables']['events']['Update'];

export function useEvents(filters?: EventFilters) {
  return useQuery<EventRow[]>({
    queryKey: queryKeys.events.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('*')
        .order('starts_at', { ascending: true });

      if (filters?.from) query = query.gte('starts_at', filters.from);
      if (filters?.to) query = query.lte('starts_at', filters.to);
      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.status) query = query.eq('status', filters.status);

      const { data, error } = await query;
      assertNoError(error);
      return data ?? [];
    },
  });
}

export function useEventsByLead(leadId: string | undefined) {
  return useQuery<EventRow[]>({
    queryKey: leadId ? ['events', 'by-lead', leadId] : ['events', 'by-lead', 'none'],
    enabled: !!leadId,
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('lead_id', leadId)
        .order('starts_at', { ascending: false });
      assertNoError(error);
      return data ?? [];
    },
  });
}

export function useEvent(id: string | undefined) {
  return useQuery<EventRow | null>({
    queryKey: id ? queryKeys.events.detail(id) : ['events', 'detail', 'none'],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      assertNoError(error);
      return data;
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation<EventRow, Error, EventCreateInput>({
    mutationFn: async (input) => {
      const workspaceId = await getCurrentWorkspaceId();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const payload: EventInsert = {
        workspace_id: workspaceId,
        user_id: userData.user.id,
        title: input.title,
        type: input.type,
        status: input.status,
        starts_at: input.starts_at,
        ends_at: input.ends_at ?? null,
        description: input.description ?? null,
        location: input.location ?? null,
        reminder_minutes_before: input.reminder_minutes_before ?? null,
        lead_id: input.lead_id ?? null,
        property_id: input.property_id ?? null,
      };

      const { data, error } = await supabase
        .from('events')
        .insert(payload)
        .select()
        .single();
      assertNoError(error);
      if (!data) throw new Error('Falha ao criar evento');

      // Se for evento de visita com lead vinculado, sincroniza status do lead
      // pra "visita" e registra interaction status_change.
      if (data.type === 'visita' && data.lead_id) {
        const { data: leadBefore } = await supabase
          .from('leads')
          .select('status')
          .eq('id', data.lead_id)
          .maybeSingle();

        const previousStatus = leadBefore?.status ?? null;
        if (previousStatus !== 'visita' && previousStatus !== 'ganho' && previousStatus !== 'perdido') {
          const { error: updErr } = await supabase
            .from('leads')
            .update({ status: 'visita', last_contact_at: new Date().toISOString() })
            .eq('id', data.lead_id);
          if (updErr) {
            console.warn('[useCreateEvent] falha ao sincronizar status do lead:', updErr);
          } else {
            await supabase.from('interactions').insert({
              workspace_id: workspaceId,
              lead_id: data.lead_id,
              type: 'status_change',
              content: previousStatus
                ? `Status alterado para "Visita agendada" via novo evento na agenda.`
                : `Status definido como "Visita agendada" via novo evento na agenda.`,
              metadata: { from: previousStatus, to: 'visita', event_id: data.id },
              occurred_at: new Date().toISOString(),
            });
          }
        }
      }

      const when = new Date(data.starts_at).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      // Se o evento tem lembrete configurado (reminder_minutes_before), só
      // persiste a row no sino — o popup e o beep ficam a cargo do
      // useReminderScheduler, que dispara faltando X min para o evento.
      // Sem lembrete configurado, notifica na hora como antes.
      const hasReminder = (data.reminder_minutes_before ?? 0) > 0;
      await createNotification({
        type: 'event_reminder',
        title: `${EVENT_TYPE_LABELS[data.type]} agendada`,
        body: `${data.title} · ${when}`,
        link: '/',
        metadata: { event_id: data.id, lead_id: data.lead_id, property_id: data.property_id },
        silent: hasReminder,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

export interface UpdateEventInput {
  id: string;
  patch: EventUpdateInput;
}

function toEventUpdatePayload(patch: EventUpdateInput): EventUpdate {
  const out: EventUpdate = {};
  if (patch.title !== undefined) out.title = patch.title;
  if (patch.type !== undefined) out.type = patch.type;
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.starts_at !== undefined) out.starts_at = patch.starts_at;
  if (patch.ends_at !== undefined) out.ends_at = patch.ends_at ?? null;
  if (patch.description !== undefined) out.description = patch.description ?? null;
  if (patch.location !== undefined) out.location = patch.location ?? null;
  if (patch.reminder_minutes_before !== undefined)
    out.reminder_minutes_before = patch.reminder_minutes_before ?? null;
  if (patch.lead_id !== undefined) out.lead_id = patch.lead_id ?? null;
  if (patch.property_id !== undefined) out.property_id = patch.property_id ?? null;
  return out;
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation<EventRow, Error, UpdateEventInput>({
    mutationFn: async ({ id, patch }) => {
      const { data, error } = await supabase
        .from('events')
        .update(toEventUpdatePayload(patch))
        .eq('id', id)
        .select()
        .single();
      assertNoError(error);
      if (!data) throw new Error('Falha ao atualizar evento');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.setQueryData(queryKeys.events.detail(data.id), data);
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      // Busca o evento antes de deletar — precisamos dos metadados para
      // possivelmente reverter o status do lead no funil.
      const { data: event } = await supabase
        .from('events')
        .select('id, workspace_id, lead_id, type, title, starts_at')
        .eq('id', id)
        .maybeSingle();

      const { error } = await supabase.from('events').delete().eq('id', id);
      assertNoError(error);

      if (!event || event.type !== 'visita' || !event.lead_id) return;

      // Revert automático: localiza a interaction `status_change` que esse
      // evento criou (metadata.event_id). Só reverte se o status atual do
      // lead ainda for exatamente o "to" registrado — caso contrário o
      // usuário já ajustou manualmente e não queremos desfazer.
      const { data: lead } = await supabase
        .from('leads')
        .select('id, status')
        .eq('id', event.lead_id)
        .maybeSingle();

      const { data: trigger } = await supabase
        .from('interactions')
        .select('id, metadata, occurred_at')
        .eq('lead_id', event.lead_id)
        .eq('type', 'status_change')
        .contains('metadata', { event_id: event.id })
        .order('occurred_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const when = new Date(event.starts_at).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      if (trigger && lead) {
        const meta = (trigger.metadata ?? {}) as {
          from?: string | null;
          to?: string | null;
        };
        const previousStatus = meta.from ?? null;
        const currentIsExpected = lead.status === (meta.to ?? 'visita');

        if (currentIsExpected && previousStatus) {
          await supabase
            .from('leads')
            .update({ status: previousStatus, last_contact_at: new Date().toISOString() })
            .eq('id', event.lead_id);

          await supabase.from('interactions').insert({
            workspace_id: event.workspace_id,
            lead_id: event.lead_id,
            type: 'status_change',
            content: `Status revertido para "${previousStatus}" porque o evento de visita "${event.title}" (${when}) foi excluído.`,
            metadata: { from: meta.to, to: previousStatus, reverted_event_id: event.id },
            occurred_at: new Date().toISOString(),
          });

          // Apaga a interaction_change original pra não poluir a timeline.
          await supabase.from('interactions').delete().eq('id', trigger.id);
          return;
        }
      }

      // Fallback conservador: status atual já foi alterado manualmente, ou
      // não achamos a interaction gatilho. Só registra nota informativa.
      await supabase.from('interactions').insert({
        workspace_id: event.workspace_id,
        lead_id: event.lead_id,
        type: 'note',
        content: `Evento de visita excluído ("${event.title}" · ${when}). Status do lead mantido como está — ajuste manualmente se necessário.`,
        metadata: { deleted_event_id: event.id },
        occurred_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}
