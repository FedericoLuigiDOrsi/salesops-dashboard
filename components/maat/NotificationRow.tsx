"use client";

import { Sparkles, CloudOff, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogEntry, Notification } from "@/types/maat";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min fa`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "ora" : "ore"} fa`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "giorno" : "giorni"} fa`;
}

interface NotificationRowProps {
  notification: Notification;
  entry?: CatalogEntry;
  onNavigate: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}

export function NotificationRow({ notification, entry, onNavigate, onMarkRead, onDelete }: NotificationRowProps) {
  const isDraft = notification.tipo === "draft_ready";

  return (
    <div
      className={cn(
        "group relative flex cursor-pointer items-center gap-4 rounded-lg bg-card p-4 transition-colors hover:bg-foreground/[.02]",
        !notification.letta && "border-l-2 border-l-primary pl-[14px]"
      )}
      onClick={onNavigate}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          isDraft ? "bg-primary/30" : "bg-foreground/[.08]"
        )}
      >
        {isDraft ? <Sparkles className="size-4 text-[#7a7000]" /> : <CloudOff className="size-4 text-muted-foreground" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{notification.messaggio}</p>
        {entry && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-3.5 shrink-0 rounded border border-border bg-background" />
            {entry.attributes.brand} — {entry.attributes.tipoCapo}
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        {!notification.letta && (
          <button
            type="button"
            title="Segna letta"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead();
            }}
            className="flex size-7 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
          >
            <Check className="size-3.5" />
          </button>
        )}
        <button
          type="button"
          title="Elimina"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex size-7 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="font-mono text-xs text-muted-foreground">{timeAgo(notification.timestamp)}</span>
        {!notification.letta && <span className="size-1.5 rounded-full bg-primary" />}
      </div>
    </div>
  );
}
