"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  HandCoins,
  Pencil,
} from "lucide-react";
import { EmptyState } from "@/components/maat/EmptyState";
import { cn } from "@/lib/utils";
import { nextActions, type NextAction } from "@/lib/next-actions";

const INITIAL_VISIBLE = 3;

const KIND_TAG: Record<NextAction["kind"], { label: string; className: string; Icon: typeof Pencil }> = {
  bozza: { label: "Bozza", className: "bg-accent-soft text-accent-ink", Icon: Pencil },
  offerta: { label: "Offerta", className: "bg-success-soft text-success", Icon: HandCoins },
};

const BAND_URG_CLASS: Record<NextAction["band"], string> = {
  0: "text-destructive",
  1: "text-accent-ink",
  2: "text-muted-foreground",
};

const FOCUS_SURFACE: Record<NextAction["band"], string> = {
  0: "bg-danger-soft shadow-[inset_3px_0_0_var(--destructive)]",
  1: "bg-accent-soft shadow-[inset_3px_0_0_var(--primary)]",
  2: "bg-neutral-soft",
};

const FOCUS_PRIORITY: Record<NextAction["band"], string> = {
  0: "Priorità alta",
  1: "Entro oggi",
  2: "Da pianificare",
};

const GROUPS: {
  band: NextAction["band"];
  label: string;
  Icon: typeof AlertTriangle;
  iconClass: string;
  badgeClass: string;
}[] = [
  {
    band: 0,
    label: "Da gestire ora",
    Icon: AlertTriangle,
    iconClass: "text-destructive",
    badgeClass: "bg-danger-soft text-destructive",
  },
  {
    band: 1,
    label: "Da gestire oggi",
    Icon: Clock,
    iconClass: "text-accent-ink",
    badgeClass: "bg-accent-soft text-accent-ink",
  },
  {
    band: 2,
    label: "Da pianificare",
    Icon: CalendarDays,
    iconClass: "text-muted-foreground",
    badgeClass: "bg-neutral-soft text-muted-foreground",
  },
];

function KindTag({ kind }: { kind: NextAction["kind"] }) {
  const { label, className, Icon } = KIND_TAG[kind];
  return (
    <span
      className={cn(
        "hidden h-[18px] shrink-0 items-center gap-1 rounded-full px-1.5 font-mono text-[8.5px] font-semibold uppercase tracking-wide sm:inline-flex",
        className
      )}
    >
      <Icon className="size-2.5" strokeWidth={1.5} />
      {label}
    </span>
  );
}

function GarmentThumbnail({ item, compact = false }: { item: NextAction; compact?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-border",
        compact ? "h-12 w-11" : "h-16 w-[58px]",
        item.kind === "offerta" ? "bg-success-soft text-success/70" : "bg-secondary text-muted-foreground"
      )}
    >
      <svg
        viewBox="0 0 48 56"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className={compact ? "h-[34px] w-7" : "h-[43px] w-[37px]"}
      >
        <path d="m17 8 7 4 7-4 10 7-6 9-4-3v27H17V21l-4 3-6-9 10-7Z" />
        <path d="M19 9c.5 3 2.2 4.5 5 4.5S28.5 12 29 9" />
      </svg>
    </span>
  );
}

function ActionRow({ item, index }: { item: NextAction; index: number }) {
  return (
    <Link
      href={item.href}
      aria-label={`${item.ctaLabel} ${item.name}`}
      style={{ animationDelay: `${index * 55}ms` }}
      className="group grid min-h-[62px] grid-cols-[44px_minmax(0,1fr)_auto_16px] items-center gap-2.5 border-b border-border px-1 py-2 text-left opacity-0 [animation:maat-action-in_.4s_cubic-bezier(.22,1,.36,1)_forwards] last:border-0 hover:bg-foreground/[.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-[.995] sm:gap-3"
    >
      <GarmentThumbnail item={item} compact />
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-1.5">
          <KindTag kind={item.kind} />
          <span className="truncate text-[12.5px] font-semibold tracking-[-.01em] sm:text-[13px]">{item.name}</span>
        </span>
        <span className="mt-1 block truncate font-mono text-[10px] text-muted-foreground">{item.meta}</span>
      </span>
      <span className="flex min-w-[66px] flex-col items-end gap-1 sm:min-w-[112px]">
        <span className="text-[10.5px] font-bold leading-none sm:text-[11px]">{item.ctaLabel}</span>
        <span className={cn("hidden items-center justify-end gap-1 whitespace-nowrap font-mono text-[10px] sm:flex", BAND_URG_CLASS[item.band])}>
          <Clock className="size-3" strokeWidth={1.5} />
          {item.urgLabel}
        </span>
      </span>
      <ArrowRight
        className="size-3.5 text-muted-foreground transition-transform duration-[180ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-0.5 group-hover:text-foreground"
        strokeWidth={1.5}
      />
    </Link>
  );
}

