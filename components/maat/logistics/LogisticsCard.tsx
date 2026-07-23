"use client";

import { Clock3, MapPin, Printer, Truck, UserRound } from "lucide-react";
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

interface LogisticsCardProps {
  shipment: Shipment;
  dragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onOpenLabel: (shipment: Shipment) => void;
}

function formatElapsed(hours: number) {
  return hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}g`;
}

export function LogisticsCard({ shipment: s, dragging, onDragStart, onDragEnd, onOpenLabel }: LogisticsCardProps) {
  const canPrintLabel = s.status === "da_fare" || s.status === "fatti";
  const urgent = canPrintLabel && s.hoursAgo >= 24;
  const timeClass =
    s.status === "consegnati"
      ? "text-muted-foreground"
      : s.hoursAgo >= 48
        ? "text-destructive"
        : s.hoursAgo >= 24
          ? "text-accent-ink"
          : "text-muted-foreground";

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart(s.id);
      }}
      onDragEnd={onDragEnd}
      style={
        urgent
          ? { boxShadow: "inset 3px 0 0 var(--primary), 0 1px 2px rgba(0,31,63,.04), 0 6px 20px rgba(0,31,63,.06)" }
          : undefined
      }
      className={cn(
        "cursor-grab rounded-xl border border-border bg-card p-3 shadow-e1 transition-[opacity,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-e2 active:cursor-grabbing",
        dragging && "opacity-35"
      )}
    >
      <div className="flex items-stretch gap-3">
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

          <div className="mt-auto flex min-w-0 items-center gap-1.5">
            <UserRound className="size-3 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            <span className="truncate text-[11px] font-medium">{s.recipient}</span>
          </div>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5 border-t border-border pt-2.5">
        <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <MapPin className="size-3 shrink-0" strokeWidth={1.8} />
          <span className="truncate">{s.destinationCity.name}</span>
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
          <Truck className="size-3" strokeWidth={1.7} />
          {s.carrier}
        </span>

        <span className={cn("flex items-center gap-1.5 font-mono text-[10px]", timeClass)}>
          <Clock3 className="size-3" strokeWidth={1.8} />
          {canPrintLabel ? "In attesa da " : "In pipeline da "}
          {formatElapsed(s.hoursAgo)}
        </span>
        {!canPrintLabel && (
          <span title={s.trackingCode} className="max-w-[110px] truncate font-mono text-[9.5px] text-muted-foreground">
            {s.trackingCode}
          </span>
        )}
      </div>

      {canPrintLabel && (
        <button
          type="button"
          draggable={false}
          onClick={(event) => {
            event.stopPropagation();
            onOpenLabel(s);
          }}
          onDragStart={(event) => event.stopPropagation()}
          className={cn(
            "mt-2.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-[8px] text-[11px] font-semibold outline-none transition-[background-color,transform,box-shadow] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px",
            s.status === "da_fare"
              ? "bg-primary text-primary-foreground hover:bg-accent-pressed"
              : "border border-border-strong bg-background text-foreground hover:bg-secondary"
          )}
          aria-label={`${s.status === "da_fare" ? "Stampa" : "Ristampa"} etichetta per ${s.itemLabel}`}
        >
          <Printer className="size-3.5" strokeWidth={1.8} />
          {s.status === "da_fare" ? "Stampa etichetta" : "Ristampa etichetta"}
        </button>
      )}
    </article>
  );
}
