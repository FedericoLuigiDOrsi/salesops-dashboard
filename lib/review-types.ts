// Tipi/costanti condivisi Review — modulo NEUTRO (no "server-only"): importabile
// sia dal data-access server (review-data.ts) sia dai componenti client (ReviewPanel).

export const REVIEW_ATTRIBUTES = [
  { key: "brand", label: "Brand" },
  { key: "tipoCapo", label: "Tipo di capo" },
  { key: "colore", label: "Colore" },
  { key: "taglia", label: "Taglia" },
  { key: "materiale", label: "Materiale" },
  { key: "genere", label: "Genere" },
  { key: "condizioni", label: "Condizioni" },
  { key: "difetti", label: "Difetti" },
  { key: "stile", label: "Stile" },
  { key: "stagionalita", label: "Stagionalità" },
] as const;

export type ReviewAttrKey = (typeof REVIEW_ATTRIBUTES)[number]["key"];

/** Etichette leggibili per attributo, derivate da REVIEW_ATTRIBUTES — un solo posto, non duplicarle di nuovo. */
export const ATTRIBUTE_LABELS: Record<ReviewAttrKey, string> = Object.fromEntries(
  REVIEW_ATTRIBUTES.map((a) => [a.key, a.label])
) as Record<ReviewAttrKey, string>;

// Set minimo obbligatorio pre-confirm (TBD-10 Federico: da confermare). Gate = AND(campi + foto).
export const REQUIRED_ATTRS: ReviewAttrKey[] = ["brand", "tipoCapo", "taglia", "condizioni"];
export const MIN_PHOTOS = 3;

export interface ReviewPhoto {
  id: string;
  url: string | null; // signed URL R2; null se non firmabile → placeholder
  role: string;
  position: number;
}

export interface ReviewDraft {
  id: string;
  catalogRef: string | null;
  status: string;
  attributes: Record<ReviewAttrKey, string>;
  confidence: Record<string, unknown> | null; // per-campo, dall'ultima ai_extraction
  aiHasRun: boolean;
  photos: ReviewPhoto[];
  photoCount: number;
  missingRequired: ReviewAttrKey[];
  canConfirm: boolean;
}

export type ConfirmResult = { ok: true; status: string } | { ok: false; error: string };
