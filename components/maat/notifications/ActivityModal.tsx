"use client";

import { Coins, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { sales, offers } from "@/lib/activity-mock";
import { MARKETPLACE_LABELS } from "@/types/maat";
import { cn, formatEUR } from "@/lib/utils";

// Modale "Attività recente" — mirror di public/mobile/maat-shell-account.html
// righe 2812-2822 (markup) + 3784-3811 (renderActm). Vendite + offerte lette
// direttamente da lib/activity-mock, indipendenti dallo stato locale della inbox.

interface ActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_BADGE: Record<"accepted" | "rejected" | "counter", { label: string; className: string }> = {
  accepted: { label: "Accettata", className: "bg-[color-mix(in_oklab,var(--chart-2)_16%,transparent)] text-[var(--chart-2)]" },
  rejected: { label: "Rifiutata", className: "bg-muted text-muted-foreground" },
  counter: { label: "Controfferta inviata", className: "bg-primary/25 text-[#7a7000]" },
};

export function ActivityModal({ open, onOpenChange }: ActivityModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[82vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attività recente</DialogTitle>
          <DialogDescription>Tutte le vendite e le offerte più recenti.</DialogDescription>
        </DialogHeader>

        <section className="flex flex-col gap-1">
          <div className="mb-1 flex items-center justify-between px-1">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-muted-foreground/70">Vendite eseguite</p>
            <span className="font-mono text-xs text-muted-foreground">{sales.length}</span>
          </div>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {sales.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground/[.06] text-muted-foreground">
                  <Coins className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
                    {s.itemLabel}
                    <span className="rounded bg-foreground/[.06] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-muted-foreground">
                      {MARKETPLACE_LABELS[s.marketplace]}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-mono text-foreground/70">SKU {s.sku}</span> · Vendita eseguita
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="font-mono text-[14px] font-semibold text-[var(--chart-2)]">{formatEUR(s.priceCents)}</span>
                  <span className="font-mono text-[11px] text-muted-foreground/70">{s.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-1">
          <div className="mb-1 flex items-center justify-between px-1">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-muted-foreground/70">Offerte ricevute</p>
            <span className="font-mono text-xs text-muted-foreground">{offers.length}</span>
          </div>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {offers.map((o) => {
              const badge = o.status !== "pending" ? STATUS_BADGE[o.status as "accepted" | "rejected" | "counter"] : null;
              return (
                <div key={o.id} className={cn("flex items-center gap-3 p-3", o.status !== "pending" && "opacity-60")}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground/[.06] text-muted-foreground">
                    <Tag className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
                      {o.itemLabel}
                      <span className="rounded bg-foreground/[.06] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-muted-foreground">
                        {MARKETPLACE_LABELS[o.marketplace]}
                      </span>
                      {badge && (
                        <span className={cn("rounded-full px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide", badge.className)}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-mono text-foreground/70">SKU {o.sku}</span> · Offerta ricevuta
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-[14px] font-semibold">{formatEUR(o.offerCents)}</span>
                      <span className="font-mono text-[11px] text-muted-foreground line-through">{formatEUR(o.listPriceCents)}</span>
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground/70">{o.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
