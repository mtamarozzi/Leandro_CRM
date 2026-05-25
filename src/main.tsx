import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import './index.css';

// ============================================================================
// main.tsx — Ponto de entrada da aplicação
// ============================================================================
// Em vez de renderizar <App /> diretamente como antes, agora o app é
// renderizado pelo RouterProvider do TanStack Router.
//
// O arquivo routeTree.gen.ts é gerado automaticamente pelo plugin
// TanStackRouterVite toda vez que qualquer arquivo em src/routes/ é salvo.
// ============================================================================

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

// Registro de tipos para ter autocomplete e validação em todas as rotas
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
