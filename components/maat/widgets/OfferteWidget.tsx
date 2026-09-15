"use client";

import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowRight, Check, ChevronRight, RefreshCw, Shirt } from "lucide-react";
import { cn, formatEUR } from "@/lib/utils";
import { offers } from "@/lib/activity-mock";
import { hasUrgentOffer } from "@/lib/urgency";
import { useOverlays } from "@/lib/overlays-store";
import { useMarketplaceActions } from "@/lib/marketplace-actions-store";
import { isActive, isLingering, offerDisplayState } from "@/lib/marketplace-actions";
import { ActionControls } from "@/components/maat/ActionControls";
import type { MarketplaceAction, Offer } from "@/types/maat";

const SECONDARY_VISIBLE = 3;

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

function offerDelta(offer: Offer) {
  return Math.round(((offer.offerCents - offer.listPriceCents) / offer.listPriceCents) * 100);
}

function offerDeltaEUR(offer: Offer) {
  const diffCents = offer.offerCents - offer.listPriceCents;
  const sign = diffCents >= 0 ? "+" : "−";
  return `${sign}${formatEUR(Math.abs(diffCents))}`;
}

/** L'azione resta nella riga finché è attiva, fallita o appena conclusa ("Fatta" per 3 s). */
function visibleAction(action: MarketplaceAction | null, now: number): MarketplaceAction | null {
  if (!action) return null;
  if (isActive(action) || action.state === "failed" || isLingering(action, now)) return action;
  return null;
}

