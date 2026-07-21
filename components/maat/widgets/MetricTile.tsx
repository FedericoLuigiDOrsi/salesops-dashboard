"use client";

import { cn } from "@/lib/utils";
import type { HomeMetric } from "@/lib/home-mock";
import { isMetricUrgent } from "@/lib/urgency";

/**
 * Tile di una metrica Panoramica. La struttura interna cambia per fascia
 * (silhouette), non solo raggio/bordo/padding:
 * grande = orizzontale (valore grande + label a destra), medio = verticale
 * classico, piccolo = pillola a una riga.
 */
export function MetricTile({ metric }: { metric: HomeMetric }) {
  const urgent = isMetricUrgent(metric);
  const dotClass = cn("size-1.5 shrink-0 rounded-full", urgent ? "bg-destructive" : metric.dotColor);

  if (metric.tier === "grande") {
    return (
      <div className="flex h-full items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-4 py-3">
        <span className="font-mono text-3xl font-semibold tabular-nums">{metric.value}</span>
        <span className="flex shrink-0 items-center gap-1.5 text-right text-[13px] text-muted-foreground">
          {metric.label}
          <span className={dotClass} />
        </span>
      </div>
    );
  }

  if (metric.tier === "piccolo") {
    return (
      <div className="flex items-center justify-between gap-2 rounded-full border border-border bg-background/40 px-3 py-1.5">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className={dotClass} />
          <span className="truncate">{metric.label}</span>
        </span>
        <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">{metric.value}</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-1.5 rounded-lg border border-border bg-background/40 px-4 py-3">
      <span className="font-mono text-2xl font-semibold tabular-nums">{metric.value}</span>
      <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <span className={dotClass} />
        {metric.label}
      </span>
    </div>
  );
}
