import { describe, expect, it } from "vitest";
import { WIDGET_TIER_GRID_CLASS, METRIC_TIER_GRID_CLASS } from "./tiers";

describe("WIDGET_TIER_GRID_CLASS", () => {
  it("assegna un footprint diverso a ogni fascia", () => {
    expect(WIDGET_TIER_GRID_CLASS.grande).toBe("lg:col-span-2 lg:row-span-2");
    expect(WIDGET_TIER_GRID_CLASS.medio).toBe("lg:col-span-2 lg:row-span-1");
    expect(WIDGET_TIER_GRID_CLASS.piccolo).toBe("lg:col-span-1 lg:row-span-1");
  });
});

describe("METRIC_TIER_GRID_CLASS", () => {
  it("solo la fascia grande occupa 2 colonne dentro Panoramica", () => {
    expect(METRIC_TIER_GRID_CLASS.grande).toBe("sm:col-span-2 lg:col-span-2");
    expect(METRIC_TIER_GRID_CLASS.medio).toBe("col-span-1");
    expect(METRIC_TIER_GRID_CLASS.piccolo).toBe("col-span-1");
  });
});
