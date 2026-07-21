import { describe, expect, it } from "vitest";
import { HOME_METRICS } from "./home-mock";

describe("HOME_METRICS", () => {
  it("ogni metrica ha una fascia valida", () => {
    const validTiers = ["grande", "medio", "piccolo"];
    for (const m of HOME_METRICS) {
      expect(validTiers).toContain(m.tier);
    }
  });
  it("le fasce grande sono esattamente entrate e offerte", () => {
    const grande = HOME_METRICS.filter((m) => m.tier === "grande").map((m) => m.key).sort();
    expect(grande).toEqual(["entrate", "offerte"]);
  });
});
