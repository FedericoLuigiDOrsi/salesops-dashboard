"use client";

import { MapPin, Printer, PackageCheck, Truck, PackageOpen } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketplaceBadge } from "@/components/maat/MarketplaceBadge";
import { EmptyState } from "@/components/maat/EmptyState";
import { FulfillmentEventRow } from "@/components/maat/logistics/FulfillmentEventRow";
import { formatEUR, cn } from "@/lib/utils";
import {
  SHIPMENT_STATUS_LABELS,
  type FulfillmentEvent,
  type Shipment,
  type ShipmentStatus,
} from "@/types/maat";

/**
 * Dettaglio di una spedizione: lo storico eventi reale, non lo stato riassunto.
 *
 * La board Kanban mostra quattro colonne di stato; il canonico registra invece
 * una sequenza di eventi in `fulfillments`. Questa view NON risolve la
 * mappatura fra le due cose: la rende osservabile, mostrando gli eventi così
 * come sono. Se per una spedizione non esiste ancora nessun evento, lo dice —
 * non inventa un evento per far tornare i conti.
 *
 * Brief: docs/technical/ooux/14-sketch-brief-shipment-detail.md
 *
 * Non sostituisce ShippingLabelDialog: sono due finestre diverse sullo stesso
 * oggetto, aperte da trigger diversi. L'etichetta si apre SOPRA questo Sheet.
 *
 * PII: mostra la città, non nome e indirizzo del destinatario. Quelli restano
 * all'etichetta.
 */

/** Lo stato corrente è DERIVATO dall'ultimo evento, non è un campo. */
const STAGE_TO_STATUS: Record<FulfillmentEvent["stage"], ShipmentStatus> = {
  packing: "da_fare",
  ready: "fatti",
  shipped: "spediti",
  in_transit: "spediti",
  delivered: "consegnati",
};

const STATUS_ORDER: ShipmentStatus[] = ["da_fare", "fatti", "spediti", "consegnati"];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "long" }).format(new Date(iso));
}

interface ShipmentDetailProps {
  shipment: Shipment | null;
  events: FulfillmentEvent[];
  onOpenChange: (open: boolean) => void;
  onAdvance: (shipment: Shipment, to: ShipmentStatus) => void;
  onPrintLabel: (shipment: Shipment) => void;
}

export function ShipmentDetail({ shipment, events, onOpenChange, onAdvance, onPrintLabel }: ShipmentDetailProps) {
  if (!shipment) return null;

  const ordered = [...events].sort((a, b) => +new Date(a.occurredAt) - +new Date(b.occurredAt));
  const latest = ordered.at(-1);

  // Senza eventi lo stato non si inventa: è "Da fare" per default, ed è vero.
  const derived: ShipmentStatus = latest ? STAGE_TO_STATUS[latest.stage] : "da_fare";
  const derivedIndex = STATUS_ORDER.indexOf(derived);

  const expected = [...ordered].reverse().find((e) => e.expectedDeliveryAt)?.expectedDeliveryAt ?? null;
  const late = expected ? new Date(expected) < new Date() && derived !== "consegnati" : false;

  // Le CTA si mostrano SOLO in avanti: non si "segna spedito" una consegnata.
  const canMarkReady = derivedIndex < STATUS_ORDER.indexOf("fatti");
  const canMarkShipped = derivedIndex < STATUS_ORDER.indexOf("spediti");
  const canMarkDelivered = derived === "spediti";

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <MarketplaceBadge marketplace={shipment.marketplace} />
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full border-transparent bg-muted px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              <span className="size-1.5 rounded-full bg-current" />
              {SHIPMENT_STATUS_LABELS[derived]}
            </Badge>
          </div>
          <SheetTitle className="text-[22px] leading-tight">{shipment.itemLabel}</SheetTitle>
          <SheetDescription className="font-mono text-xs">{shipment.sku}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          {/* 1 · Storico eventi — la ragione della view, quindi per prima */}
          <section>
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
              Storico
            </h3>
            {ordered.length === 0 ? (
              <EmptyState
                tone="idle"
                title="Nessun evento registrato"
                subtitle="La spedizione è nel flusso ma il canonico non ha ancora nessun evento per questo capo."
                className="items-start text-left"
              />
            ) : (
              <ol className="mt-3">
                {ordered.map((e, i) => (
                  <FulfillmentEventRow key={e.id} event={e} isLatest={i === ordered.length - 1} />
                ))}
              </ol>
            )}
          </section>

          {/* 2 · Consegna prevista */}
          {expected ? (
            <section>
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
                Consegna prevista
              </h3>
              <p className={cn("mt-1.5 text-sm font-medium", late && "text-destructive")}>
                {formatDate(expected)}
                {late ? " · in ritardo" : ""}
              </p>
            </section>
          ) : null}

          {/* 3 · Destinazione — città, non il destinatario: è PII */}
          <section>
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
              Destinazione
            </h3>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm">
              <MapPin className="size-3.5 text-muted-foreground" />
              {shipment.destinationCity.name}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Nome e indirizzo del destinatario restano sull&apos;etichetta di spedizione.
            </p>
          </section>

          <p className="font-mono text-[11px] text-muted-foreground/70">
            Vendita {formatEUR(shipment.priceCents)}
          </p>
        </div>

        <SheetFooter className="mt-auto flex-col gap-2 border-t border-border">
          {canMarkDelivered ? (
            <Button className="w-full gap-1.5" onClick={() => onAdvance(shipment, "consegnati")}>
              <PackageCheck className="size-3.5" /> Segna consegnato
            </Button>
          ) : canMarkShipped ? (
            <Button className="w-full gap-1.5" onClick={() => onAdvance(shipment, "spediti")}>
              <Truck className="size-3.5" /> Segna spedito
            </Button>
          ) : null}

          {/* ⚠️ "Segna pronto" resta aperta dal brief: non è chiaro se scriva un
                 evento canonico o sia solo un colore-scrivania. La board la offre
                 già, quindi c'è, ma non fingiamo di sapere a quale stage scrive. */}
          {canMarkReady ? (
            <Button variant="ghost" className="w-full gap-1.5" onClick={() => onAdvance(shipment, "fatti")}>
              <PackageOpen className="size-3.5" /> Segna pronto
            </Button>
          ) : null}

          <Button variant="ghost" className="w-full gap-1.5" onClick={() => onPrintLabel(shipment)}>
            <Printer className="size-3.5" />
            {derivedIndex >= STATUS_ORDER.indexOf("spediti") ? "Ristampa etichetta" : "Stampa etichetta"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
