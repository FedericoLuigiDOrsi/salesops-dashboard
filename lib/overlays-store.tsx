"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Telecomando unico degli overlay: governa quale float è aperto (offerta /
 * vendita / notifiche) (lo stato delle offerte vive nel registro delle azioni,
 * lib/marketplace-actions-store.tsx). Mirror del pattern settings-store:
 * provider in layout, host in AppShell, aperto ovunque via hook.
 */
export type ActiveOverlay =
  | { kind: "offer"; offerId: string } // id BASE dell'offerta, es. "off-1"
  | { kind: "sale"; sku: string }
  | { kind: "notifications" }
  | null;

interface OverlaysContextValue {
  active: ActiveOverlay;
  openOffer: (offerId: string) => void;
  openSale: (sku: string) => void;
  openNotifications: () => void;
  close: () => void;
}

const OverlaysContext = createContext<OverlaysContextValue | null>(null);

export function OverlaysProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveOverlay>(null);

  const value = useMemo<OverlaysContextValue>(
    () => ({
      active,
      openOffer: (offerId) => setActive({ kind: "offer", offerId }),
      openSale: (sku) => setActive({ kind: "sale", sku }),
      openNotifications: () => setActive({ kind: "notifications" }),
      close: () => setActive(null),
    }),
    [active]
  );

  return <OverlaysContext.Provider value={value}>{children}</OverlaysContext.Provider>;
}

export function useOverlays() {
  const ctx = useContext(OverlaysContext);
  if (!ctx) throw new Error("useOverlays must be used within an OverlaysProvider");
  return ctx;
}
