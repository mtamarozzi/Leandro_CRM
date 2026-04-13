import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginPage } from '@/src/pages/LoginPage';
import { supabase } from '@/src/lib/supabase';

// ============================================================================
// /login — Rota pública
// ============================================================================
// Se o usuário JÁ está autenticado e acessa /login, redireciona para a home.
// Isso evita que alguém logado veja a tela de login novamente.
// ============================================================================

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});
