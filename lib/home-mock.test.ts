import { describe, expect, it } from "vitest";
import { HOME_METRICS } from "./home-mock";

describe("HOME_METRICS", () => {
  it("ogni metrica ha un kind valido", () => {
    const validKinds = ["hero", "actionable", "trend"];
    for (const m of HOME_METRICS) {
      expect(validKinds).toContain(m.kind);
    }
  });
  it("esiste esattamente un hero (entrate) e le actionable sono bozze e offerte", () => {
    const hero = HOME_METRICS.filter((m) => m.kind === "hero").map((m) => m.key);
    expect(hero).toEqual(["entrate"]);
    const actionable = HOME_METRICS.filter((m) => m.kind === "actionable").map((m) => m.key).sort();
    expect(actionable).toEqual(["bozze", "offerte"]);
  });
});
