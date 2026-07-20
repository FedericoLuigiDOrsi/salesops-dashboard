"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { mockNotifications } from "@/lib/maat-mock";
import { notificationsV2 } from "@/lib/notifications-mock";
import type { Notification } from "@/types/maat";

/**
 * Store notifiche condiviso: fonte di verità per il badge in AppShell.
 * `notifications` (draft_ready/local_save) resta per compatibilità con
 * HomeDashboard ("Notifiche recenti"). Il conteggio non letti ora somma anche
 * la nuova inbox v2 (vendite/offerte/spedizioni) — vedi NotificationInbox,
 * che gestisce il proprio stato locale e non scrive su questo store.
 */
interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const unreadV2Count = notificationsV2.filter((n) => n.unread).length;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.letta).length + unreadV2Count, [notifications]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      markRead: (id) =>
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, letta: true } : n))),
      markAllRead: () => setNotifications((prev) => prev.map((n) => ({ ...n, letta: true }))),
      remove: (id) => setNotifications((prev) => prev.filter((n) => n.id !== id)),
    }),
    [notifications, unreadCount]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
}
