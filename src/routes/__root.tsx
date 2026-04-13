import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { AuthProvider } from '@/src/contexts/AuthContext';

// ============================================================================
// __root.tsx — Rota raiz
// ============================================================================
// Esta rota é o "pai" de todas as outras. Tudo que está aqui é herdado por
// cada rota filha. Usamos para:
//   1. Envolver o app com <AuthProvider> (estado global de autenticação)
//   2. Montar o <Outlet /> onde cada rota filha será renderizada
//   3. Carregar as DevTools do Router em modo desenvolvimento
// ============================================================================

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </AuthProvider>
  );
}
