import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { queryKeys } from '@/src/lib/queryKeys';
import { assertNoError } from '@/src/lib/supabase-helpers';
import {
  LEAD_ORIGINS,
  LEAD_ORIGIN_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadOrigin,
  type LeadStatus,
} from '@/src/lib/schemas/lead-schema';

// ============================================================================
// useDashboard.ts — Queries agregadas do Dashboard
// ============================================================================
// Decisões aplicadas (3.5 perguntas 1 e 2):
//  - "Leads do mês" = leads criados no mês corrente (primeiro ao último dia)
//  - Taxa de conversão = ganho / (ganho + perdido)
// ============================================================================

export interface DashboardKpis {
  totalLeads: number;
  leadsThisMonth: number;
  conversionRate: number;
  totalProperties: number;
}

function startOfMonth(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return d.toISOString();
}

function endOfMonth(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return d.toISOString();
}

export function useDashboardKpis() {
  return useQuery<DashboardKpis>({
    queryKey: queryKeys.dashboard.kpis(),
    queryFn: async () => {
      const monthStart = startOfMonth();
      const monthEnd = endOfMonth();

      const [totalLeads, leadsThisMonth, wonLeads, lostLeads, totalProperties] =
        await Promise.all([
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .is('deleted_at', null),
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .is('deleted_at', null)
            .gte('created_at', monthStart)
            .lte('created_at', monthEnd),
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .is('deleted_at', null)
            .eq('status', 'ganho'),
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .is('deleted_at', null)
            .eq('status', 'perdido'),
          supabase
            .from('properties')
            .select('id', { count: 'exact', head: true })
            .is('deleted_at', null),
        ]);

      assertNoError(totalLeads.error);
      assertNoError(leadsThisMonth.error);
      assertNoError(wonLeads.error);
      assertNoError(lostLeads.error);
      assertNoError(totalProperties.error);

      const won = wonLeads.count ?? 0;
      const lost = lostLeads.count ?? 0;
      const decided = won + lost;
      const conversionRate = decided === 0 ? 0 : (won / decided) * 100;

      return {
        totalLeads: totalLeads.count ?? 0,
        leadsThisMonth: leadsThisMonth.count ?? 0,
        conversionRate,
        totalProperties: totalProperties.count ?? 0,
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Distribuição de leads por status (funnel chart)
// ---------------------------------------------------------------------------

export interface FunnelChartDatum {
  status: LeadStatus;
  label: string;
  value: number;
}

export function useLeadsByStatus() {
  return useQuery<FunnelChartDatum[]>({
    queryKey: queryKeys.dashboard.funnelChart(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('status')
        .is('deleted_at', null);
      assertNoError(error);

      const counts: Record<LeadStatus, number> = {
        novo: 0,
        contato: 0,
        visita: 0,
        proposta: 0,
        ganho: 0,
        perdido: 0,
      };
      for (const row of data ?? []) {
        counts[row.status as LeadStatus]++;
      }

      return LEAD_STATUSES.map((status) => ({
        status,
        label: LEAD_STATUS_LABELS[status],
        value: counts[status],
      }));
    },
  });
}

// ---------------------------------------------------------------------------
// Distribuição de leads por origem (pie chart)
// ---------------------------------------------------------------------------

export interface SourceChartDatum {
  origin: LeadOrigin;
  label: string;
  value: number;
}

export function useLeadsBySource() {
  return useQuery<SourceChartDatum[]>({
    queryKey: queryKeys.dashboard.sourceChart(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('origin')
        .is('deleted_at', null);
      assertNoError(error);

      const counts: Record<LeadOrigin, number> = {
        chat_widget: 0,
        whatsapp: 0,
        facebook: 0,
        instagram: 0,
        google: 0,
        indicacao: 0,
        site: 0,
        trafego_pago: 0,
        manual: 0,
        outro: 0,
      };
      for (const row of data ?? []) {
        counts[row.origin as LeadOrigin]++;
      }

      return LEAD_ORIGINS.map((origin) => ({
        origin,
        label: LEAD_ORIGIN_LABELS[origin],
        value: counts[origin],
      })).filter((d) => d.value > 0);
    },
  });
}
