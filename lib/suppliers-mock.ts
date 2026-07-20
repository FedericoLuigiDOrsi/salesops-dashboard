import type { Supplier } from "@/types/maat";

export const suppliers: Supplier[] = [
  { id: "sup-1", name: "Grossista Prato", loadsCount: 12, pieces: 0, kg: 640, updatedAt: "15 lug" },
  { id: "sup-2", name: "Stock Milano", loadsCount: 8, pieces: 1240, kg: 0, updatedAt: "9 lug" },
  { id: "sup-3", name: "Riciclo Tessile Sud", loadsCount: 5, pieces: 0, kg: 380, updatedAt: "2 lug" },
  { id: "sup-4", name: "Vintage Wholesale NL", loadsCount: 3, pieces: 210, kg: 120, updatedAt: "28 giu" },
];

export const CARICO_CATEGORIES = [
  "Mista (categorie assortite)",
  "Giacche & capispalla",
  "Felpe & maglieria",
  "Denim",
  "Sneakers & scarpe",
  "T-shirt & camicie",
  "Accessori",
] as const;
