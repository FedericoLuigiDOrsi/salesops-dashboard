import { REQUIRED_ATTRS, type ReviewAttrKey } from "@/lib/review-types";
import type { CatalogEntry } from "@/types/maat";

// Il gate di conferma, in un posto solo.
//
// La regola vive nel database: il trigger `items_status_guard`
// (services/backend/_sql/28) pretende almeno 3 foto validate E i quattro
// attributi bloccanti. Qui non la ridefiniamo, la leggiamo da REQUIRED_ATTRS
// in review-types.ts, che è lo stesso set che usa il percorso Review reale.
//
// Perché esiste questo file: la regola era scritta a mano in DUE componenti,
// e il 03/08 è stata corretta in uno solo. Risultato, fino al 02/09:
// ReviewForm chiedeva 4 attributi e CatalogEntryDetail ancora tutti e 10, così
// lo stesso capo si poteva confermare da una schermata e non dall'altra.
// Finché la regola sta in due posti, torna a divergere.
//
// Se l'insieme cambia, si cambia PRIMA la migrazione e poi questo file.

/** Le tre foto senza cui il canonico rifiuta la conferma. */
export const REQUIRED_PHOTO_LABELS = [
  { key: "fronte", text: "Fronte" },
  { key: "retro", text: "Retro" },
  { key: "brand", text: "Brand" },
] as const;

export interface GateResult {
  /** true quando il canonico accetterebbe il confirm. */
  enabled: boolean;
  /** Etichette leggibili di ciò che manca, foto per prime. Vuoto se enabled. */
  missingLabels: string[];
}

/**
 * Valuta il gate sulla forma dati del prototipo (`CatalogEntry`).
 *
 * `attributeLabels` serve solo a rendere leggibile il messaggio "Mancano: …":
 * la decisione su COSA blocca non passa da lì, passa da REQUIRED_ATTRS.
 */
export function evaluateConfirmGate(
  entry: CatalogEntry,
  attributeLabels: Record<string, string>
): GateResult {
  const missingPhotos = REQUIRED_PHOTO_LABELS.filter(({ key }) => {
    const photo = entry.photos.find((p) => p.label === key);
    return !photo || photo.state !== "validated";
  }).map((l) => l.text);

  const missingAttrs = REQUIRED_ATTRS.filter(
    (key) => entry.attributes[key as keyof CatalogEntry["attributes"]] === ""
  ).map((key) => attributeLabels[key] ?? key);

  const missingLabels = [...missingPhotos, ...missingAttrs];
  return { enabled: missingLabels.length === 0, missingLabels };
}

/** true se l'attributo blocca la conferma. Per distinguere obbligatori da consigliati in UI. */
export function isBlockingAttribute(key: string): key is ReviewAttrKey {
  return (REQUIRED_ATTRS as readonly string[]).includes(key);
}
