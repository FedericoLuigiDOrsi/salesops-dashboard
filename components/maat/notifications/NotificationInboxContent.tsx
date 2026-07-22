"use client";

import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/maat/EmptyState";
import { SaleNotificationRow, OfferNotificationRow, ShipmentNotificationRow } from "@/components/maat/NotificationRow";
import { notificationsV2, notificationGroups, type NotificationV2 } from "@/lib/notifications-mock";
import { useOverlays } from "@/lib/overlays-store";
import { cn } from "@/lib/utils";

// Corpo riusabile della inbox notifiche: segmented + gruppi + righe. Consumato
// sia dalla pagina piena /notifiche sia dal float NotificationsPanel. Le righe
// aprono i float globali via telecomando (overlays-store); lo stato delle
// offerte è quello condiviso, keyed sull'id base (n-off-1 → off-1).

type FilterKey = "tutte" | "vendita" | "offerta" | "spedizione";

const FILTER_OPTIONS: { value: FilterKey; label: string }[] = [
  { value: "tutte", label: "Tutte" },
  { value: "vendita", label: "Vendite" },
  { value: "offerta", label: "Offerte" },
  { value: "spedizione", label: "Spedizioni" },
];

function baseOfferId(notificationId: string): string {
  return notificationId.replace(/^n-/, "");
}

export function NotificationInboxContent({ variant = "page" }: { variant?: "page" | "panel" }) {
  const { openOffer, openSale, offerStatus } = useOverlays();
  const [filter, setFilter] = useState<FilterKey>("tutte");

  const items = useMemo<NotificationV2[]>(
    () =>
      notificationsV2.map((n) => {
        if (n.type !== "offerta") return n;
        const override = offerStatus[baseOfferId(n.id)];
        return override ? { ...n, status: override.status, counterCents: override.counterCents ?? n.counterCents } : n;
      }),
    [offerStatus]
  );

  const counts = useMemo(
    () => Object.fromEntries(notificationGroups.map((g) => [g.key, items.filter(g.match).length])) as Record<string, number>,
    [items]
  );

  const visibleGroups = notificationGroups.filter((g) => filter === "tutte" || g.key === filter);

  return (
    <div>
      <div
        className={cn(
          "inline-flex flex-wrap gap-0.5 rounded-full bg-foreground/[.05] p-[3px]",
          variant === "page" ? "mb-6" : "mb-4"
        )}
      >
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            aria-pressed={filter === opt.value}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors",
              filter === opt.value && "bg-card text-foreground shadow-sm"
            )}
          >
            {opt.label}
            {opt.value !== "tutte" && <span className="font-mono text-[11px] text-muted-foreground/70">{counts[opt.value] ?? 0}</span>}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<Bell className="size-5 text-muted-foreground" />} title="Nessuna notifica" subtitle="Vendite, offerte e spedizioni appariranno qui." />
      ) : (
        <div className="flex flex-col gap-6">
          {visibleGroups.map((group) => {
            const groupItems = items.filter(group.match);
            if (groupItems.length === 0) return null;
            return (
              <section key={group.key}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">{group.label}</p>
                  <span className="font-mono text-xs text-muted-foreground">{groupItems.length}</span>
                </div>
                <div className="divide-y divide-border rounded-xl border border-border bg-card">
                  {groupItems.map((n) => {
                    if (n.type === "vendita") {
                      return <SaleNotificationRow key={n.id} notification={n} onOpen={() => n.sku && openSale(n.sku)} />;
                    }
                    if (n.type === "offerta") {
                      return <OfferNotificationRow key={n.id} notification={n} onOpen={() => openOffer(baseOfferId(n.id))} />;
                    }
                    return <ShipmentNotificationRow key={n.id} notification={n} />;
                  })}
                </div>
              </section>
            );
          })}

          {visibleGroups.every((group) => items.filter(group.match).length === 0) && (
            <EmptyState icon={<Bell className="size-5 text-muted-foreground" />} title="Nessuna notifica in questa categoria" />
          )}
        </div>
      )}
    </div>
  );
}
