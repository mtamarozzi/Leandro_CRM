import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';

// ============================================================================
// LoginPage
// ============================================================================
// Tela de login com o mesmo design system do CRM:
// - Fundo com gradiente radial (cinza + dourado)
// - Card glassmorphism centralizado
// - Logo real do Leandro no topo
// - Inputs com borda dourada ao focar
// - Botão primário dourado
// - Link para recuperação de senha
//
// Não tem link de "criar conta" porque o fluxo é manual (admin cria no painel).
// ============================================================================

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Informe email e senha.');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      // Tradução amigável dos erros mais comuns do Supabase
      const message =
        error.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos.'
          : error.message === 'Email not confirmed'
            ? 'Confirme seu email antes de entrar.'
            : 'Não foi possível entrar. Tente novamente.';
      setErrorMessage(message);
      return;
    }

    navigate({ to: '/' });
  };

  return (
    <div className="auth-page">
      {/* Camada de background com gradiente radial */}
      <div className="auth-bg" aria-hidden="true" />

      {/* Card central glassmorphism */}
      <div className="auth-card">
        <div className="auth-header">
          <img
            src="/imagens/logo-preta.png"
            alt="Leandro Alonso Consultoria Imobiliária"
            className="auth-logo"
          />
          <h1 className="auth-title">Bem-vindo de volta</h1>
          <p className="auth-subtitle">Entre com suas credenciais para acessar o CRM</p>
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

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              Senha
            </label>
            <div className="auth-password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="auth-input auth-input--password"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="auth-password-toggle"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="auth-error" role="alert">
              {errorMessage}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="auth-spinner" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Entrar
              </>
            )}
          </button>

          <div className="auth-footer-links">
            <Link to="/forgot-password" className="auth-link">
              Esqueci minha senha
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
