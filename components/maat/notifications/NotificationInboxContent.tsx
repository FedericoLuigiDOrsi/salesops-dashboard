"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/maat/EmptyState";
import { SaleNotificationRow, OfferNotificationRow, ShipmentNotificationRow } from "@/components/maat/NotificationRow";
import { notificationsV2, notificationGroups, type NotificationV2 } from "@/lib/notifications-mock";
import { useOverlays } from "@/lib/overlays-store";
import { useNotifications } from "@/lib/notifications-store";
import { cn } from "@/lib/utils";

// Corpo riusabile della inbox notifiche: segmented + gruppi + righe. Consumato
// sia dalla pagina piena /notifiche sia dal float NotificationsPanel. Le righe
// aprono i float globali via telecomando (overlays-store); lo stato delle
// offerte è quello condiviso, keyed sull'id base (n-off-1 → off-1). Letto/non
// letto ed eliminazione vivono in notifications-store — condiviso tra le due
// istanze montate (pagina + float) e con il badge in AppShell.

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

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const rowVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } },
};

export function NotificationInboxContent({ variant = "page" }: { variant?: "page" | "panel" }) {
  const { openOffer, openSale, offerStatus } = useOverlays();
  const { isUnreadV2, isDeletedV2, toggleReadV2, removeV2 } = useNotifications();
  const [filter, setFilter] = useState<FilterKey>("tutte");

  function markRead(id: string, baseUnread: boolean) {
    if (isUnreadV2(id, baseUnread)) toggleReadV2(id, baseUnread);
  }

  const items = useMemo<NotificationV2[]>(
    () =>
      notificationsV2
        .filter((n) => !isDeletedV2(n.id))
        .map((n) => {
          const unread = isUnreadV2(n.id, n.unread);
          if (n.type !== "offerta") return { ...n, unread };
          const override = offerStatus[baseOfferId(n.id)];
          return override
            ? { ...n, unread, status: override.status, counterCents: override.counterCents ?? n.counterCents }
            : { ...n, unread };
        }),
    [offerStatus, isUnreadV2, isDeletedV2]
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
        <EmptyState tone="first-run" icon={<Bell className="size-5 text-muted-foreground" />} title="Non è ancora arrivato niente" subtitle="Qui compaiono vendite, offerte ricevute e aggiornamenti sulle spedizioni, appena succedono." />
      ) : (
        <div className="flex flex-col gap-6" aria-live="polite">
          {visibleGroups.map((group) => {
            const groupItems = items.filter(group.match);
            if (groupItems.length === 0) return null;
            return (
              <section key={group.key}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">{group.label}</p>
                  <span className="font-mono text-xs text-muted-foreground">{groupItems.length}</span>
                </div>
                <motion.div
                  key={group.key}
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-border rounded-xl border border-border bg-card"
                >
                  {groupItems.map((n) => {
                    if (n.type === "vendita") {
                      return (
                        <motion.div key={n.id} variants={rowVariants}>
                          <SaleNotificationRow
                            notification={n}
                            onOpen={() => {
                              markRead(n.id, n.unread);
                              if (n.sku) openSale(n.sku);
                            }}
                            onToggleRead={() => toggleReadV2(n.id, n.unread)}
                            onDelete={() => removeV2(n.id)}
                          />
                        </motion.div>
                      );
                    }
                    if (n.type === "offerta") {
                      return (
                        <motion.div key={n.id} variants={rowVariants}>
                          <OfferNotificationRow
                            notification={n}
                            onOpen={() => {
                              markRead(n.id, n.unread);
                              openOffer(baseOfferId(n.id));
                            }}
                            onToggleRead={() => toggleReadV2(n.id, n.unread)}
                            onDelete={() => removeV2(n.id)}
                          />
                        </motion.div>
                      );
                    }
                    return (
                      <motion.div key={n.id} variants={rowVariants}>
                        <ShipmentNotificationRow
                          notification={n}
                          onToggleRead={() => toggleReadV2(n.id, n.unread)}
                          onDelete={() => removeV2(n.id)}
                        />
                      </motion.div>
                    );
                  })}
                </motion.div>
              </section>
            );
          })}

          {visibleGroups.every((group) => items.filter(group.match).length === 0) && (
            <EmptyState tone="idle" title="Nessuna notifica in questa categoria" />
          )}
        </div>
      )}
    </div>
  );
}
