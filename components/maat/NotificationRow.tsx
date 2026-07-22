"use client";

import type { ReactNode } from "react";
import { Coins, Tag, Truck, Check, Package } from "lucide-react";
import { cn, formatEUR } from "@/lib/utils";
import { MARKETPLACE_LABELS } from "@/types/maat";
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
        "flex size-9 shrink-0 items-center justify-center rounded-md",
        unread ? "bg-primary/25 text-[#7a7000]" : "bg-foreground/[.06] text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

export function SaleNotificationRow({ notification, onOpen }: { notification: SaleNotification; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-foreground/[.03]">
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
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="font-mono text-[15px] font-semibold text-[var(--chart-2)]">{formatEUR(notification.priceCents)}</span>
        <span className="font-mono text-[11px] text-muted-foreground/70">{notification.time}</span>
      </div>
    </button>
  );
}

const OFFER_BADGE: Record<"accepted" | "rejected" | "counter", { label: string; className: string }> = {
  accepted: { label: "Accettata", className: "bg-[color-mix(in_oklab,var(--chart-2)_16%,transparent)] text-[var(--chart-2)]" },
  rejected: { label: "Rifiutata", className: "bg-muted text-muted-foreground" },
  counter: { label: "Controfferta inviata", className: "bg-primary/25 text-[#7a7000]" },
};

export function OfferNotificationRow({ notification, onOpen }: { notification: OfferNotification; onOpen: () => void }) {
  const resolved = notification.status !== "pending";
  const badge = resolved ? OFFER_BADGE[notification.status as "accepted" | "rejected" | "counter"] : null;
  return (
    <button
      type="button"
      disabled={resolved}
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 p-3 text-left transition-colors",
        resolved ? "cursor-default opacity-60" : "hover:bg-foreground/[.03]"
      )}
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
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[15px] font-semibold">{formatEUR(notification.offerCents)}</span>
          <span className="font-mono text-xs text-muted-foreground line-through">{formatEUR(notification.listPriceCents)}</span>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground/70">
          {notification.time}
          {!resolved && <span className="ml-1 font-semibold text-foreground">· Rispondi ›</span>}
        </span>
      </div>
    </button>
  );
}

const SHIPMENT_ICON: Record<NotificationV2Sub, typeof Truck> = {
  partita: Truck,
  arrivata: Check,
  reso: Truck,
  bozza: Check,
  delisting: Package,
};

export function ShipmentNotificationRow({ notification }: { notification: ShipmentNotification }) {
  const Icon = SHIPMENT_ICON[notification.sub];
  const metaParts = [
    notification.itemLabel,
    notification.sku ? `SKU ${notification.sku}` : null,
    notification.carrier ?? (notification.marketplace ? MARKETPLACE_LABELS[notification.marketplace] : null),
  ].filter(Boolean);

  return (
    <div className="flex items-center gap-3 p-3">
      <RowIcon unread={notification.unread}>
        <Icon className="size-4" />
      </RowIcon>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium">{notification.detail}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{metaParts.join(" · ")}</div>
      </div>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground/70">{notification.time}</span>
    </div>
  );
}
