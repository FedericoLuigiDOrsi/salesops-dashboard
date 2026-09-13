import type { Marketplace } from "@/types/maat";

// Il ritiro alla vendita, per ogni vendita nota.
//
// Brief: docs/technical/ooux/46-sketch-brief-ritiro-alla-vendita.md
//
// ── Perché un dato dedicato invece di un join ────────────────────────────────
// Nei mock convivono DUE vocabolari di SKU che non si sono mai incontrati:
// `activity-mock` (vendite) e `logistics-mock` (spedizioni) parlano `B-###`,
// mentre `inventory-mock` — e quindi `listings-mock`, che ne deriva — parla
// `ACN-23-0058`. Nessuna vista aveva mai avuto bisogno di entrambi, quindi
// nessuno se n'era accorto: questa è la prima.
//
// Unire i due vocabolari è la cosa giusta da fare, ma tocca mock condivisi da
// più schermate e non è il lavoro di questa view. Qui si fa come faceva il
// mockup che questa vista rimpiazza (`public/mobile/maat-shell-account.html`,
// dizionario `ARTICLES` con `soldOn` + `platforms`): un dato proprio, esplicito,
// invece di un join per etichetta che fallirebbe in silenzio.
//
// ⚠️ Debito dichiarato, non nascosto: finché i due vocabolari restano separati,
// questi esiti sono scritti a mano e non derivati dai `listings` reali.

/**
 * Cosa è successo a un annuncio quando il capo si è venduto altrove.
 *
 * `sold_here` non è un esito del ritiro: è l'annuncio che ha venduto, e sta
 * nella stessa lista perché il Seller ragiona per marketplace, non per ruolo
 * della riga.
 */
export type DelistOutcome = "sold_here" | "delisted" | "still_online" | "manual_required" | "error";

export interface DelistRow {
  marketplace: Marketplace;
  outcome: DelistOutcome;
  /** Quando il ritiro è avvenuto. `null` dove non è avvenuto o non si sa. */
  at: string | null;
  /** Perché serve una mano, o perché è fallito. Solo dove l'esito lo richiede. */
  detail: string | null;
}

export interface SaleDelistScene {
  /**
   * Il marketplace su cui è avvenuta la vendita.
   *
   * `null` è un caso reale, non di bordo: `sales.listing_id` è nullable nel
   * canonico, e per una vendita registrata fuori dai webhook (import manuale,
   * vendita diretta) non c'è modo di sapere dove sia avvenuta. La view lo dice
   * invece di indovinarlo.
   */
  soldOn: Marketplace | null;
  rows: DelistRow[];
}

function iso(hoursAgo: number) {
  const d = new Date();
  d.setHours(d.getHours() - hoursAgo, 0, 0, 0);
  return d.toISOString();
}

/**
 * Le scene, per SKU di vendita. La copertura è scelta perché la view sia
 * provabile in tutti i casi che il brief chiede, incluso quello in cui il
 * ritiro NON è andato a buon fine — che è il caso per cui la view esiste.
 */
export const saleScenes: Record<string, SaleDelistScene> = {
  // Il caso misto: uno ritirato, uno ancora online. È lo stato più comune
  // finché la regola non gira davvero.
  "B-091": {
    soldOn: "vinted",
    rows: [
      { marketplace: "vinted", outcome: "sold_here", at: iso(0), detail: null },
      { marketplace: "grailed", outcome: "delisted", at: iso(0), detail: null },
      { marketplace: "depop", outcome: "still_online", at: null, detail: null },
    ],
  },

  // Pubblicato su un solo marketplace: non c'era niente da ritirare. Non è uno
  // stato vuoto da riempire con un disegno, è una riga di testo.
  "B-090": {
    soldOn: "vinted",
    rows: [{ marketplace: "vinted", outcome: "sold_here", at: iso(3), detail: null }],
  },

  // Il caso che il canonico prevede e che l'interfaccia non ha mai ammesso:
  // su Vinted il ritiro passa dall'estensione nel browser dell'operatore,
  // quindi non avviene da solo. `delist_manual` esiste apposta.
  "B-097": {
    soldOn: "vestiaire",
    rows: [
      { marketplace: "vestiaire", outcome: "sold_here", at: iso(26), detail: null },
      { marketplace: "vinted", outcome: "manual_required", at: null,
        detail: "Su Vinted il ritiro si completa nell'estensione del browser: non avviene da solo." },
      { marketplace: "ebay", outcome: "delisted", at: iso(26), detail: null },
    ],
  },

  // Vendita senza marketplace noto — `listing_id` nullo nel canonico. Nessuna
  // riga può dirsi "venduto qui", e la view lo dichiara.
  "B-074": {
    soldOn: null,
    rows: [
      { marketplace: "depop", outcome: "still_online", at: null, detail: null },
      { marketplace: "grailed", outcome: "error", at: null,
        detail: "Grailed ha rifiutato la richiesta di ritiro." },
    ],
  },
};

export function sceneForSale(sku: string): SaleDelistScene | null {
  return saleScenes[sku] ?? null;
}
