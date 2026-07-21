"use client";

import Link from "next/link";
import { ArrowRight, CloudOff, Sparkles } from "lucide-react";
import { useNotifications } from "@/lib/notifications-store";
import { hasUnreadNotifications } from "@/lib/urgency";

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min fa`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "ora" : "ore"} fa`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "giorno" : "giorni"} fa`;
}

/** Le ultime notifiche dell'account (bozze pronte, salvataggi locali). */
export function NotificheWidget() {
  const { notifications } = useNotifications();
  const recent = [...notifications]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 2);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Notifiche
          </p>
          {hasUnreadNotifications(notifications) ? (
            <span aria-label="Notifiche non lette" className="size-1.5 shrink-0 rounded-full bg-destructive" />
          ) : null}
        </div>
        <Link
          href="/notifiche"
          className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Vedi tutte <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="py-4 text-[13px] text-muted-foreground">Nessuna notifica: le novità appariranno qui.</p>
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
                  <p className="truncate text-[13px] font-medium leading-snug">{n.messaggio}</p>
                  <span className="font-mono text-xs text-muted-foreground">{timeAgo(n.timestamp)}</span>
                </div>
                {!n.letta && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
