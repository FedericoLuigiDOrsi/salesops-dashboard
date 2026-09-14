import { describe, expect, it } from "vitest";
import { DEFAULT_LAYOUT } from "@/lib/home-layout-parse";
import { WIDGET_KEYS } from "@/lib/widget-catalog";
import { HOME_WIDGETS } from "./registry";

describe("HOME_WIDGETS", () => {
  it("copre esattamente le chiavi del catalogo", () => {
    expect(HOME_WIDGETS.map((w) => w.key).sort()).toEqual([...WIDGET_KEYS].sort());
  });
  it("registra una sola volta ogni widget e copre tutto il layout iniziale", () => {
    const keys = HOME_WIDGETS.map((widget) => widget.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(DEFAULT_LAYOUT.every((key) => keys.includes(key))).toBe(true);
  });
  it("la panoramica non è un widget", () => {
    expect(HOME_WIDGETS.map((w) => w.key)).not.toContain("panoramica");
  });
  it("i cinque widget in valutazione sono visibili nel layout iniziale", () => {
    expect(DEFAULT_LAYOUT).toEqual(
      expect.arrayContaining(["top-performer", "inventario-fermo", "target-settimanale", "note", "tempo-operativo"])
    );
  });
});
