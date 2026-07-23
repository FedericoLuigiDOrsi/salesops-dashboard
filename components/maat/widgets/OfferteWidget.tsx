"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowRight, Check, ChevronDown, RefreshCw, RotateCcw, Shirt, X, type LucideIcon } from "lucide-react";
import { cn, formatEUR } from "@/lib/utils";
import { offers } from "@/lib/activity-mock";
import { hasUrgentOffer } from "@/lib/urgency";
import { useOverlays } from "@/lib/overlays-store";
import type { Offer, OfferStatus } from "@/types/maat";

const INITIAL_VISIBLE = 2;

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

const RESOLVED_BANNER: Record<
  Exclude<OfferStatus, "pending">,
  { icon: LucideIcon; iconBg: string; bannerBg: string; ring: string; strike?: boolean; label: (o: Offer, marginLabel: string, counterCents?: number) => string }
> = {
  accepted: {
    icon: Check,
    iconBg: "bg-success text-white",
    bannerBg: "bg-success-soft",
    ring: "shadow-[inset_3px_0_0_var(--success)]",
    label: (o, marginLabel) => `Accettata a ${formatEUR(o.offerCents)} · ${marginLabel} · ${o.sku}`,
  },
  rejected: {
    icon: X,
    iconBg: "bg-destructive/10 text-destructive",
    bannerBg: "bg-destructive/10",
    ring: "shadow-[inset_3px_0_0_var(--destructive)]",
    strike: true,
    label: (o, marginLabel) => `Rifiutata · ${formatEUR(o.offerCents)} · ${marginLabel} · ${o.sku}`,
  },
  counter: {
    icon: RefreshCw,
    iconBg: "bg-primary/25 text-[#7a7000]",
    bannerBg: "bg-primary/10",
    ring: "shadow-[inset_3px_0_0_var(--primary)]",
    label: (o, _marginLabel, counterCents) => `Controfferta a ${formatEUR(counterCents ?? o.offerCents)} · ${o.sku}`,
  },
};

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

/** Offerte in sospeso: card ariosa con foto, badge margine, prezzo hero, banner animato a risoluzione. */
export function OfferteWidget() {
  const { openOffer, offerStatus, resolveOffer } = useOverlays();
  const { message, notify } = useLocalToast();
  const [expanded, setExpanded] = useState(false);

  const effective = offers.map((o) => {
    const override = offerStatus[o.id];
    return { offer: o, status: override?.status ?? o.status, counterCents: override?.counterCents };
  });
  const pendingCount = effective.filter((e) => e.status === "pending").length;
  const visible = expanded ? effective : effective.slice(0, INITIAL_VISIBLE);
  const hiddenCount = effective.length - visible.length;

  function handleResolve(offer: Offer, status: "accepted" | "rejected") {
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
          <p className="text-[16px] font-bold tracking-[-.01em] text-foreground">Offerte in arrivo</p>
          {pendingCount > 0 ? (
            <span className="rounded-full bg-primary px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary-foreground">
              {pendingCount}
            </span>
          ) : null}
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
        <motion.div variants={listVariants} initial="hidden" animate="show" className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {visible.map(({ offer: o, status, counterCents }) => {
              const diffPct = Math.round(((o.offerCents - o.listPriceCents) / o.listPriceCents) * 100);
              const positive = diffPct >= 0;
              const marginLabel = `${positive ? "+" : "−"}${Math.abs(diffPct)}%`;

              if (status !== "pending") {
                const banner = RESOLVED_BANNER[status];
                const Icon = banner.icon;
                return (
                  <motion.div
                    key={o.id}
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className={cn("flex items-center gap-3 rounded-xl p-3.5", banner.bannerBg, banner.ring)}
                  >
                    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg", banner.iconBg)}>
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-[15px] font-semibold", banner.strike && "text-muted-foreground line-through")}>
                        {o.itemLabel}
                      </p>
                      <p className="font-mono text-[12px] font-semibold text-muted-foreground">{banner.label(o, marginLabel, counterCents)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => resolveOffer(o.id, "pending")}
                      className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <RotateCcw className="size-3.5" /> Annulla
                    </button>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={o.id}
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="rounded-xl border border-border p-3.5 transition-colors hover:border-primary"
                >
                  <div className="flex items-stretch gap-3.5">
                    <span className="flex w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground/50">
                      <Shirt className="size-6" strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold leading-tight">{o.itemLabel}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{o.sku}</p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold",
                            positive ? "bg-success-soft text-success" : "bg-destructive/10 text-destructive"
                          )}
                        >
                          {marginLabel}
                        </span>
                      </div>
                      <div className="mt-2.5 flex items-baseline gap-2">
                        <span className="font-mono text-[22px] font-semibold tracking-tight">{formatEUR(o.offerCents)}</span>
                        <span className="font-mono text-xs text-muted-foreground line-through">
                          richiesto {formatEUR(o.listPriceCents)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleResolve(o, "accepted")}
                      className="flex-1 rounded-lg bg-primary py-1.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Accetta
                    </button>
                    <button
                      type="button"
                      onClick={() => openOffer(o.id)}
                      className="flex-1 rounded-lg border border-border py-1.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-foreground/[.04]"
                    >
                      Controproposta
                    </button>
                    <button
                      type="button"
                      aria-label={`Rifiuta offerta ${o.itemLabel}`}
                      onClick={() => handleResolve(o, "rejected")}
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex items-center justify-center gap-1.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Vedi altre {hiddenCount} offerte <ChevronDown className="size-3.5" />
            </button>
          ) : null}
        </motion.div>
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
