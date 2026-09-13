import { FULFILLMENT_STAGE_LABELS, type FulfillmentEvent } from "@/types/maat";
import { cn } from "@/lib/utils";

// Una riga dello storico di una spedizione.
//
// `carrier` e `trackingCode` sono PER EVENTO, non per spedizione: valori
// diversi su righe diverse sono legittimi (un cambio corriere in transito), non
// un errore di dati. Per questo si leggono dalla riga e non dall'intestazione.
//
// `stage` resta un enum tipizzato e non testo formattato: il MCSFD (Fase 1) lo
// vuole filtrabile, quindi la label si deriva qui e il dato resta strutturato.

function formatWhen(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

interface FulfillmentEventRowProps {
  event: FulfillmentEvent;
  /** L'ultimo evento in ordine di tempo: è quello che determina lo stato corrente. */
  isLatest?: boolean;
}

export function FulfillmentEventRow({ event, isLatest }: FulfillmentEventRowProps) {
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {/* Filo verticale della cronologia, interrotto sull'ultimo evento. */}
      <span aria-hidden className="absolute left-[5px] top-4 bottom-0 w-px bg-border last:hidden" />
      <span
        aria-hidden
        className={cn(
          "relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-card",
          isLatest ? "bg-primary" : "bg-border"
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className={cn("text-sm", isLatest ? "font-semibold" : "font-medium")}>
            {FULFILLMENT_STAGE_LABELS[event.stage]}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">{formatWhen(event.occurredAt)}</span>
        </div>

        {(event.carrier || event.trackingCode) && (
          <p className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-muted-foreground">
            {event.carrier ? <span>{event.carrier}</span> : null}
            {event.trackingCode ? (
              <>
                {event.carrier ? <span aria-hidden>·</span> : null}
                <span className="text-foreground">{event.trackingCode}</span>
              </>
            ) : null}
          </p>
        )}

        {event.note ? <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{event.note}</p> : null}
      </div>
    </li>
  );
}
