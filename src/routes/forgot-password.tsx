import { createFileRoute } from '@tanstack/react-router';
import { ForgotPasswordPage } from '@/src/pages/ForgotPasswordPage';

// ============================================================================
// /forgot-password — Rota pública
// ============================================================================
// Tela simples onde o usuário informa o email e recebe um link de reset.
// O link vai para /reset-password?access_token=... que ainda não existe
// (pode ser adicionado em uma etapa futura se necessário).
// ============================================================================

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
});
