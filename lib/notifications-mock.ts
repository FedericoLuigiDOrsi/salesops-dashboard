import { offers, sales } from "@/lib/activity-mock";
import type { Marketplace, OfferStatus, Offer } from "@/types/maat";

// Inbox notifiche v2 — mirror di public/mobile/maat-shell-account.html righe
// 3467-3577 (array N + GROUPS). Unifica vendite/offerte/spedizioni in un unico
// flusso classificabile: segmented Tutte/Vendite/Offerte/Spedizioni, gruppi
// "Vendite eseguite" / "Offerte ricevute" / "Spedizioni e altro".
// Vendite e offerte derivano da lib/activity-mock (fonte condivisa con Home);
// spedizione/altro sono righe dedicate, non presenti altrove.

export type NotificationV2Type = "vendita" | "offerta" | "spedizione" | "altro";
export type NotificationV2Sub = "partita" | "arrivata" | "reso" | "bozza" | "delisting";

interface NotificationV2Base {
  id: string;
  unread: boolean;
  itemLabel: string;
  marketplace?: Marketplace;
  sku?: string;
  time: string; // relativo — "12 min", "3 h", "ieri"
}

export interface SaleNotification extends NotificationV2Base {
  type: "vendita";
  priceCents: number;
}

export interface OfferNotification extends NotificationV2Base {
  type: "offerta";
  offerCents: number;
  listPriceCents: number;
  status: OfferStatus;
  counterCents?: number;
  photoUrl?: string | null;
  listingUrl?: string | null;
}

export interface ShipmentNotification extends NotificationV2Base {
  type: "spedizione" | "altro";
  sub: NotificationV2Sub;
  detail: string;
  carrier?: string; // corriere (BRT/InPost/...) — distinto da marketplace
}

export type NotificationV2 = SaleNotification | OfferNotification | ShipmentNotification;

const saleNotifications: SaleNotification[] = sales.map((s, i): SaleNotification => ({
  id: `n-${s.id}`,
  type: "vendita",
  unread: i === 0,
  itemLabel: s.itemLabel,
  marketplace: s.marketplace,
  sku: s.sku,
  time: s.time,
  priceCents: s.priceCents,
}));

const offerNotifications: OfferNotification[] = offers.map((o, i): OfferNotification => ({
  id: `n-${o.id}`,
  type: "offerta",
  unread: i < 2,
  itemLabel: o.itemLabel,
  marketplace: o.marketplace,
  sku: o.sku,
  time: o.time,
  offerCents: o.offerCents,
  listPriceCents: o.listPriceCents,
  status: o.status,
  counterCents: o.counterCents,
}));

const shipmentNotifications: ShipmentNotification[] = [
  {
    id: "n-sh-partita-1",
    type: "spedizione",
    sub: "partita",
    unread: false,
    itemLabel: "Stone Island · Bomber",
    sku: "B-091",
    carrier: "BRT",
    time: "2 h",
    detail: "Spedizione partita · in transito",
  },
  {
    id: "n-sh-arrivata-1",
    type: "spedizione",
    sub: "arrivata",
    unread: false,
    itemLabel: "Burberry · Trench",
    sku: "B-088",
    carrier: "InPost",
    time: "ieri",
    detail: "Spedizione consegnata a L. Bianchi",
  },
  {
    id: "n-altro-reso-1",
    type: "altro",
    sub: "reso",
    unread: false,
    itemLabel: "Levi's · 501",
    sku: "B-074",
    time: "3 h",
    detail: "Reso pronto al ritiro",
  },
  {
    id: "n-altro-bozza-1",
    type: "altro",
    sub: "bozza",
    unread: false,
    itemLabel: "Carhartt · Detroit jacket",
    sku: "MP-0043",
    time: "ieri",
    detail: "Bozza pronta da revisionare",
  },
  {
    id: "n-altro-delisting-1",
    type: "altro",
    sub: "delisting",
    unread: false,
    itemLabel: "Ralph Lauren · Oxford",
    marketplace: "depop",
    time: "ieri",
    detail: "Delisting completato",
  },
];

export const notificationsV2: NotificationV2[] = [...saleNotifications, ...offerNotifications, ...shipmentNotifications];

export const notificationGroups: { key: "vendita" | "offerta" | "spedizione"; label: string; match: (n: NotificationV2) => boolean }[] = [
  { key: "vendita", label: "Vendite eseguite", match: (n) => n.type === "vendita" },
  { key: "offerta", label: "Offerte ricevute", match: (n) => n.type === "offerta" },
  { key: "spedizione", label: "Spedizioni e altro", match: (n) => n.type === "spedizione" || n.type === "altro" },
];

// Mappa un Offer (id base, es. "off-1") in OfferNotification preservando l'id
// base come `id` — così lo stato condiviso è keyed coerentemente tra widget Home
// (Offer) e float/pagina (OfferNotification). L'override sovrascrive stato/controfferta.
export function offerToNotification(
  offer: Offer,
  override?: { status: OfferStatus; counterCents?: number }
): OfferNotification {
  return {
    id: offer.id,
    type: "offerta",
    unread: false,
    itemLabel: offer.itemLabel,
    marketplace: offer.marketplace,
    sku: offer.sku,
    time: offer.time,
    offerCents: offer.offerCents,
    listPriceCents: offer.listPriceCents,
    status: override?.status ?? offer.status,
    counterCents: override?.counterCents ?? offer.counterCents,
    photoUrl: offer.photoUrl,
    listingUrl: offer.listingUrl,
  };
}
