"use client";

import { CheckCircle2, MapPin, Truck } from "lucide-react";
import { placeholderPhoto } from "@/lib/placeholder-photo";
import { cn, formatEUR } from "@/lib/utils";
import type { Shipment } from "@/types/maat";

const MARKETPLACE_LETTER: Record<Shipment["marketplace"], string> = {
  vinted: "V",
  depop: "D",
  grailed: "G",
  vestiaire: "Ve",
  ebay: "eB",
};

type TrackingStage = "shipped" | "in_transit" | "delivered";
const STAGE_ORDER: TrackingStage[] = ["shipped", "in_transit", "delivered"];
const STAGE_LABELS: Record<TrackingStage, string> = {
  shipped: "Spedito",
  in_transit: "In transito",
  delivered: "Consegnato",
};

/**
 * Stadio del tracking derivato dallo status + ore trascorse: non c'è ancora
 * un feed corriere reale collegato, quindi oggi è una stima. La card è già
 * pronta a leggere uno stadio vero (FulfillmentEvent) quando il tracking
 * live sarà collegato: cambia solo questa funzione, non il componente.
 */
function stageFor(s: Shipment): TrackingStage {
  if (s.status === "consegnati") return "delivered";
  return s.hoursAgo >= 20 ? "in_transit" : "shipped";
}

function formatElapsed(hours: number) {
  return hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}g`;
}

interface LogisticsTrackingCardProps {
  shipment: Shipment;
  onOpen: (shipment: Shipment) => void;
}

export function LogisticsTrackingCard({ shipment: s, onOpen }: LogisticsTrackingCardProps) {
  const stage = stageFor(s);
  const stageIndex = STAGE_ORDER.indexOf(stage);
  const delivered = stage === "delivered";

  return (
    <article
      onClick={() => onOpen(s)}
      className="cursor-pointer rounded-xl border border-border bg-card p-3 shadow-e1 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-e2"
    >
      <div className="flex items-stretch gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={placeholderPhoto(s.id, s.itemLabel)}
          alt={s.itemLabel}
          draggable={false}
          className="h-[68px] w-14 shrink-0 rounded-[9px] border border-border object-cover"
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[13px] font-semibold leading-tight">{s.itemLabel}</h3>
              <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                {s.sku} <span aria-hidden="true">·</span> {formatEUR(s.priceCents)}
              </p>
            </div>
            <span
              title={s.marketplace}
              className="flex size-[20px] shrink-0 items-center justify-center rounded-[5px] bg-secondary font-mono text-[9px] font-bold"
            >
              {MARKETPLACE_LETTER[s.marketplace]}
            </span>
          </div>

          <div className="mt-auto flex min-w-0 items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3 shrink-0" strokeWidth={1.8} />
              <span className="truncate">{s.destinationCity.name}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10.5px]">
              <Truck className="size-3" strokeWidth={1.7} />
              {s.carrier}
            </span>
          </div>
        </div>
      </div>

      {/* Indicatore di stato tracking: si riempie a mano a mano che la spedizione
          avanza, diventa verde e piena quando risulta consegnata. */}
      <div className="mt-2.5 border-t border-border pt-2.5">
        <div className="flex items-center gap-1">
          {STAGE_ORDER.map((st, i) => (
            <span key={st} className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <span
                className={cn(
                  "block h-full rounded-full transition-[width] duration-500",
                  delivered ? "bg-success" : "bg-primary"
                )}
                style={{ width: i <= stageIndex ? "100%" : "0%" }}
              />
            </span>
          ))}
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className={cn("font-mono text-[10.5px] font-medium", delivered ? "text-success" : "text-foreground")}>
            {STAGE_LABELS[stage]}
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            {delivered ? (
              <CheckCircle2 className="size-3 text-success" strokeWidth={1.8} />
            ) : (
              `da ${formatElapsed(s.hoursAgo)}`
            )}
          </span>
        </div>
      </div>
    </article>
  );
}
