import type { Marketplace, MarketplaceAction } from "@/types/maat";
import type { EnqueueInput } from "./marketplace-actions";

/**
 * Il "fattorino": l'unico punto che sa chi esegue le azioni. Oggi è il
 * simulatore (marketplace-actions-sim.ts), al collegamento sarà un adattatore
 * verso marketplace_actions del Blocco 6. Cambiarlo non tocca widget e store.
 *
 * `getSnapshot` deve restituire lo STESSO array finché niente cambia:
 * lo store lo legge con useSyncExternalStore, che confronta con Object.is.
 */
export interface ActionDriver {
  getSnapshot(): readonly MarketplaceAction[];
  subscribe(onChange: () => void): () => void;
  submit(input: EnqueueInput): MarketplaceAction;
  cancel(id: string): Promise<"cancelled" | "too_late">;
  retry(id: string): void;
  resume(marketplace: Marketplace): void;
}
