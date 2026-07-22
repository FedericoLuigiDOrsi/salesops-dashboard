"use client";

import { useState } from "react";
import { Shirt, ExternalLink, Download, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sales } from "@/lib/activity-mock";
import { shipments } from "@/lib/logistics-mock";
import { MARKETPLACE_LABELS, SHIPMENT_STATUS_LABELS } from "@/types/maat";
import { formatEUR } from "@/lib/utils";

// Anteprima articolo da una vendita — mirror di public/mobile/maat-shell-account.html
// righe 2824-2856 (markup) + 4042-4128 (logica). Il mockup usa un dizionario
// ARTICLES multi-piattaforma dedicato; qui deriviamo lo stesso pannello da
// lib/activity-mock (sales, marketplace unico venduto) + lib/logistics-mock
// (spedizione per SKU), le due fonti condivise disponibili in questo scope.

interface ArticlePreviewProps {
  sku: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArticlePreview({ sku, open, onOpenChange }: ArticlePreviewProps) {
  const [printed, setPrinted] = useState(false);

  const sale = sku ? sales.find((s) => s.sku === sku) : undefined;
  const shipment = sku ? shipments.find((s) => s.sku === sku) : undefined;

  function handlePrint() {
    setPrinted(true);
    window.setTimeout(() => setPrinted(false), 2000);
  }

  if (!sale) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Articolo non disponibile</DialogTitle>
            <DialogDescription>Nessun dettaglio disponibile per questo articolo.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-5">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground/[.06] text-muted-foreground">
              <Shirt className="size-4.5" />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">SKU {sale.sku}</p>
              <DialogTitle className="mt-0.5 text-[16px] leading-tight">{sale.itemLabel}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="sr-only">Anteprima articolo venduto {sale.itemLabel}</DialogDescription>
        </DialogHeader>

        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[26px] font-semibold tracking-tight">{formatEUR(sale.priceCents)}</span>
          <span className="text-[13px] text-muted-foreground">Prezzo di vendita</span>
        </div>

        <div>
          <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-muted-foreground">Piattaforme</p>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--chart-2)] bg-[color-mix(in_oklab,var(--chart-2)_10%,transparent)] px-2.5 py-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--chart-2)]">
              {MARKETPLACE_LABELS[sale.marketplace]} · venduto qui
            </span>
            <span className="font-mono text-[13px] font-semibold">{formatEUR(sale.priceCents)}</span>
          </div>
        </div>

        <Button variant="outline" className="w-full justify-center gap-1.5" asChild>
          <a href="#" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" /> Vai all&apos;annuncio
          </a>
        </Button>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-muted-foreground">Spedizione</p>
          {shipment ? (
            <div className="flex flex-col gap-1 text-[13px] text-muted-foreground">
              <div>
                Destinatario · <b className="font-semibold text-foreground">{shipment.recipient}</b>
              </div>
              <div>
                Corriere · <b className="font-semibold text-foreground">{shipment.carrier}</b>{" "}
                <span className="font-mono text-xs text-muted-foreground">{shipment.trackingCode}</span>
              </div>
              <div>
                {SHIPMENT_STATUS_LABELS[shipment.status]} · entro <b className="font-semibold text-foreground">{shipment.expectedDeliveryAt}</b>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">Nessuna spedizione attiva per questo articolo.</p>
          )}
          <Button className="w-full justify-center gap-1.5" onClick={handlePrint}>
            {printed ? (
              <>
                <Check className="size-4" /> Etichetta pronta
              </>
            ) : (
              <>
                <Download className="size-4" /> Stampa etichetta
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
