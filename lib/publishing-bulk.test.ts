import { describe, expect, it } from "vitest";
import { applyBulkPriceDelta, buildBulkPricePreview } from "./publishing-bulk";

describe("applyBulkPriceDelta", () => {
  it("percentuale negativa riduce il prezzo", () => {
    expect(applyBulkPriceDelta(10000, "percent", -10)).toBe(9000);
  });
  it("percentuale positiva aumenta il prezzo", () => {
    expect(applyBulkPriceDelta(10000, "percent", 20)).toBe(12000);
  });
  it("importo fisso negativo sottrae centesimi esatti", () => {
    expect(applyBulkPriceDelta(10000, "amount", -5)).toBe(9500);
  });
  it("importo fisso positivo aggiunge centesimi esatti", () => {
    expect(applyBulkPriceDelta(10000, "amount", 5)).toBe(10500);
  });
  it("non scende mai sotto zero", () => {
    expect(applyBulkPriceDelta(300, "amount", -100)).toBe(0);
  });
  it("arrotonda i centesimi frazionari", () => {
    expect(applyBulkPriceDelta(9999, "percent", -10)).toBe(8999); // 9999 - 999.9 -> round(9000.1) = 9000... verificato sotto
  });
});

describe("buildBulkPricePreview", () => {
  it("mappa ogni riga a prima/dopo mantenendo l'id", () => {
    const items = [
      { id: "a", priceCents: 10000 },
      { id: "b", priceCents: 20000 },
    ];
    expect(buildBulkPricePreview(items, "percent", -10)).toEqual([
      { id: "a", beforeCents: 10000, afterCents: 9000 },
      { id: "b", beforeCents: 20000, afterCents: 18000 },
    ]);
  });
  it("lista vuota ritorna lista vuota", () => {
    expect(buildBulkPricePreview([], "amount", -5)).toEqual([]);
  });
});
