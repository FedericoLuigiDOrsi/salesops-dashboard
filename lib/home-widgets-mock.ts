import type { Marketplace } from "@/types/maat";

export type PerformerEntity = "categorie" | "capi";
export type PerformerPeriod = "7d" | "30d";

export interface PerformerRow {
  label: string;
  sales: number;
}

/**
 * Contratto mock dell'aggregazione futura. La forma è già quella che il
 * backend potrà restituire per entità e finestra temporale.
 */
export const TOP_PERFORMERS: Record<PerformerEntity, Record<PerformerPeriod, PerformerRow[]>> = {
  categorie: {
    "7d": [
      { label: "Felpe & maglieria", sales: 9 },
      { label: "Giacche & capispalla", sales: 7 },
      { label: "T-shirt & camicie", sales: 6 },
    ],
    "30d": [
      { label: "Felpe & maglieria", sales: 31 },
      { label: "Giacche & capispalla", sales: 24 },
      { label: "T-shirt & camicie", sales: 22 },
    ],
  },
  capi: {
    "7d": [
      { label: "Nike · Hoodie vintage", sales: 4 },
      { label: "Levi's · Giacca denim", sales: 3 },
      { label: "Dr. Martens · 1460", sales: 2 },
    ],
    "30d": [
      { label: "Stone Island · Bomber", sales: 8 },
      { label: "Nike · Hoodie vintage", sales: 6 },
      { label: "Levi's · Giacca denim", sales: 5 },
    ],
  },
};

export interface AgingItem {
  id: string;
  label: string;
  ageDays: number;
  baseCostCents: number;
  marketplace: Marketplace;
}

/** Mock temporaneo finché inventario non espone listedAt/availableAt e costo allocato. */
export const AGING_ITEMS: AgingItem[] = [
  { id: "aging-1", label: "Burberry · Trench", ageDays: 94, baseCostCents: 3800, marketplace: "vinted" },
  { id: "aging-2", label: "Barbour · Beaufort", ageDays: 72, baseCostCents: 3100, marketplace: "depop" },
  { id: "aging-3", label: "Levi's · 501 Jeans", ageDays: 58, baseCostCents: 2400, marketplace: "grailed" },
  { id: "aging-4", label: "Patagonia · Retro-X", ageDays: 51, baseCostCents: 2900, marketplace: "vinted" },
  { id: "aging-5", label: "Carhartt WIP · Detroit", ageDays: 47, baseCostCents: 2700, marketplace: "ebay" },
];

export const DEFAULT_WEEKLY_TARGET_CENTS = 320_000;
