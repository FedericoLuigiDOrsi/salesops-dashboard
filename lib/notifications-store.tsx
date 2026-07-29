"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { mockNotifications } from "@/lib/maat-mock";
import { notificationsV2 } from "@/lib/notifications-mock";
import type { Notification } from "@/types/maat";

/**
 * Store notifiche condiviso: fonte di verità per il badge in AppShell, per la
 * pagina /notifiche e per il float NotificationsPanel (montati come istanze
 * separate di NotificationInboxContent — senza questo store ognuno aveva il
 * proprio `readIds` locale, quindi segnare letta in un punto non si vedeva
 * nell'altro né sul badge). `notifications` (draft_ready/local_save) resta
 * per compatibilità con HomeDashboard ("Notifiche recenti"); `readIdsV2` e
 * `deletedIdsV2` coprono letto/non letto ed eliminazione per l'inbox v2
 * (vendite/offerte/spedizioni) — lo stato delle offerte (accetta/rifiuta)
 * resta nel telecomando overlays-store, che è cosa diversa dalla lettura.
 */
interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  unreadCountV2: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  isUnreadV2: (id: string, baseUnread: boolean) => boolean;
  isDeletedV2: (id: string) => boolean;
  toggleReadV2: (id: string, baseUnread: boolean) => void;
  removeV2: (id: string) => void;
  markAllReadV2: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  // Override esplicito letto/non letto per id, sopra il flag `unread` di base
  // dei mock — assente = usa il valore di base. Permette il toggle in
  // entrambe le direzioni (non solo "segna come letta").
  const [unreadOverridesV2, setUnreadOverridesV2] = useState<Record<string, boolean>>({});
  const [deletedIdsV2, setDeletedIdsV2] = useState<Set<string>>(() => new Set());

  const isUnreadV2 = (id: string, baseUnread: boolean) => unreadOverridesV2[id] ?? baseUnread;

  const unreadCountV2 = useMemo(
    () => notificationsV2.filter((n) => !deletedIdsV2.has(n.id) && isUnreadV2(n.id, n.unread)).length,
    [unreadOverridesV2, deletedIdsV2]
  );
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.letta).length + unreadCountV2,
    [notifications, unreadCountV2]
  );

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      unreadCountV2,
      markRead: (id) =>
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, letta: true } : n))),
      markAllRead: () => setNotifications((prev) => prev.map((n) => ({ ...n, letta: true }))),
      remove: (id) => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      isUnreadV2,
      isDeletedV2: (id) => deletedIdsV2.has(id),
      toggleReadV2: (id, baseUnread) =>
        setUnreadOverridesV2((prev) => ({ ...prev, [id]: !(prev[id] ?? baseUnread) })),
      removeV2: (id) => setDeletedIdsV2((prev) => new Set(prev).add(id)),
      markAllReadV2: () =>
        setUnreadOverridesV2((prev) => {
          const next = { ...prev };
          notificationsV2.forEach((n) => {
            next[n.id] = false;
          });
          return next;
        }),
    }),
    [notifications, unreadCount, unreadOverridesV2, deletedIdsV2]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
}
