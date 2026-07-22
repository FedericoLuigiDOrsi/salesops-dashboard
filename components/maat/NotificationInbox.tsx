"use client";

import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/maat/EmptyState";
import { SaleNotificationRow, OfferNotificationRow, ShipmentNotificationRow } from "@/components/maat/NotificationRow";
import { OfferPopup } from "@/components/maat/notifications/OfferPopup";
import { ArticlePreview } from "@/components/maat/notifications/ArticlePreview";
import { ActivityModal } from "@/components/maat/notifications/ActivityModal";
import { notificationsV2, notificationGroups, type NotificationV2, type OfferNotification } from "@/lib/notifications-mock";
import { cn } from "@/lib/utils";
import type { OfferStatus } from "@/types/maat";

// Inbox notifiche v2 — mirror di public/mobile/maat-shell-account.html
// righe 1738-1751 (markup) + 3467-3577 (logica). Segmented Tutte/Vendite/
// Offerte/Spedizioni con conteggi live, gruppi Vendite eseguite/Offerte
// ricevute/Spedizioni e altro, popup risposta offerta e anteprima articolo.

type FilterKey = "tutte" | "vendita" | "offerta" | "spedizione";

const FILTER_OPTIONS: { value: FilterKey; label: string }[] = [
  { value: "tutte", label: "Tutte" },
  { value: "vendita", label: "Vendite" },
  { value: "offerta", label: "Offerte" },
  { value: "spedizione", label: "Spedizioni" },
];

export function NotificationInbox() {
  const [filter, setFilter] = useState<FilterKey>("tutte");
  const [offerOverrides, setOfferOverrides] = useState<Record<string, { status: OfferStatus; counterCents?: number }>>({});
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);
  const [previewSku, setPreviewSku] = useState<string | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);

  // Stato locale delle offerte (accetta/rifiuta/controfferta) sovrapposto ai
  // dati mock — nessuno store condiviso, coerente col resto della schermata.
  const items = useMemo<NotificationV2[]>(
    () =>
      notificationsV2.map((n) => {
        if (n.type !== "offerta") return n;
        const override = offerOverrides[n.id];
        return override ? { ...n, status: override.status, counterCents: override.counterCents ?? n.counterCents } : n;
      }),
    [offerOverrides]
  );

  const counts = useMemo(
    () => Object.fromEntries(notificationGroups.map((g) => [g.key, items.filter(g.match).length])) as Record<string, number>,
    [items]
  );

  const visibleGroups = notificationGroups.filter((g) => filter === "tutte" || g.key === filter);
  const activeOffer = items.find((n): n is OfferNotification => n.type === "offerta" && n.id === activeOfferId) ?? null;
  const offerItems = items.filter((n): n is OfferNotification => n.type === "offerta");

  function handleResolve(id: string, status: OfferStatus, counterCents?: number) {
    setOfferOverrides((prev) => ({ ...prev, [id]: { status, counterCents } }));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Inbox</p>
          <h1 className="text-[28px] font-bold tracking-tight">Notifiche</h1>
        </div>
        <button
          type="button"
          onClick={() => setActivityOpen(true)}
          className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Visualizza tutte
        </button>
      </div>

      <div className="mb-6 inline-flex flex-wrap gap-0.5 rounded-full bg-foreground/[.05] p-[3px]">
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
            {opt.value !== "tutte" && <span className="font-mono text-[11px] text-muted-foreground">{counts[opt.value] ?? 0}</span>}
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
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">{group.label}</p>
                  <span className="font-mono text-xs text-muted-foreground">{groupItems.length}</span>
                </div>
                <div className="divide-y divide-border rounded-xl border border-border bg-card">
                  {groupItems.map((n) => {
                    if (n.type === "vendita") {
                      return <SaleNotificationRow key={n.id} notification={n} onOpen={() => setPreviewSku(n.sku ?? null)} />;
                    }
                    if (n.type === "offerta") {
                      return <OfferNotificationRow key={n.id} notification={n} onOpen={() => setActiveOfferId(n.id)} />;
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

      <OfferPopup offer={activeOffer} open={activeOffer !== null} onOpenChange={(open) => !open && setActiveOfferId(null)} onResolve={handleResolve} />
      <ArticlePreview sku={previewSku} open={previewSku !== null} onOpenChange={(open) => !open && setPreviewSku(null)} />
      <ActivityModal open={activityOpen} onOpenChange={setActivityOpen} offers={offerItems} />
    </div>
  );
}
