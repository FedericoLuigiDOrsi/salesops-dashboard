"use client";

import type { ReactNode } from "react";
import { Coins, Tag, Truck, Check, Package, MoreVertical, MailOpen, Mail, Trash2 } from "lucide-react";
import { cn, formatEUR } from "@/lib/utils";
import { MARKETPLACE_LABELS } from "@/types/maat";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SaleNotification, OfferNotification, ShipmentNotification, NotificationV2Sub } from "@/lib/notifications-mock";

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-foreground/[.06] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

function RowIcon({ unread, children }: { unread: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center rounded-md",
        unread ? "bg-primary/25 text-[#7a7000]" : "bg-foreground/[.06] text-muted-foreground"
      )}
    >
      {children}
      {unread && (
        <span className="absolute -right-0.5 -top-0.5 size-2 animate-pulse rounded-full bg-primary ring-2 ring-card" />
      )}
    </span>
  );
}

/** Barra a sinistra per le righe non lette — leggibile anche a colpo d'occhio in liste dense. */
function UnreadBar({ unread }: { unread: boolean }) {
  if (!unread) return null;
  return <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" aria-hidden />;
}

interface RowActionsProps {
  onToggleRead?: () => void;
  onDelete?: () => void;
}

/** Menu "..." letto/non letto + elimina — condiviso da tutte le righe con stato mutabile. */
function RowMenu({ unread, onToggleRead, onDelete }: { unread: boolean } & Required<RowActionsProps>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => e.stopPropagation()}
          aria-label="Altre azioni"
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={onToggleRead}>
          {unread ? <MailOpen className="size-4" /> : <Mail className="size-4" />}
          {unread ? "Segna come letta" : "Segna come non letta"}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 className="size-4" />
          Elimina notifica
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SaleNotificationRow({
  notification,
  onOpen,
  onToggleRead,
  onDelete,
}: { notification: SaleNotification; onOpen: () => void } & RowActionsProps) {
  return (
    <div className="relative flex w-full items-center gap-3 p-3 transition-colors hover:bg-foreground/[.03]">
      <UnreadBar unread={notification.unread} />
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <RowIcon unread={notification.unread}>
          <Coins className="size-4" />
        </RowIcon>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
            {notification.itemLabel}
            {notification.marketplace && <Pill>{MARKETPLACE_LABELS[notification.marketplace]}</Pill>}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {notification.sku && <span className="font-mono text-foreground/70">SKU {notification.sku}</span>} · Vendita eseguita
          </div>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[15px] font-semibold text-[var(--chart-2)]">{formatEUR(notification.priceCents)}</span>
          <span className="font-mono text-[11px] text-muted-foreground/70">{notification.time}</span>
        </div>
        {onToggleRead && onDelete && <RowMenu unread={notification.unread} onToggleRead={onToggleRead} onDelete={onDelete} />}
      </div>
    </div>
  );
}

const OFFER_BADGE: Record<"accepted" | "rejected" | "counter", { label: string; className: string }> = {
  accepted: { label: "Accettata", className: "bg-[color-mix(in_oklab,var(--chart-2)_16%,transparent)] text-[var(--chart-2)]" },
  rejected: { label: "Rifiutata", className: "bg-muted text-muted-foreground" },
  counter: { label: "Controfferta inviata", className: "bg-primary/25 text-[#7a7000]" },
};

export function OfferNotificationRow({
  notification,
  onOpen,
  onToggleRead,
  onDelete,
}: { notification: OfferNotification; onOpen: () => void } & RowActionsProps) {
  const resolved = notification.status !== "pending";
  const badge = resolved ? OFFER_BADGE[notification.status as "accepted" | "rejected" | "counter"] : null;
  return (
    <div className={cn("relative flex w-full items-center gap-3 p-3 transition-colors", !resolved && "hover:bg-foreground/[.03]")}>
      <UnreadBar unread={notification.unread && !resolved} />
      <button
        type="button"
        disabled={resolved}
        onClick={onOpen}
        className={cn("flex min-w-0 flex-1 items-center gap-3 text-left", resolved && "cursor-default opacity-60")}
      >
        <RowIcon unread={notification.unread && !resolved}>
          <Tag className="size-4" />
        </RowIcon>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
            {notification.itemLabel}
            {notification.marketplace && <Pill>{MARKETPLACE_LABELS[notification.marketplace]}</Pill>}
            {badge && (
              <span className={cn("rounded-full px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide", badge.className)}>
                {badge.label}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {notification.sku && <span className="font-mono text-foreground/70">SKU {notification.sku}</span>} · Offerta ricevuta
          </div>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[15px] font-semibold">{formatEUR(notification.offerCents)}</span>
            <span className="font-mono text-xs text-muted-foreground line-through">{formatEUR(notification.listPriceCents)}</span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground/70">
            {notification.time}
            {!resolved && <span className="ml-1 font-semibold text-foreground">· Rispondi ›</span>}
          </span>
        </div>
        {onToggleRead && onDelete && (
          <RowMenu unread={notification.unread && !resolved} onToggleRead={onToggleRead} onDelete={onDelete} />
        )}
      </div>
    </div>
  );
}

const SHIPMENT_ICON: Record<NotificationV2Sub, typeof Truck> = {
  partita: Truck,
  arrivata: Check,
  reso: Truck,
  bozza: Check,
  delisting: Package,
};

export function ShipmentNotificationRow({
  notification,
  onToggleRead,
  onDelete,
}: { notification: ShipmentNotification } & RowActionsProps) {
  const Icon = SHIPMENT_ICON[notification.sub];
  const metaParts = [
    notification.itemLabel,
    notification.sku ? `SKU ${notification.sku}` : null,
    notification.carrier ?? (notification.marketplace ? MARKETPLACE_LABELS[notification.marketplace] : null),
  ].filter(Boolean);

  return (
    <div className="relative flex items-center gap-3 p-3">
      <UnreadBar unread={notification.unread} />
      <RowIcon unread={notification.unread}>
        <Icon className="size-4" />
      </RowIcon>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium">{notification.detail}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{metaParts.join(" · ")}</div>
      </div>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground/70">{notification.time}</span>
      {onToggleRead && onDelete && <RowMenu unread={notification.unread} onToggleRead={onToggleRead} onDelete={onDelete} />}
    </div>
  );
}
