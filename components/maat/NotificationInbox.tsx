"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertTriangle, X } from "lucide-react";
import { NotificationRow } from "@/components/maat/NotificationRow";
import { EmptyState } from "@/components/maat/EmptyState";
import { SegmentedFilter } from "@/components/maat/SegmentedFilter";
import { mockCatalogEntries, mockNotifications } from "@/lib/maat-mock";
import type { Notification } from "@/types/maat";

type Filter = "tutte" | "non-lette";

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "tutte", label: "Tutte" },
  { value: "non-lette", label: "Non lette" },
];

export function NotificationInbox() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<Filter>("tutte");
  const [deadLink, setDeadLink] = useState(false);

  const sorted = useMemo(
    () => [...notifications].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [notifications]
  );
  const filtered = filter === "non-lette" ? sorted.filter((n) => !n.letta) : sorted;
  const isGlobalEmpty = notifications.length === 0;

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, letta: true } : n)));
  }

  function remove(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

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
        <SegmentedFilter options={FILTER_OPTIONS} active={filter} onChange={setFilter} />
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
        <div className="flex flex-col gap-0.5">
          {filtered.map((n) => (
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
      )}
    </div>
  );
}
