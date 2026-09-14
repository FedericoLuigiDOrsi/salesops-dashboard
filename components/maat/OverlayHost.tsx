"use client";

import { useOverlays } from "@/lib/overlays-store";
import { useMarketplaceActions } from "@/lib/marketplace-actions-store";
import { offerActionKind, offerDisplayState } from "@/lib/marketplace-actions";
import { offers } from "@/lib/activity-mock";
import { offerToNotification } from "@/lib/notifications-mock";
import { OfferPopup } from "@/components/maat/notifications/OfferPopup";
import { SaleDetail } from "@/components/maat/sales/SaleDetail";
import { NotificationsPanel } from "@/components/maat/notifications/NotificationsPanel";

/**
 * Unico punto di montaggio dei float dell'app. Legge il telecomando
 * (overlays-store), risolve offerta/vendita dai mock condivisi e renderizza
 * i popup una sola volta. Rispondere a un'offerta accoda un'azione nel
 * registro: l'esito arriva quando il fattorino la conclude.
 */
export function OverlayHost() {
  const { active, close } = useOverlays();
  const { actionFor, enqueue } = useMarketplaceActions();

  const offerId = active?.kind === "offer" ? active.offerId : null;
  const baseOffer = offerId ? offers.find((o) => o.id === offerId) ?? null : null;
  const activeOffer = baseOffer
    ? offerToNotification(
        baseOffer,
        offerDisplayState(baseOffer.status, baseOffer.counterCents, actionFor({ type: "offer", id: baseOffer.id })),
      )
    : null;

  const saleSku = active?.kind === "sale" ? active.sku : null;

  return (
    <>
      {/* `key` sull'id: cambiare offerta rimonta il popup, che è il modo in cui
          si azzerano controfferta e modalità senza un effect di reset. */}
      {activeOffer && baseOffer && (
        <OfferPopup
          key={activeOffer.id}
          offer={activeOffer}
          open={active?.kind === "offer"}
          onOpenChange={(open) => !open && close()}
          onResolve={(id, status, counterCents) => {
            const kind = offerActionKind(status);
            if (!kind) return;
            enqueue({
              kind,
              marketplace: baseOffer.marketplace,
              target: { type: "offer", id },
              payload: kind === "offer_counter" ? { counterCents } : undefined,
            });
          }}
        />
      )}
      <SaleDetail sku={saleSku} open={active?.kind === "sale"} onOpenChange={(open) => !open && close()} />
      <NotificationsPanel open={active?.kind === "notifications"} onOpenChange={(open) => !open && close()} />
    </>
  );
}