/** Coda prioritaria: l'offerta più vecchia è in evidenza, le successive restano azionabili a colpo d'occhio. */
export function OfferteWidget() {
  const { openOffer } = useOverlays();
  const { actionFor, now } = useMarketplaceActions();

  const effective = offers
    .map((offer) => {
      const action = actionFor({ type: "offer", id: offer.id });
      const display = offerDisplayState(offer.status, offer.counterCents, action);
      return { offer, action: visibleAction(action, now), status: display.status, counterCents: display.counterCents };
    })
    .sort((a, b) => new Date(a.offer.receivedAt).getTime() - new Date(b.offer.receivedAt).getTime());

  const pendingCount = effective.filter((entry) => entry.status === "pending" && entry.action === null).length;
  // Accettate e rifiutate escono dal flusso dopo i 3 s della riga "Fatta".
  const visible = effective.filter(
    (entry) => (entry.status !== "accepted" && entry.status !== "rejected") || entry.action !== null,
  );
  const featured = visible[0];
  const secondary = visible.slice(1, SECONDARY_VISIBLE + 1);

  // Una controfferta inviata non si annulla più: resta come esito, senza "Annulla".
  function renderCountered(offer: Offer, counterCents: number | undefined, compact = false) {
    return (
      <motion.div
        key={offer.id}
        layout
        variants={itemVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        className={cn(
          "flex items-center gap-3 rounded-xl bg-primary/10 shadow-[inset_3px_0_0_var(--primary)]",
          compact ? "px-1 py-3" : "p-4"
        )}
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/25 text-accent-ink">
          <RefreshCw className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold">{offer.itemLabel}</p>
          <p className="truncate font-mono text-[10px] font-semibold text-muted-foreground">
            Controfferta a {formatEUR(counterCents ?? offer.offerCents)} · {offer.sku}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-[16px] font-bold tracking-[-.01em] text-foreground">Offerte in arrivo</p>
          {pendingCount > 0 ? (
            <span className="rounded-full bg-primary px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary-foreground">
              {pendingCount}
            </span>
          ) : null}
          {featured && hasUrgentOffer(offers) ? (
            <span className="hidden items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-1 text-[10px] font-semibold text-destructive sm:inline-flex">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-destructive" />
              1 da ieri
            </span>
          ) : null}
        </div>
        <Link
          href="/notifiche"
          className="flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-foreground/[.04] hover:text-foreground"
        >
          Tutte <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {!featured ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Check className="size-5" />
          </span>
          <p className="mt-3 text-[14px] font-semibold">Nessuna offerta in sospeso</p>
          <p className="mt-1 text-[12px] text-muted-foreground">Le nuove proposte compariranno qui.</p>
        </div>
      ) : (
        <motion.div variants={listVariants} initial="hidden" animate="show" className="flex flex-1 flex-col">
          <AnimatePresence initial={false}>
            {featured.status === "counter" && featured.action === null ? (
              renderCountered(featured.offer, featured.counterCents)
            ) : (
              <motion.section
                key={featured.offer.id}
                layout
                variants={itemVariants}
                className="my-2 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/20 via-primary/[.06] to-transparent p-4 shadow-[0_2px_6px_rgba(0,31,63,.08),0_16px_40px_rgba(0,31,63,.10)]"
              >
                <div className="flex gap-3.5 max-[460px]:flex-col">
                  {featured.action ? (
                    <div className="flex min-w-0 flex-1 gap-3.5">
                      <span className="flex h-[94px] w-[78px] shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground/50 max-[460px]:h-[72px] max-[460px]:w-[58px]">
                        <Shirt className="size-6" strokeWidth={1.5} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold leading-tight">{featured.offer.itemLabel}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className="rounded bg-foreground/[.06] px-1.5 py-0.5 font-semibold uppercase tracking-[.08em]">
                            {featured.offer.marketplace}
                          </span>
                          <span className="font-mono">{featured.offer.sku}</span>
                          <span>ricevuta {featured.offer.time}</span>
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-mono text-[24px] font-semibold tracking-[-.045em]">
                            {formatEUR(featured.offer.offerCents)}
                          </span>
                          <span className="font-mono text-[18px] font-semibold tracking-[-.02em] text-foreground/75">
                            {offerDeltaEUR(featured.offer)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                          <span className="font-mono font-semibold">{offerDelta(featured.offer)}% dal listino</span>
                          <span className="font-mono">listino {formatEUR(featured.offer.listPriceCents)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openOffer(featured.offer.id)}
                      className="flex min-w-0 flex-1 items-center gap-3.5 rounded-lg text-left transition-opacity hover:opacity-80"
                    >
                      <span className="flex h-[94px] w-[78px] shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground/50 max-[460px]:h-[72px] max-[460px]:w-[58px]">
                        <Shirt className="size-6" strokeWidth={1.5} />
                      </span>
                      <span className="block min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold leading-tight">{featured.offer.itemLabel}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className="rounded bg-foreground/[.06] px-1.5 py-0.5 font-semibold uppercase tracking-[.08em]">
                            {featured.offer.marketplace}
                          </span>
                          <span className="font-mono">{featured.offer.sku}</span>
                          <span>ricevuta {featured.offer.time}</span>
                        </span>
                        <span className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-mono text-[24px] font-semibold tracking-[-.045em]">
                            {formatEUR(featured.offer.offerCents)}
                          </span>
                          <span className="font-mono text-[18px] font-semibold tracking-[-.02em] text-foreground/75">
                            {offerDeltaEUR(featured.offer)}
                          </span>
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                          <span className="font-mono font-semibold">{offerDelta(featured.offer)}% dal listino</span>
                          <span className="font-mono">listino {formatEUR(featured.offer.listPriceCents)}</span>
                        </span>
                      </span>
                    </button>
                  )}

                  {featured.action ? (
                    <div className="flex w-[132px] shrink-0 items-center max-[460px]:w-full">
                      <ActionControls action={featured.action} className="flex-wrap" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Rispondi all'offerta ${featured.offer.itemLabel}`}
                      onClick={() => openOffer(featured.offer.id)}
                      className="flex w-11 shrink-0 items-center justify-center self-stretch rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[.04] hover:text-foreground max-[460px]:w-full"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  )}
                </div>
              </motion.section>
            )}

            {secondary.length > 0 ? (
              <div className="divide-y divide-border">
                {secondary.map(({ offer, action, status, counterCents }) => {
                  if (status === "counter" && action === null) return renderCountered(offer, counterCents, true);
                  const delta = offerDelta(offer);
                  return (
                    <motion.div
                      key={offer.id}
                      layout
                      variants={itemVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5"
                    >
                      <button
                        type="button"
                        aria-label={`Rispondi all'offerta ${offer.itemLabel}`}
                        onClick={() => openOffer(offer.id)}
                        className="flex min-h-11 min-w-0 items-center gap-3 rounded-lg text-left transition-colors hover:bg-foreground/[.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex h-[54px] w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground/50">
                          <Shirt className="size-5" strokeWidth={1.5} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold">{offer.itemLabel}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                            <span>{offer.marketplace.toUpperCase()}</span>
                            <span>{offer.sku}</span>
                            <span>{offer.time}</span>
                          </span>
                        </span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <div className="mr-1 text-right">
                          <div className="flex items-baseline justify-end gap-1">
                            <span className="font-mono text-[15px] font-semibold">{formatEUR(offer.offerCents)}</span>
                            <span className="font-mono text-[12px] font-semibold text-foreground/70">
                              {offerDeltaEUR(offer)}
                            </span>
                          </div>
                          <span className="block font-mono text-[10px] font-medium text-muted-foreground">{delta}%</span>
                        </div>
                        {action ? (
                          <ActionControls action={action} />
                        ) : (
                          <button
                            type="button"
                            aria-label={`Rispondi all'offerta ${offer.itemLabel}`}
                            onClick={() => openOffer(offer.id)}
                            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[.04] hover:text-foreground"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : null}
          </AnimatePresence>

          <div className="mt-auto flex min-h-11 items-center justify-between gap-3 border-t border-border pt-2">
            <span className="text-[10px] font-medium text-muted-foreground">Ordinate per attesa</span>
            <Link
              href="/notifiche"
              className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-foreground/[.04] hover:text-foreground"
            >
              Vedi tutte le {effective.length} offerte <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
