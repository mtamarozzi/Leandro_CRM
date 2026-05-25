import { QueryClient } from '@tanstack/react-query';

// ============================================================================
// queryClient.ts — Instância única do React Query
// ============================================================================
// O QueryClient gerencia o cache de todas as queries da aplicação.
// Configurações ajustadas para o contexto do CRM:
//
// - staleTime: dados são considerados "frescos" por 30s (não refaz requisição
//   se o usuário trocar de tela e voltar dentro desse intervalo)
// - gcTime: dados ficam no cache por 5 minutos antes de serem coletados
//   (gcTime substituiu cacheTime na v5)
// - retry: 1 tentativa automática em caso de falha (não 3, que é o padrão)
// - refetchOnWindowFocus: false (irritante se o usuário trocar de aba)
// - refetchOnReconnect: true (importante: se a internet cair e voltar,
//   refaz automaticamente)
// ============================================================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
