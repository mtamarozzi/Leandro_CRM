import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { queryKeys, type EventFilters } from '@/src/lib/queryKeys';
import { assertNoError, getCurrentWorkspaceId } from '@/src/lib/supabase-helpers';
import type { Database } from '@/src/types/database';
import type {
  EventCreateInput,
  EventUpdateInput,
} from '@/src/lib/schemas/event-schema';

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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
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
      const { error } = await supabase.from('events').delete().eq('id', id);
      assertNoError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}
