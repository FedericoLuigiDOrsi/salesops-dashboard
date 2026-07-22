import type { InventoryItem, InventoryStatus } from "@/lib/inventory-mock";
import type { PlatformKey } from "@/lib/inventory-columns";

export type ViewMode = "table" | "grid";
export type StatusFilter = "all" | InventoryStatus;
export type PriceBand = "all" | "lt50" | "50-100" | "100-200" | "gt200";
export type PlatformFilter = "all" | PlatformKey;

export const CATEGORY_OPTIONS = [
  "Capospalla",
  "Giacche",
  "Pantaloni",
  "Camicie",
  "Maglieria",
  "Scarpe",
  "Accessori",
] as const;

export const SIZE_OPTIONS = ["S", "M", "L", "XL", "W32", "42", "Unica"] as const;

export const PRICE_OPTIONS: { value: PriceBand; label: string }[] = [
  { value: "all", label: "Tutti" },
  { value: "lt50", label: "< 50 €" },
  { value: "50-100", label: "50–100 €" },
  { value: "100-200", label: "100–200 €" },
  { value: "gt200", label: "> 200 €" },
];

export const STATUS_SEGMENTS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tutti" },
  { value: "bozza", label: "Bozze" },
  { value: "catalogo", label: "A catalogo" },
  { value: "venduto", label: "Venduti" },
];

export const STATUS_LABEL: Record<InventoryStatus, string> = {
  bozza: "Bozza",
  catalogo: "A catalogo",
  venduto: "Venduto",
};

export const STATUS_CLASS: Record<InventoryStatus, string> = {
  bozza: "border-transparent bg-primary/20 text-[#7a7000]",
  catalogo: "border-transparent bg-[color-mix(in_oklab,var(--chart-2)_16%,transparent)] text-[var(--chart-2)]",
  venduto: "border-transparent bg-muted text-muted-foreground",
};

export function matchesPrice(cents: number, band: PriceBand) {
  const eur = cents / 100;
  switch (band) {
    case "lt50":
      return eur < 50;
    case "50-100":
      return eur >= 50 && eur <= 100;
    case "100-200":
      return eur > 100 && eur <= 200;
    case "gt200":
      return eur > 200;
    default:
      return true;
  }
}

export function matchesBase(
  item: InventoryItem,
  filters: { search: string; category: string; size: string; price: PriceBand; platform: PlatformFilter }
) {
  const { search, category, size, price, platform } = filters;
  if (search) {
    const needle = search.trim().toLowerCase();
    const haystack = `${item.brand} ${item.tipoCapo} ${item.sku}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  if (category !== "all" && item.category !== category) return false;
  if (size !== "all" && item.size !== size) return false;
  if (!matchesPrice(item.priceCents, price)) return false;
  if (platform !== "all" && item.platforms[platform] === null) return false;
  return true;
}
