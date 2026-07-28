// Config colonne inventario + identità/colori piattaforma.
// PlatformKey vive qui (non più dentro InventoryView) così store, pillole e
// tabella lo importano da un unico punto.
import type { Marketplace } from "@/types/maat";

export type PlatformKey = Extract<Marketplace, "vinted" | "grailed" | "depop">;
export const PLATFORM_KEYS: PlatformKey[] = ["vinted", "grailed", "depop"];

export type ColumnKey = "capo" | "stato" | "sku" | "categoria" | "taglia" | "prezzo" | "piattaforme";

export interface ColumnDef {
  key: ColumnKey;
  label: string;
  /** La colonna identità: sempre prima, mai nascosta/spostata, fuori dai preset. */
  pinned?: boolean;
}

export const COLUMN_DEFS: Record<ColumnKey, ColumnDef> = {
  capo: { key: "capo", label: "Capo", pinned: true },
  stato: { key: "stato", label: "Stato" },
  sku: { key: "sku", label: "SKU" },
  categoria: { key: "categoria", label: "Categoria" },
  taglia: { key: "taglia", label: "Taglia" },
  prezzo: { key: "prezzo", label: "Prezzo" },
  piattaforme: { key: "piattaforme", label: "Piattaforme" },
};

// Stato promosso in seconda posizione, subito dopo l'identità pinnata. Ordine
// allineato al design handoff "Riprogettazione tabelle inventario premium"
// (Capo·Stato·Categoria·Taglia·Canali·Prezzo); SKU non è nello spec, resta in coda.
export const DEFAULT_COLUMN_ORDER: ColumnKey[] = [
  "capo",
  "stato",
  "categoria",
  "taglia",
  "piattaforme",
  "prezzo",
  "sku",
];

// Tutte le colonne configurabili (mostra/nascondi/riordino) = default meno la pinnata.
export const CONFIGURABLE_COLUMNS: ColumnKey[] = DEFAULT_COLUMN_ORDER.filter(
  (k) => !COLUMN_DEFS[k].pinned
);

// ⚠️ Colori best-effort, NON ufficiali (fonti terze: mobbin, brandfetch).
// Da riprogettare/validare contro la palette calda/olive dell'app. Il valore
// semantico primario resta il pallino stato: il colore serve solo a identificare.
export const PLATFORM_BRAND: Record<PlatformKey, { color: string; initial: string }> = {
  vinted: { color: "#007782", initial: "V" },
  depop: { color: "#FF2300", initial: "D" },
  grailed: { color: "#404040", initial: "G" },
};
