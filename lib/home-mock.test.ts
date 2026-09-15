import { describe, expect, it } from "vitest";
import { HOME_METRICS } from "./home-mock";

describe("HOME_METRICS", () => {
  it("ogni metrica ha un kind valido", () => {
    const validKinds = ["hero", "trend"];
    for (const m of HOME_METRICS) {
      expect(validKinds).toContain(m.kind);
    }
  });
  it("esiste esattamente un hero (entrate); bozze e offerte non sono più metriche Panoramica", () => {
    const hero = HOME_METRICS.filter((m) => m.kind === "hero").map((m) => m.key);
    expect(hero).toEqual(["entrate"]);
    const keys = HOME_METRICS.map((m) => m.key);
    expect(keys).not.toContain("bozze");
    expect(keys).not.toContain("offerte");
  });
});
