import { describe, expect, it } from "vitest";
import { HOME_WIDGETS } from "./registry";

describe("HOME_WIDGETS", () => {
  it("ogni widget ha una fascia valida", () => {
    const validTiers = ["grande", "medio", "piccolo"];
    for (const w of HOME_WIDGETS) {
      expect(validTiers).toContain(w.tier);
    }
  });
  it("le fasce grande sono esattamente panoramica e offerte", () => {
    const grande = HOME_WIDGETS.filter((w) => w.tier === "grande").map((w) => w.key).sort();
    expect(grande).toEqual(["offerte", "panoramica"]);
  });
});
