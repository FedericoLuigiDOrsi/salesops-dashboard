"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatEUR } from "@/lib/utils";
import { AGING_ITEMS } from "@/lib/home-widgets-mock";

const THRESHOLDS = [30, 45, 60, 90] as const;

export function InventarioFermoWidget() {
  const [threshold, setThreshold] = useState<number>(45);
  const items = useMemo(
    () => AGING_ITEMS.filter((item) => item.ageDays > threshold).sort((a, b) => b.baseCostCents - a.baseCostCents),
    [threshold]
  );
  const totalCostCents = items.reduce((sum, item) => sum + item.baseCostCents, 0);

  return (
    <div className="h-full">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-foreground">
          Inventario fermo
        </p>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="aging-threshold">Soglia inventario fermo</label>
          <select
            id="aging-threshold"
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
            className="h-7 rounded-md border border-border bg-background px-2 font-mono text-[9px] font-semibold uppercase tracking-[.06em] outline-none transition-colors focus:border-foreground/30"
          >
            {THRESHOLDS.map((value) => <option key={value} value={value}>&gt; {value} gg</option>)}
          </select>
          <Link href="/inventario" className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-[color,transform] hover:translate-x-0.5 hover:text-foreground active:translate-y-px">
            Inventario <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between border-b border-border pb-2.5">
        <p className="font-mono text-[26px] font-semibold leading-none tabular-nums">
          {items.length} <span className="text-lg">capi</span>
          <span className="mt-1 block text-[8px] uppercase tracking-[.1em] text-muted-foreground">oltre la soglia</span>
        </p>
        <p className="text-right font-mono text-lg font-semibold text-destructive tabular-nums">
          {formatEUR(totalCostCents)}
          <span className="mt-1 block text-[8px] uppercase tracking-[.08em] text-muted-foreground">costo base fermo</span>
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-20 items-center justify-center text-center">
          <div>
            <p className="text-xs font-semibold">Nessun capo oltre la soglia</p>
            <p className="mt-1 text-[11px] text-muted-foreground">L’inventario non presenta aging critico.</p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.slice(0, 3).map((item) => (
            <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_44px_42px] items-center gap-2 py-2 text-xs">
              <span className="truncate font-semibold">{item.label}</span>
              <span className="rounded-full bg-destructive/[.08] px-1.5 py-1 text-center font-mono text-[8px] font-semibold uppercase text-destructive">{item.ageDays} gg</span>
              <span className="text-right font-mono text-[10px] font-semibold tabular-nums">{formatEUR(item.baseCostCents)}</span>
            </li>
          ))}
        </ul>
      )}

      {items.length > 3 ? <p className="mt-2 text-right font-mono text-[9px] text-muted-foreground">+{items.length - 3} capi da valutare</p> : null}
    </div>
  );
}
