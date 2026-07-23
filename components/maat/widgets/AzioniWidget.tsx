"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, HandCoins, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { nextActions, type NextAction } from "@/lib/next-actions";

const KIND_TAG: Record<NextAction["kind"], { label: string; className: string; Icon: typeof Pencil }> = {
  bozza: { label: "Bozza", className: "bg-accent-soft text-accent-ink", Icon: Pencil },
  offerta: { label: "Offerta", className: "bg-success-soft text-success", Icon: HandCoins },
};

const BAND_STRIPE: Record<NextAction["band"], string> = {
  0: "shadow-[inset_3px_0_0_var(--destructive)]",
  1: "shadow-[inset_3px_0_0_var(--primary)]",
  2: "",
};

const BAND_URG_CLASS: Record<NextAction["band"], string> = {
  0: "text-destructive",
  1: "text-accent-ink",
  2: "text-muted-foreground font-medium",
};

function KindTag({ kind }: { kind: NextAction["kind"] }) {
  const { label, className, Icon } = KIND_TAG[kind];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wide",
        className
      )}
    >
      <Icon className="size-2.5" />
      {label}
    </span>
  );
}

function ActionRow({ item }: { item: NextAction }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg border-b border-border p-2.5 transition-colors last:border-0 hover:bg-foreground/[.03]",
        BAND_STRIPE[item.band]
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background font-mono text-[9px] uppercase text-muted-foreground">
        Foto
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <KindTag kind={item.kind} />
          <span className="truncate text-[13px] font-semibold">{item.name}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 overflow-hidden">
          <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">{item.meta}</span>
          <span className="size-0.5 shrink-0 rounded-full bg-muted-foreground/60" />
          <span className={cn("shrink-0 truncate font-mono text-xs", BAND_URG_CLASS[item.band])}>
            {item.urgLabel}
          </span>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1 rounded-md border border-foreground px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors">
        <span className="hidden md:inline">{item.ctaLabel}</span>
        <ArrowRight className="size-3" />
      </span>
    </Link>
  );
}

const GROUPS: { band: NextAction["band"]; label: string; Icon: typeof AlertTriangle; badgeClass: string }[] = [
  { band: 0, label: "In ritardo · adesso", Icon: AlertTriangle, badgeClass: "bg-danger-soft text-destructive" },
  { band: 1, label: "Entro oggi", Icon: Clock, badgeClass: "bg-accent-soft text-accent-ink" },
  { band: 2, label: "Questa settimana", Icon: undefined as unknown as typeof AlertTriangle, badgeClass: "bg-neutral-soft text-muted-foreground" },
];

/** Coda unica prossime azioni: bozze da revisionare + offerte in sospeso, per urgenza. */
export function AzioniWidget() {
  const actions = nextActions();
  const [hero, ...rest] = actions;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
            Prossime azioni
          </p>
          <span className="font-mono text-xs text-muted-foreground">{actions.length}</span>
          {actions[0]?.band === 0 ? (
            <span aria-label="Azioni in ritardo" className="size-1.5 shrink-0 rounded-full bg-destructive" />
          ) : null}
        </div>
        <Link
          href="/inventario"
          className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Lavorazione <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {!hero ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle2 className="size-5 text-success" />
          </span>
          <p className="text-[14px] font-semibold">Coda completata</p>
          <p className="max-w-[280px] text-[13px] text-muted-foreground">
            Nessuna azione urgente al momento. Bozze e offerte sono tutte gestite.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Link
            href={hero.href}
            className="flex items-center gap-4 rounded-lg bg-surface-dark p-4 text-text-on-dark shadow-[inset_4px_0_0_var(--destructive)] transition-opacity hover:opacity-90"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-white/10 font-mono text-[9px] uppercase text-text-on-dark/50">
              Foto
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wide">
                  {KIND_TAG[hero.kind].label}
                </span>
                <span className="min-w-0 truncate font-mono text-[11px] font-semibold text-[#F4979A]">
                  {hero.urgLabel}
                </span>
              </div>
              <p className="mt-1 truncate text-[16px] font-bold tracking-tight">{hero.name}</p>
              <p className="truncate font-mono text-xs text-text-on-dark/55">{hero.meta}</p>
            </div>
            <span className="shrink-0 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground">
              {hero.ctaLabel}
            </span>
          </Link>

          {rest.length > 0 ? (
            <div className="flex flex-col">
              {GROUPS.map(({ band, label, Icon, badgeClass }) => {
                const items = rest.filter((it) => it.band === band);
                if (items.length === 0) return null;
                return (
                  <div key={band}>
                    <div className="flex items-center gap-1.5 px-1 py-1.5">
                      {Icon ? <Icon className={cn("size-3", band === 0 ? "text-destructive" : "text-accent-ink")} /> : null}
                      <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted-foreground">
                        {label}
                      </span>
                      <span className={cn("rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold", badgeClass)}>
                        {items.length}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      {items.map((item) => (
                        <ActionRow key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
