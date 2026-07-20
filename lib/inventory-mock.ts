export type ListingStatus = "active" | "pending" | "delisted";

export interface InventoryListingRow {
  catalogEntryId: string;
  vinted: ListingStatus | null;
  grailed: ListingStatus | null;
  depop: ListingStatus | null;
  fulfillment: string | null;
}

/** Stato di pubblicazione per piattaforma — solo per i capi già "available". */
export const inventoryListings: InventoryListingRow[] = [
  { catalogEntryId: "b-08", vinted: "active", grailed: "active", depop: "delisted", fulfillment: null },
  { catalogEntryId: "b-06", vinted: "active", grailed: "pending", depop: "active", fulfillment: "In transito" },
];
