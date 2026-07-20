"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatEUR } from "@/lib/utils";
import { weeklyKpi, weeklyRevenue } from "@/lib/accounting-mock";

/** Andamento ricavi delle ultime settimane, vista compatta della Contabilità. */
export function EntrateWidget() {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
          Entrate
        </p>
        <Link
          href="/contabilita"
          className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Contabilità <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="text-2xl font-bold tabular-nums">{formatEUR(weeklyKpi.revenueCents)}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        <span className="flex items-center gap-1 font-semibold text-[var(--chart-2)]">
          <TrendingUp className="size-3" /> +{weeklyKpi.revenueDeltaPct}%
        </span>
        <span className="text-muted-foreground">+{formatEUR(weeklyKpi.revenueDeltaCents)} vs sett. prec.</span>
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
