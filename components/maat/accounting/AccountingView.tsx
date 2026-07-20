"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, Area, AreaChart } from "recharts";
import { Download, Plus, Shield, TrendingUp, Wallet, Tag, Vault, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { RegistraCaricoDialog } from "@/components/maat/accounting/RegistraCaricoDialog";
import { formatEUR, cn } from "@/lib/utils";
import { MARKETPLACE_LABELS } from "@/types/maat";
import type { LotType, Supplier } from "@/types/maat";
import {
  weeklyKpi,
  topCategory,
  weeklyRevenue,
  platformShares,
  categoryShares,
  cassaSettlement,
  cassaKpi,
  accountingEntries,
} from "@/lib/accounting-mock";
import { suppliers as initialSuppliers } from "@/lib/suppliers-mock";

const PERIODS = [
  { value: "7", label: "7 giorni" },
  { value: "30", label: "30 giorni" },
  { value: "90", label: "90 giorni" },
  { value: "anno", label: "Anno" },
] as const;

const STATUS_LABEL: Record<(typeof accountingEntries)[number]["status"], string> = {
  confirmed: "Liquidato",
  escrow: "In escrow",
  pending: "In transito",
};

const STATUS_CLASS: Record<(typeof accountingEntries)[number]["status"], string> = {
  confirmed: "border-transparent bg-[color-mix(in_oklab,var(--chart-2)_16%,transparent)] text-[var(--chart-2)]",
  escrow: "border-transparent bg-primary/15 text-[#7a7000]",
  pending: "border-transparent bg-muted text-muted-foreground",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? "";
  return (a + b).toUpperCase() || "·";
}

function supplierFigure(s: Supplier) {
  const parts: string[] = [];
  if (s.pieces > 0) parts.push(`${s.pieces} pz`);
  if (s.kg > 0) parts.push(`${s.kg} kg`);
  return parts.join(" · ") || "—";
}

export function AccountingView() {
  const [period, setPeriod] = useState("30");
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [highlightSupplier, setHighlightSupplier] = useState<string | null>(null);
  const [caricoOpen, setCaricoOpen] = useState(false);

  const txTotals = accountingEntries.reduce(
    (acc, e) => ({
      gross: acc.gross + e.grossAmountCents,
      fee: acc.fee + e.platformFeeCents,
      shipping: acc.shipping + e.shippingCostCents,
      net: acc.net + e.netAmountCents,
    }),
    { gross: 0, fee: 0, shipping: 0, net: 0 }
  );

  function registerLoad(data: { type: LotType; quantity: number; category: string; supplierName: string }) {
    setSuppliers((prev) => {
      const existing = prev.find((s) => s.name.toLowerCase() === data.supplierName.toLowerCase());
      if (existing) {
        return prev.map((s) =>
          s.id === existing.id
            ? {
                ...s,
                loadsCount: s.loadsCount + 1,
                pieces: s.pieces + (data.type === "pezzo" ? data.quantity : 0),
                kg: s.kg + (data.type === "ingrosso" ? data.quantity : 0),
                updatedAt: "oggi",
              }
            : s
        );
      }
      const created: Supplier = {
        id: `sup-${Date.now()}`,
        name: data.supplierName,
        loadsCount: 1,
        pieces: data.type === "pezzo" ? data.quantity : 0,
        kg: data.type === "ingrosso" ? data.quantity : 0,
        updatedAt: "oggi",
      };
      return [created, ...prev];
    });
    setHighlightSupplier(data.supplierName);
    window.setTimeout(() => setHighlightSupplier(null), 1500);
  }

  function exportCsv() {
    const header = "Data,Capo,Piattaforma,Lordo,Commissioni,Spedizione,Netto,Stato";
    const rows = accountingEntries.map((e) =>
      [
        e.eventDate,
        e.itemLabel,
        MARKETPLACE_LABELS[e.marketplace],
        (e.grossAmountCents / 100).toFixed(2),
        (e.platformFeeCents / 100).toFixed(2),
        (e.shippingCostCents / 100).toFixed(2),
        (e.netAmountCents / 100).toFixed(2),
        STATUS_LABEL[e.status],
      ]
        .map((v) => `"${v}"`)
        .join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contabilita-maat.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Contabilità · Tenant DirtyTag
          </p>
          <h1 className="text-[28px] font-bold tracking-tight">Contabilità</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Pannello di controllo economico: vendite, distribuzione dei canali e delle categorie, cassa e settlement.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} className="hidden gap-1.5 sm:flex">
          <Download className="size-3.5" /> Esporta CSV
        </Button>
      </div>

      {/* toolbar periodo */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <div className="inline-flex rounded-md border border-border p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              aria-pressed={period === p.value}
              className={cn(
                "rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                period === p.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <Badge variant="outline" className="gap-1.5 border-[var(--chart-2)]/30 text-[var(--chart-2)]">
          <span className="size-1.5 rounded-full bg-[var(--chart-2)]" /> Dati in tempo reale
        </Badge>
      </div>

      {/* KPI settimana */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Questa settimana · 13–19 lug</p>
          <span className="text-xs text-muted-foreground">vs settimana precedente (06–12 lug)</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="size-3.5" /> Ricavi settimana
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{formatEUR(weeklyKpi.revenueCents)}</div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 font-semibold text-[var(--chart-2)]">
                <TrendingUp className="size-3" /> +{weeklyKpi.revenueDeltaPct}%
              </span>
              <span className="text-muted-foreground">+{formatEUR(weeklyKpi.revenueDeltaCents)} vs sett. prec.</span>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 opacity-70">
              <ChartContainer config={{ revenueCents: { label: "Ricavi", color: "var(--chart-3)" } }} className="h-full w-full">
                <AreaChart data={weeklyRevenue} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Area dataKey="revenueCents" type="monotone" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.16} strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>

          <KpiTile icon={ListChecks} label="Pezzi venduti" value={`${weeklyKpi.unitsSold} pezzi`} deltaPct={weeklyKpi.unitsDeltaPct} note={`${weeklyKpi.unitsPrevWeek} la scorsa settimana`} />
          <KpiTile
            icon={Tag}
            label="Prezzo medio di vendita"
            value={formatEUR(weeklyKpi.avgPriceCents)}
            deltaPct={weeklyKpi.avgPriceDeltaPct}
            note={`min ${formatEUR(weeklyKpi.avgPriceMinCents)} · max ${formatEUR(weeklyKpi.avgPriceMaxCents)}`}
          />
          <KpiTile icon={Vault} label="Netto stimato" value={formatEUR(weeklyKpi.netCents)} note={`margine ${weeklyKpi.netMarginPct}%`} deltaLabel={`margine ${weeklyKpi.netMarginPct}%`} />
        </div>
      </section>

      {/* categoria più venduta */}
      <section className="rounded-xl bg-sidebar p-5 text-sidebar-foreground">
        <p className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60">In testa negli ultimi 30 giorni</p>
        <p className="mt-1 text-xl font-bold">{topCategory.name}</p>
        <p className="mt-1 max-w-md text-sm text-sidebar-foreground/70">
          Davanti a {topCategory.runnerUp} ({topCategory.runnerUpSharePct}%). Traino delle vendite del periodo, con lo scontrino medio
          più alto del catalogo.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <FeatStat value={formatEUR(topCategory.revenueCents)} label="Ricavi periodo" accent />
          <FeatStat value={String(topCategory.units)} label="Pezzi venduti" />
          <FeatStat value={`${topCategory.sharePct}%`} label="Quota sul venduto" />
          <FeatStat value={`+${topCategory.deltaPct}%`} label="vs periodo prec." positive />
        </div>
      </section>

      {/* andamento settimanale */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold">Andamento vendite settimanali</h3>
          <p className="text-xs text-muted-foreground">Ultime 8 settimane · settimana in corso evidenziata</p>
        </div>
        <ChartContainer config={{ revenueCents: { label: "Ricavi", color: "var(--chart-3)" } }} className="h-[220px] w-full">
          <BarChart data={weeklyRevenue}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="weekLabel" tickLine={false} axisLine={false} fontSize={11} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => (
                    <span>
                      {formatEUR(Number(value))} · {item.payload.unitsSold} pz
                    </span>
                  )}
                />
              }
            />
            <Bar dataKey="revenueCents" fill="var(--chart-3)" radius={[4, 4, 0, 0]}>
              {weeklyRevenue.map((w) => (
                <Cell key={w.weekLabel} fillOpacity={w.current ? 1 : 0.4} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </section>

      {/* distribuzioni */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DistributionCard
          title="Distribuzione per piattaforma"
          sub="Ricavi ultimi 30 giorni"
          total={formatEUR(platformShares.reduce((s, p) => s + p.revenueCents, 0))}
          rows={platformShares.map((p) => ({
            key: p.marketplace,
            label: MARKETPLACE_LABELS[p.marketplace],
            valueCents: p.revenueCents,
            sub: `${p.sales} vendite`,
          }))}
        />
        <DistributionCard
          title="Distribuzione per categoria"
          sub={`Ricavi ultimi 30 giorni · ${categoryShares.reduce((s, c) => s + c.units, 0)} pezzi`}
          total={formatEUR(categoryShares.reduce((s, c) => s + c.revenueCents, 0))}
          rows={categoryShares.map((c) => ({
            key: c.category,
            label: c.category,
            valueCents: c.revenueCents,
            sub: `${c.units} pz · medio ${formatEUR(Math.round(c.revenueCents / c.units))}`,
          }))}
        />
      </section>

      {/* cassa e settlement */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cassa e settlement</p>
          <span className="text-xs text-muted-foreground">finestra reso 14gg · payout ~7gg</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile icon={Tag} label="Commissioni piattaforme" value={formatEUR(cassaKpi.commissioniCents)} note={`≈ ${cassaKpi.commissioniPctVenduto}% del venduto · settimana`} />
          <KpiTile
            icon={Wallet}
            label="Spedizioni"
            value={formatEUR(cassaKpi.spedizioniCents)}
            note={`${cassaKpi.spedizioniCount} spedizioni · media ${formatEUR(cassaKpi.spedizioniMediaCents)}`}
          />
          <KpiTile icon={Vault} label="In escrow" value={formatEUR(cassaKpi.inEscrowCents)} note={`${cassaKpi.inEscrowSales} vendite in finestra reso`} />
          <KpiTile icon={Download} label="Payout previsto" value={formatEUR(cassaKpi.payoutPrevistoCents)} note={`accredito stimato ${cassaKpi.payoutEta}`} />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold">Stato della cassa</h3>
          <p className="mb-4 text-xs text-muted-foreground">Ripartizione dei ricavi maturati · {formatEUR(cassaSettlement.totalCents)}</p>
          <div
            role="img"
            aria-label={`Liquidato ${formatEUR(cassaSettlement.liquidatoCents)}, payout in arrivo ${formatEUR(cassaSettlement.payoutInArrivoCents)}, in escrow ${formatEUR(cassaSettlement.inEscrowCents)}`}
            className="flex h-3 overflow-hidden rounded-full"
          >
            <span style={{ flex: `0 0 ${(cassaSettlement.liquidatoCents / cassaSettlement.totalCents) * 100}%`, background: "var(--chart-2)" }} />
            <span style={{ flex: `0 0 ${(cassaSettlement.payoutInArrivoCents / cassaSettlement.totalCents) * 100}%`, background: "var(--chart-1)" }} />
            <span style={{ flex: `0 0 ${(cassaSettlement.inEscrowCents / cassaSettlement.totalCents) * 100}%`, background: "var(--chart-4)" }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <LegendItem color="var(--chart-2)" label="Liquidato" value={formatEUR(cassaSettlement.liquidatoCents)} />
            <LegendItem color="var(--chart-1)" label={`Payout in arrivo · ${cassaSettlement.payoutEta}`} value={formatEUR(cassaSettlement.payoutInArrivoCents)} />
            <LegendItem color="var(--chart-4)" label={`In escrow · reso ${cassaSettlement.escrowFinestraGiorni}gg`} value={formatEUR(cassaSettlement.inEscrowCents)} />
          </div>
        </div>
      </section>

      {/* ultime transazioni */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Ultime transazioni</h3>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Capo</TableHead>
                <TableHead>Piattaforma</TableHead>
                <TableHead className="text-right">Lordo</TableHead>
                <TableHead className="text-right">Commissioni</TableHead>
                <TableHead className="text-right">Spedizione</TableHead>
                <TableHead className="text-right">Netto</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountingEntries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {new Date(e.eventDate).toLocaleDateString("it-IT", { day: "numeric", month: "numeric" })}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{e.itemLabel}</div>
                    <div className="text-xs text-muted-foreground">{e.category}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{MARKETPLACE_LABELS[e.marketplace]}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatEUR(e.grossAmountCents)}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-destructive">−{formatEUR(e.platformFeeCents)}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-destructive">−{formatEUR(e.shippingCostCents)}</TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold">{formatEUR(e.netAmountCents)}</TableCell>
                  <TableCell>
                    <Badge className={cn("text-[11px]", STATUS_CLASS[e.status])}>{STATUS_LABEL[e.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Totale · {accountingEntries.length} transazioni</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatEUR(txTotals.gross)}</TableCell>
                <TableCell className="text-right font-mono text-xs text-destructive">−{formatEUR(txTotals.fee)}</TableCell>
                <TableCell className="text-right font-mono text-xs text-destructive">−{formatEUR(txTotals.shipping)}</TableCell>
                <TableCell className="text-right font-mono text-xs font-semibold">{formatEUR(txTotals.net)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </section>

      {/* fornitori */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Fornitori</h3>
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setCaricoOpen(true)}>
            <Plus className="size-3.5" /> Nuovo carico
          </Button>
        </div>
        <div className="mb-3 flex items-start gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
          <Shield className="mt-0.5 size-3.5 shrink-0" />
          <span>
            I nomi dei tuoi fornitori restano <b className="text-foreground">privati</b>: MAAT non ha accesso alla tua lista fornitori,
            la vedi e la gestisci soltanto tu.
          </span>
        </div>
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {suppliers.map((s) => (
            <div key={s.id} className={cn("flex items-center gap-3 p-3.5 transition-colors", highlightSupplier === s.name && "bg-primary/[.08]")}>
              <Avatar className="size-9">
                <AvatarFallback className="bg-secondary font-mono text-xs font-semibold">{initials(s.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{s.name}</div>
                <div className="font-mono text-xs text-muted-foreground">
                  {s.loadsCount} carichi · ultimo {s.updatedAt}
                </div>
              </div>
              <div className="font-mono text-[13px] font-semibold">{supplierFigure(s)}</div>
            </div>
          ))}
        </div>
      </section>

      <RegistraCaricoDialog open={caricoOpen} onOpenChange={setCaricoOpen} suppliers={suppliers} onSubmit={registerLoad} />
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  deltaPct,
  deltaLabel,
  note,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  deltaPct?: number;
  deltaLabel?: string;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {deltaPct !== undefined && (
          <span className="flex items-center gap-1 font-semibold text-[var(--chart-2)]">
            <TrendingUp className="size-3" /> +{deltaPct}%
          </span>
        )}
        {deltaLabel && <span className="font-semibold text-[var(--chart-2)]">{deltaLabel}</span>}
        <span className="text-muted-foreground">{note}</span>
      </div>
    </div>
  );
}

function FeatStat({ value, label, accent, positive }: { value: string; label: string; accent?: boolean; positive?: boolean }) {
  return (
    <div>
      <div className={cn("text-lg font-bold", accent && "text-primary", positive && "text-[#8fe0b8]")}>{value}</div>
      <div className="text-xs text-sidebar-foreground/60">{label}</div>
    </div>
  );
}

function DistributionCard({
  title,
  sub,
  total,
  rows,
}: {
  title: string;
  sub: string;
  total: string;
  rows: { key: string; label: string; valueCents: number; sub: string }[];
}) {
  const max = Math.max(...rows.map((r) => r.valueCents));
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          Totale
          <div className="text-sm font-semibold text-foreground">{total}</div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.key}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-medium text-foreground">{r.label}</span>
              <span className="font-mono text-muted-foreground">
                {formatEUR(r.valueCents)} · {r.sub}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(r.valueCents / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label} <b className="text-foreground">{value}</b>
    </span>
  );
}
