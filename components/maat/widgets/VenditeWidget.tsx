"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatEUR } from "@/lib/utils";
import { sales } from "@/lib/activity-mock";
import { useOverlays } from "@/lib/overlays-store";

/** Vendite recenti: click su una riga apre il float (annuncio, etichetta, logistica). */
export function VenditeWidget() {
  const { openSale } = useOverlays();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Vendite
          </p>
          <span className="font-mono text-xs text-muted-foreground">{sales.length}</span>
        </div>
        <Link
          href="/notifiche"
          className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Tutte <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {sales.length === 0 ? (
        <p className="py-4 text-[13px] text-muted-foreground">Nessuna vendita recente.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {sales.slice(0, 2).map((s) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => openSale(s.sku)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openSale(s.sku);
                }
              }}
              className="flex cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-foreground/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-[var(--chart-2)]" />
              <p className="min-w-0 flex-1 truncate text-[13px] font-medium">{s.itemLabel}</p>
              <span className="font-mono text-[13px] font-semibold text-[var(--chart-2)]">
                {formatEUR(s.priceCents)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
