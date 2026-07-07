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

export type NotificationType = "draft_ready" | "local_save";

export interface Notification {
  id: string;
  tipo: NotificationType;
  messaggio: string;
  timestamp: string;
  letta: boolean;
  catalogEntryId: string;
}
