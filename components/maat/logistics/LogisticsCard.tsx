"use client";

import { Clock, MapPin, Truck } from "lucide-react";
import { cn, formatEUR, formatHoursAgo } from "@/lib/utils";
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
}

export function LogisticsCard({ shipment: s, dragging, onDragStart, onDragEnd }: LogisticsCardProps) {
  const urgent = (s.status === "da_fare" || s.status === "fatti") && s.hoursAgo >= 24;
  const timeClass =
    s.status === "consegnati" ? "text-muted-foreground" : s.hoursAgo >= 48 ? "text-destructive" : s.hoursAgo >= 24 ? "text-accent-ink" : "text-muted-foreground";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart(s.id);
      }}
      onDragEnd={onDragEnd}
      style={
        urgent
          ? { boxShadow: "inset 3px 0 0 var(--primary), 0 1px 2px rgba(0,31,63,.04), 0 6px 20px rgba(0,31,63,.06)" }
          : undefined
      }
      className={cn(
        "cursor-grab rounded-xl border border-border bg-card p-2.5 shadow-e1 transition-[opacity,transform,box-shadow] hover:-translate-y-0.5 hover:shadow-e2",
        dragging && "opacity-35"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex size-[46px] shrink-0 items-center justify-center rounded-[9px] border border-border bg-background">
          <span className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground/60">Foto</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-tight">{s.itemLabel}</div>
          <div className="mt-px font-mono text-[10.5px] text-muted-foreground">
            {s.sku} · {formatEUR(s.priceCents)}
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5">
          {urgent && <span title="Vendita in scadenza" className="size-2 shrink-0 rounded-full bg-primary" />}
          <span className="flex size-[17px] items-center justify-center rounded-[5px] bg-secondary font-mono text-[9px] font-bold">
            {MARKETPLACE_LETTER[s.marketplace]}
          </span>
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-2.5">
        <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="size-3 shrink-0" strokeWidth={1.8} />
          <span className="truncate">{s.destinationCity.name}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 font-mono text-[10.5px] text-muted-foreground">
          <Truck className="size-3" strokeWidth={1.6} />
          {s.carrier}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={cn("flex items-center gap-1 font-mono text-[10px]", timeClass)}>
          <Clock className="size-[11px]" strokeWidth={1.8} />
          {formatHoursAgo(s.hoursAgo)}
        </span>
        {s.status === "da_fare" ? (
          <span className="inline-flex items-center rounded-full bg-accent-soft px-[7px] py-0.5 text-[10px] font-semibold text-accent-ink">
            Etichetta
          </span>
        ) : (
          <span className="max-w-[110px] truncate font-mono text-[10px] text-muted-foreground">{s.trackingCode}</span>
        )}
      </div>
    </div>
  );
}
