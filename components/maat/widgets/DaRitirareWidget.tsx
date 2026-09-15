"use client";

import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketplaceBadge } from "@/components/maat/MarketplaceBadge";
import { DelistOutcomeBadge } from "@/components/maat/DelistOutcomeBadge";
import { ActionControls } from "@/components/maat/ActionControls";
import { useMarketplaceActions } from "@/lib/marketplace-actions-store";
import { isActive, isLingering } from "@/lib/marketplace-actions";
import { daRitirareRows, delistTargetId, displayOutcome, saleScenes } from "@/lib/sale-detail-mock";

/** Bacheca degli annunci ancora online dopo una vendita altrove, aggregata su tutte le vendite. */
export function DaRitirareWidget() {
  const { actionFor, enqueue, now } = useMarketplaceActions();
  const rows = daRitirareRows(saleScenes)
    .map((row) => {
      const targetId = delistTargetId(row.saleSku, row.marketplace);
      const action = actionFor({ type: "listing", id: targetId });
      const outcome = displayOutcome(
        { marketplace: row.marketplace, outcome: row.outcome, at: null, detail: null },
        action
      );
      return { row, targetId, action, outcome };
    })
    // Come in OfferteWidget: la riga resta finché l'azione è attiva, fallita o appena
    // conclusa ("Ritirato" per 3 s), poi esce dalla coda.
    .filter(
      ({ action }) => action === null || isActive(action) || action.state === "failed" || isLingering(action, now)
    );

  return (
    <div className="flex h-full flex-col">
      <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-foreground">
        Da ritirare
      </p>

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <p className="text-[14px] font-semibold">Niente da ritirare</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Gli annunci ancora online dopo una vendita compariranno qui.
          </p>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {rows.map(({ row, targetId, action, outcome }) => {
            const active = action !== null && action.state !== "done";

            return (
              <li
                key={targetId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11px] font-semibold text-muted-foreground">
                    {row.saleSku}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <MarketplaceBadge marketplace={row.marketplace} />
                    <DelistOutcomeBadge outcome={outcome} />
                  </div>
                </div>
                {active ? (
                  <ActionControls action={action} />
                ) : outcome !== "delisted" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1.5"
                    onClick={() =>
                      enqueue({ kind: "delist", marketplace: row.marketplace, target: { type: "listing", id: targetId } })
                    }
                  >
                    <Undo2 className="size-3.5" /> Ritira
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
