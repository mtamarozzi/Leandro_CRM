import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { queryClient } from '@/src/lib/queryClient';

// ============================================================================
// __root.tsx — Rota raiz
// ============================================================================
// Esta rota é o "pai" de todas as outras. Tudo que está aqui é herdado por
// cada rota filha. Usamos para:
//   1. Envolver o app com <QueryClientProvider> (cache global do React Query)
//   2. Envolver o app com <AuthProvider> (estado global de autenticação)
//   3. Montar o <Outlet /> onde cada rota filha será renderizada
//   4. Carregar as DevTools (Router + React Query) em modo desenvolvimento
//
// Ordem dos providers importa:
//   QueryClientProvider deve estar POR FORA do AuthProvider, porque o
//   AuthProvider pode (no futuro) usar React Query internamente.
// ============================================================================

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        {import.meta.env.DEV && (
          <>
            <TanStackRouterDevtools position="bottom-right" />
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          </>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}
