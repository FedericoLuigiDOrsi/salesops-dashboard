"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { mockNotifications } from "@/lib/maat-mock";
import type { Notification } from "@/types/maat";

/**
 * Store notifiche condiviso: una sola fonte di verità così il badge in AppShell
 * e la inbox restano in sync (segna-letta / segna-tutte azzera il badge live).
 */
interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.letta).length, [notifications]);

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
