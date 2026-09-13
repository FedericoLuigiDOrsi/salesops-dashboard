"use client";

import { Eye, Printer } from "lucide-react";
import { placeholderPhoto } from "@/lib/placeholder-photo";
import { cn } from "@/lib/utils";
import type { Shipment } from "@/types/maat";

const MARKETPLACE_LETTER: Record<Shipment["marketplace"], string> = {
  vinted: "V",
  depop: "D",
  grailed: "G",
  vestiaire: "Ve",
  ebay: "eB",
};

interface LogisticsCompactRowProps {
  shipment: Shipment;
  dragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onOpenLabel: (shipment: Shipment) => void;
  onOpen: (shipment: Shipment) => void;
}

/**
 * Riga stretta per "Pacchi fatti" in modalità "Prepari i pacchi": una volta
 * stampata l'etichetta non serve più rivedere prezzo/corriere/tempo di
 * attesa, basta riconoscere il pacco al volo prima di darlo al corriere.
 * Solo l'anteprima etichetta resta a portata, per un'eventuale ristampa.
 */
export function LogisticsCompactRow({
  shipment: s,
  dragging,
  onDragStart,
  onDragEnd,
  onOpenLabel,
  onOpen,
}: LogisticsCompactRowProps) {
  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart(s.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(s)}
      className={cn(
        "flex cursor-grab items-center gap-2.5 rounded-lg border border-border bg-card p-2 shadow-e1 transition-[opacity,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-e2 active:cursor-grabbing",
        dragging && "opacity-35"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={placeholderPhoto(s.id, s.itemLabel)}
        alt={s.itemLabel}
        draggable={false}
        className="h-10 w-9 shrink-0 rounded-[7px] border border-border object-cover"
      />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[12.5px] font-semibold leading-tight">{s.itemLabel}</h3>
        <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{s.recipient}</p>
      </div>

      <span
        title={s.marketplace}
        className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] bg-secondary font-mono text-[8.5px] font-bold"
      >
        {MARKETPLACE_LETTER[s.marketplace]}
      </span>

      <button
        type="button"
        draggable={false}
        onClick={(event) => {
          event.stopPropagation();
          onOpenLabel(s);
        }}
        onDragStart={(event) => event.stopPropagation()}
        aria-label={`Anteprima etichetta per ${s.itemLabel}`}
        title="Anteprima etichetta"
        className="flex size-7 shrink-0 items-center justify-center rounded-[7px] text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Eye className="size-3.5" strokeWidth={1.8} />
      </button>
      <span className="hidden shrink-0 items-center gap-1 font-mono text-[9px] text-muted-foreground sm:inline-flex">
        <Printer className="size-3" strokeWidth={1.8} />
        pronto
      </span>
    </article>
  );
}
