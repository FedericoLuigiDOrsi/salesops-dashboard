import { describe, expect, it } from "vitest";
import { buildArcs, buildRings, DIRTYTAG_ORIGIN, STATUS_ARC_COLOR } from "./logistics-globe-data";
import type { Shipment } from "@/types/maat";

function mockShipment(overrides: Partial<Shipment> = {}): Shipment {
  return {
    id: "sh-test",
    itemLabel: "Test item",
    sku: "T-001",
    marketplace: "vinted",
    carrier: "BRT",
    trackingCode: "TEST-001",
    recipient: "Test",
    status: "in_transit",
    shippedAt: "1 lug",
    expectedDeliveryAt: "5 lug",
    priceCents: 1000,
    destinationCity: { name: "Milano", lat: 45.4642, lng: 9.19 },
    ...overrides,
  };
}

describe("buildArcs", () => {
  it("crea un arco per ogni spedizione, dall'origine alla destinazione", () => {
    const shipments = [
      mockShipment({ id: "sh-1" }),
      mockShipment({ id: "sh-2", destinationCity: { name: "Roma", lat: 41.9028, lng: 12.4964 } }),
    ];
    const arcs = buildArcs(shipments);
    expect(arcs).toHaveLength(2);
    expect(arcs[0]).toEqual({
      id: "sh-1",
      startLat: DIRTYTAG_ORIGIN.lat,
      startLng: DIRTYTAG_ORIGIN.lng,
      endLat: 45.4642,
      endLng: 9.19,
      color: STATUS_ARC_COLOR.in_transit,
    });
  });

  it("colora l'arco in base allo status della spedizione", () => {
    const shipments = [
      mockShipment({ id: "a", status: "shipped" }),
      mockShipment({ id: "b", status: "in_transit" }),
      mockShipment({ id: "c", status: "out_for_delivery" }),
    ];
    const arcs = buildArcs(shipments);
    expect(arcs.map((a) => a.color)).toEqual([
      STATUS_ARC_COLOR.shipped,
      STATUS_ARC_COLOR.in_transit,
      STATUS_ARC_COLOR.out_for_delivery,
    ]);
  });

  it("ritorna array vuoto per lista vuota", () => {
    expect(buildArcs([])).toEqual([]);
  });
});

describe("buildRings", () => {
  it("crea un ring per ogni destinazione, con lo stesso colore dell'arco", () => {
    const shipments = [mockShipment({ id: "sh-1" })];
    const rings = buildRings(shipments);
    expect(rings).toEqual([{ id: "sh-1", lat: 45.4642, lng: 9.19, color: STATUS_ARC_COLOR.in_transit }]);
  });
});
