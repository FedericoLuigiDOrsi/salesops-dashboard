import { DEFAULT_SELECTED_METRICS } from "@/lib/home-mock";
import { WIDGET_CATALOG, isWidgetKey, type WidgetKey } from "@/lib/widget-catalog";
import { clampModuleDims, isModuleDims, type ModuleDims } from "@/lib/widget-sizes";

// Lettura pura del layout salvato. È anche la migrazione: le chiavi sconosciute
// (compresa la vecchia "panoramica") spariscono, le taglie tornano dentro i
// limiti del widget, chi non ha una taglia salvata usa la predefinita del catalogo.

export const NEW_WIDGET_KEYS: WidgetKey[] = ["top-performer", "inventario-fermo", "target-settimanale", "note", "tempo-operativo", "da-ritirare", "da-spedire"];

// Layout iniziale: i nuovi widget restano visibili durante la fase di valutazione.
export const DEFAULT_LAYOUT: WidgetKey[] = ["offerte", "vendite", "logistica", ...NEW_WIDGET_KEYS];

export interface HomeLayoutState {
  layout: WidgetKey[];
  metrics: string[];
  widgetSizes: Partial<Record<WidgetKey, ModuleDims>>;
}

export const DEFAULT_STATE: HomeLayoutState = {
  layout: DEFAULT_LAYOUT,
  metrics: DEFAULT_SELECTED_METRICS,
  widgetSizes: {},
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function parseWidgetSizes(value: unknown): Partial<Record<WidgetKey, ModuleDims>> {
  if (!value || typeof value !== "object") return {};
  const out: Partial<Record<WidgetKey, ModuleDims>> = {};
  for (const [key, dims] of Object.entries(value as Record<string, unknown>)) {
    if (isWidgetKey(key) && isModuleDims(dims)) out[key] = clampModuleDims(dims, WIDGET_CATALOG[key].sizes);
  }
  return out;
}

export function parseHomeLayout(raw: string): HomeLayoutState | undefined {
  const saved = JSON.parse(raw) as {
    layout?: unknown;
    metrics?: unknown;
    widgetSizes?: unknown;
  };
  return {
    layout: Array.isArray(saved.layout) ? saved.layout.filter(isWidgetKey) : DEFAULT_LAYOUT,
    metrics: Array.isArray(saved.metrics) ? asStringArray(saved.metrics) : DEFAULT_SELECTED_METRICS,
    widgetSizes: parseWidgetSizes(saved.widgetSizes),
  };
}

/** Aggiunge in coda i widget introdotti dopo, per chi aveva già personalizzato la Home. */
export function withNewWidgets(state: HomeLayoutState): HomeLayoutState {
  return { ...state, layout: [...state.layout, ...NEW_WIDGET_KEYS.filter((key) => !state.layout.includes(key))] };
}
