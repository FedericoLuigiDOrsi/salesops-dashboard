"use client";

import Link from "next/link";
import { Plus, ChevronRight, Sparkles, CloudOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/maat/StatTile";
import { StatusBadge } from "@/components/maat/StatusBadge";
import { EmptyState } from "@/components/maat/EmptyState";
import { catalogCounts, actionQueue } from "@/lib/catalog-stats";
import { useNotifications } from "@/lib/notifications-store";

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min fa`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "ora" : "ore"} fa`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "giorno" : "giorni"} fa`;
}

export function HomeDashboard() {
  const counts = catalogCounts();
  const queue = actionQueue().slice(0, 4);
  const totalQueue = actionQueue().length;
  const { notifications } = useNotifications();
  const recent = [...notifications]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Dashboard
          </p>
          <h1 className="text-[28px] font-bold tracking-tight">Ciao Federico</h1>
        </div>
        <Button asChild>
          <a href="/capi/nuovo/foto/fronte">
            <Plus />
            Crea capo
          </a>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile number={counts.totale} label="Totale" />
        <StatTile number={counts.bozze} label="Bozze" attention={counts.bozze > 0} />
        <StatTile number={counts.confermati} label="Confermati" />
        <StatTile number={counts.locali} label="Locali" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Azioni richieste */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold">Azioni richieste</h2>
              <span className="font-mono text-xs text-muted-foreground">{totalQueue}</span>
            </div>
            <Link
              href="/capi"
              className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Lavorazione <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {queue.length === 0 ? (
            <EmptyState title="Tutto in ordine" subtitle="Nessun capo in attesa di revisione." />
          ) : (
            <div className="flex flex-col gap-1">
              {queue.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/capi/${entry.id}`}
                  className="flex items-center gap-3 rounded-lg border border-transparent p-2.5 transition-colors hover:bg-foreground/[.03]"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background font-mono text-[9px] uppercase text-muted-foreground/60">
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
        </section>

        {/* Notifiche recenti */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Notifiche recenti</h2>
            <Link
              href="/notifiche"
              className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Vedi tutte <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState title="Nessuna notifica" subtitle="Le novità appariranno qui." />
          ) : (
            <div className="flex flex-col gap-1">
              {recent.map((n) => {
                const isDraft = n.tipo === "draft_ready";
                return (
                  <Link
                    key={n.id}
                    href="/notifiche"
                    className="flex items-start gap-3 rounded-lg border border-transparent p-2.5 transition-colors hover:bg-foreground/[.03]"
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                        isDraft ? "bg-primary/30" : "bg-foreground/[.08]"
                      }`}
                    >
                      {isDraft ? (
                        <Sparkles className="size-4 text-[#7a7000]" />
                      ) : (
                        <CloudOff className="size-4 text-muted-foreground" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium leading-snug">{n.messaggio}</p>
                      <span className="font-mono text-xs text-muted-foreground">{timeAgo(n.timestamp)}</span>
                    </div>
                    {!n.letta && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
