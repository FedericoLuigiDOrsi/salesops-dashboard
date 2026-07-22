import type { Shipment, ShipmentStatus } from "@/types/maat";

/** Magazzino DirtyTag — Napoli. */
export const DIRTYTAG_ORIGIN = { lat: 40.8518, lng: 14.2681 };

/**
 * shipped/in_transit condividono lo stesso testo in StatusBadge (--muted-foreground);
 * qui usiamo --info per in_transit per rendere gli archi distinguibili sul globo.
 */
export const STATUS_ARC_COLOR: Record<ShipmentStatus, string> = {
  shipped: "#5B6670", // --muted-foreground
  in_transit: "#1E488F", // --info
  out_for_delivery: "#00804C", // --success
};

export interface ArcDatum {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}

export interface RingDatum {
  id: string;
  lat: number;
  lng: number;
  color: string;
}

export function buildArcs(shipments: Shipment[], origin: { lat: number; lng: number } = DIRTYTAG_ORIGIN): ArcDatum[] {
  return shipments.map((s) => ({
    id: s.id,
    startLat: origin.lat,
    startLng: origin.lng,
    endLat: s.destinationCity.lat,
    endLng: s.destinationCity.lng,
    color: STATUS_ARC_COLOR[s.status],
  }));
}

export function buildRings(shipments: Shipment[]): RingDatum[] {
  return shipments.map((s) => ({
    id: s.id,
    lat: s.destinationCity.lat,
    lng: s.destinationCity.lng,
    color: STATUS_ARC_COLOR[s.status],
  }));
}
