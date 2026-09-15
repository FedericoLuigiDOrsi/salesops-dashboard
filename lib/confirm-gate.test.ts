import { describe, it, expect } from "vitest";
import { evaluateConfirmGate, isBlockingAttribute, REQUIRED_PHOTO_LABELS } from "@/lib/confirm-gate";
import { REQUIRED_ATTRS, REVIEW_ATTRIBUTES } from "@/lib/review-types";
import type { CatalogEntry, Photo } from "@/types/maat";

// Questi test esistono per una ragione precisa: la regola del gate era scritta
// a mano in due componenti, il 03/08 è stata corretta in uno solo, e per quattro
// settimane lo stesso capo si poteva confermare da una schermata e non
// dall'altra. Un test la blocca; un commento no.

const LABELS: Record<string, string> = Object.fromEntries(REVIEW_ATTRIBUTES.map((a) => [a.key, a.label]));

/** Attributi tutti pieni, tranne quelli passati in `empty`. Tipato, niente cast. */
function attrs(empty: readonly string[] = []): CatalogEntry["attributes"] {
  const out = {} as CatalogEntry["attributes"];
  for (const { key } of REVIEW_ATTRIBUTES) {
    out[key as keyof CatalogEntry["attributes"]] = empty.includes(key) ? "" : "x";
  }
  return out;
}

function photo(label: string, state: Photo["state"] = "validated"): Photo {
  return { id: `p-${label}`, label: label as Photo["label"], url: null, photoType: "standard", state, createdAt: "" };
}

function entry(over: Partial<CatalogEntry> = {}): CatalogEntry {
  return {
    id: "e1",
    sku: null,
    status: "to_be_reviewed",
    attributes: attrs(),
    measures: {},
    photos: REQUIRED_PHOTO_LABELS.map((l) => photo(l.key)),
    accountId: "a1",
    createdAt: "",
    purchasePriceCents: null,
    suggestedSalePriceCents: null,
    ...over,
  } as CatalogEntry;
}

describe("evaluateConfirmGate", () => {
  it("passa con le tre foto validate e i quattro attributi bloccanti pieni", () => {
    expect(evaluateConfirmGate(entry(), LABELS)).toEqual({ enabled: true, missingLabels: [] });
  });

  it("NON blocca sui sei attributi consigliati, che il canonico accetta vuoti", () => {
    const optional = REVIEW_ATTRIBUTES.map((a) => a.key).filter((k) => !REQUIRED_ATTRS.includes(k));
    expect(optional).toHaveLength(6);

    const r = evaluateConfirmGate(entry({ attributes: attrs(optional) }), LABELS);

    // È la regressione esatta che CatalogEntryDetail aveva: pretendeva tutti e dieci.
    expect(r.enabled).toBe(true);
    expect(r.missingLabels).toEqual([]);
  });

  it("blocca su ognuno dei quattro attributi obbligatori, uno alla volta", () => {
    for (const key of REQUIRED_ATTRS) {
      const r = evaluateConfirmGate(entry({ attributes: attrs([key]) }), LABELS);
      expect(r.enabled, `${key} doveva bloccare`).toBe(false);
      expect(r.missingLabels).toContain(LABELS[key]);
    }
  });

  it("blocca se una foto obbligatoria manca o non è validata", () => {
    const senzaRetro = entry({ photos: [photo("fronte"), photo("brand")] });
    expect(evaluateConfirmGate(senzaRetro, LABELS).missingLabels).toContain("Retro");

    const retroRifiutata = entry({ photos: [photo("fronte"), photo("retro", "rejected"), photo("brand")] });
    expect(evaluateConfirmGate(retroRifiutata, LABELS).missingLabels).toContain("Retro");
  });

  it("elenca le foto prima degli attributi, ed è l'ordine che legge l'utente", () => {
    const r = evaluateConfirmGate(entry({ photos: [photo("fronte")], attributes: attrs(["brand"]) }), LABELS);
    expect(r.missingLabels).toEqual(["Retro", "Brand", LABELS.brand]);
  });
});

describe("isBlockingAttribute", () => {
  it("riconosce i quattro, e solo quelli", () => {
    for (const k of REQUIRED_ATTRS) expect(isBlockingAttribute(k)).toBe(true);
    for (const k of ["colore", "materiale", "genere", "difetti", "stile", "stagionalita"]) {
      expect(isBlockingAttribute(k), `${k} non deve bloccare`).toBe(false);
    }
  });
});

describe("il contratto con il database", () => {
  it("gli obbligatori restano quattro: se cambiano, si cambia PRIMA la migrazione", () => {
    // Il trigger items_status_guard (_sql/28) pretende esattamente questi.
    expect([...REQUIRED_ATTRS].sort()).toEqual(["brand", "condizioni", "taglia", "tipoCapo"]);
  });

  it("le foto obbligatorie restano tre", () => {
    expect(REQUIRED_PHOTO_LABELS.map((l) => l.key)).toEqual(["fronte", "retro", "brand"]);
  });
});
