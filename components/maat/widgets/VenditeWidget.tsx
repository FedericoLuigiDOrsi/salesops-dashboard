"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { formatEUR } from "@/lib/utils";
import { placeholderPhoto } from "@/lib/placeholder-photo";
import { sales } from "@/lib/activity-mock";
import { useOverlays } from "@/lib/overlays-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MARKETPLACE_LABELS, type Marketplace } from "@/types/maat";

const MARKETPLACE_TAG_STYLES: Record<Marketplace, string> = {
  vinted: "border-[#007782]/20 bg-[#007782]/10 text-[#006a70]",
  depop: "border-destructive/20 bg-destructive/[.08] text-destructive",
  grailed: "border-[var(--chart-1)]/20 bg-[var(--chart-1)]/[.08] text-[var(--chart-1)]",
  vestiaire: "border-[#977c45]/20 bg-[#977c45]/10 text-[#6d5a36]",
  ebay: "border-[#1e488f]/20 bg-[#1e488f]/[.08] text-[#1e488f]",
};

/**
 * Vendite: la home mostra solo quante ce ne sono, non l'elenco — il lavoro
 * vero (impacchettare) succede in Logistica, il dettaglio ("Visualizza
 * tutte") vive in un pannello a parte, non impegna spazio nel widget.
 */
export function VenditeWidget() {
  const { openSale } = useOverlays();
  const [allOpen, setAllOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[.12em] text-foreground">Vendite</p>

      {sales.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <p className="text-xs font-semibold">Nessuna vendita recente</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Le nuove vendite appariranno qui.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-center">
          <span className="font-mono text-[42px] font-bold leading-none tabular-nums text-foreground">
            {sales.length}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            {sales.length === 1 ? "vendita da spedire" : "vendite da spedire"}
          </span>
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 border-t border-border pt-2.5">
        <Link
          href="/logistica?mode=prep"
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-accent-pressed active:translate-y-px"
        >
          <Package className="size-3.5" strokeWidth={1.8} />
          Prepara i pacchi
        </Link>
        <button
          type="button"
          onClick={() => setAllOpen(true)}
          disabled={sales.length === 0}
          className="flex h-9 shrink-0 items-center gap-1 rounded-lg border border-border px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-foreground/[.04] hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          Tutte <ArrowRight className="size-3" />
        </button>
      </div>

      <Dialog open={allOpen} onOpenChange={setAllOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vendite · {sales.length}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {sales.map((sale) => (
              <button
                key={sale.id}
                type="button"
                onClick={() => {
                  setAllOpen(false);
                  openSale(sale.sku);
                }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 text-left transition-colors hover:border-foreground/25"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={placeholderPhoto(sale.id, sale.itemLabel)}
                  alt=""
                  className="h-12 w-10 shrink-0 rounded-[8px] border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold" title={sale.itemLabel}>
                    {sale.itemLabel}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
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
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-foreground">
                  {formatEUR(sale.priceCents)}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
