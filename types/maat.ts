export type CatalogEntryStatus = "local_draft" | "to_be_reviewed" | "available";

export type PhotoLabel = "fronte" | "retro" | "brand" | "taglia" | "materiale" | "extra";
export type PhotoState = "captured" | "processing" | "validated" | "rejected";
export type PhotoType = "standard" | "aruco";

export interface Photo {
  id: string;
  label: PhotoLabel;
  url: string | null;
  photoType: PhotoType;
  state: PhotoState;
  qualityScore?: number;
  qualityFlags?: string[];
  createdAt: string;
}

// 10 attributi AI-compilati. Stringa vuota "" = campo mancante (da compilare in Review).
export interface CatalogEntryAttributes {
  brand: string;
  tipoCapo: string;
  colore: string;
  taglia: string;
  materiale: string;
  genere: string;
  condizioni: string;
  difetti: string;
  stile: string;
  stagionalita: string;
}

// Le misure non sono un set fisso: dipendono dalla categoria del capo
// (derivata da tipoCapo, vedi lib/measures.ts) e sono calcolate dalla foto
// reference con marker ArUco, non compilate manualmente.
export type MeasureCategory = "top" | "bottom" | "gonna" | "abito";
export type CatalogEntryMeasures = Partial<Record<string, number>>;

export interface CatalogEntry {
  id: string;
  sku: string | null;
  status: CatalogEntryStatus;
  attributes: CatalogEntryAttributes;
  measures: CatalogEntryMeasures;
  photos: Photo[];
  accountId: string;
  createdAt: string;
}

export interface UserProfile {
  nome: string;
  email: string;
  ruolo: "Admin" | "Operator";
  iniziali: string;
  avatarUrl: string | null;
}

export type BrandTone = "diretto" | "caldo" | "professionale" | "streetwise";
export type PhotoAesthetic = "pulita" | "editoriale" | "street" | "vintage";

// Profilo brand del reseller (tenant): alimenta il tono del copy e lo stile
// delle foto suggerito dall'AI in fase di catalogazione.
export interface TenantBrand {
  nomeNegozio: string;
  tono: BrandTone;
  estetica: PhotoAesthetic;
  bio: string;
}

export type NotificationType = "draft_ready" | "local_save";

export interface Notification {
  id: string;
  tipo: NotificationType;
  messaggio: string;
  timestamp: string;
  letta: boolean;
  catalogEntryId: string;
}

// ---------------------------------------------------------------------------
// Contabilità / Logistica / Fornitori — schema minimo informato dal target
// Supabase (vedi Reference/research/maat/maat-airtable-database-fields.md,
// cluster C11/C12). Importi in centesimi, coerente col target *_cents.
// ---------------------------------------------------------------------------

export type Marketplace = "vinted" | "depop" | "grailed" | "vestiaire" | "ebay";

export const MARKETPLACE_LABELS: Record<Marketplace, string> = {
  vinted: "Vinted",
  depop: "Depop",
  grailed: "Grailed",
  vestiaire: "Vestiaire",
  ebay: "eBay",
};

export type AccountingEntryType = "sale" | "return" | "expense" | "refund";
export type AccountingEntryStatus = "confirmed" | "escrow" | "pending";

export interface AccountingEntry {
  id: string;
  eventDate: string; // ISO date
  itemLabel: string;
  category: string;
  marketplace: Marketplace;
  entryType: AccountingEntryType;
  status: AccountingEntryStatus;
  grossAmountCents: number;
  platformFeeCents: number;
  shippingCostCents: number;
  netAmountCents: number;
}

export interface WeeklyRevenuePoint {
  weekLabel: string;
  revenueCents: number;
  unitsSold: number;
  current?: boolean;
}

export interface PlatformShare {
  marketplace: Marketplace;
  revenueCents: number;
  sales: number;
}

export interface CategoryShare {
  category: string;
  revenueCents: number;
  units: number;
}

export type LotType = "pezzo" | "ingrosso";
export type LotAllocationMethod = "uniform" | "weight_based" | "manual";

export interface Supplier {
  id: string;
  name: string;
  loadsCount: number;
  pieces: number;
  kg: number;
  updatedAt: string;
}

export interface Lot {
  id: string;
  code: string;
  name?: string; // etichetta libera del carico; se assente si mostra `code` (es. CAR-0142)
  supplierName: string;
  acquiredAt: string; // ISO date
  executedAt: string; // ISO date — "Data di esecuzione" nel dialog Registra carico
  type: LotType;
  quantity: number;
  category: string;
  allocationMethod: LotAllocationMethod;
  totalCostCents: number | null; // costo di ripartizione per capo, non raccolto nel dialog, opzionale
  pricePaidCents?: number | null; // "Prezzo pagato" al fornitore per l'intero carico, facoltativo nel dialog
}

export type ShipmentStatus = "shipped" | "in_transit" | "out_for_delivery";

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  shipped: "Spedita",
  in_transit: "In transito",
  out_for_delivery: "In consegna",
};

export interface Shipment {
  id: string;
  itemLabel: string;
  sku: string;
  marketplace: Marketplace;
  carrier: string;
  trackingCode: string;
  recipient: string;
  status: ShipmentStatus;
  shippedAt: string; // "14 lug"
  expectedDeliveryAt: string; // "18 lug"
  priceCents: number;
}
