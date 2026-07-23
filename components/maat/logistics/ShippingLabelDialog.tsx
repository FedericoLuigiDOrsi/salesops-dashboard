"use client";

import { PackageCheck, Printer, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { placeholderPhoto } from "@/lib/placeholder-photo";
import type { Shipment } from "@/types/maat";

const BARCODE_BARS = [
  1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 3, 1, 1, 3, 2, 2, 1, 1, 3, 1, 2, 3, 1, 1, 2, 1, 3,
];

interface ShippingLabelDialogProps {
  shipment: Shipment | null;
  onOpenChange: (open: boolean) => void;
}

export function ShippingLabelDialog({ shipment: s, onOpenChange }: ShippingLabelDialogProps) {
  return (
    <Dialog open={Boolean(s)} onOpenChange={onOpenChange}>
      {s && (
        <DialogContent
          showCloseButton={false}
          className="shipping-label-dialog max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto border-0 bg-card p-0 shadow-e2 sm:max-w-[760px] sm:rounded-[18px]"
        >
          <DialogTitle className="sr-only">Etichetta di spedizione per {s.itemLabel}</DialogTitle>
          <DialogDescription className="sr-only">
            Anteprima stampabile dell&apos;etichetta {s.trackingCode}
          </DialogDescription>

          <div className="grid md:grid-cols-[minmax(0,1fr)_250px]">
            <div className="flex items-center justify-center bg-muted p-4 sm:p-6">
              <ShippingLabel shipment={s} />
            </div>

            <aside className="flex flex-col border-t border-border p-5 md:border-l md:border-t-0 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">
                    Etichetta pronta
                  </p>
                  <h2 className="mt-1.5 text-xl font-bold tracking-tight">Controlla e stampa</h2>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="Chiudi etichetta"
                  className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <img
                  src={placeholderPhoto(s.id, s.itemLabel)}
                  alt={s.itemLabel}
                  className="size-14 rounded-[9px] border border-border object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{s.itemLabel}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">{s.sku}</p>
                </div>
              </div>

              <dl className="mt-6 divide-y divide-border border-y border-border text-xs">
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-muted-foreground">Destinatario</dt>
                  <dd className="truncate font-semibold">{s.recipient}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-muted-foreground">Corriere</dt>
                  <dd className="font-mono font-semibold">{s.carrier}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-muted-foreground">Tracking</dt>
                  <dd className="max-w-[130px] truncate font-mono text-[10px] font-semibold">{s.trackingCode}</dd>
                </div>
              </dl>

              <div className="mt-6 rounded-[10px] bg-accent-soft p-3 text-[11px] leading-relaxed text-accent-ink">
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <PackageCheck className="size-3.5" /> Prima di stampare
                </span>
                <span className="mt-1 block">Verifica articolo, destinatario e corriere.</span>
              </div>

              <div className="mt-auto flex flex-col gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex h-10 items-center justify-center gap-2 rounded-[9px] bg-primary text-sm font-semibold text-primary-foreground transition-[background-color,transform] hover:bg-accent-pressed active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Printer className="size-4" />
                  Stampa etichetta
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="h-9 rounded-[9px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Torna alla board
                </button>
              </div>
            </aside>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

function ShippingLabel({ shipment: s }: { shipment: Shipment }) {
  return (
    <section
      aria-label={`Etichetta di spedizione ${s.trackingCode}`}
      className="shipping-label-print flex aspect-[2/3] w-full max-w-[260px] flex-col overflow-hidden border-2 border-[#001f3f] bg-white p-5 text-[#111] shadow-[0_16px_45px_rgba(0,31,63,.16)] sm:max-w-[350px] print:h-[150mm] print:w-[100mm] print:max-w-none print:shadow-none"
    >
      <header className="flex items-start justify-between gap-4 border-b-2 border-[#111] pb-3">
        <div>
          <p className="font-mono text-[8px] font-bold uppercase tracking-[.18em]">Etichetta di spedizione</p>
          <p className="mt-1 text-2xl font-black tracking-tight">{s.carrier}</p>
        </div>
        <span className="rounded border border-[#111] px-2 py-1 font-mono text-[9px] font-bold uppercase">{s.marketplace}</span>
      </header>

      <div className="border-b border-[#111] py-3">
        <p className="font-mono text-[8px] font-bold uppercase tracking-[.16em] text-[#555]">Destinatario</p>
        <p className="mt-1.5 text-xl font-bold leading-none">{s.recipient}</p>
        <p className="mt-1.5 text-sm font-semibold">{s.destinationCity.name}</p>
        <p className="mt-1 text-[10px] text-[#555]">Indirizzo completo fornito dal corriere</p>
      </div>

      <div className="grid grid-cols-2 border-b border-[#111]">
        <div className="border-r border-[#111] py-3 pr-3">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[.16em] text-[#555]">Ordine</p>
          <p className="mt-1 font-mono text-base font-bold">{s.sku}</p>
        </div>
        <div className="py-3 pl-3">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[.16em] text-[#555]">Contenuto</p>
          <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-tight">{s.itemLabel}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center py-4">
        <div aria-hidden="true" className="flex h-20 items-stretch justify-center gap-[2px] overflow-hidden">
          {BARCODE_BARS.map((width, index) => (
            <span key={index} className="block bg-[#111]" style={{ width }} />
          ))}
        </div>
        <p className="mt-2.5 text-center font-mono text-[11px] font-bold tracking-[.14em]">{s.trackingCode}</p>
      </div>

      <footer className="flex items-end justify-between gap-4 border-t-2 border-[#111] pt-3">
        <div>
          <p className="font-mono text-[8px] font-bold uppercase tracking-[.16em] text-[#555]">Mittente</p>
          <p className="mt-1 text-[11px] font-bold">DirtyTag · Napoli</p>
        </div>
        <div className="flex size-12 items-center justify-center border-2 border-[#111] font-mono text-[8px] font-bold">QR</div>
      </footer>
    </section>
  );
}
