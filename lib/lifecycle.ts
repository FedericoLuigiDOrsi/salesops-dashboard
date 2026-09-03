// Riconciliazione lifecycle: modello canonico (backend Databros, 11 stati) ↔ vista web (3 stati).
// Riferimento: services/backend/supabase/migrations/*catalog.sql (items.status) e
// *domain_tables.sql (listings.per_listing_status). Vedi MIGRATION.md §3.3.

import type { InventoryStatus, PlatformListingState } from "@/lib/inventory-mock";

// items.status canonico (CHECK nel DB): 11 stati del ciclo di vita BBA.
export type CanonicalItemStatus =
  | "draft"
  | "incomplete"
  | "confirmed"
  | "published"
  | "sold"
  | "finalized"
  | "disputed"
  | "returning"
  | "ready_for_pickup"
  | "returned"
  | "available";

// listings.per_listing_status canonico.
export type CanonicalListingStatus = "active" | "delisted" | "pending_manual" | "error";

// 11 → 4 stati vista (vocabolario CatalogEntryStatus, allineato al 01/08 col ri-sync
// da salesops-dashboard @7bc71ec). Rename 1:1, comportamento invariato rispetto alla
// mappatura a 3 stati precedente — vedi MIGRATION.md §5 per il dettaglio.
//  • draft/incomplete              → to_be_reviewed (non ancora a catalogo)
//  • confirmed/published/available → available      (vendibile)
//  • sold e post-vendita           → sold
export function statusToWeb(status: string): InventoryStatus {
  switch (status) {
    case "draft":
    case "incomplete":
      return "to_be_reviewed";
    case "confirmed":
    case "published":
    case "available":
      return "available";
    case "sold":
    case "finalized":
    case "disputed":
    case "returning":
    case "ready_for_pickup":
    case "returned":
      return "sold";
    default:
      return "to_be_reviewed";
  }
}

// per_listing_status → stato pillola piattaforma della vista.
export function listingStateToWeb(
  status: string | null | undefined
): PlatformListingState {
  switch (status) {
    case "active":
      return "active";
    case "pending_manual":
      return "pending";
    case "delisted":
      return "delisted";
    case "error":
      return "pending";
    default:
      return null;
  }
}
