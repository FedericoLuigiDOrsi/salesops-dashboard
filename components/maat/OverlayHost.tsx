"use client";

import { useOverlays } from "@/lib/overlays-store";
import { offers } from "@/lib/activity-mock";
import { offerToNotification } from "@/lib/notifications-mock";
import { OfferPopup } from "@/components/maat/notifications/OfferPopup";
import { ArticlePreview } from "@/components/maat/notifications/ArticlePreview";
import { NotificationsPanel } from "@/components/maat/notifications/NotificationsPanel";

/**
 * Unico punto di montaggio dei float dell'app. Legge il telecomando
 * (overlays-store), risolve offerta/vendita dai mock condivisi e renderizza
 * i popup una sola volta. Montato in AppShell, accanto a SettingsModal.
 */
export function OverlayHost() {
  const { active, close, offerStatus, resolveOffer } = useOverlays();

  const offerId = active?.kind === "offer" ? active.offerId : null;
  const baseOffer = offerId ? offers.find((o) => o.id === offerId) ?? null : null;
  const activeOffer = baseOffer ? offerToNotification(baseOffer, offerStatus[baseOffer.id]) : null;

  const saleSku = active?.kind === "sale" ? active.sku : null;

  return (
    <>
      <OfferPopup
        offer={activeOffer}
        open={active?.kind === "offer"}
        onOpenChange={(open) => !open && close()}
        onResolve={(id, status, counterCents) => resolveOffer(id, status, counterCents)}
      />
      <ArticlePreview sku={saleSku} open={active?.kind === "sale"} onOpenChange={(open) => !open && close()} />
      <NotificationsPanel open={active?.kind === "notifications"} onOpenChange={(open) => !open && close()} />
    </>
  );
}
