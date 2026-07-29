import type { InventoryItem } from "./inventory-mock";

export function isReadyToPublish(item: InventoryItem): boolean {
  return item.status === "available" && Object.values(item.platforms).every((v) => v === null);
}

export function isLive(item: InventoryItem): boolean {
  return Object.values(item.platforms).some((v) => v !== null);
}

/** Venduto su tutte le piattaforme su cui è mai stato listato (nessuna active/pending/delisted residua). */
export function isSoldOutEverywhere(item: InventoryItem): boolean {
  const listed = Object.values(item.platforms).filter((v) => v !== null);
  return listed.length > 0 && listed.every((v) => v === "sold");
}

export function getToPublishItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter(isReadyToPublish);
}

export function getLiveItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter(isLive);
}

export function getDraftCount(items: InventoryItem[]): number {
  return items.filter((item) => item.status === "to_be_reviewed").length;
}
