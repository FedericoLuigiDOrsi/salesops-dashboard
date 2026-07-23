import { describe, expect, it } from "vitest";
import { DEFAULT_LAYOUT } from "@/lib/home-layout-store";
import { HOME_WIDGETS } from "./registry";

describe("HOME_WIDGETS", () => {
  it("ogni widget ha una fascia valida", () => {
    const validTiers = ["grande", "medio", "piccolo"];
    for (const w of HOME_WIDGETS) {
      expect(validTiers).toContain(w.tier);
    }
  });
  it("le fasce grande sono esattamente offerte e panoramica", () => {
    const grande = HOME_WIDGETS.filter((w) => w.tier === "grande").map((w) => w.key).sort();
    expect(grande).toEqual(["offerte", "panoramica"]);
  });
  it("prossime azioni usa la fascia media", () => {
    expect(HOME_WIDGETS.find((w) => w.key === "azioni")?.tier).toBe("medio");
  it("registra una sola volta ogni widget e copre tutto il layout iniziale", () => {
    const keys = HOME_WIDGETS.map((widget) => widget.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(DEFAULT_LAYOUT.every((key) => keys.includes(key))).toBe(true);
  });
  it("i cinque widget in valutazione sono visibili nel layout iniziale", () => {
    expect(DEFAULT_LAYOUT).toEqual(expect.arrayContaining([
      "top-performer",
      "inventario-fermo",
      "target-settimanale",
      "note",
      "tempo-operativo",
    ]));
  });

  });
});
