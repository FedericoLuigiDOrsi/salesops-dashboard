export type CatalogEntryStatus = "local_draft" | "to_be_reviewed" | "available" | "sold";

export type PhotoLabel = "fronte" | "retro" | "brand" | "taglia" | "materiale" | "difetti" | "extra" | "aruco";
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
  purchasePriceCents: number | null;
  suggestedSalePriceCents: number | null;
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

/**
 * I cinque marketplace, in ordine di rilevanza commerciale.
 *
 * Serve dove l'elenco va percorso e non solo indicizzato. `PLATFORM_KEYS`
 * (lib/inventory-columns) ne copre solo tre ed è legato alle colonne della
 * tabella inventario: non è la lista dei marketplace, è la lista delle colonne
 * che oggi esistono. Usare quella per iterare sui marketplace è lo stesso
 * errore che teneva MarketplaceBadge fermo a tre su cinque.
 */
export const MARKETPLACES: Marketplace[] = ["vinted", "depop", "grailed", "vestiaire", "ebay"];

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

// Pipeline di fulfillment (board Kanban Logistica): da_fare/fatti precedono la
// spedizione vera e propria, spediti/consegnati la seguono.
// ---------------------------------------------------------------------------
// Listing — l'annuncio di un capo su UN marketplace.
//
// È l'oggetto che l'OOUX Round 1 delle aree operative ha trovato MANCANTE:
// Pubblicazione era una vista filtrata di Catalog Entry, e `publishing-mock.ts`
// esportava sei funzioni e zero tipi. Ma un capo su tre marketplace ha TRE
// annunci, con prezzo e stato indipendenti.
//
// Spec: docs/technical/ooux/10-object-guide-listing-shipment.md (Fase 2),
// contratto dati in 09-mcsfd-aree-operative.md (Fase 1).

/**
 * Stato di UN annuncio, non del capo. Il capo diventa `sold`, l'annuncio no:
 * è la divergenza che la Fase 3 ha trovato in ChannelDots, dove `sold` era
 * usato come stato per-listing.
 */
export type ListingStatus = "active" | "pending_manual" | "error" | "delisted";

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  active: "Online",
  pending_manual: "In corso",
  error: "Errore",
  delisted: "Ritirato",
};

export interface Listing {
  id: string;
  /** Il capo di cui questo è l'annuncio. Il Listing non ha un nome proprio. */
  itemId: string;
  itemLabel: string;
  sku: string;
  marketplace: Marketplace;
  status: ListingStatus;
  priceCents: number;
  negotiable: boolean;
  /** Null finché non è mai stato pubblicato davvero. */
  externalUrl: string | null;
  publishedAt: string | null;
  delistedAt: string | null;
  /** Popolato solo su `status: "error"`. Null = la piattaforma non ha detto perché. */
  errorReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Fulfillment event — una riga dello storico di una spedizione.
//
// `carrier`, `trackingCode` ed `expectedDeliveryAt` sono PER EVENTO, non per
// spedizione: un valore diverso per riga è possibile e non è un errore di dati
// (verificato sullo schema per il brief 14).
//
// Il destinatario NON sta qui: è PII e vive in `personal_data`. Lo Shipment
// Detail mostra la città, non nome e indirizzo — quelli restano a
// ShippingLabelDialog.

export type FulfillmentStage = "packing" | "ready" | "shipped" | "in_transit" | "delivered";

export const FULFILLMENT_STAGE_LABELS: Record<FulfillmentStage, string> = {
  packing: "In preparazione",
  ready: "Pronto al ritiro",
  shipped: "Spedito",
  in_transit: "In transito",
  delivered: "Consegnato",
};

export interface FulfillmentEvent {
  id: string;
  shipmentId: string;
  stage: FulfillmentStage;
  occurredAt: string;
  carrier: string | null;
  trackingCode: string | null;
  expectedDeliveryAt: string | null;
  note: string | null;
}

// ---------------------------------------------------------------------------
// Marketplace Account — il collegamento autorizzato fra il tenant e UN
// marketplace esterno. Non riguarda un capo: è l'infrastruttura che rende un
// intero marketplace utilizzabile. Un tenant ne ha al più uno per marketplace,
// cinque in tutto, e zero è lo stato iniziale di ogni tenant nuovo.
//
// `secret_ref` del canonico NON compare qui, di proposito: punta a un secret nel
// vault e non deve mai raggiungere il client, nemmeno come riferimento.
//
// Object Guide: docs/technical/ooux/17-object-guide-marketplace-account.md

export type MarketplaceAccountStatus = "active" | "inactive" | "error";

export const MARKETPLACE_ACCOUNT_STATUS_LABELS: Record<MarketplaceAccountStatus, string> = {
  active: "Collegato",
  inactive: "Scollegato",
  error: "Errore",
};

export interface MarketplaceAccount {
  id: string;
  marketplace: Marketplace;
  status: MarketplaceAccountStatus;
  connectedAt: string | null;
  /** Quando il collegamento è stato verificato l'ultima volta. */
  checkedAt: string | null;
  /**
   * Perché è rotto, quando lo è. Non è nel canonico: è messaggistica.
   * `error` e `inactive` bloccano la pubblicazione allo stesso modo — la
   * differenza è solo in cosa si dice all'utente, non nel comportamento.
   */
  errorReason: string | null;
}

export type ShipmentStatus = "da_fare" | "fatti" | "spediti" | "consegnati";

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  da_fare: "Da fare",
  fatti: "Fatti",
  spediti: "Spediti",
  consegnati: "Consegnati",
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
  hoursAgo: number; // da quando la vendita è entrata in pipeline
  priceCents: number;
  destinationCity: { name: string; lat: number; lng: number };
}

