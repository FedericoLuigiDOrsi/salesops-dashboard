"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MARKETPLACE_LABELS } from "@/types/maat";
import { PLATFORM_BRAND, PLATFORM_KEYS } from "@/lib/inventory-columns";
import type { InventoryItem, PlatformListingState } from "@/lib/inventory-mock";

// Colore del pallino d'angolo = stato del listing (fonte di significato primaria).
const STATE_DOT: Record<NonNullable<PlatformListingState>, string> = {
  active: "#2f9e4f",
  pending: "#c9a400",
  delisted: "#bbbbbb",
  sold: "#2a2a22",
};

const STATE_LABEL: Record<NonNullable<PlatformListingState>, string> = {
  active: "attivo",
  pending: "in corso",
  delisted: "rimosso",
  sold: "venduto",
};

/** Pillole piattaforma: quadratino colore-brand + iniziale + pallino stato + tooltip. */
export function PlatformPills({ platforms }: { platforms: InventoryItem["platforms"] }) {
  const listed = PLATFORM_KEYS.filter((key) => platforms[key] !== null);
  if (listed.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {listed.map((key) => {
        const state = platforms[key];
        if (!state) return null;
        const brand = PLATFORM_BRAND[key];
        return (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <span
                className="relative inline-flex size-6 items-center justify-center rounded-[7px] font-mono text-[10px] font-bold text-white"
                style={{ backgroundColor: brand.color }}
              >
                {brand.initial}
                <span
                  className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-background"
                  style={{ backgroundColor: STATE_DOT[state] }}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {MARKETPLACE_LABELS[key]} · {STATE_LABEL[state]}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
