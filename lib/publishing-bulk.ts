export type BulkPriceMode = "percent" | "amount";

/** signedValue porta già il segno: -10 = "-10%" o "-10€" a seconda di mode. */
export function applyBulkPriceDelta(priceCents: number, mode: BulkPriceMode, signedValue: number): number {
  const deltaCents = mode === "percent" ? Math.round((priceCents * signedValue) / 100) : Math.round(signedValue * 100);
  return Math.max(0, priceCents + deltaCents);
}

export interface BulkPricePreviewRow {
  id: string;
  beforeCents: number;
  afterCents: number;
}

export function buildBulkPricePreview(
  items: { id: string; priceCents: number }[],
  mode: BulkPriceMode,
  signedValue: number
): BulkPricePreviewRow[] {
  return items.map((item) => ({
    id: item.id,
    beforeCents: item.priceCents,
    afterCents: applyBulkPriceDelta(item.priceCents, mode, signedValue),
  }));
}
