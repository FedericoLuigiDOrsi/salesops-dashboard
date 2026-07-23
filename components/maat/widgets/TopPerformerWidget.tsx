"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  TOP_PERFORMERS,
  type PerformerEntity,
  type PerformerPeriod,
} from "@/lib/home-widgets-mock";

export function TopPerformerWidget() {
  const [entity, setEntity] = useState<PerformerEntity>("categorie");
  const [period, setPeriod] = useState<PerformerPeriod>("30d");
  const rows = TOP_PERFORMERS[entity][period];
  const maxSales = Math.max(...rows.map((row) => row.sales), 1);

  return (
    <div className="h-full">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-foreground">
          Top performer
        </p>
        <div className="flex items-center gap-1.5">
          <label className="sr-only" htmlFor="top-performer-entity">Entità</label>
          <select
            id="top-performer-entity"
            value={entity}
            onChange={(event) => setEntity(event.target.value as PerformerEntity)}
            className="h-7 rounded-md border border-border bg-background px-2 font-mono text-[9px] font-semibold uppercase tracking-[.06em] outline-none transition-colors focus:border-foreground/30"
          >
            <option value="categorie">Categorie</option>
            <option value="capi">Capi</option>
          </select>
          <label className="sr-only" htmlFor="top-performer-period">Periodo</label>
          <select
            id="top-performer-period"
            value={period}
            onChange={(event) => setPeriod(event.target.value as PerformerPeriod)}
            className="h-7 rounded-md border border-border bg-background px-2 font-mono text-[9px] font-semibold uppercase tracking-[.06em] outline-none transition-colors focus:border-foreground/30"
          >
            <option value="7d">7 gg</option>
            <option value="30d">30 gg</option>
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex min-h-28 items-center justify-center text-center">
          <div>
            <p className="text-xs font-semibold">Nessuna vendita nel periodo</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Prova una finestra temporale più ampia.</p>
          </div>
        </div>
      ) : (
        <ol className="mt-3 divide-y divide-border">
          {rows.map((row, index) => (
            <li key={row.label} className="grid grid-cols-[28px_minmax(0,1fr)_44px] items-center gap-2 py-2 first:pt-0 last:pb-0">
              <span className={`flex size-6 items-center justify-center rounded-md font-mono text-[9px] font-bold ${index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">{row.label}</span>
                <span className="mt-1.5 block h-0.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full origin-left rounded-full bg-success transition-transform duration-500 [transition-timing-function:cubic-bezier(.22,1,.36,1)]"
                    style={{ transform: `scaleX(${row.sales / maxSales})` }}
                  />
                </span>
              </span>
              <span className="text-right font-mono text-sm font-semibold tabular-nums">
                {row.sales}
                <span className="block text-[7px] uppercase tracking-[.08em] text-muted-foreground">vendite</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <Link href="/contabilita" className="mt-3 flex items-center justify-end gap-1 text-[11px] font-medium text-muted-foreground transition-[color,transform] hover:translate-x-0.5 hover:text-foreground active:translate-y-px">
        Apri contabilità <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}
