// Fascia di importanza fissa per i widget Home.
export type Tier = "grande" | "medio" | "piccolo";

/** Footprint in griglia (4 colonne, grid-flow-dense) per i 6 widget-card Home. */
export const WIDGET_TIER_GRID_CLASS: Record<Tier, string> = {
  grande: "lg:col-span-2 lg:row-span-2",
  medio: "lg:col-span-2 lg:row-span-1",
  piccolo: "lg:col-span-1 lg:row-span-1",
};
