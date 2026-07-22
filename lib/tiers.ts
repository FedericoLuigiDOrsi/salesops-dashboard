// Fascia di importanza fissa per widget Home e metriche Panoramica.
export type Tier = "grande" | "medio" | "piccolo";

/** Footprint in griglia (4 colonne, grid-flow-dense) per i 6 widget-card Home. */
export const WIDGET_TIER_GRID_CLASS: Record<Tier, string> = {
  grande: "lg:col-span-2 lg:row-span-2",
  medio: "lg:col-span-2 lg:row-span-1",
  piccolo: "lg:col-span-1 lg:row-span-1",
};

/** Span per le tile-metrica dentro Panoramica (griglia interna, fino a 4 colonne). */
export const METRIC_TIER_GRID_CLASS: Record<Tier, string> = {
  grande: "sm:col-span-2 lg:col-span-2",
  medio: "col-span-1",
  piccolo: "col-span-1",
};
