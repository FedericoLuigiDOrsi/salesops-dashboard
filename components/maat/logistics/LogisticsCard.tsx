"use client";

import { Check, Clock3, Eye, MapPin, Printer, Truck, UserRound } from "lucide-react";
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
  /** Apre il dettaglio con lo storico eventi. Diverso da onOpenLabel: quella è
      l'etichetta stampabile, due finestre diverse sullo stesso oggetto. */
  onOpen: (shipment: Shipment) => void;
  /**
   * "board" (default) = comportamento di oggi: un solo pulsante che apre
   * l'anteprima. "prep" = modalità "Prepari i pacchi": la priorità è il
   * processo fisico (vedi, cerca, impacchetta, stampa), quindi "Stampa
   * etichetta" stampa subito senza anteprima, l'anteprima diventa un
   * pulsante a parte, e compare "Pacco completato".
   */
  variant?: "board" | "prep";
  /** Solo variant "prep": true se l'etichetta è già stata stampata almeno una volta. */
  printed?: boolean;
  /** Solo variant "prep": stampa diretta, senza aprire l'anteprima. */
  onPrint?: (shipment: Shipment) => void;
  /** Solo variant "prep": sposta il pacco in "Fatti". */
  onComplete?: (shipment: Shipment) => void;
}

function formatElapsed(hours: number) {
  return hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}g`;
}

export function LogisticsCard({
  shipment: s,
  dragging,
  onDragStart,
  onDragEnd,
  onOpenLabel,
  onOpen,
  variant = "board",
  printed = false,
  onPrint,
  onComplete,
}: LogisticsCardProps) {
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

  // L'accento a sinistra sugli urgenti, in "prep", è sostituito da bordo+
  // elevazione, come la card in evidenza di "Offerte in arrivo" in Home —
  // coerenza tra le due priorità visive dell'app, niente più barra laterale
  // colorata. In "board" resta l'accento di prima: quella vista non cambia.
  const prep = variant === "prep";

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
        "cursor-grab rounded-xl border bg-card p-3 shadow-e1 transition-[opacity,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-e2 active:cursor-grabbing",
        prep && urgent
          ? "border-primary/25 shadow-[0_2px_6px_rgba(0,31,63,.08),0_16px_40px_rgba(0,31,63,.10)]"
          : "border-border",
        !prep && urgent && "shadow-[inset_3px_0_0_var(--primary),0_1px_2px_rgba(0,31,63,.04),0_6px_20px_rgba(0,31,63,.06)]",
        dragging && "opacity-35"
      )}
    >
      <div className="flex items-stretch gap-3">
        {/* placeholderPhoto() ritorna un data:image/svg+xml generato in locale e
            next.config.mjs ha già images.unoptimized: next/image non ottimizza nulla qui. */}
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

        {variant !== "board" && (
          <span className={cn("flex items-center gap-1.5 font-mono text-[10px]", timeClass)}>
            <Clock3 className="size-3" strokeWidth={1.8} />
            {canPrintLabel ? "In attesa da " : "In pipeline da "}
            {formatElapsed(s.hoursAgo)}
          </span>
        )}
        {variant !== "board" && !canPrintLabel && (
          <span title={s.trackingCode} className="max-w-[110px] truncate font-mono text-[9.5px] text-muted-foreground">
            {s.trackingCode}
          </span>
        )}
      </div>

      {canPrintLabel && variant === "prep" && (
        <>
          <div className="mt-2.5 grid grid-cols-[minmax(0,1fr)_auto] gap-1.5">
            <button
              type="button"
              draggable={false}
              onClick={(event) => {
                event.stopPropagation();
                onPrint?.(s);
              }}
              onDragStart={(event) => event.stopPropagation()}
              className="flex h-8 items-center justify-center gap-1.5 rounded-[8px] bg-primary text-[11px] font-semibold text-primary-foreground outline-none transition-[background-color,transform] hover:bg-accent-pressed focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px"
              aria-label={`${printed ? "Ristampa" : "Stampa"} etichetta per ${s.itemLabel}`}
            >
              <Printer className="size-3.5" strokeWidth={1.8} />
              {printed ? "Ristampa etichetta" : "Stampa etichetta"}
            </button>
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
              className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-border-strong bg-background text-foreground outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px"
            >
              <Eye className="size-3.5" strokeWidth={1.8} />
            </button>
          </div>

          {s.status === "da_fare" && (
            <button
              type="button"
              draggable={false}
              onClick={(event) => {
                event.stopPropagation();
                onComplete?.(s);
              }}
              onDragStart={(event) => event.stopPropagation()}
              className={cn(
                "mt-1.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-[8px] text-[11px] font-semibold outline-none transition-[background-color,transform] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px",
                printed
                  ? "bg-success text-white hover:bg-success/90"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/70"
              )}
              aria-label={`Segna pacco completato per ${s.itemLabel}`}
            >
              <Check className="size-3.5" strokeWidth={1.8} />
              Pacco completato
            </button>
          )}
        </>
      )}
    </article>
  );
}
