import { describe, expect, it } from "vitest";
import { DEFAULT_SELECTED_METRICS } from "./home-mock";
import { DEFAULT_LAYOUT, NEW_WIDGET_KEYS, parseHomeLayout, withNewWidgets } from "./home-layout-parse";

describe("parseHomeLayout", () => {
  it("scarta panoramica e chiavi sconosciute mantenendo l'ordine", () => {
    const raw = JSON.stringify({ layout: ["panoramica", "note", "boh", "offerte"] });
    expect(parseHomeLayout(raw)?.layout).toEqual(["note", "offerte"]);
  });

  it("mantiene la taglia salvata riportandola dentro i limiti del widget", () => {
    const raw = JSON.stringify({ layout: ["offerte"], widgetSizes: { offerte: { w: 9, h: 3 }, entrate: { w: 4, h: 4 }, panoramica: { w: 2, h: 2 } } });
    expect(parseHomeLayout(raw)?.widgetSizes).toEqual({ offerte: { w: 4, h: 3 }, entrate: { w: 2, h: 2 } });
  });

  it("usa i default quando i campi mancano o non sono array", () => {
    const state = parseHomeLayout(JSON.stringify({ layout: "x", metrics: 1 }));
    expect(state).toEqual({
      layout: DEFAULT_LAYOUT,
      metrics: DEFAULT_SELECTED_METRICS,
      widgetSizes: {},
    });
  });
});

describe("withNewWidgets", () => {
  it("aggiunge in coda i widget in valutazione mancanti, senza doppioni", () => {
    const state = parseHomeLayout(JSON.stringify({ layout: ["offerte", "note"] }))!;
    const next = withNewWidgets(state).layout;
    expect(next.slice(0, 2)).toEqual(["offerte", "note"]);
    expect(next.filter((k) => k === "note")).toHaveLength(1);
    expect(NEW_WIDGET_KEYS.every((k) => next.includes(k))).toBe(true);
  });
});

describe("DEFAULT_LAYOUT", () => {
  it("non contiene la panoramica", () => {
    expect(DEFAULT_LAYOUT).not.toContain("panoramica");
  });
});
