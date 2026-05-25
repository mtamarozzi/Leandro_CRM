import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { queryKeys } from '@/src/lib/queryKeys';
import { assertNoError, getCurrentWorkspaceId } from '@/src/lib/supabase-helpers';
import { showNotificationPopup } from '@/components/notifications/NotificationPopup';
import type { Database } from '@/src/types/database';

// ============================================================================
// useNotifications.ts — Hooks de notificações persistentes
// ============================================================================

type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

const NOTIFICATIONS_LIMIT = 30;

const NOTIFICATION_BADGE_LABELS: Record<NonNullable<NotificationInsert['type']>, string> = {
  new_lead: 'Lead',
  event_reminder: 'Agenda',
  lead_assigned: 'Lead',
  ai_insight: 'IA',
  ai_handoff: 'IA',
  system: 'Sistema',
};

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
  /** Se true, insere a row no banco mas não dispara popup+beep. Usado quando o
   *  gatilho da UI vai ser feito depois (ex.: scheduler de lembretes). */
  silent?: boolean;
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (sharedAudioCtx) return sharedAudioCtx;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  sharedAudioCtx = new Ctx();
  return sharedAudioCtx;
}

export function playNotificationBeep() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const start = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    };
    // Chrome/Safari suspendem o AudioContext quando ele é criado após um `await`
    // (fora do gesto inicial do usuário). `resume()` reativa na primeira vez.
    if (ctx.state === 'suspended') {
      void ctx.resume().then(start).catch(() => {});
    } else {
      start();
    }
  } catch {
    /* alguns browsers bloqueiam autoplay até a primeira interação do usuário */
  }
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
    return;
  }

  if (input.silent) return;

  showNotificationPopup({
    title: input.title,
    body: input.body,
    badge: NOTIFICATION_BADGE_LABELS[input.type],
  });
  playNotificationBeep();
}
