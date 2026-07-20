"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, SlidersHorizontal, Check, X, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatEUR } from "@/lib/utils";
import { offers as initialOffers, sales } from "@/lib/activity-mock";
import { HOME_METRICS, DEFAULT_SELECTED_METRICS } from "@/lib/home-mock";
import type { Offer } from "@/types/maat";

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

export function HomeDashboard() {
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED_METRICS);
  const [editOpen, setEditOpen] = useState(false);
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [refreshing, setRefreshing] = useState(false);
  const { message, notify } = useLocalToast();

  const visibleMetrics = HOME_METRICS.filter((m) => selected.includes(m.key));

  function toggleMetric(key: string) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function resolveOffer(offer: Offer, status: "accepted" | "rejected") {
    setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, status } : o)));
    notify(
      status === "accepted"
        ? `Offerta accettata · ${formatEUR(offer.offerCents)} · ${offer.itemLabel}`
        : `Offerta rifiutata · ${offer.itemLabel}`
    );
  }

  function handleRefresh() {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 500);
  }

  return (
    <div className="relative mx-auto max-w-[1400px] px-6 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Dashboard
          </p>
          <h1 className="text-[28px] font-bold tracking-tight">Ciao, Federico</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" aria-label="Aggiorna" onClick={handleRefresh}>
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/contabilita">
              <PackagePlus /> Registra carico
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/capi/nuovo/foto/fronte">
              <Plus /> Crea capo
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Panoramica — box configurabile */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
              Panoramica
            </p>
            <Popover open={editOpen} onOpenChange={setEditOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                  <SlidersHorizontal className="size-3.5" />
                  Modifica
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-3">
                <p className="mb-2 px-1 text-xs font-semibold text-muted-foreground">Scegli cosa mostrare</p>
                <div className="flex flex-col gap-0.5">
                  {HOME_METRICS.map((m) => (
                    <label
                      key={m.key}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-foreground/[.04]"
                    >
                      <Checkbox checked={selected.includes(m.key)} onCheckedChange={() => toggleMetric(m.key)} />
                      <span className={cn("size-2 shrink-0 rounded-full", m.dotColor)} />
                      <span className="flex-1">{m.label}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {visibleMetrics.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-muted-foreground">
              Nessuna informazione selezionata. Usa &ldquo;Modifica&rdquo;.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {visibleMetrics.map((m) => (
                <div key={m.key} className="flex flex-col gap-1.5 rounded-lg border border-border bg-background/40 px-4 py-3">
                  <span className="font-mono text-2xl font-semibold tabular-nums">{m.value}</span>
                  <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span className={cn("size-1.5 shrink-0 rounded-full", m.dotColor)} />
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Offerte / Vendite */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => notify("Vista completa offerte e vendite — presto in Notifiche")}
            >
              Visualizza tutte
            </Button>
          </div>

          <div className="flex flex-col gap-5">
            {/* Offerte */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
                  Offerte
                </p>
                <span className="font-mono text-xs text-muted-foreground">{offers.length}</span>
              </div>
              {offers.length === 0 ? (
                <p className="py-4 text-[13px] text-muted-foreground">Nessuna offerta in sospeso.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {offers.map((o) => {
                    const resolved = o.status !== "pending";
                    return (
                      <div
                        key={o.id}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-foreground/[.03]"
                      >
                        <span className="size-1.5 shrink-0 rounded-full bg-[var(--chart-1)]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">{o.itemLabel}</p>
                          <p className="font-mono text-xs text-muted-foreground">{o.sku}</p>
                        </div>
                        <span className="font-mono text-[13px] font-semibold">{formatEUR(o.offerCents)}</span>
                        {resolved ? (
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
                              o.status === "accepted"
                                ? "bg-[color-mix(in_oklab,var(--chart-2)_16%,transparent)] text-[var(--chart-2)]"
                                : "bg-destructive/10 text-destructive"
                            )}
                          >
                            {o.status === "accepted" ? "Accettata" : "Rifiutata"}
                          </span>
                        ) : (
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              aria-label={`Accetta offerta ${o.itemLabel}`}
                              onClick={() => resolveOffer(o, "accepted")}
                              className="flex size-7 items-center justify-center rounded-md border border-border text-[var(--chart-2)] transition-colors hover:bg-[var(--chart-2)]/10"
                            >
                              <Check className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Rifiuta offerta ${o.itemLabel}`}
                              onClick={() => resolveOffer(o, "rejected")}
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
            </div>

            {/* Vendite */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
                  Vendite
                </p>
                <span className="font-mono text-xs text-muted-foreground">{sales.length}</span>
              </div>
              {sales.length === 0 ? (
                <p className="py-4 text-[13px] text-muted-foreground">Nessuna vendita recente.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {sales.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-foreground/[.03]"
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-[var(--chart-2)]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{s.itemLabel}</p>
                        <p className="font-mono text-xs text-muted-foreground">{s.sku}</p>
                      </div>
                      <span className="font-mono text-[13px] font-semibold text-[var(--chart-2)]">
                        {formatEUR(s.priceCents)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

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
