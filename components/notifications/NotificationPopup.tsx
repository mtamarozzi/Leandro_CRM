import { useEffect, useSyncExternalStore } from 'react';
import { BellRing, X } from 'lucide-react';

// ============================================================================
// NotificationPopup.tsx — popup custom fixo no topo direito
// ============================================================================
// Substitui `toast.info` do sonner, que tinha comportamento instável com o
// `<Toaster richColors>` configurado. Modelo visual espelhado do CRM_FVC
// (card com faixa lateral azul, ícone de sino, badge do tipo do evento, X
// para fechar manualmente) e portado para React.
//
// API imperativa: `showNotificationPopup({ title, body, badge })` dispara um
// popup. O <NotificationPopupContainer/> precisa estar montado na rota raiz.
// ============================================================================

export interface NotificationPopupInput {
  title: string;
  body?: string;
  badge?: string;
  durationMs?: number;
}

interface ActivePopup extends NotificationPopupInput {
  id: string;
}

const DEFAULT_DURATION_MS = 8000;

let popups: ActivePopup[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function getSnapshot() {
  return popups;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function dismiss(id: string) {
  popups = popups.filter((p) => p.id !== id);
  notify();
}

export function showNotificationPopup(input: NotificationPopupInput): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `popup-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  popups = [...popups, { ...input, id }];
  notify();
  return id;
}

function Popup({ popup }: { popup: ActivePopup }) {
  useEffect(() => {
    const timer = window.setTimeout(
      () => dismiss(popup.id),
      popup.durationMs ?? DEFAULT_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [popup.id, popup.durationMs]);

  return (
    <div className="notification-popup" role="alert" aria-live="polite">
      <div className="notification-popup__header">
        <span className="notification-popup__title">
          <BellRing size={16} aria-hidden="true" />
          Lembrete Importante
        </span>
        <button
          type="button"
          className="notification-popup__close"
          aria-label="Fechar"
          onClick={() => dismiss(popup.id)}
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="notification-popup__main">
        <div className="notification-popup__main-title">{popup.title}</div>
        {popup.badge && (
          <div className="notification-popup__badge">{popup.badge}</div>
        )}
      </div>
      {popup.body && <div className="notification-popup__body">{popup.body}</div>}
    </div>
  );
}

export function NotificationPopupContainer() {
  const active = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (active.length === 0) return null;
  return (
    <div className="notification-popup-stack" aria-live="polite">
      {active.map((popup) => (
        <Popup key={popup.id} popup={popup} />
      ))}
    </div>
  );
}