/** Coda unica: una prossima azione in focus, poi una preview ordinata per priorità. */
export function AzioniWidget() {
  const [expanded, setExpanded] = useState(false);
  const actions = nextActions();
  const [focus, ...rest] = actions;
  const visibleRest = expanded ? rest : rest.slice(0, INITIAL_VISIBLE);
  const hiddenCount = rest.length - visibleRest.length;
  const urgentCount = actions.filter((item) => item.band === 0).length;

  if (!focus) {
    return (
      <div>
        <WidgetHeader count={0} urgentCount={0} />
        <EmptyState
          icon={<CheckCircle2 className="size-5 text-success" strokeWidth={1.5} />}
          title="Coda completata"
          subtitle="Bozze e offerte sono tutte gestite. Le nuove azioni compariranno qui in ordine di priorità."
        />
      </div>
    );
  }

  const [primaryMeta, ...secondaryMetaParts] = focus.meta.split(" · ");
  const secondaryMeta = secondaryMetaParts.join(" · ");

  return (
    <div>
      <WidgetHeader count={actions.length} urgentCount={urgentCount} />

      <section
        aria-label="Prossima azione"
        className={cn(
          "grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3 rounded-[10px] p-3 pl-4 [animation:maat-action-in_.4s_cubic-bezier(.22,1,.36,1)_both] sm:grid-cols-[58px_minmax(0,1fr)_auto] sm:gap-3.5 sm:p-[15px] sm:pl-[18px]",
          FOCUS_SURFACE[focus.band]
        )}
      >
        <GarmentThumbnail item={focus} />
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[.07em]">
            <span className={BAND_URG_CLASS[focus.band]}>{FOCUS_PRIORITY[focus.band]}</span>
            <span className="size-0.5 rounded-full bg-current opacity-50" />
            <span>{KIND_TAG[focus.kind].label}</span>
            <span className="size-0.5 rounded-full bg-current opacity-50" />
            <span>{focus.urgLabel}</span>
          </div>
          <h3 className="truncate text-[14px] font-bold leading-tight tracking-[-.02em] sm:text-[16px]">{focus.name}</h3>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-1.5 font-mono text-[11px] text-muted-foreground">
            <strong className="text-[13px] font-semibold text-foreground">{primaryMeta}</strong>
            {secondaryMeta ? <span>{secondaryMeta}</span> : null}
          </p>
        </div>
        <Link
          href={focus.href}
          className="col-span-2 flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-accent-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-[.98] sm:col-span-1"
        >
          {focus.ctaLabel}
          <ArrowRight className="size-3.5" strokeWidth={1.5} />
        </Link>
      </section>

      {rest.length > 0 ? (
        <div className="mt-[18px]">
          {GROUPS.map(({ band, label, Icon, iconClass, badgeClass }) => {
            const items = visibleRest.filter((item) => item.band === band);
            if (items.length === 0) return null;
            return (
              <section key={band} className="mt-3.5 first:mt-0">
                <div className="flex h-7 items-center gap-1.5 px-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[.09em] text-muted-foreground">
                  <Icon className={cn("size-3", iconClass)} strokeWidth={1.5} />
                  <span>{label}</span>
                  <span className={cn("inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[9px]", badgeClass)}>
                    {items.length}
                  </span>
                </div>
                <div>
                  {items.map((item, index) => (
                    <ActionRow key={item.id} item={item} index={index} />
                  ))}
                </div>
              </section>
            );
          })}

          {hiddenCount > 0 || expanded ? (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
              className="mt-1 flex min-h-[42px] w-full items-center justify-center gap-1.5 border-t border-border pt-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card active:translate-y-px"
            >
              {expanded ? (
                <>
                  Riduci elenco <ChevronUp className="size-3.5" strokeWidth={1.5} />
                </>
              ) : (
                <>
                  Mostra altre {hiddenCount} azioni <ChevronDown className="size-3.5" strokeWidth={1.5} />
                </>
              )}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function WidgetHeader({ count, urgentCount }: { count: number; urgentCount: number }) {
  return (
    <header className="mb-[18px] flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-bold tracking-[-.025em]">Prossime azioni</h2>
          <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-neutral-soft px-1.5 font-mono text-[10px] font-semibold">
            {count}
          </span>
        </div>
        {urgentCount > 0 ? (
          <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-destructive [animation:maat-priority-breathe_2.2s_cubic-bezier(.22,1,.36,1)_infinite]" />
            <span>{urgentCount} ad alta priorità</span>
          </div>
        ) : null}
      </div>
      <Link
        href="/inventario"
        className="flex min-h-10 items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card active:translate-y-px"
      >
        <span className="hidden sm:inline">Apri coda</span>
        <ArrowRight className="size-3.5" strokeWidth={1.5} />
      </Link>
    </header>
  );
}
