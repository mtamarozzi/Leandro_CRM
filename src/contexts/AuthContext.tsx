import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase';

// ============================================================================
// AuthContext
// ============================================================================
// Context global de autenticação. Mantém o estado de sessão do usuário
// e expõe funções para login, logout e recuperação de senha.
//
// Uso:
//   const { user, session, signIn, signOut, loading } = useAuth();
// ============================================================================

interface AuthContextValue {
  /** Usuário autenticado ou null se não logado */
  user: User | null;
  /** Sessão ativa ou null se não logado */
  session: Session | null;
  /** true enquanto a sessão inicial está sendo verificada */
  loading: boolean;
  /** Faz login com email + senha */
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  /** Encerra a sessão atual */
  signOut: () => Promise<void>;
  /** Envia email de recuperação de senha */
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  /** Atualiza a senha do usuário logado (usado na tela de reset) */
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Ao montar, verifica se já existe sessão salva (localStorage)
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // 2. Assina mudanças de autenticação (login, logout, refresh de token)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signIn, signOut, resetPassword, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook para consumir o contexto. Lança erro se usado fora do AuthProvider.
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um <AuthProvider>');
  }
  return context;
}
