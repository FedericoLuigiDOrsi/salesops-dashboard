"use client";

import { cn } from "@/lib/utils";
import { MARKETPLACE_LABELS } from "@/types/maat";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/inventory-columns";

interface PlatformChipsProps {
  selected: PlatformKey[];
  onToggle: (key: PlatformKey) => void;
}

/** Chip toggle per piattaforma, riusata da StrategySheet e ToPublishTab. */
export function PlatformChips({ selected, onToggle }: PlatformChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PLATFORM_KEYS.map((key) => {
        const on = selected.includes(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              on
                ? "border-primary/60 bg-primary/15 text-foreground"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex size-4 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-semibold">
              {MARKETPLACE_LABELS[key][0]}
            </span>
            {MARKETPLACE_LABELS[key]}
          </button>
        );
      })}
    </div>
  );
}
