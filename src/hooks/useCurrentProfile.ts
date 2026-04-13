import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import type { Database } from '@/src/types/database';

// ============================================================================
// useCurrentProfile
// ============================================================================
// Hook que busca o profile (tabela public.profiles) do usuário autenticado.
// A tabela profiles é criada automaticamente pelo trigger handle_new_user
// quando um novo usuário se cadastra no auth.users.
//
// Retorna:
//  - profile: dados completos do profile ou null
//  - workspace: dados do workspace vinculado ou null
//  - loading: true enquanto a query inicial está rodando
//  - error: mensagem de erro se a query falhou
//
// Uso:
//   const { profile, workspace, loading } = useCurrentProfile();
// ============================================================================

type Profile = Database['public']['Tables']['profiles']['Row'];
type Workspace = Database['public']['Tables']['workspaces']['Row'];

interface UseCurrentProfileResult {
  profile: Profile | null;
  workspace: Workspace | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCurrentProfile(): UseCurrentProfileResult {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setWorkspace(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Busca o profile com join no workspace (Supabase faz isso automaticamente
      // quando usamos a notação 'table(*)' no select)
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*, workspaces(*)')
        .eq('id', user.id)
        .single();

      if (queryError) {
        throw queryError;
      }

      if (data) {
        // Separa profile do workspace (que veio aninhado)
        const { workspaces: workspaceData, ...profileData } = data as Profile & {
          workspaces: Workspace;
        };
        setProfile(profileData);
        setWorkspace(workspaceData);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar profile';
      setError(message);
      console.error('[useCurrentProfile] Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    profile,
    workspace,
    loading,
    error,
    refetch: fetchProfile,
  };
}
