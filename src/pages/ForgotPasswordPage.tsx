import { useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';

// ============================================================================
// ForgotPasswordPage
// ============================================================================
// Tela de recuperação de senha. Usuário informa o email e recebe um link.
// O Supabase envia o email automaticamente (é preciso configurar o template
// de "Reset Password" no painel Supabase > Authentication > Email Templates).
// ============================================================================

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Informe seu email.');
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email.trim());
    setLoading(false);

    if (error) {
      setErrorMessage('Não foi possível enviar o email. Tente novamente.');
      return;
    }

    setSuccessMessage(
      'Enviamos um link de recuperação para seu email. Verifique sua caixa de entrada.'
    );
    setEmail('');
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" aria-hidden="true" />

      <div className="auth-card">
        <div className="auth-header">
          <img
            src="/imagens/logo-preta.png"
            alt="Leandro Alonso Consultoria Imobiliária"
            className="auth-logo"
          />
          <h1 className="auth-title">Recuperar senha</h1>
          <p className="auth-subtitle">
            Informe seu email e enviaremos um link para você criar uma nova senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label htmlFor="email" className="auth-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="auth-input"
              disabled={loading}
              required
            />
          </div>

          {errorMessage && (
            <div className="auth-error" role="alert">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="auth-success" role="status">
              {successMessage}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="auth-spinner" />
                Enviando...
              </>
            ) : (
              <>
                <Mail size={18} />
                Enviar link de recuperação
              </>
            )}
          </button>

          <div className="auth-footer-links">
            <Link to="/login" className="auth-link auth-link--with-icon">
              <ArrowLeft size={14} />
              Voltar para o login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
