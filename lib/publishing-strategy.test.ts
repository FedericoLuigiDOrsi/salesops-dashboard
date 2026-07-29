import { describe, expect, it } from "vitest";
import { DEFAULT_STRATEGY, isValidStrategyConfig } from "./publishing-strategy";
import { PLATFORM_KEYS } from "./inventory-columns";

describe("DEFAULT_STRATEGY", () => {
  it("ha una voce per ogni piattaforma", () => {
    for (const key of PLATFORM_KEYS) {
      expect(DEFAULT_STRATEGY.platforms[key]).toBeDefined();
    }
  });
  it("defaultPublishPlatforms contiene solo chiavi valide", () => {
    for (const key of DEFAULT_STRATEGY.defaultPublishPlatforms) {
      expect(PLATFORM_KEYS).toContain(key);
    }
  });
  it("è valido secondo isValidStrategyConfig", () => {
    expect(isValidStrategyConfig(DEFAULT_STRATEGY)).toBe(true);
  });
});

describe("isValidStrategyConfig", () => {
  it("rifiuta null/undefined", () => {
    expect(isValidStrategyConfig(null)).toBe(false);
    expect(isValidStrategyConfig(undefined)).toBe(false);
  });
  it("rifiuta un oggetto senza defaultPublishPlatforms", () => {
    const { defaultPublishPlatforms, ...rest } = DEFAULT_STRATEGY;
    expect(isValidStrategyConfig(rest)).toBe(false);
  });
  it("rifiuta se manca una piattaforma", () => {
    const { vinted, ...restPlatforms } = DEFAULT_STRATEGY.platforms;
    expect(isValidStrategyConfig({ ...DEFAULT_STRATEGY, platforms: restPlatforms })).toBe(false);
  });
  it("rifiuta se un campo numerico è una stringa", () => {
    const corrupted = {
      ...DEFAULT_STRATEGY,
      platforms: {
        ...DEFAULT_STRATEGY.platforms,
        vinted: {
          ...DEFAULT_STRATEGY.platforms.vinted,
          repricing: { ...DEFAULT_STRATEGY.platforms.vinted.repricing, discountPct: "5" },
        },
      },
    };
    expect(isValidStrategyConfig(corrupted)).toBe(false);
  });
});
