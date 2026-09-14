"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle, Package, Pencil, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { shipments } from "@/lib/logistics-mock";
import { unreadMessagesCount } from "@/lib/messages-mock";
import { AGING_ITEMS } from "@/lib/home-widgets-mock";
import { HOME_METRICS } from "@/lib/home-mock";
import { useRefreshJob } from "@/lib/refresh-store";

const AGING_THRESHOLD_DAYS = 45;

const bozzeCount = Number(HOME_METRICS.find((m) => m.key === "bozze")?.value ?? 0);

interface LinkRowProps {
  icon: typeof Package;
  title: string;
  subtitle: string;
  count: number;
  ctaLabel: string;
}

/** Riga "azione" con link diretto: naviga subito, niente stato intermedio. */
function ActionLinkRow({ icon: Icon, title, subtitle, count, ctaLabel, href }: LinkRowProps & { href: string }) {
  const empty = count === 0;
  return (
    <Link
      href={href}
      aria-disabled={empty}
      onClick={(event) => {
        if (empty) event.preventDefault();
      }}
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors",
        empty ? "cursor-default opacity-55" : "hover:border-foreground/20 hover:bg-foreground/[.02]"
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
        <Icon className="size-[18px]" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold">{title}</p>
        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{subtitle}</p>
      </div>
      <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-neutral-soft px-1.5 font-mono text-[11px] font-semibold tabular-nums text-foreground">
        {count}
      </span>
      <span
        className={cn(
          "hidden shrink-0 items-center gap-1 text-[11.5px] font-semibold sm:flex",
          empty ? "text-muted-foreground/50" : "text-foreground/80 group-hover:text-foreground"
        )}
      >
        {ctaLabel}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
      </span>
    </Link>
  );
}

/** Riga "refresh": non naviga, avvia il job in background (FAB in basso a destra). */
function RefreshRow({ icon: Icon, title, subtitle, count, ctaLabel }: LinkRowProps) {
  const { status, start } = useRefreshJob();
  const empty = count === 0;
  const running = status === "running";
  const disabled = empty || running;

  return (
    <button
      type="button"
      onClick={() => start(count)}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors",
        disabled ? "cursor-default opacity-55" : "hover:border-foreground/20 hover:bg-foreground/[.02]"
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
        <Icon className={cn("size-[18px]", running && "animate-spin [animation-duration:1.6s]")} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold">{title}</p>
        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{subtitle}</p>
      </div>
      <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-neutral-soft px-1.5 font-mono text-[11px] font-semibold tabular-nums text-foreground">
        {count}
      </span>
      <span
        className={cn(
          "hidden shrink-0 items-center gap-1 text-[11.5px] font-semibold sm:flex",
          disabled ? "text-muted-foreground/50" : "text-foreground/80 group-hover:text-foreground"
        )}
      >
        {running ? "In corso…" : ctaLabel}
      </span>
    </button>
  );
}

/**
 * "Link tree" delle azioni quotidiane: quattro scorciatoie fisse (non una coda
 * dinamica) verso i punti dell'app dove il lavoro si fa davvero — ognuna col
 * numero di cose da fare e un tasto diretto.
 */
export function AzioniWidget() {
  const toPrepare = shipments.filter((s) => s.status === "da_fare").length;
  const unreadMsg = unreadMessagesCount();
  const aging = AGING_ITEMS.filter((item) => item.ageDays > AGING_THRESHOLD_DAYS).length;

  return (
    <div className="flex h-full flex-col">
      <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-foreground">
        Prossime azioni
      </p>

      <div className="flex flex-1 flex-col gap-2">
        <ActionLinkRow
          icon={Package}
          title="Prepara i pacchi"
          subtitle={toPrepare === 0 ? "Nessun pacco da preparare" : `${toPrepare} pacchi da preparare`}
          count={toPrepare}
          ctaLabel="Prepara"
          href="/logistica?mode=prep"
        />
        <ActionLinkRow
          icon={MessageCircle}
          title="Rispondi ai messaggi"
          subtitle={unreadMsg === 0 ? "Nessun messaggio da leggere" : `${unreadMsg} messaggi non letti`}
          count={unreadMsg}
          ctaLabel="Rispondi"
          href="/messaggi"
        />
        <ActionLinkRow
          icon={Pencil}
          title="Revisiona le bozze"
          subtitle={bozzeCount === 0 ? "Nessuna bozza in attesa" : `${bozzeCount} bozze in attesa`}
          count={bozzeCount}
          ctaLabel="Revisiona"
          href="/inventario?status=to_be_reviewed"
        />
        <RefreshRow
          icon={RefreshCw}
          title="Aggiorna annunci fermi"
          subtitle={aging === 0 ? "Tutto aggiornato" : `${aging} articoli online da troppo tempo`}
          count={aging}
          ctaLabel="Avvia refresh"
        />
      </div>
    </div>
  );
}
