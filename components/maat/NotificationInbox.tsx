"use client";

import { useMemo, useState } from "react";
import { ActivityModal } from "@/components/maat/notifications/ActivityModal";
import { NotificationInboxContent } from "@/components/maat/notifications/NotificationInboxContent";
import { notificationsV2, type OfferNotification } from "@/lib/notifications-mock";
import { useOverlays } from "@/lib/overlays-store";

// Pagina /notifiche: la "sezione intera" per lavorare a tutte le notifiche.
// Header + il corpo inbox riusabile (stesso di NotificationsPanel). I popup
// (offerta/vendita) sono globali via OverlayHost — qui niente stato popup
// locale. ActivityModal ("Visualizza tutte") mantenuto.

function baseOfferId(notificationId: string): string {
  return notificationId.replace(/^n-/, "");
}

export function NotificationInbox() {
  const { offerStatus } = useOverlays();
  const [activityOpen, setActivityOpen] = useState(false);

  // Offerte con lo stato condiviso applicato — per l'ActivityModal.
  const offerItems = useMemo<OfferNotification[]>(
    () =>
      notificationsV2
        .filter((n): n is OfferNotification => n.type === "offerta")
        .map((n) => {
          const override = offerStatus[baseOfferId(n.id)];
          return override ? { ...n, status: override.status, counterCents: override.counterCents ?? n.counterCents } : n;
        }),
    [offerStatus]
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">Inbox</p>
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

      <NotificationInboxContent variant="page" />

      <ActivityModal open={activityOpen} onOpenChange={setActivityOpen} offers={offerItems} />
    </div>
  );
}
