"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { cn, formatEUR } from "@/lib/utils";
import { offers } from "@/lib/activity-mock";
import { hasUrgentOffer } from "@/lib/urgency";
import { useOverlays } from "@/lib/overlays-store";

/** Toast minimale e autonomo: niente provider esterni da montare in layout. */
function useLocalToast() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), 2400);
    return () => window.clearTimeout(id);
  }, [message]);
  return { message, notify: setMessage };
}

const RESOLVED_BADGE: Record<"accepted" | "rejected" | "counter", { label: string; className: string }> = {
  accepted: { label: "Accettata", className: "bg-[color-mix(in_oklab,var(--chart-2)_16%,transparent)] text-[var(--chart-2)]" },
  rejected: { label: "Rifiutata", className: "bg-destructive/10 text-destructive" },
  counter: { label: "Controfferta", className: "bg-primary/25 text-[#7a7000]" },
};

/** Offerte in sospeso: click sulla riga apre il float, ✓/✗ restano scorciatoie. */
export function OfferteWidget() {
  const { openOffer, offerStatus, resolveOffer } = useOverlays();
  const { message, notify } = useLocalToast();

  function handleResolve(offer: { id: string; itemLabel: string; offerCents: number }, status: "accepted" | "rejected") {
    resolveOffer(offer.id, status);
    notify(
      status === "accepted"
        ? `Offerta accettata · ${formatEUR(offer.offerCents)} · ${offer.itemLabel}`
        : `Offerta rifiutata · ${offer.itemLabel}`
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Offerte
          </p>
          <span className="font-mono text-xs text-muted-foreground">{offers.length}</span>
          {hasUrgentOffer(offers) ? (
            <span aria-label="Offerte in attesa da tempo" className="size-1.5 shrink-0 rounded-full bg-destructive" />
          ) : null}
        </div>
        <Link
          href="/notifiche"
          className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Tutte <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {offers.length === 0 ? (
        <p className="py-4 text-[13px] text-muted-foreground">Nessuna offerta in sospeso.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {offers.map((o) => {
            const status = offerStatus[o.id]?.status ?? o.status;
            const resolved = status !== "pending";
            const badge = resolved ? RESOLVED_BADGE[status as "accepted" | "rejected" | "counter"] : null;
            return (
              <div
                key={o.id}
                role="button"
                tabIndex={0}
                onClick={() => openOffer(o.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openOffer(o.id);
                  }
                }}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-foreground/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-[var(--chart-1)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{o.itemLabel}</p>
                  <p className="font-mono text-xs text-muted-foreground">{o.sku}</p>
                </div>
                <span className="font-mono text-[13px] font-semibold">{formatEUR(o.offerCents)}</span>
                {badge ? (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
                      badge.className
                    )}
                  >
                    {badge.label}
                  </span>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Accetta offerta ${o.itemLabel}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolve(o, "accepted");
                      }}
                      className="flex size-7 items-center justify-center rounded-md border border-border text-[var(--chart-2)] transition-colors hover:bg-[var(--chart-2)]/10"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Rifiuta offerta ${o.itemLabel}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolve(o, "rejected");
                      }}
                      className="flex size-7 items-center justify-center rounded-md border border-border text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {message ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="pointer-events-auto rounded-full border border-border bg-popover px-4 py-2 text-[13px] font-medium text-popover-foreground shadow-lg">
            {message}
          </div>
        </div>
      ) : null}
    </div>
  );
}
