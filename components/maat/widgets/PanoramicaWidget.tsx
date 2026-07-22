"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { HOME_METRICS } from "@/lib/home-mock";
import { useHomeLayout } from "@/lib/home-layout-store";
import { METRIC_TIER_GRID_CLASS } from "@/lib/tiers";
import { MetricTile } from "./MetricTile";

/** Metriche chiave configurabili: il box "Panoramica" del mockup, come widget. */
export function PanoramicaWidget() {
  const { metrics, toggleMetric } = useHomeLayout();
  const [editOpen, setEditOpen] = useState(false);

  const visibleMetrics = HOME_METRICS.filter((m) => metrics.includes(m.key));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
          Panoramica
        </p>
        <Popover open={editOpen} onOpenChange={setEditOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <SlidersHorizontal className="size-3.5" />
              Modifica
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-3">
            <p className="mb-2 px-1 text-xs font-semibold text-muted-foreground">Scegli cosa mostrare</p>
            <div className="flex flex-col gap-0.5">
              {HOME_METRICS.map((m) => (
                <label
                  key={m.key}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-foreground/[.04]"
                >
                  <Checkbox checked={metrics.includes(m.key)} onCheckedChange={() => toggleMetric(m.key)} />
                  <span className={cn("size-2 shrink-0 rounded-full", m.dotColor)} />
                  <span className="flex-1">{m.label}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {visibleMetrics.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-muted-foreground">
          Nessuna informazione selezionata. Usa &ldquo;Modifica&rdquo;.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:grid-flow-dense">
          {visibleMetrics.map((m) => (
            <div key={m.key} className={METRIC_TIER_GRID_CLASS[m.tier]}>
              <MetricTile metric={m} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
