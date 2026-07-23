"use client";

import Link from "next/link";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn, formatEUR } from "@/lib/utils";
import { weeklyKpi, weeklyRevenue } from "@/lib/accounting-mock";
import { isRevenueDown } from "@/lib/urgency";

/** Andamento ricavi delle ultime settimane, vista compatta della Contabilità. */
export function EntrateWidget() {
  const isDown = isRevenueDown(weeklyKpi.revenueDeltaPct);
  const DeltaIcon = isDown ? TrendingDown : TrendingUp;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Entrate
          </p>
          {isRevenueDown(weeklyKpi.revenueDeltaPct) ? (
            <span aria-label="Ricavi in calo" className="size-1.5 shrink-0 rounded-full bg-destructive" />
          ) : null}
        </div>
        <Link
          href="/contabilita"
          className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Contabilità <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="font-mono text-2xl font-bold tabular-nums">{formatEUR(weeklyKpi.revenueCents)}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        <span
          className={cn(
            "flex items-center gap-1 font-semibold",
            isDown ? "text-destructive" : "text-[var(--chart-2)]"
          )}
        >
          <DeltaIcon className="size-3" /> {isDown ? "" : "+"}
          {weeklyKpi.revenueDeltaPct}%
        </span>
        <span className="text-muted-foreground">
          {isDown ? "" : "+"}
          {formatEUR(weeklyKpi.revenueDeltaCents)} vs sett. prec.
        </span>
      </div>

      <ChartContainer
        config={{ revenueCents: { label: "Ricavi", color: "var(--chart-3)" } }}
        className="mt-3 h-[120px] w-full"
      >
        <BarChart data={weeklyRevenue} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="weekLabel" tickLine={false} axisLine={false} fontSize={10} />
          <ChartTooltip
            content={<ChartTooltipContent formatter={(value) => <span>{formatEUR(Number(value))}</span>} />}
          />
          <Bar dataKey="revenueCents" fill="var(--chart-3)" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
