import { useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { showNotificationPopup } from '@/components/notifications/NotificationPopup';
import { playNotificationBeep } from './useNotifications';
import { EVENT_TYPE_LABELS } from '@/src/lib/schemas/event-schema';
import type { Database } from '@/src/types/database';

// ============================================================================
// useReminderScheduler.ts — Sub-bloco 3.7
// ============================================================================
// Faz polling a cada 30s dos eventos agendados e dispara popup + beep quando
// o horário atual entra na janela [starts_at - reminder_minutes_before,
// starts_at). Inspirado no `checkAlarms` do CRM_FVC, adaptado para React.
//
// Dedup via localStorage: cada event_id fica marcado como "já disparado" por
// 7 dias, evitando duplicação em refresh ou reabertura da aba.
//
// Deve ser montado numa rota autenticada (ver _authenticated.tsx).
// ============================================================================

type EventRow = Database['public']['Tables']['events']['Row'];

const POLL_INTERVAL_MS = 30_000;
const LOOKAHEAD_MS = 24 * 60 * 60 * 1000; // 24h pra frente
const STORAGE_KEY = 'crm:fired-event-reminders';
const ENTRY_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

type FiredMap = Record<string, number>;

function loadFired(): FiredMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as FiredMap;
    const now = Date.now();
    const cleaned: FiredMap = {};
    for (const [id, firedAt] of Object.entries(parsed)) {
      if (now - firedAt < ENTRY_TTL_MS) cleaned[id] = firedAt;
    }
    return cleaned;
  } catch {
    return {};
  }
}

function saveFired(map: FiredMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota cheia ou modo privado — silencioso */
  }
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function checkReminders() {
  const now = Date.now();
  const lookaheadIso = new Date(now + LOOKAHEAD_MS).toISOString();

  const { data, error } = await supabase
    .from('events')
    .select('id, title, type, status, starts_at, reminder_minutes_before')
    .gte('starts_at', new Date(now).toISOString())
    .lte('starts_at', lookaheadIso)
    .not('reminder_minutes_before', 'is', null);

  if (error) {
    console.warn('[reminder-scheduler] falha ao buscar eventos:', error);
    return;
  }

  const events = (data ?? []) as Pick<
    EventRow,
    'id' | 'title' | 'type' | 'status' | 'starts_at' | 'reminder_minutes_before'
  >[];

  const fired = loadFired();
  let changed = false;

  for (const ev of events) {
    if (ev.status === 'cancelado' || ev.status === 'realizado') continue;
    if (!ev.reminder_minutes_before || ev.reminder_minutes_before <= 0) continue;
    if (fired[ev.id]) continue;

    const startsAt = new Date(ev.starts_at).getTime();
    const remindAt = startsAt - ev.reminder_minutes_before * 60 * 1000;

    if (remindAt <= now && now < startsAt) {
      const label = EVENT_TYPE_LABELS[ev.type] ?? 'Evento';
      showNotificationPopup({
        title: `Lembrete: ${label}`,
        body: `${ev.title} · ${formatWhen(ev.starts_at)}`,
        badge: 'Agenda',
      });
      playNotificationBeep();
      fired[ev.id] = Date.now();
      changed = true;
    }
  }

  if (changed) saveFired(fired);
}

export function useReminderScheduler() {
  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      void checkReminders();
    };

    // Primeira checagem imediata + polling + re-checagem quando a aba volta.
    run();
    const interval = window.setInterval(run, POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
