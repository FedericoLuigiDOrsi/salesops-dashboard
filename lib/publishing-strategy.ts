import { PLATFORM_KEYS, type PlatformKey } from "./inventory-columns";

export interface PlatformStrategy {
  autoDelist: { enabled: boolean; staleDays: number };
  repricing: { enabled: boolean; discountPct: number; frequencyDays: number; floorPct: number };
  autoRelist: { enabled: boolean; frequencyDays: number };
}

export interface StrategyConfig {
  defaultPublishPlatforms: PlatformKey[];
  platforms: Record<PlatformKey, PlatformStrategy>;
}

const ACTIVE_DEFAULT: PlatformStrategy = {
  autoDelist: { enabled: true, staleDays: 90 },
  repricing: { enabled: true, discountPct: 5, frequencyDays: 7, floorPct: 40 },
  autoRelist: { enabled: true, frequencyDays: 7 },
};

const INACTIVE_DEFAULT: PlatformStrategy = {
  autoDelist: { enabled: false, staleDays: 90 },
  repricing: { enabled: false, discountPct: 5, frequencyDays: 7, floorPct: 40 },
  autoRelist: { enabled: false, frequencyDays: 7 },
};

export const DEFAULT_STRATEGY: StrategyConfig = {
  defaultPublishPlatforms: ["vinted", "depop"],
  platforms: {
    vinted: { ...ACTIVE_DEFAULT },
    grailed: { ...INACTIVE_DEFAULT },
    depop: { ...ACTIVE_DEFAULT, repricing: { enabled: true, discountPct: 10, frequencyDays: 14, floorPct: 30 } },
  },
};

function isPlatformStrategy(value: unknown): value is PlatformStrategy {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const delist = v.autoDelist as Record<string, unknown> | undefined;
  const repricing = v.repricing as Record<string, unknown> | undefined;
  const relist = v.autoRelist as Record<string, unknown> | undefined;
  if (!delist || typeof delist.enabled !== "boolean" || typeof delist.staleDays !== "number") return false;
  if (
    !repricing ||
    typeof repricing.enabled !== "boolean" ||
    typeof repricing.discountPct !== "number" ||
    typeof repricing.frequencyDays !== "number" ||
    typeof repricing.floorPct !== "number"
  )
    return false;
  if (!relist || typeof relist.enabled !== "boolean" || typeof relist.frequencyDays !== "number") return false;
  return true;
}

export function isValidStrategyConfig(value: unknown): value is StrategyConfig {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.defaultPublishPlatforms)) return false;
  if (!v.defaultPublishPlatforms.every((p) => (PLATFORM_KEYS as string[]).includes(p as string))) return false;
  const platforms = v.platforms as Record<string, unknown> | undefined;
  if (!platforms) return false;
  return PLATFORM_KEYS.every((key) => isPlatformStrategy(platforms[key]));
}
