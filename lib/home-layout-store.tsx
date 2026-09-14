"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { DEFAULT_SELECTED_METRICS } from "@/lib/home-mock";
import { usePersistentState } from "@/lib/use-persistent-state";
import { readPersisted, writePersisted } from "@/lib/persistent-store";
import { clampModuleDims, isModuleDims, DEFAULT_MODULE_DIMS, type ModuleDims } from "@/lib/widget-sizes";

// Chiavi dei widget disponibili in Home. Vivono qui e non nella registry per
// evitare un ciclo di import runtime (widgets → store → registry → widgets):
// la registry importa da questo file solo il tipo.
export const WIDGET_KEYS = [
  "panoramica",
  "offerte",
  "vendite",
  "azioni",
  "notifiche",
  "entrate",
  "logistica",
  "top-performer",
  "inventario-fermo",
  "target-settimanale",
  "note",
  "tempo-operativo",
] as const;
export type WidgetKey = (typeof WIDGET_KEYS)[number];

const NEW_WIDGET_KEYS: WidgetKey[] = ["top-performer", "inventario-fermo", "target-settimanale", "note", "tempo-operativo"];

// Layout iniziale: i cinque nuovi widget restano visibili di default durante la fase di valutazione.
export const DEFAULT_LAYOUT: WidgetKey[] = ["panoramica", "offerte", "vendite", "logistica", ...NEW_WIDGET_KEYS];

// Dimensioni di default per i widget che già supportano il sistema a moduli
// (vedi lib/widget-sizes.ts). Gli altri non hanno voce qui: restano sulla Tier fissa.
export const DEFAULT_WIDGET_SIZES: Partial<Record<WidgetKey, ModuleDims>> = {
  offerte: DEFAULT_MODULE_DIMS,
};

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

function isWidgetKey(value: unknown): value is WidgetKey {
  return typeof value === "string" && (WIDGET_KEYS as readonly string[]).includes(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

interface HomeLayoutState {
  layout: WidgetKey[];
  metrics: string[];
  widgetSizes: Partial<Record<WidgetKey, ModuleDims>>;
}

const DEFAULT_STATE: HomeLayoutState = {
  layout: DEFAULT_LAYOUT,
  metrics: DEFAULT_SELECTED_METRICS,
  widgetSizes: DEFAULT_WIDGET_SIZES,
};

function parseWidgetSizes(value: unknown): Partial<Record<WidgetKey, ModuleDims>> {
  if (!value || typeof value !== "object") return DEFAULT_WIDGET_SIZES;
  const out: Partial<Record<WidgetKey, ModuleDims>> = {};
  for (const [key, dims] of Object.entries(value as Record<string, unknown>)) {
    if (isWidgetKey(key) && isModuleDims(dims)) out[key] = clampModuleDims(dims);
  }
  return { ...DEFAULT_WIDGET_SIZES, ...out };
}

function parseHomeLayout(raw: string): HomeLayoutState | undefined {
  const saved = JSON.parse(raw) as {
    layout?: unknown[];
    metrics?: unknown[];
    widgetSizes?: unknown;
  };
  return {
    layout: Array.isArray(saved.layout) ? saved.layout.filter(isWidgetKey) : DEFAULT_LAYOUT,
    metrics: Array.isArray(saved.metrics) ? asStringArray(saved.metrics) : DEFAULT_SELECTED_METRICS,
    widgetSizes: parseWidgetSizes(saved.widgetSizes),
  };
}

/**
 * Legge la chiave legacy e vi aggiunge i widget introdotti dopo, così chi aveva
 * già personalizzato la Home non se li perde. Usata una sola volta all'avvio,
 * per riscrivere il risultato sotto la chiave corrente.
 */
function migrateLegacyLayout(): HomeLayoutState | null {
  try {
    if (window.localStorage.getItem(STORAGE_KEY) !== null) return null;
    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return null;
    const migrated = parseHomeLayout(legacyRaw);
    if (!migrated) return null;
    return {
      ...migrated,
      layout: [...migrated.layout, ...NEW_WIDGET_KEYS.filter((key) => !migrated.layout.includes(key))],
    };
  } catch {
    return null;
  }
}

/**
 * Store del layout personalizzabile della Home: quali widget sono in pagina,
 * in che ordine, e quali metriche mostra la Panoramica (e in che ordine).
 * Persistito in localStorage (per ora niente backend, coerente col
 * prototipo).
 */
export function HomeLayoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = usePersistentState(STORAGE_KEY, parseHomeLayout, DEFAULT_STATE);
  const { layout, metrics, widgetSizes } = state;

  // Migrazione della chiave legacy: scrivere su un sistema esterno dentro un
  // effect è il pattern previsto, quello vietato è il setState. Gira una volta
  // sola perché dopo la scrittura STORAGE_KEY esiste e migrateLegacyLayout()
  // torna subito null.
  useEffect(() => {
    const migrated = migrateLegacyLayout();
    if (migrated) writePersisted(STORAGE_KEY, migrated);
  }, []);

  // Applica una patch partendo dal valore appena scritto in storage, non da
  // `state` (che nel render corrente è già vecchio): due setter chiamati in
  // sequenza nello stesso handler (es. saveEdit in PanoramicaWidget, che fa
  // setMetrics() e poi setPinnedMetrics()) altrimenti si sovrascrivono a
  // vicenda, perché entrambi spatterebbero lo stesso `state` catturato prima
  // di qualsiasi scrittura. `readPersisted` legge dalla cache del modulo,
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
        patchState({ widgetSizes: { ...widgetSizes, [key]: clampModuleDims(dims) } }),
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
