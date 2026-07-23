import type { Offer, Sale } from "@/types/maat";

// Fonte condivisa di offerte + vendite recenti. Consumata da:
// - Home (components/maat/HomeDashboard) — card Offerte / Vendite
// - Notifiche v2 (components/maat/NotificationInbox) — gruppi Offerte / Vendite,
//   popup risposta offerta, anteprima articolo da una vendita.
// Ogni schermata gestisce il proprio stato locale (accetta/rifiuta/controfferta)
// inizializzato da questi dati — nessuno store condiviso, coerente col prototipo.

export const offers: Offer[] = [
  { id: "off-1", itemLabel: "Burberry · Trench", sku: "B-088", marketplace: "grailed", offerCents: 19000, listPriceCents: 24000, time: "1 h", receivedAt: "2026-07-23T08:00:00.000Z", status: "pending" },
  { id: "off-2", itemLabel: "Levi's · Giacca denim", sku: "B-102", marketplace: "depop", offerCents: 5500, listPriceCents: 6800, time: "2 h", receivedAt: "2026-07-23T07:00:00.000Z", status: "pending" },
  { id: "off-3", itemLabel: "Dr. Martens · 1460", sku: "B-099", marketplace: "depop", offerCents: 7500, listPriceCents: 8800, time: "5 h", receivedAt: "2026-07-23T04:00:00.000Z", status: "pending" },
  { id: "off-4", itemLabel: "Nike · Hoodie vintage", sku: "B-093", marketplace: "vinted", offerCents: 4000, listPriceCents: 5200, time: "6 h", receivedAt: "2026-07-23T03:00:00.000Z", status: "pending" },
  { id: "off-5", itemLabel: "Acne · Maglione lana", sku: "B-097", marketplace: "vestiaire", offerCents: 9500, listPriceCents: 11500, time: "ieri", receivedAt: "2026-07-22T09:00:00.000Z", status: "pending" },
];

export const sales: Sale[] = [
  { id: "sale-1", itemLabel: "Stone Island · Bomber", sku: "B-091", marketplace: "vinted", priceCents: 17200, time: "12 min" },
  { id: "sale-2", itemLabel: "The North Face · Nuptse 700", sku: "B-090", marketplace: "vinted", priceCents: 15000, time: "3 h" },
  { id: "sale-3", itemLabel: "Acne Studios · Maglione lana", sku: "B-097", marketplace: "vestiaire", priceCents: 11500, time: "ieri" },
  { id: "sale-4", itemLabel: "Ralph Lauren · Oxford", sku: "B-074", marketplace: "depop", priceCents: 4000, time: "ieri" },
];
