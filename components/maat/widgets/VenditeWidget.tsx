"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatEUR } from "@/lib/utils";
import { sales } from "@/lib/activity-mock";

/** Vendite recenti, in sola lettura. */
export function VenditeWidget() {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
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
            <div key={s.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-foreground/[.03]">
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
