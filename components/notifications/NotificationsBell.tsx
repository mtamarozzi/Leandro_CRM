import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationsCount,
} from '@/src/hooks/useNotifications';

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const notificationsQuery = useNotifications();
  const unreadQuery = useUnreadNotificationsCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notificationsQuery.data ?? [];
  const unread = unreadQuery.data ?? 0;

  return (
    <div className="notifications-wrap">
      <button
        type="button"
        className="icon-btn notifications-bell"
        aria-label="Notificações"
        title="Notificações"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={18} />
        {unread > 0 && <span className="notifications-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <>
          <div className="notifications-overlay" onClick={() => setOpen(false)} />
          <div className="notifications-dropdown" role="dialog" aria-label="Notificações">
            <header className="notifications-dropdown__header">
              <span className="notifications-dropdown__title">Notificações</span>
              {unread > 0 && (
                <button
                  type="button"
                  className="notifications-dropdown__action"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  title="Marcar todas como lidas"
                >
                  <CheckCheck size={14} aria-hidden="true" />
                  <span>Marcar tudo</span>
                </button>
              )}
            </header>

            {notificationsQuery.isLoading && (
              <p className="notifications-dropdown__empty">Carregando…</p>
            )}

            {!notificationsQuery.isLoading && notifications.length === 0 && (
              <p className="notifications-dropdown__empty">Sem notificações por enquanto.</p>
            )}

            <ul className="notifications-list">
              {notifications.map((n) => {
                const isUnread = n.read_at === null;
                const date = new Date(n.created_at).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <li
                    key={n.id}
                    className={`notifications-item ${isUnread ? 'notifications-item--unread' : ''}`}
                    onClick={() => {
                      if (isUnread) markRead.mutate(n.id);
                    }}
                  >
                    <div className="notifications-item__title">{n.title}</div>
                    {n.body && <p className="notifications-item__body">{n.body}</p>}
                    <time className="notifications-item__date">{date}</time>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
