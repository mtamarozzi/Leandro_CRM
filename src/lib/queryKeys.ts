// ============================================================================
// queryKeys.ts — Fábrica de chaves de cache do React Query
// ============================================================================
// Padrão "Query Key Factory" recomendado pela documentação do React Query.
//
// Por que centralizar?
// 1. Evita strings mágicas espalhadas pelo código
// 2. Facilita invalidação em cascata (ex: invalidar todas as queries de leads
//    de uma vez chamando queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }))
// 3. Garante consistência de tipos
// 4. Documenta de uma vez todas as queries existentes na aplicação
//
// Convenção de nomes:
// - `all`       → chave raiz da entidade (sem filtros)
// - `lists()`   → chave de lista (sem filtros específicos)
// - `list(filters)` → chave de lista com filtros aplicados
// - `details()` → chave raiz de detalhes (sem ID)
// - `detail(id)` → chave de detalhe específico
//
// Exemplo de invalidação em cascata:
//   queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
//   → invalida TUDO relacionado a leads (lista + detalhes + filtros)
// ============================================================================

export const queryKeys = {
  // -------------------- Workspace e Profile --------------------
  workspace: {
    all: ['workspace'] as const,
    current: () => [...queryKeys.workspace.all, 'current'] as const,
  },

  profile: {
    all: ['profile'] as const,
    current: () => [...queryKeys.profile.all, 'current'] as const,
  },

  // -------------------- Properties (Imóveis) --------------------
  properties: {
    all: ['properties'] as const,
    lists: () => [...queryKeys.properties.all, 'list'] as const,
    list: (filters?: PropertyFilters) =>
      [...queryKeys.properties.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.properties.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.properties.details(), id] as const,
    media: (propertyId: string) =>
      [...queryKeys.properties.detail(propertyId), 'media'] as const,
  },

  // -------------------- Leads --------------------
  leads: {
    all: ['leads'] as const,
    lists: () => [...queryKeys.leads.all, 'list'] as const,
    list: (filters?: LeadFilters) =>
      [...queryKeys.leads.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.leads.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.leads.details(), id] as const,
    interactions: (leadId: string) =>
      [...queryKeys.leads.detail(leadId), 'interactions'] as const,
    properties: (leadId: string) =>
      [...queryKeys.leads.detail(leadId), 'properties'] as const,
  },

  // -------------------- Events (Agenda) --------------------
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (filters?: EventFilters) =>
      [...queryKeys.events.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,
  },

  // -------------------- Notifications --------------------
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },

  // -------------------- Dashboard (queries agregadas) --------------------
  dashboard: {
    all: ['dashboard'] as const,
    kpis: () => [...queryKeys.dashboard.all, 'kpis'] as const,
    funnelChart: () => [...queryKeys.dashboard.all, 'funnel-chart'] as const,
    sourceChart: () => [...queryKeys.dashboard.all, 'source-chart'] as const,
  },
} as const;

// ============================================================================
// Tipos de filtros (usados pelas chaves para diferenciar o cache)
// ============================================================================

export interface PropertyFilters {
  purpose?: 'venda' | 'locacao' | 'lancamento';
  status?: 'disponivel' | 'reservado' | 'alugado' | 'vendido' | 'indisponivel';
  city?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface LeadFilters {
  status?: 'novo' | 'contato' | 'visita' | 'proposta' | 'ganho' | 'perdido';
  origin?: string;
  search?: string;
  region?: string;
}

export interface EventFilters {
  /** Início do intervalo a buscar (ISO string). */
  from?: string;
  /** Fim do intervalo a buscar (ISO string). */
  to?: string;
  type?: 'followup' | 'visita' | 'reuniao' | 'tarefa' | 'ligacao';
  status?: 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'nao_compareceu';
}
