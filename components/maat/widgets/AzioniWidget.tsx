"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/maat/StatusBadge";
import { actionQueue } from "@/lib/catalog-stats";
import { isActionQueueUrgent } from "@/lib/urgency";

/** Coda di lavorazione: bozze da revisionare e capi salvati in locale. */
export function AzioniWidget() {
  const queue = actionQueue();
  const visible = queue.slice(0, 4);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
            Azioni richieste
          </p>
          <span className="font-mono text-xs text-muted-foreground">{queue.length}</span>
          {isActionQueueUrgent(queue, new Date().toISOString()) ? (
            <span aria-label="Capi in coda da tempo" className="size-1.5 shrink-0 rounded-full bg-destructive" />
          ) : null}
        </div>
        <Link
          href="/capi"
          className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Lavorazione <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {visible.length === 0 ? (
        <p className="py-4 text-[13px] text-muted-foreground">Tutto in ordine: nessun capo in attesa di revisione.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {visible.map((entry) => (
            <Link
              key={entry.id}
              href={`/capi/${entry.id}`}
              className="flex items-center gap-3 rounded-lg border border-transparent p-2.5 transition-colors hover:bg-foreground/[.03]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background font-mono text-[9px] uppercase text-muted-foreground">
                Foto
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[13px] font-semibold">
                  {entry.attributes.brand} — {entry.attributes.tipoCapo}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  Taglia {entry.attributes.taglia || "—"}
                </span>
              </div>
              <StatusBadge status={entry.status} />
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
