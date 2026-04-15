import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { supabase } from '@/src/lib/supabase';
import { useReminderScheduler } from '@/src/hooks/useReminderScheduler';

// ============================================================================
// _authenticated.tsx — Layout protegido
// ============================================================================
// Rotas dentro de src/routes/_authenticated/ herdam este guard.
// Se não houver sessão válida, redireciona para /login preservando
// a URL de origem em search params (para voltar após o login).
//
// O prefixo "_" faz com que esse segmento NÃO apareça na URL (é um
// "layout route" do TanStack Router).
// ============================================================================

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  useReminderScheduler();
  return <Outlet />;
}
