import type { WidgetSizes } from "@/lib/widget-sizes";

// Dati dei widget senza componenti: li leggono sia la registry (che aggiunge
// titolo, icona e componente) sia home-layout-store, che non può importare la
// registry senza un ciclo widgets → store → registry → widgets.

export const WIDGET_KEYS = [
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

/** Criterio del palmare: un widget è operativo (verbo concluso in Home) o un'utilità. `kpi` segna i debiti. */
export type WidgetRole = "operativo" | "utilita" | "kpi";

/** Unici widget ammessi con ruolo kpi: destinati alla Panoramica, la pulizia svuota l'elenco. */
export const KPI_WIDGETS: readonly WidgetKey[] = ["entrate", "top-performer", "target-settimanale"];

function fixed(w: number, h: number): WidgetSizes {
  return { min: { w, h }, max: { w, h }, default: { w, h } };
}

// Primo passaggio: taglie che riproducono le vecchie fasce (medio = 2×2,
// piccolo = 1×1). L'unità di riga è quadrata quanto la colonna (vedi
// useSquareRowUnit in HomeDashboard.tsx): "medio" è un quadrato di moduli,
// mai un rettangolo. Il ridimensionamento arriva widget per widget, col
// design per taglia.
export const WIDGET_CATALOG: Record<WidgetKey, { sizes: WidgetSizes; role: WidgetRole }> = {
  offerte: { sizes: { min: { w: 2, h: 2 }, max: { w: 4, h: 4 }, default: { w: 2, h: 3 } }, role: "operativo" },
  vendite: { sizes: fixed(1, 1), role: "operativo" },
  azioni: { sizes: fixed(2, 2), role: "operativo" },
  notifiche: { sizes: fixed(1, 1), role: "utilita" },
  entrate: { sizes: fixed(2, 2), role: "kpi" },
  logistica: { sizes: fixed(2, 2), role: "operativo" },
  "top-performer": { sizes: fixed(2, 2), role: "kpi" },
  "inventario-fermo": { sizes: fixed(2, 2), role: "operativo" },
  "target-settimanale": { sizes: fixed(1, 1), role: "kpi" },
  note: { sizes: fixed(1, 1), role: "utilita" },
  "tempo-operativo": { sizes: fixed(1, 1), role: "utilita" },
};

export function isWidgetKey(value: unknown): value is WidgetKey {
  return typeof value === "string" && (WIDGET_KEYS as readonly string[]).includes(value);
}
