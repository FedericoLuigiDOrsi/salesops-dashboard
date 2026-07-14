"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isToday, isYesterday, format } from "date-fns";
import { it } from "date-fns/locale";
import { Bell, AlertTriangle, X, CheckCheck } from "lucide-react";
import { NotificationRow } from "@/components/maat/NotificationRow";
import { EmptyState } from "@/components/maat/EmptyState";
import { SegmentedFilter } from "@/components/maat/SegmentedFilter";
import { mockCatalogEntries } from "@/lib/maat-mock";
import { useNotifications } from "@/lib/notifications-store";
import type { Notification } from "@/types/maat";

type Filter = "tutte" | "non-lette";

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "tutte", label: "Tutte" },
  { value: "non-lette", label: "Non lette" },
];

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Oggi";
  if (isYesterday(d)) return "Ieri";
  return format(d, "EEEE d MMMM", { locale: it });
}

export function NotificationInbox() {
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead, remove } = useNotifications();
  const [filter, setFilter] = useState<Filter>("tutte");
  const [deadLink, setDeadLink] = useState(false);

  const sorted = useMemo(
    () => [...notifications].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [notifications]
  );
  const filtered = filter === "non-lette" ? sorted.filter((n) => !n.letta) : sorted;
  const isGlobalEmpty = notifications.length === 0;

  // Raggruppa per giorno preservando l'ordine (già ordinato desc).
  const groups = useMemo(() => {
    const acc: { label: string; items: Notification[] }[] = [];
    for (const n of filtered) {
      const label = dayLabel(n.timestamp);
      const last = acc[acc.length - 1];
      if (last && last.label === label) last.items.push(n);
      else acc.push({ label, items: [n] });
    }
    return acc;
  }, [filtered]);

  function navigate(n: Notification) {
    markRead(n.id);
    const entryExists = mockCatalogEntries.some((e) => e.id === n.catalogEntryId);
    if (entryExists) {
      router.push(`/capi/${n.catalogEntryId}`);
    } else {
      setDeadLink(true);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Inbox
          </p>
          <h1 className="text-[28px] font-bold tracking-tight">Notifiche</h1>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-foreground/[.04] hover:text-foreground"
            >
              <CheckCheck className="size-3.5" />
              Segna tutte lette
              <span className="font-mono text-xs text-muted-foreground">{unreadCount}</span>
            </button>
          )}
          <SegmentedFilter options={FILTER_OPTIONS} active={filter} onChange={setFilter} />
        </div>
      </div>

      {deadLink && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="flex-1">Questo capo non è più disponibile.</span>
          <button type="button" onClick={() => setDeadLink(false)} aria-label="Chiudi">
            <X className="size-4" />
          </button>
        </div>
      )}

      {isGlobalEmpty ? (
        <EmptyState
          icon={<Bell className="size-5 text-muted-foreground" />}
          title="Nessuna notifica"
          subtitle="Le notifiche su bozze pronte e salvataggi locali appariranno qui."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-5 text-muted-foreground" />}
          title="Nessuna notifica non letta"
          subtitle="Sei aggiornato — torna più tardi."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <p className="mb-1 px-1 font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70 first-letter:uppercase">
                {group.label}
              </p>
              {group.items.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  entry={mockCatalogEntries.find((e) => e.id === n.catalogEntryId)}
                  onNavigate={() => navigate(n)}
                  onMarkRead={() => markRead(n.id)}
                  onDelete={() => remove(n.id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
