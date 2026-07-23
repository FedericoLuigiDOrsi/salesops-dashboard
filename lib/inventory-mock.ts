// Inventario unificato — catalogo capi + stato di pubblicazione per piattaforma
// in un'unica vista. Sostituisce il precedente inventory-mock (solo listing).

import { placeholderPhoto } from "@/lib/placeholder-photo";
import type { CatalogEntryStatus } from "@/types/maat";

/** Stesso vocabolario di stato del catalogo capi (StatusBadge) — una sola fonte di verità. */
export type InventoryStatus = CatalogEntryStatus;

/** Stato di un annuncio su una singola piattaforma. null = mai pubblicato lì. */
export type PlatformListingState = "active" | "pending" | "delisted" | "sold" | null;

export interface InventoryItem {
  id: string;
  brand: string;
  tipoCapo: string;
  sku: string;
  category: string;
  size: string;
  priceCents: number;
  status: InventoryStatus;
  /** Foto fronte. null = non ancora scattata (es. bozze). */
  photoUrl: string | null;
  platforms: {
    vinted: PlatformListingState;
    grailed: PlatformListingState;
    depop: PlatformListingState;
  };
}

export const inventoryItems: InventoryItem[] = [
  {
    id: "inv-01",
    brand: "Stone Island",
    tipoCapo: "Overshirt Ghost",
    sku: "STI-24-0182",
    category: "Giacche",
    size: "L",
    priceCents: 14500,
    status: "available",
    photoUrl: placeholderPhoto("inv-01", "Stone Island"),
    platforms: { vinted: "active", grailed: "active", depop: "pending" },
  },
  {
    id: "inv-02",
    brand: "Burberry",
    tipoCapo: "Trench Kensington",
    sku: "BBR-23-0044",
    category: "Capospalla",
    size: "M",
    priceCents: 32000,
    status: "available",
    photoUrl: placeholderPhoto("inv-02", "Burberry"),
    platforms: { vinted: "active", grailed: "pending", depop: null },
  },
  {
    id: "inv-03",
    brand: "The North Face",
    tipoCapo: "Piumino Nuptse 700",
    sku: "TNF-22-0311",
    category: "Capospalla",
    size: "XL",
    priceCents: 18000,
    status: "to_be_reviewed",
    photoUrl: null,
    platforms: { vinted: null, grailed: null, depop: null },
  },
  {
    id: "inv-04",
    brand: "Nike",
    tipoCapo: "Windrunner",
    sku: "NKE-24-0097",
    category: "Giacche",
    size: "L",
    priceCents: 6500,
    status: "available",
    photoUrl: placeholderPhoto("inv-04", "Nike"),
    platforms: { vinted: "active", grailed: null, depop: "active" },
  },
  {
    id: "inv-05",
    brand: "Acne Studios",
    tipoCapo: "Maglione lana merino",
    sku: "ACN-23-0058",
    category: "Maglieria",
    size: "S",
    priceCents: 9500,
    status: "to_be_reviewed",
    photoUrl: null,
    platforms: { vinted: null, grailed: null, depop: null },
  },
  {
    id: "inv-06",
    brand: "Levi's",
    tipoCapo: "501 Original",
    sku: "LVS-21-0203",
    category: "Pantaloni",
    size: "W32",
    priceCents: 4500,
    status: "sold",
    photoUrl: placeholderPhoto("inv-06", "Levi's"),
    platforms: { vinted: "sold", grailed: "delisted", depop: "delisted" },
  },
  {
    id: "inv-07",
    brand: "Dr. Martens",
    tipoCapo: "1460 Pelle",
    sku: "DRM-24-0129",
    category: "Scarpe",
    size: "42",
    priceCents: 11000,
    status: "available",
    photoUrl: placeholderPhoto("inv-07", "Dr. Martens"),
    platforms: { vinted: "active", grailed: "active", depop: "active" },
  },
  {
    id: "inv-08",
    brand: "Adidas",
    tipoCapo: "Track Top Firebird",
    sku: "ADI-23-0071",
    category: "Giacche",
    size: "M",
    priceCents: 3800,
    status: "available",
    photoUrl: placeholderPhoto("inv-08", "Adidas"),
    platforms: { vinted: "pending", grailed: null, depop: "active" },
  },
  {
    id: "inv-09",
    brand: "Prada",
    tipoCapo: "Camicia seta",
    sku: "PRD-22-0016",
    category: "Camicie",
    size: "S",
    priceCents: 21000,
    status: "to_be_reviewed",
    photoUrl: null,
    platforms: { vinted: null, grailed: null, depop: null },
  },
  {
    id: "inv-10",
    brand: "Ralph Lauren",
    tipoCapo: "Polo Custom Fit",
    sku: "RLR-24-0154",
    category: "Camicie",
    size: "L",
    priceCents: 4200,
    status: "sold",
    photoUrl: placeholderPhoto("inv-10", "Ralph Lauren"),
    platforms: { vinted: "delisted", grailed: "sold", depop: "delisted" },
  },
  {
    id: "inv-11",
    brand: "Carhartt WIP",
    tipoCapo: "Detroit Jacket",
    sku: "CHT-23-0088",
    category: "Giacche",
    size: "XL",
    priceCents: 8800,
    status: "available",
    photoUrl: placeholderPhoto("inv-11", "Carhartt WIP"),
    platforms: { vinted: "active", grailed: "pending", depop: null },
  },
  {
    id: "inv-12",
    brand: "Patagonia",
    tipoCapo: "Retro-X Fleece",
    sku: "PTG-22-0037",
    category: "Maglieria",
    size: "M",
    priceCents: 13000,
    status: "available",
    photoUrl: placeholderPhoto("inv-12", "Patagonia"),
    platforms: { vinted: "active", grailed: "active", depop: "delisted" },
  },
  {
    id: "inv-13",
    brand: "Burberry",
    tipoCapo: "Sciarpa check",
    sku: "BBR-21-0009",
    category: "Accessori",
    size: "Unica",
    priceCents: 7500,
    status: "sold",
    photoUrl: placeholderPhoto("inv-13", "Burberry"),
    platforms: { vinted: "delisted", grailed: "delisted", depop: "sold" },
  },
  {
    id: "inv-14",
    brand: "Nike",
    tipoCapo: "Air Force 1 '07",
    sku: "NKE-24-0142",
    category: "Scarpe",
    size: "42",
    priceCents: 5500,
    status: "to_be_reviewed",
    photoUrl: null,
    platforms: { vinted: null, grailed: null, depop: null },
  },
  {
    id: "inv-15",
    brand: "Stone Island",
    tipoCapo: "Cargo Pants Garment Dyed",
    sku: "STI-24-0201",
    category: "Pantaloni",
    size: "42",
    priceCents: 16500,
    status: "available",
    photoUrl: placeholderPhoto("inv-15", "Stone Island"),
    platforms: { vinted: "active", grailed: null, depop: null },
  },
];
