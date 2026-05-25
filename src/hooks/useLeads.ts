import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { queryKeys, type LeadFilters } from '@/src/lib/queryKeys';
import { assertNoError, getCurrentWorkspaceId } from '@/src/lib/supabase-helpers';
import type { Database } from '@/src/types/database';
import type {
  LeadCreateInput,
  LeadStatus,
  LeadUpdateInput,
} from '@/src/lib/schemas/lead-schema';
import { LEAD_STATUS_LABELS } from '@/src/lib/schemas/lead-schema';
import type { InteractionCreateInput } from '@/src/lib/schemas/interaction-schema';

// ============================================================================
// useLeads.ts — Hooks de leads e interactions
// ============================================================================

type LeadRow = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];
type InteractionRow = Database['public']['Tables']['interactions']['Row'];
type InteractionInsert = Database['public']['Tables']['interactions']['Insert'];

// ---------------------------------------------------------------------------
// Listagem
// ---------------------------------------------------------------------------

export function useLeads(filters?: LeadFilters) {
  return useQuery<LeadRow[]>({
    queryKey: queryKeys.leads.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status as LeadStatus);
      if (filters?.origin) query = query.eq('origin', filters.origin);
      if (filters?.region)
        query = query.ilike('preferred_region', `%${filters.region}%`);
      if (filters?.search) {
        const term = `%${filters.search}%`;
        query = query.or(
          `name.ilike.${term},phone.ilike.${term},email.ilike.${term},notes.ilike.${term}`,
        );
      }

      const { data, error } = await query;
      assertNoError(error);
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------------------
// Detalhe
// ---------------------------------------------------------------------------

export function useLead(id: string | undefined) {
  return useQuery<LeadRow | null>({
    queryKey: id ? queryKeys.leads.detail(id) : ['leads', 'detail', 'none'],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();
      assertNoError(error);
      return data;
    },
  });
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation<LeadRow, Error, LeadCreateInput>({
    mutationFn: async (input) => {
      const workspaceId = await getCurrentWorkspaceId();
      const payload: LeadInsert = {
        workspace_id: workspaceId,
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        origin: input.origin,
        status: input.status,
        interest_purpose: input.interest_purpose ?? null,
        interest_type: input.interest_type ?? null,
        preferred_city: input.preferred_city ?? null,
        preferred_region: input.preferred_region ?? null,
        budget_min: input.budget_min ?? null,
        budget_max: input.budget_max ?? null,
        notes: input.notes ?? null,
      };

      const { data, error } = await supabase
        .from('leads')
        .insert(payload)
        .select()
        .single();
      assertNoError(error);
      if (!data) throw new Error('Falha ao criar lead');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export interface UpdateLeadInput {
  id: string;
  patch: LeadUpdateInput;
}

function toLeadUpdatePayload(patch: LeadUpdateInput): LeadUpdate {
  const out: LeadUpdate = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.phone !== undefined) out.phone = patch.phone;
  if (patch.email !== undefined) out.email = patch.email ?? null;
  if (patch.origin !== undefined) out.origin = patch.origin;
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.interest_purpose !== undefined)
    out.interest_purpose = patch.interest_purpose ?? null;
  if (patch.interest_type !== undefined)
    out.interest_type = patch.interest_type ?? null;
  if (patch.preferred_city !== undefined)
    out.preferred_city = patch.preferred_city ?? null;
  if (patch.preferred_region !== undefined)
    out.preferred_region = patch.preferred_region ?? null;
  if (patch.budget_min !== undefined) out.budget_min = patch.budget_min ?? null;
  if (patch.budget_max !== undefined) out.budget_max = patch.budget_max ?? null;
  if (patch.notes !== undefined) out.notes = patch.notes ?? null;
  if (patch.assigned_to !== undefined)
    out.assigned_to = patch.assigned_to ?? null;
  return out;
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation<LeadRow, Error, UpdateLeadInput>({
    mutationFn: async ({ id, patch }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(toLeadUpdatePayload(patch))
        .eq('id', id)
        .select()
        .single();
      assertNoError(error);
      if (!data) throw new Error('Falha ao atualizar lead');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.setQueryData(queryKeys.leads.detail(data.id), data);
    },
  });
}

// ---------------------------------------------------------------------------
// Soft delete
// ---------------------------------------------------------------------------

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('leads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      assertNoError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Mudança de status — usado pelo drag no funil (optimistic + status_change)
// ---------------------------------------------------------------------------

export interface UpdateLeadStatusInput {
  id: string;
  nextStatus: LeadStatus;
  previousStatus?: LeadStatus;
}

async function applyStatusMutation(queryClient: QueryClient, previousStatus?: LeadStatus) {
  void queryClient;
  void previousStatus;
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation<LeadRow, Error, UpdateLeadStatusInput, { snapshot?: LeadRow[] }>({
    mutationFn: async ({ id, nextStatus, previousStatus }) => {
      const workspaceId = await getCurrentWorkspaceId();

      const { data, error } = await supabase
        .from('leads')
        .update({ status: nextStatus, last_contact_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      assertNoError(error);
      if (!data) throw new Error('Falha ao atualizar status');

      const fromLabel = previousStatus
        ? LEAD_STATUS_LABELS[previousStatus]
        : 'anterior';
      const toLabel = LEAD_STATUS_LABELS[nextStatus];
      const interactionPayload: InteractionInsert = {
        workspace_id: workspaceId,
        lead_id: id,
        type: 'status_change',
        content: `Status alterado de "${fromLabel}" para "${toLabel}"`,
        metadata: { from: previousStatus ?? null, to: nextStatus },
        occurred_at: new Date().toISOString(),
      };
      const { error: interactionError } = await supabase
        .from('interactions')
        .insert(interactionPayload);
      if (interactionError) {
        console.warn('[useUpdateLeadStatus] Falha ao registrar interaction:', interactionError);
      }

      await applyStatusMutation(queryClient, previousStatus);
      return data;
    },
    onMutate: async ({ id, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.leads.all });
      const snapshots = queryClient.getQueriesData<LeadRow[]>({
        queryKey: queryKeys.leads.lists(),
      });
      queryClient.setQueriesData<LeadRow[]>(
        { queryKey: queryKeys.leads.lists() },
        (old) =>
          old?.map((lead) =>
            lead.id === id ? { ...lead, status: nextStatus } : lead,
          ) ?? [],
      );
      return { snapshot: snapshots.flatMap(([, data]) => data ?? []) };
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueriesData<LeadRow[]>(
          { queryKey: queryKeys.leads.lists() },
          context.snapshot,
        );
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leads.interactions(vars.id),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Interactions — listagem por lead
// ---------------------------------------------------------------------------

export function useLeadInteractions(leadId: string | undefined) {
  return useQuery<InteractionRow[]>({
    queryKey: leadId
      ? queryKeys.leads.interactions(leadId)
      : ['leads', 'interactions', 'none'],
    enabled: !!leadId,
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('lead_id', leadId)
        .order('occurred_at', { ascending: false });
      assertNoError(error);
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------------------
// Interactions — criação manual
// ---------------------------------------------------------------------------

export function useAddInteraction() {
  const queryClient = useQueryClient();

  return useMutation<InteractionRow, Error, InteractionCreateInput>({
    mutationFn: async (input) => {
      const workspaceId = await getCurrentWorkspaceId();
      const { data: userData } = await supabase.auth.getUser();

      const payload: InteractionInsert = {
        workspace_id: workspaceId,
        lead_id: input.lead_id,
        type: input.type,
        content: input.content,
        user_id: userData.user?.id ?? null,
        occurred_at: input.occurred_at ?? new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('interactions')
        .insert(payload)
        .select()
        .single();
      assertNoError(error);
      if (!data) throw new Error('Falha ao registrar interação');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.leads.interactions(data.lead_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leads.detail(data.lead_id),
      });
    },
  });
}
