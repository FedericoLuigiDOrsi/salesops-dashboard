// Fascia di importanza fissa per i widget Home.
export type Tier = "grande" | "medio" | "piccolo";

/**
 * Footprint in griglia (6 colonne, grid-flow-dense, unità di riga = larghezza
 * colonna: vedi useSquareRowUnit in HomeDashboard.tsx). Ogni fascia è un
 * quadrato di moduli, mai un rettangolo — "medio" era 2×1 (rettangolare),
 * ora è 2×2.
 */
export const WIDGET_TIER_GRID_CLASS: Record<Tier, string> = {
  grande: "lg:col-span-3 lg:row-span-3",
  medio: "lg:col-span-2 lg:row-span-2",
  piccolo: "lg:col-span-1 lg:row-span-1",
};
