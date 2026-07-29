// lib/publishing-strategy-store.tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PLATFORM_KEYS, type PlatformKey } from "./inventory-columns";
import { DEFAULT_STRATEGY, isValidStrategyConfig, type PlatformStrategy, type StrategyConfig } from "./publishing-strategy";

const STORAGE_KEY = "maat.publishing.strategy.v1";

interface PublishingStrategyContextValue {
  strategy: StrategyConfig;
  toggleDefaultPublishPlatform: (platform: PlatformKey) => void;
  setAutoDelist: (platform: PlatformKey, patch: Partial<PlatformStrategy["autoDelist"]>) => void;
  setRepricing: (platform: PlatformKey, patch: Partial<PlatformStrategy["repricing"]>) => void;
  setAutoRelist: (platform: PlatformKey, patch: Partial<PlatformStrategy["autoRelist"]>) => void;
}

const PublishingStrategyContext = createContext<PublishingStrategyContextValue | null>(null);

/**
 * Store delle regole di pubblicazione (auto-delist/repricing/auto-relist per
 * piattaforma + piattaforme predefinite). Persistito in localStorage, stesso
 * pattern di lib/home-layout-store.tsx: niente backend nel prototipo.
 */
export function PublishingStrategyProvider({ children }: { children: ReactNode }) {
  const [strategy, setStrategy] = useState<StrategyConfig>(DEFAULT_STRATEGY);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValidStrategyConfig(parsed)) setStrategy(parsed);
      }
    } catch {
      // storage corrotto o non disponibile: si riparte dal default
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(strategy));
    } catch {
      // storage non disponibile: la sessione resta solo in memoria
    }
  }, [strategy]);

  function updatePlatform(platform: PlatformKey, patch: Partial<PlatformStrategy>) {
    setStrategy((prev) => ({
      ...prev,
      platforms: { ...prev.platforms, [platform]: { ...prev.platforms[platform], ...patch } },
    }));
  }

  function toggleDefaultPublishPlatform(platform: PlatformKey) {
    setStrategy((prev) => {
      const has = prev.defaultPublishPlatforms.includes(platform);
      return {
        ...prev,
        defaultPublishPlatforms: has
          ? prev.defaultPublishPlatforms.filter((p) => p !== platform)
          : [...prev.defaultPublishPlatforms, platform],
      };
    });
  }

  function setAutoDelist(platform: PlatformKey, patch: Partial<PlatformStrategy["autoDelist"]>) {
    updatePlatform(platform, { autoDelist: { ...strategy.platforms[platform].autoDelist, ...patch } });
  }

  function setRepricing(platform: PlatformKey, patch: Partial<PlatformStrategy["repricing"]>) {
    updatePlatform(platform, { repricing: { ...strategy.platforms[platform].repricing, ...patch } });
  }

  function setAutoRelist(platform: PlatformKey, patch: Partial<PlatformStrategy["autoRelist"]>) {
    updatePlatform(platform, { autoRelist: { ...strategy.platforms[platform].autoRelist, ...patch } });
  }

  const value = useMemo(
    () => ({ strategy, toggleDefaultPublishPlatform, setAutoDelist, setRepricing, setAutoRelist }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [strategy]
  );

  return <PublishingStrategyContext.Provider value={value}>{children}</PublishingStrategyContext.Provider>;
}

export function usePublishingStrategy() {
  const ctx = useContext(PublishingStrategyContext);
  if (!ctx) throw new Error("usePublishingStrategy deve stare dentro PublishingStrategyProvider");
  return ctx;
}

export { PLATFORM_KEYS };
