import { describe, expect, it } from "vitest";
import {
  isReadyToPublish,
  isLive,
  isSoldOutEverywhere,
  getToPublishItems,
  getLiveItems,
  getDraftCount,
} from "./publishing-mock";
import type { InventoryItem } from "./inventory-mock";

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: "inv-x",
    brand: "Test Brand",
    tipoCapo: "Test Capo",
    sku: "TST-00-0000",
    category: "Giacche",
    size: "M",
    priceCents: 10000,
    status: "available",
    photoUrl: null,
    platforms: { vinted: null, grailed: null, depop: null },
    ...overrides,
  };
}

describe("isReadyToPublish", () => {
  it("true per un capo a catalogo mai listato", () => {
    expect(isReadyToPublish(makeItem())).toBe(true);
  });
  it("false per una bozza", () => {
    expect(isReadyToPublish(makeItem({ status: "to_be_reviewed" }))).toBe(false);
  });
  it("false se già listato ovunque anche solo su una piattaforma", () => {
    expect(
      isReadyToPublish(makeItem({ platforms: { vinted: "active", grailed: null, depop: null } }))
    ).toBe(false);
  });
});

describe("isLive", () => {
  it("true se almeno una piattaforma non è null", () => {
    expect(isLive(makeItem({ platforms: { vinted: "pending", grailed: null, depop: null } }))).toBe(true);
  });
  it("false se tutte le piattaforme sono null", () => {
    expect(isLive(makeItem())).toBe(false);
  });
});

describe("isSoldOutEverywhere", () => {
  it("true se tutte le piattaforme listate sono sold", () => {
    expect(
      isSoldOutEverywhere(makeItem({ platforms: { vinted: "sold", grailed: "delisted", depop: null } }))
    ).toBe(false); // delisted non è sold: non è "venduto ovunque"
  });
  it("true se le uniche piattaforme listate sono tutte sold", () => {
    expect(
      isSoldOutEverywhere(makeItem({ platforms: { vinted: "sold", grailed: null, depop: null } }))
    ).toBe(true);
  });
  it("false se nessuna piattaforma è mai stata listata", () => {
    expect(isSoldOutEverywhere(makeItem())).toBe(false);
  });
});

describe("getToPublishItems / getLiveItems / getDraftCount", () => {
  const items = [
    makeItem({ id: "a", status: "available" }), // ready to publish
    makeItem({ id: "b", status: "to_be_reviewed" }), // draft, escluso da entrambe
    makeItem({ id: "c", platforms: { vinted: "active", grailed: null, depop: null } }), // live
  ];

  it("getToPublishItems ritorna solo i pronti", () => {
    expect(getToPublishItems(items).map((i) => i.id)).toEqual(["a"]);
  });
  it("getLiveItems ritorna solo i listati", () => {
    expect(getLiveItems(items).map((i) => i.id)).toEqual(["c"]);
  });
  it("getDraftCount conta le bozze", () => {
    expect(getDraftCount(items)).toBe(1);
  });
});
