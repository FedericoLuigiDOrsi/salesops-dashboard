"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { OfferStatus } from "@/types/maat";

/**
 * Telecomando unico degli overlay: governa quale float è aperto (offerta /
 * vendita / notifiche) e lo stato condiviso delle offerte. Mirror del pattern
 * settings-store: provider in layout, host in AppShell, aperto ovunque via hook.
 */
export type ActiveOverlay =
  | { kind: "offer"; offerId: string } // id BASE dell'offerta, es. "off-1"
  | { kind: "sale"; sku: string }
  | { kind: "notifications" }
  | null;

type OfferStatusMap = Record<string, { status: OfferStatus; counterCents?: number }>;

interface OverlaysContextValue {
  active: ActiveOverlay;
  openOffer: (offerId: string) => void;
  openSale: (sku: string) => void;
  openNotifications: () => void;
  close: () => void;
  offerStatus: OfferStatusMap;
  resolveOffer: (offerId: string, status: OfferStatus, counterCents?: number) => void;
}

const OverlaysContext = createContext<OverlaysContextValue | null>(null);

export function OverlaysProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveOverlay>(null);
  const [offerStatus, setOfferStatus] = useState<OfferStatusMap>({});

  const value = useMemo<OverlaysContextValue>(
    () => ({
      active,
      openOffer: (offerId) => setActive({ kind: "offer", offerId }),
      openSale: (sku) => setActive({ kind: "sale", sku }),
      openNotifications: () => setActive({ kind: "notifications" }),
      close: () => setActive(null),
      offerStatus,
      resolveOffer: (offerId, status, counterCents) =>
        setOfferStatus((prev) => ({ ...prev, [offerId]: { status, counterCents } })),
    }),
    [active, offerStatus]
  );

  return <OverlaysContext.Provider value={value}>{children}</OverlaysContext.Provider>;
}

export function useOverlays() {
  const ctx = useContext(OverlaysContext);
  if (!ctx) throw new Error("useOverlays must be used within an OverlaysProvider");
  return ctx;
}
