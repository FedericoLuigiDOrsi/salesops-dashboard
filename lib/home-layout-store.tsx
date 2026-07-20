"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DEFAULT_SELECTED_METRICS } from "@/lib/home-mock";

// Chiavi dei widget disponibili in Home. Vivono qui e non nella registry per
// evitare un ciclo di import runtime (widgets → store → registry → widgets):
// la registry importa da questo file solo il tipo.
export const WIDGET_KEYS = ["panoramica", "offerte", "vendite", "azioni", "notifiche", "entrate"] as const;
export type WidgetKey = (typeof WIDGET_KEYS)[number];

// Layout iniziale = lo stato del mockup public/mobile/maat-shell-account.html.
export const DEFAULT_LAYOUT: WidgetKey[] = ["panoramica", "offerte", "vendite"];

const STORAGE_KEY = "maat.home.layout.v1";

interface HomeLayoutContextValue {
  layout: WidgetKey[];
  metrics: string[];
  setLayout: (next: WidgetKey[]) => void;
  addWidget: (key: WidgetKey) => void;
  removeWidget: (key: WidgetKey) => void;
  toggleMetric: (key: string) => void;
}

const HomeLayoutContext = createContext<HomeLayoutContextValue | null>(null);

function isWidgetKey(value: unknown): value is WidgetKey {
  return typeof value === "string" && (WIDGET_KEYS as readonly string[]).includes(value);
}

/**
 * Store del layout personalizzabile della Home: quali widget sono in pagina,
 * in che ordine, e quali metriche mostra la Panoramica. Persistito in
 * localStorage (per ora niente backend, coerente col prototipo).
 */
export function HomeLayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<WidgetKey[]>(DEFAULT_LAYOUT);
  const [metrics, setMetrics] = useState<string[]>(DEFAULT_SELECTED_METRICS);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { layout?: unknown[]; metrics?: unknown[] };
        if (Array.isArray(saved.layout)) setLayout(saved.layout.filter(isWidgetKey));
        if (Array.isArray(saved.metrics)) {
          setMetrics(saved.metrics.filter((m): m is string => typeof m === "string"));
        }
      }
    } catch {
      // storage corrotto o non disponibile: si riparte dal default
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ layout, metrics }));
    } catch {
      // storage pieno o bloccato: il layout resta solo in memoria
    }
  }, [layout, metrics]);

  const value = useMemo<HomeLayoutContextValue>(
    () => ({
      layout,
      metrics,
      setLayout,
      addWidget: (key) => setLayout((prev) => (prev.includes(key) ? prev : [...prev, key])),
      removeWidget: (key) => setLayout((prev) => prev.filter((k) => k !== key)),
      toggleMetric: (key) =>
        setMetrics((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])),
    }),
    [layout, metrics]
  );

  return <HomeLayoutContext.Provider value={value}>{children}</HomeLayoutContext.Provider>;
}

export function useHomeLayout() {
  const ctx = useContext(HomeLayoutContext);
  if (!ctx) throw new Error("useHomeLayout must be used within a HomeLayoutProvider");
  return ctx;
}
