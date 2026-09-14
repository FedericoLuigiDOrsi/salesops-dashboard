"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { MarketplaceAction } from "@/types/maat";
import { cn } from "@/lib/utils";
import { CANCELLABLE_STATES } from "@/lib/marketplace-actions";
import { useMarketplaceActions } from "@/lib/marketplace-actions-store";
import { ActionStatePill } from "@/components/maat/ActionStatePill";

const TOO_LATE_VISIBLE_MS = 3_000;

/**
 * Pillola + controllo, uguali in ogni widget. Annulla esiste solo finché
 * l'azione è in coda; niente conto alla rovescia, perché la partenza reale
 * dipende anche dalla coda e un timer a zero con l'azione ferma mentirebbe.
 */
export function ActionControls({ action, className }: { action: MarketplaceAction; className?: string }) {
  const { cancel, retry, now } = useMarketplaceActions();
  const [tooLateAt, setTooLateAt] = useState<number | null>(null);
  const showTooLate = tooLateAt !== null && now - tooLateAt <= TOO_LATE_VISIBLE_MS;

  async function handleCancel() {
    const result = await cancel(action.id);
    if (result === "too_late") setTooLateAt(Date.now());
  }

  const linkClass =
    "min-h-8 rounded-md px-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ActionStatePill state={action.state} />
      {showTooLate ? (
        <span className="text-[11px] text-muted-foreground" role="status">
          Troppo tardi, già in corso
        </span>
      ) : CANCELLABLE_STATES.includes(action.state) ? (
        <button type="button" onClick={handleCancel} className={linkClass}>
          Annulla
        </button>
      ) : action.state === "failed" ? (
        <button
          type="button"
          onClick={() => retry(action.id)}
          title={action.lastError}
          className={cn(linkClass, "inline-flex items-center gap-1")}
        >
          <RotateCcw className="size-3.5" /> Riprova
        </button>
      ) : null}
    </div>
  );
}