// ---------------------------------------------------------------------------
// Attività (offerte + vendite) — condivise tra Home (card offerte/vendite) e
// Notifiche v2 (gruppi Vendite/Offerte + popup controfferta + anteprima).
// Importi in centesimi. `time` è copy relativo; `receivedAt` è la sorgente
// stabile per ordinamento e logiche temporali.
// ---------------------------------------------------------------------------

export type OfferStatus = "pending" | "accepted" | "rejected" | "counter";

export interface Offer {
  id: string;
  itemLabel: string; // "Burberry · Trench"
  sku: string;
  marketplace: Marketplace;
  offerCents: number; // prezzo offerto dall'acquirente
  listPriceCents: number; // prezzo di listino
  time: string; // "1 h"
  receivedAt: string; // ISO 8601, usato per ordinare senza interpretare il copy localizzato
  status: OfferStatus;
  counterCents?: number; // controfferta inviata dal venditore, se status === "counter"
  photoUrl?: string | null; // placeholder oggi; immagine reale in futuro
  listingUrl?: string | null; // URL annuncio sul marketplace
}

// ─── Azioni verso le piattaforme (registro) ───────────────────────────────
// Nomi e stati ricalcano `marketplace_actions` del Blocco 6
// (services/backend/RICHIESTA-2026-08-03-blocco-6-decisioni-consolidate.md §2.2).
// `cancelled` è nostro: il Blocco 6 non prevede l'annullamento.

export type MarketplaceActionKind =
  | "publish"
  | "draft"
  | "hide"
  | "unhide"
  | "delist"
  | "offer_accept"
  | "offer_reject"
  | "offer_counter"
  | "thread_reply"
  | "like_outreach";

export type MarketplaceActionState =
  | "pending"
  | "composing"
  | "submitting"
  | "throttled"
  | "awaiting_challenge"
  | "done"
  | "failed"
  | "needs_reauth"
  | "cancelled";

export type ActionPriorityClass = "conversation" | "like" | "listing";

export interface ActionTarget {
  type: "offer" | "thread" | "listing" | "item" | "liker";
  id: string;
}

export interface MarketplaceAction {
  id: string;
  kind: MarketplaceActionKind;
  marketplace: Marketplace;
  target: ActionTarget;
  payload?: { counterCents?: number; replyBody?: string };
  state: MarketplaceActionState;
  priority: ActionPriorityClass;
  /** epoch ms: l'adattatore verso il backend converte le date. */
  createdAt: number;
  updatedAt: number;
  /** Quando l'azione può essere presa dall'estensione. */
  nextActionAt: number;
  attempts: number;
  lastError?: string;
}

export interface Sale {
  id: string;
  itemLabel: string;
  sku: string;
  marketplace: Marketplace;
  priceCents: number;
  time: string; // "12 min"
  photoUrl?: string | null;
  listingUrl?: string | null;
}
