"use client";

import { useEffect, useState } from "react";
import { Shirt, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MARKETPLACE_LABELS, type OfferStatus } from "@/types/maat";
import { formatEUR } from "@/lib/utils";
import type { OfferNotification } from "@/lib/notifications-mock";

// Popup risposta offerta — mirror di public/mobile/maat-shell-account.html
// righe 2775-2810 (markup) + 3579-3627 (logica accept/reject/counter).

interface OfferPopupProps {
  offer: OfferNotification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (id: string, status: OfferStatus, counterCents?: number) => void;
}

export function OfferPopup({ offer, open, onOpenChange, onResolve }: OfferPopupProps) {
  const [counterMode, setCounterMode] = useState(false);
  const [counterInput, setCounterInput] = useState("");

  // Reset del popup ad ogni apertura su una nuova offerta — controfferta
  // preimpostata alla media tra offerta e prezzo di listino, come nel mockup.
  useEffect(() => {
    if (open && offer) {
      setCounterMode(false);
      setCounterInput(String(Math.round((offer.offerCents + offer.listPriceCents) / 2 / 100)));
    }
  }, [open, offer]);

  if (!offer) return null;

  const diffPct = Math.round(((offer.offerCents - offer.listPriceCents) / offer.listPriceCents) * 100);

  function resolveAndClose(status: OfferStatus, counterCents?: number) {
    if (!offer) return;
    onResolve(offer.id, status, counterCents);
    onOpenChange(false);
  }

  function handleSend() {
    const normalized = counterInput.trim().replace(",", ".");
    const value = Number.parseFloat(normalized);
    if (!Number.isFinite(value) || value <= 0) return;
    resolveAndClose("counter", Math.round(value * 100));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-5">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-foreground/[.06] text-muted-foreground">
              {offer.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={offer.photoUrl} alt={offer.itemLabel} className="size-full object-cover" />
              ) : (
                <Shirt className="size-5" />
              )}
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground/70">Offerta ricevuta</p>
              <DialogTitle className="mt-0.5 text-[16px] leading-tight">{offer.itemLabel}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="flex items-center gap-2 pl-12 text-left">
            {offer.marketplace && (
              <span className="rounded bg-foreground/[.06] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {MARKETPLACE_LABELS[offer.marketplace]}
              </span>
            )}
            {offer.sku && <span className="font-mono text-xs text-muted-foreground">SKU {offer.sku}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/60 px-2 py-2.5 text-center">
            <p className="text-[11px] text-muted-foreground">Offerta</p>
            <p className="mt-0.5 font-mono text-[16px] font-semibold">{formatEUR(offer.offerCents)}</p>
          </div>
          <div className="rounded-lg bg-muted/60 px-2 py-2.5 text-center">
            <p className="text-[11px] text-muted-foreground">Prezzo</p>
            <p className="mt-0.5 font-mono text-[16px] font-medium text-muted-foreground line-through">{formatEUR(offer.listPriceCents)}</p>
          </div>
          <div className="rounded-lg bg-muted/60 px-2 py-2.5 text-center">
            <p className="text-[11px] text-muted-foreground">Diff.</p>
            <p className="mt-0.5 font-mono text-[16px] font-semibold text-destructive">
              {diffPct > 0 ? "+" : ""}
              {diffPct}%
            </p>
          </div>
        </div>

        <Button variant="outline" className="w-full justify-center gap-1.5" asChild>
          <a href={offer.listingUrl ?? "#"} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" /> Vai all&apos;annuncio
          </a>
        </Button>

        {counterMode && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="offer-counter-input" className="text-sm font-medium">
              La tua controfferta
            </label>
            <div className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1">
              <span className="text-sm text-muted-foreground">€</span>
              <Input
                id="offer-counter-input"
                value={counterInput}
                onChange={(e) => setCounterInput(e.target.value.replace(/[^0-9.,]/g, ""))}
                inputMode="decimal"
                placeholder="0,00"
                autoFocus
                className="border-none p-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {!counterMode ? (
            <>
              <Button type="button" variant="destructive" className="flex-1" onClick={() => resolveAndClose("rejected")}>
                Rifiuta
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCounterMode(true)}>
                Controfferta
              </Button>
              <Button type="button" className="flex-1" onClick={() => resolveAndClose("accepted")}>
                Accetta
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setCounterMode(false)}>
                Annulla
              </Button>
              <Button type="button" className="flex-1" onClick={handleSend}>
                Invia controfferta
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
