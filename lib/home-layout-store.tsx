"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/lib/use-persistent-state";
import { readPersisted, writePersisted } from "@/lib/persistent-store";
import { WIDGET_CATALOG, type WidgetKey } from "@/lib/widget-catalog";
import { clampModuleDims, type ModuleDims } from "@/lib/widget-sizes";
import { DEFAULT_STATE, parseHomeLayout, withNewWidgets, type HomeLayoutState } from "@/lib/home-layout-parse";

export type { WidgetKey } from "@/lib/widget-catalog";

const STORAGE_KEY = "maat.home.layout.v2";
const LEGACY_STORAGE_KEY = "maat.home.layout.v1";

interface HomeLayoutContextValue {
  layout: WidgetKey[];
  metrics: string[];
  widgetSizes: Partial<Record<WidgetKey, ModuleDims>>;
  setLayout: (next: WidgetKey[]) => void;
  addWidget: (key: WidgetKey) => void;
  removeWidget: (key: WidgetKey) => void;
  setMetrics: (next: string[]) => void;
  setWidgetSize: (key: WidgetKey, dims: ModuleDims) => void;
}

const HomeLayoutContext = createContext<HomeLayoutContextValue | null>(null);

/** Legge la chiave legacy una sola volta all'avvio e la riscrive sotto la chiave corrente. */
function migrateLegacyLayout(): HomeLayoutState | null {
  try {
    if (window.localStorage.getItem(STORAGE_KEY) !== null) return null;
    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return null;
    const migrated = parseHomeLayout(legacyRaw);
    return migrated ? withNewWidgets(migrated) : null;
  } catch {
    return null;
  }
}

/**
 * Store del layout personalizzabile della Home: quali widget sono in pagina,
 * in che ordine, con che taglia, e quali metriche mostra la Panoramica (e in
 * che ordine). Persistito in localStorage (per ora niente backend, coerente
 * col prototipo).
 */
export function HomeLayoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = usePersistentState(STORAGE_KEY, parseHomeLayout, DEFAULT_STATE);
  const { layout, metrics, widgetSizes } = state;

  // Scrivere su un sistema esterno dentro un effect è il pattern previsto,
  // quello vietato è il setState. Gira una volta: dopo, STORAGE_KEY esiste.
  useEffect(() => {
    const migrated = migrateLegacyLayout();
    if (migrated) writePersisted(STORAGE_KEY, migrated);
  }, []);

  // Applica una patch partendo dal valore appena scritto in storage, non da
  // `state` (che nel render corrente è già vecchio): due setter chiamati in
  // sequenza nello stesso handler altrimenti si sovrascrivono a vicenda,
  // perché entrambi partirebbero dallo stesso `state` catturato prima di
  // qualsiasi scrittura. `readPersisted` legge dalla cache del modulo,
  // aggiornata in modo sincrono da `writePersisted`, quindi il secondo setter
  // vede già l'effetto del primo.
  function patchState(patch: Partial<HomeLayoutState>) {
    const current = readPersisted(STORAGE_KEY, parseHomeLayout, DEFAULT_STATE);
    setState({ ...current, ...patch });
  }

  const value = useMemo<HomeLayoutContextValue>(
    () => ({
      layout,
      metrics,
      widgetSizes,
      setLayout: (next) => patchState({ layout: next }),
      addWidget: (key) =>
        patchState({ layout: layout.includes(key) ? layout : [...layout, key] }),
      removeWidget: (key) => patchState({ layout: layout.filter((k) => k !== key) }),
      setMetrics: (next) => patchState({ metrics: next }),
      setWidgetSize: (key, dims) =>
        patchState({ widgetSizes: { ...widgetSizes, [key]: clampModuleDims(dims, WIDGET_CATALOG[key].sizes) } }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layout, metrics, widgetSizes]
  );

  return <HomeLayoutContext.Provider value={value}>{children}</HomeLayoutContext.Provider>;
}

export function useHomeLayout() {
  const ctx = useContext(HomeLayoutContext);
  if (!ctx) throw new Error("useHomeLayout must be used within a HomeLayoutProvider");
  return ctx;
}
