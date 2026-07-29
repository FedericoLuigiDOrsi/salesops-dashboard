import type { Shipment, ShipmentStatus } from "@/types/maat";
import { SHIPMENT_STATUS_LABELS } from "@/types/maat";

/** Magazzino DirtyTag — Napoli. */
export const DIRTYTAG_ORIGIN = { lat: 40.8518, lng: 14.2681 };

/**
 * Stati che richiedono un'azione dell'operatore: sono i soli a ricevere il fluo
 * sul globo. Spediti e consegnati sono "in corso" e restano neutri — così il
 * dosaggio 90/10 del design system regge anche con 18 rotte a schermo.
 */
export const NEEDS_ACTION: ShipmentStatus[] = ["da_fare", "fatti"];
export const needsAction = (status: ShipmentStatus) => NEEDS_ACTION.includes(status);

/** Colori delle colonne della board Kanban Logistica (non più usati dal globo). */
export const STATUS_ARC_COLOR: Record<ShipmentStatus, string> = {
  da_fare: "#DBE64C", // --primary
  fatti: "#1E488F", // --info
  spediti: "#5B6670", // --muted-foreground
  consegnati: "#00804C", // --success
};

export interface CityAggregate {
  name: string;
  lat: number;
  lng: number;
  /** Spedizioni totali verso questa città. */
  total: number;
  /** Almeno una spedizione da_fare o fatti. */
  needsAction: boolean;
  byStatus: Partial<Record<ShipmentStatus, number>>;
}

/**
 * Una voce per città invece di una per spedizione: il globo disegnava 18 archi
 * e 18 ring sovrapposti su 13 città (Berlino ne aveva 3 identici).
 */
export function buildCityAggregates(shipments: Shipment[]): CityAggregate[] {
  const map = new Map<string, CityAggregate>();
  for (const s of shipments) {
    const { name, lat, lng } = s.destinationCity;
    const entry =
      map.get(name) ?? ({ name, lat, lng, total: 0, needsAction: false, byStatus: {} } satisfies CityAggregate);
    entry.total += 1;
    entry.byStatus[s.status] = (entry.byStatus[s.status] ?? 0) + 1;
    if (needsAction(s.status)) entry.needsAction = true;
    map.set(name, entry);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/** "LONDRA — 2 da fare · 1 spediti" */
export function cityTooltip(city: CityAggregate): string {
  const parts = (Object.keys(city.byStatus) as ShipmentStatus[]).map(
    (k) => `${city.byStatus[k]} ${SHIPMENT_STATUS_LABELS[k].toLowerCase()}`
  );
  return `${city.name.toUpperCase()} — ${parts.join(" · ")}`;
}
