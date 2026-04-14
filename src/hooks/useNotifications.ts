import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { queryKeys } from '@/src/lib/queryKeys';
import { assertNoError, getCurrentWorkspaceId } from '@/src/lib/supabase-helpers';
import type { Database } from '@/src/types/database';

// ============================================================================
// useNotifications.ts — Hooks de notificações persistentes
// ============================================================================

type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

const NOTIFICATIONS_LIMIT = 30;

export function useNotifications() {
  return useQuery<NotificationRow[]>({
    queryKey: queryKeys.notifications.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(NOTIFICATIONS_LIMIT);
      assertNoError(error);
      return data ?? [];
    },
    refetchInterval: 60_000,
  });
}

export function useUnreadNotificationsCount() {
  return useQuery<number>({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null);
      assertNoError(error);
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
      assertNoError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null);
      assertNoError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export interface CreateNotificationInput {
  type: NotificationInsert['type'];
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    console.warn('[createNotification] sem usuário autenticado, pulando');
    return;
  }

  const { error } = await supabase.from('notifications').insert({
    workspace_id: workspaceId,
    user_id: userData.user.id,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    metadata: (input.metadata ?? null) as NotificationInsert['metadata'],
  });

  if (error) {
    console.error('[createNotification] erro ao inserir:', error);
  }
}
