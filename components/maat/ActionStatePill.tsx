import type { MarketplaceActionState } from "@/types/maat";
import { StatusPill } from "@/components/maat/StatusPill";
import { ACTION_STATE_PILL } from "@/lib/marketplace-actions-copy";

// Stato di UNA azione verso una piattaforma. Non è lo stato dell'offerta né
// dell'annuncio: risponde a «la cosa che ho chiesto è partita?».

export function ActionStatePill({ state, className }: { state: MarketplaceActionState; className?: string }) {
  return (
    <StatusPill value={state} config={ACTION_STATE_PILL} live={ACTION_STATE_PILL[state].live} className={className} />
  );
}
