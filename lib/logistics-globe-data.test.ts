import { describe, expect, it } from "vitest";
import { buildCityAggregates, cityTooltip, needsAction, NEEDS_ACTION, STATUS_ARC_COLOR } from "./logistics-globe-data";
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
    status: "spediti",
    hoursAgo: 10,
    priceCents: 1000,
    destinationCity: { name: "Milano", lat: 45.4642, lng: 9.19 },
    ...overrides,
  };
}

describe("needsAction", () => {
  it("è true solo per da_fare e fatti", () => {
    expect(NEEDS_ACTION).toEqual(["da_fare", "fatti"]);
    expect(needsAction("da_fare")).toBe(true);
    expect(needsAction("fatti")).toBe(true);
    expect(needsAction("spediti")).toBe(false);
    expect(needsAction("consegnati")).toBe(false);
  });
});

describe("buildCityAggregates", () => {
  it("ritorna array vuoto per lista vuota", () => {
    expect(buildCityAggregates([])).toEqual([]);
  });

  it("crea una voce per città con lat/lng e conteggio totale", () => {
    const shipments = [mockShipment({ id: "sh-1" })];
    const cities = buildCityAggregates(shipments);
    expect(cities).toEqual([
      { name: "Milano", lat: 45.4642, lng: 9.19, total: 1, needsAction: false, byStatus: { spediti: 1 } },
    ]);
  });

  it("aggrega più spedizioni sulla stessa città invece di duplicarla", () => {
    const shipments = [
      mockShipment({ id: "sh-1", status: "da_fare" }),
      mockShipment({ id: "sh-2", status: "spediti" }),
      mockShipment({
        id: "sh-3",
        status: "consegnati",
        destinationCity: { name: "Roma", lat: 41.9028, lng: 12.4964 },
      }),
    ];
    const cities = buildCityAggregates(shipments);
    expect(cities).toHaveLength(2);
    const milano = cities.find((c) => c.name === "Milano")!;
    expect(milano.total).toBe(2);
    expect(milano.byStatus).toEqual({ da_fare: 1, spediti: 1 });
  });

  it("needsAction è true se almeno una spedizione della città è da_fare o fatti", () => {
    const [onlyQuiet, withAction] = buildCityAggregates([
      mockShipment({ id: "sh-1", status: "spediti" }),
      mockShipment({
        id: "sh-2",
        status: "fatti",
        destinationCity: { name: "Roma", lat: 41.9028, lng: 12.4964 },
      }),
    ]).sort((a, b) => a.name.localeCompare(b.name));
    expect(onlyQuiet.needsAction).toBe(false);
    expect(withAction.needsAction).toBe(true);
  });

  it("ordina le città per totale decrescente", () => {
    const shipments = [
      mockShipment({ id: "sh-1" }),
      mockShipment({ id: "sh-2" }),
      mockShipment({
        id: "sh-3",
        destinationCity: { name: "Roma", lat: 41.9028, lng: 12.4964 },
      }),
    ];
    const cities = buildCityAggregates(shipments);
    expect(cities.map((c) => c.name)).toEqual(["Milano", "Roma"]);
  });
});

describe("cityTooltip", () => {
  it("formatta nome maiuscolo e ripartizione per stato in minuscolo", () => {
    const [city] = buildCityAggregates([
      mockShipment({ id: "sh-1", status: "da_fare" }),
      mockShipment({ id: "sh-2", status: "spediti" }),
    ]);
    expect(cityTooltip(city)).toBe("MILANO — 1 da fare · 1 spediti");
  });
});

describe("STATUS_ARC_COLOR", () => {
  it("copre tutti e 4 gli stati", () => {
    expect(Object.keys(STATUS_ARC_COLOR).sort()).toEqual(["consegnati", "da_fare", "fatti", "spediti"]);
  });
});
