"use client";

import { cn } from "@/lib/utils";
import type { HomeMetric } from "@/lib/home-mock";
import { isMetricUrgent } from "@/lib/urgency";

const VALUE_CLASS: Record<HomeMetric["tier"], string> = {
  grande: "text-[32px] font-bold",
  medio: "text-xl font-semibold",
  piccolo: "text-[15px] font-semibold",
};

const LABEL_CLASS: Record<HomeMetric["tier"], string> = {
  grande: "text-xs",
  medio: "text-[10px]",
  piccolo: "text-[10px]",
};

const TILE_PADDING_CLASS: Record<HomeMetric["tier"], string> = {
  grande: "px-4 py-3.5",
  medio: "px-3 py-2.5",
  piccolo: "px-2.5 py-2",
};

/**
 * Tile di una metrica Panoramica: una sola struttura (valore sopra, label
 * sotto, mai troncata) — la fascia si vede solo da scala tipografica e
 * padding, non da una forma diversa.
 */
export function MetricTile({ metric }: { metric: HomeMetric }) {
  const urgent = isMetricUrgent(metric);
  const dotClass = cn("size-1.5 shrink-0 rounded-full", urgent ? "bg-destructive" : metric.dotColor);

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-1 rounded-lg border border-border bg-background/40",
        TILE_PADDING_CLASS[metric.tier]
      )}
    >
      <span className={cn("font-mono tabular-nums", VALUE_CLASS[metric.tier])}>{metric.value}</span>
      <span className={cn("flex items-center gap-1.5 text-muted-foreground", LABEL_CLASS[metric.tier])}>
        <span className={dotClass} />
        {metric.label}
      </span>
    </div>
  );
}
