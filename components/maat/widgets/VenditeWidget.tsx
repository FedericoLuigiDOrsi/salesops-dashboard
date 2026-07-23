"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatEUR } from "@/lib/utils";
import { sales } from "@/lib/activity-mock";
import { useOverlays } from "@/lib/overlays-store";
import { MARKETPLACE_LABELS, type Marketplace } from "@/types/maat";

const MAX_VISIBLE_SALES = 2;

const MARKETPLACE_TAG_STYLES: Record<Marketplace, string> = {
  vinted: "border-[#007782]/20 bg-[#007782]/10 text-[#006a70]",
  depop: "border-destructive/20 bg-destructive/[.08] text-destructive",
  grailed: "border-[var(--chart-1)]/20 bg-[var(--chart-1)]/[.08] text-[var(--chart-1)]",
  vestiaire: "border-[#977c45]/20 bg-[#977c45]/10 text-[#6d5a36]",
  ebay: "border-[#1e488f]/20 bg-[#1e488f]/[.08] text-[#1e488f]",
};

/** Vendite recenti: click su una riga apre il float (annuncio, etichetta, logistica). */
export function VenditeWidget() {
  const { openSale } = useOverlays();
  const visibleSales = sales.slice(0, MAX_VISIBLE_SALES);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[.12em] text-foreground">
            Vendite
          </p>
          <span className="font-mono text-[10px] text-muted-foreground">{sales.length}</span>
        </div>
        <Link
          href="/notifiche"
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-[color,transform] hover:translate-x-0.5 hover:text-foreground active:translate-y-px"
        >
          Tutte <ArrowRight className="size-3" />
        </Link>
      </div>

      {sales.length === 0 ? (
        <div className="flex min-h-28 items-center justify-center text-center">
          <div>
            <p className="text-xs font-semibold">Nessuna vendita recente</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Le nuove vendite appariranno qui.</p>
          </div>
        </div>
      ) : (
        <div>
          {visibleSales.map((sale) => (
            <button
              key={sale.id}
              type="button"
              aria-label={`Apri vendita ${sale.itemLabel}`}
              onClick={() => openSale(sale.sku)}
              className="grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 border-b border-border py-2.5 text-left transition-[background-color,transform] last:border-b-0 hover:bg-foreground/[.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px"
            >
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold tracking-[-.01em]" title={sale.itemLabel}>
                  {sale.itemLabel}
                </span>
                <span className="mt-1.5 flex items-center gap-1.5 whitespace-nowrap">
                  <span
                    className={`inline-flex h-[18px] items-center rounded-full border px-1.5 font-mono text-[8px] font-semibold uppercase tracking-[.06em] ${MARKETPLACE_TAG_STYLES[sale.marketplace]}`}
                  >
                    {MARKETPLACE_LABELS[sale.marketplace]}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[.025em] text-muted-foreground">
                    {sale.sku}
                  </span>
                  <span aria-hidden="true" className="text-[9px] text-muted-foreground/50">
                    ·
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[.025em] text-muted-foreground">
                    {sale.time}
                  </span>
                </span>
              </span>
              <span className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
                {formatEUR(sale.priceCents)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
