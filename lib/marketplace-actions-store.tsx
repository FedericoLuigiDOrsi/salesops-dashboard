"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import type { ActionTarget, Marketplace, MarketplaceAction } from "@/types/maat";
import { accountFor } from "@/lib/marketplace-accounts-mock";
import {
  extensionStatus,
  latestActionFor,
  type EnqueueInput,
  type ExtensionStatus,
} from "@/lib/marketplace-actions";
import { createSimulatedDriver, type SimSettings, type SimulatedDriver } from "@/lib/marketplace-actions-sim";

// Legge lo snapshot del fattorino con useSyncExternalStore, come
// lib/use-persistent-state.ts fa con localStorage. Oggi il fattorino è il
// simulatore: `isSimulated` resta true finché non arriva l'adattatore vero,
// e indicatore e avviso lo dichiarano (apps/web/CLAUDE.md, «il prototipo si dichiara»).

const TICK_MS = 1_000;
const EMPTY: readonly MarketplaceAction[] = [];

interface MarketplaceActionsValue {
  actions: readonly MarketplaceAction[];
  now: number;
  extension: ExtensionStatus;
  isSimulated: true;
  settings: SimSettings;
  simulator: SimulatedDriver;
  enqueue: (input: EnqueueInput) => MarketplaceAction;
  cancel: (id: string) => Promise<"cancelled" | "too_late">;
  retry: (id: string) => void;
  resume: (marketplace: Marketplace) => void;
  actionFor: (target: ActionTarget) => MarketplaceAction | null;
}

const MarketplaceActionsContext = createContext<MarketplaceActionsValue | null>(null);

export function MarketplaceActionsProvider({ children }: { children: ReactNode }) {
  const [driver] = useState(() =>
    createSimulatedDriver({ settings: { accountConnected: accountFor("vinted")?.status === "active" } }),
  );
  const [now, setNow] = useState(() => Date.now());

  const actions = useSyncExternalStore(driver.subscribe, driver.getSnapshot, () => EMPTY);
  const settings = useSyncExternalStore(driver.subscribe, driver.getSettings, driver.getSettings);

  // L'orologio del simulatore è un sistema esterno: l'effect lo avvia e lo
  // ferma, lo stato si aggiorna solo nel callback dell'intervallo.
  useEffect(() => {
    const id = window.setInterval(() => {
      driver.tick();
      setNow(Date.now());
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [driver]);

  const value = useMemo<MarketplaceActionsValue>(
    () => ({
      actions,
      now,
      extension: extensionStatus([...actions], settings.accountConnected, now),
      isSimulated: true,
      settings,
      simulator: driver,
      enqueue: (input) => driver.submit(input),
      cancel: (id) => driver.cancel(id),
      retry: (id) => driver.retry(id),
      resume: (marketplace) => driver.resume(marketplace),
      actionFor: (target) => latestActionFor([...actions], target),
    }),
    [actions, now, settings, driver],
  );

  return <MarketplaceActionsContext.Provider value={value}>{children}</MarketplaceActionsContext.Provider>;
}

export function useMarketplaceActions() {
  const ctx = useContext(MarketplaceActionsContext);
  if (!ctx) throw new Error("useMarketplaceActions must be used within a MarketplaceActionsProvider");
  return ctx;
}
