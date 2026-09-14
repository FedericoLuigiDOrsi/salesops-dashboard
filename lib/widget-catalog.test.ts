import { describe, expect, it } from "vitest";
import { KPI_WIDGETS, WIDGET_CATALOG, WIDGET_KEYS, isWidgetKey } from "./widget-catalog";
import { GRID_MAX, clampModuleDims, isResizable, mobileSize } from "./widget-sizes";

describe("WIDGET_CATALOG", () => {
  it("ogni widget ha taglie coerenti e dentro il tetto della griglia", () => {
    for (const key of WIDGET_KEYS) {
      const { min, max, default: def } = WIDGET_CATALOG[key].sizes;
      expect(min.w).toBeGreaterThanOrEqual(1);
      expect(min.h).toBeGreaterThanOrEqual(1);
      expect(min.w).toBeLessThanOrEqual(def.w);
      expect(def.w).toBeLessThanOrEqual(max.w);
      expect(min.h).toBeLessThanOrEqual(def.h);
      expect(def.h).toBeLessThanOrEqual(max.h);
      expect(max.w).toBeLessThanOrEqual(GRID_MAX.w);
      expect(max.h).toBeLessThanOrEqual(GRID_MAX.h);
    }
  });

  it("il ruolo kpi è ammesso solo per l'elenco fisso destinato alla Panoramica", () => {
    const kpi = WIDGET_KEYS.filter((k) => WIDGET_CATALOG[k].role === "kpi");
    expect([...kpi].sort()).toEqual([...KPI_WIDGETS].sort());
    expect([...KPI_WIDGETS].sort()).toEqual(["entrate", "target-settimanale", "top-performer"]);
  });

  it("primo passaggio: solo Offerte si ridimensiona, le fasce fisse sono quadrati", () => {
    const resizable = WIDGET_KEYS.filter((k) => isResizable(WIDGET_CATALOG[k].sizes));
    expect(resizable).toEqual(["offerte"]);
    expect(WIDGET_CATALOG.offerte.sizes).toEqual({ min: { w: 2, h: 2 }, max: { w: 4, h: 4 }, default: { w: 2, h: 3 } });
    expect(WIDGET_CATALOG.azioni.sizes.default).toEqual({ w: 2, h: 2 });
    expect(WIDGET_CATALOG.note.sizes.default).toEqual({ w: 1, h: 1 });
  });

  it("riconosce solo le chiavi del catalogo", () => {
    expect(isWidgetKey("offerte")).toBe(true);
    expect(isWidgetKey("panoramica")).toBe(false);
    expect(isWidgetKey(3)).toBe(false);
  });
});

describe("widget-sizes", () => {
  it("riporta una taglia dentro i limiti del widget", () => {
    const sizes = WIDGET_CATALOG.offerte.sizes;
    expect(clampModuleDims({ w: 9, h: 1 }, sizes)).toEqual({ w: 4, h: 2 });
    expect(clampModuleDims({ w: 2.6, h: 3.2 }, sizes)).toEqual({ w: 3, h: 3 });
  });

  it("su telefono usa la larghezza minima e l'altezza predefinita", () => {
    expect(mobileSize(WIDGET_CATALOG.offerte.sizes)).toEqual({ w: 2, h: 3 });
  });
});
