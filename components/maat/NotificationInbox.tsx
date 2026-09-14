"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { ActivityModal } from "@/components/maat/notifications/ActivityModal";
import { NotificationInboxContent } from "@/components/maat/notifications/NotificationInboxContent";
import { notificationsV2, type OfferNotification } from "@/lib/notifications-mock";
import { useMarketplaceActions } from "@/lib/marketplace-actions-store";
import { offerDisplayState } from "@/lib/marketplace-actions";
import { useNotifications } from "@/lib/notifications-store";

// Pagina /notifiche: la "sezione intera" per lavorare a tutte le notifiche.
// Header + il corpo inbox riusabile (stesso di NotificationsPanel). I popup
// (offerta/vendita) sono globali via OverlayHost — qui niente stato popup
// locale. ActivityModal ("Visualizza tutte") mantenuto.

function baseOfferId(notificationId: string): string {
  return notificationId.replace(/^n-/, "");
}

export function NotificationInbox() {
  const { actionFor } = useMarketplaceActions();
  const { unreadCountV2, markAllReadV2 } = useNotifications();
  const [activityOpen, setActivityOpen] = useState(false);

  // Offerte con lo stato visto dall'utente (base + esito del registro), per l'ActivityModal.
  const offerItems = useMemo<OfferNotification[]>(
    () =>
      notificationsV2
        .filter((n): n is OfferNotification => n.type === "offerta")
        .map((n) => ({
          ...n,
          ...offerDisplayState(n.status, n.counterCents, actionFor({ type: "offer", id: baseOfferId(n.id) })),
        })),
    [actionFor]
  );

  return (
    <div className="w-full px-4 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Notifiche</h1>
        </div>
        <div className="flex items-center gap-4">
          {unreadCountV2 > 0 && (
            <button
              type="button"
              onClick={markAllReadV2}
              className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Check className="size-3.5" />
              Segna tutte come lette
            </button>
          )}
          <button
            type="button"
            onClick={() => setActivityOpen(true)}
            className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Visualizza tutte
          </button>
        </div>
      </div>

      <NotificationInboxContent variant="page" />

      <ActivityModal open={activityOpen} onOpenChange={setActivityOpen} offers={offerItems} />
    </div>
  );
}
