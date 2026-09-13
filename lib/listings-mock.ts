import type { FulfillmentEvent, FulfillmentStage, Listing, ListingStatus, Marketplace } from "@/types/maat";
import { shipments } from "@/lib/logistics-mock";
import { inventoryItems } from "@/lib/inventory-mock";

// Dati dimostrativi per Listing Detail e Shipment Detail.
//
// Sono mock, e la pagina che li usa lo dichiara. Servono a rendere le due view
// provabili prima che esistano gli endpoint: `listings` e `fulfillments` sono
// tabelle canoniche già presenti nello schema, ma senza API che le espongano.
//
// Un vincolo che questi mock rispettano di proposito: gli eventi NON coprono
// tutte le spedizioni. Alcune non ne hanno nessuno, ed è il caso reale che il
// brief 14 chiede di mostrare invece di riempire con un evento inventato.

function iso(daysAgo: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const LISTING_SEED: [Marketplace, ListingStatus, number, boolean, string | null][] = [
  ["vinted", "active", 14500, true, null],
  ["grailed", "active", 24000, false, null],
  ["depop", "error", 8900, false, "Le foto non rispettano le linee guida: serve almeno uno scatto su fondo neutro."],
  ["vestiaire", "pending_manual", 32000, false, null],
  ["ebay", "delisted", 5500, true, null],
  ["vinted", "error", 18000, true, null],
];

/**
 * Un Listing per ognuno dei primi capi a catalogo, così ogni riga di LiveTab
 * ha qualcosa da aprire. Deliberatamente vari negli stati: senza un `error` e
 * un `delisted` la view non sarebbe provabile proprio dove serve di più.
 */
export const listings: Listing[] = inventoryItems.slice(0, LISTING_SEED.length).map((item, i) => {
  const [marketplace, status, priceCents, negotiable, errorReason] = LISTING_SEED[i];
  const published = status === "active" || status === "delisted" || status === "error";
  return {
    id: `lst-${i + 1}`,
    itemId: item.id,
    itemLabel: `${item.brand} · ${item.tipoCapo}`,
    sku: item.sku,
    marketplace,
    status,
    priceCents,
    negotiable,
    externalUrl: published && status !== "error" ? `https://example.com/${marketplace}/${item.sku}` : null,
    publishedAt: published && status !== "error" ? iso(9 + i) : null,
    delistedAt: status === "delisted" ? iso(2) : null,
    errorReason,
    createdAt: iso(12 + i),
    updatedAt: iso(i),
  };
});

/** Il Listing aperto dalla riga di LiveTab, se ne esiste uno per quel capo. */
export function listingForItem(itemId: string): Listing | null {
  return listings.find((l) => l.itemId === itemId) ?? null;
}

// ---------------------------------------------------------------------------

const STAGE_CHAIN: Record<string, FulfillmentStage[]> = {
  da_fare: [],
  fatti: ["packing", "ready"],
  spediti: ["packing", "ready", "shipped", "in_transit"],
  consegnati: ["packing", "ready", "shipped", "in_transit", "delivered"],
};

/**
 * Gli eventi di una spedizione, derivati dal suo stato di board.
 *
 * Le spedizioni in `da_fare` restano SENZA eventi: è il caso che il brief
 * chiede esplicitamente di mostrare vuoto invece di inventare un `packing`
 * per far tornare i conti fra board e canonico.
 */
export const fulfillmentEvents: FulfillmentEvent[] = shipments.flatMap((s) => {
  const chain = STAGE_CHAIN[s.status] ?? [];
  return chain.map((stage, i) => {
    // Il PRIMO evento della catena è il più VECCHIO: `packing` è successo
    // quando la vendita è entrata in pipeline, `delivered` è il più recente.
    // La formula precedente sottraeva al contrario e invertiva la cronologia:
    // lo stato derivato leggeva "packing" come ultimo evento e una spedizione
    // consegnata appariva "Da fare". Trovato solo guardando la view, perché
    // tsc e i test non hanno modo di sapere che una data è nell'ordine sbagliato.
    const daysAgo = Math.max(0, Math.round(s.hoursAgo / 24) - i);
    const moving = stage === "shipped" || stage === "in_transit" || stage === "delivered";
    return {
      id: `flf-${s.id}-${i}`,
      shipmentId: s.id,
      stage,
      occurredAt: iso(daysAgo, 9 + i),
      // Per-evento, non per-spedizione: il corriere compare quando il pacco
      // entra davvero in rete, non prima.
      carrier: moving ? s.carrier : null,
      trackingCode: moving ? s.trackingCode : null,
      expectedDeliveryAt: stage === "shipped" ? iso(Math.max(0, daysAgo - 3), 18) : null,
      note: stage === "ready" ? "Etichetta stampata, in attesa di ritiro." : null,
    };
  });
});

export function eventsForShipment(shipmentId: string): FulfillmentEvent[] {
  return fulfillmentEvents.filter((e) => e.shipmentId === shipmentId);
}
