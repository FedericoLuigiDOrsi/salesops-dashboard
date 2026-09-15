import { describe, expect, it } from "vitest";
import {
  saleScenes,
  sceneForSale,
  daRitirareRows,
  delistTargetId,
  displayOutcome,
  type DelistOutcome,
  type DelistRow,
} from "@/lib/sale-detail-mock";
import type { MarketplaceAction } from "@/types/maat";
import { DELIST_OUTCOME_PILL } from "@/components/maat/DelistOutcomeBadge";
import { sales } from "@/lib/activity-mock";

describe("saleScenes", () => {
  // La view esiste per il caso in cui il ritiro NON è andato a buon fine.
  // Senza almeno un «ancora online», un «a mano» e un «errore» non è provabile
  // proprio dove serve di più.
  it("copre tutti gli esiti, non solo quello buono", () => {
    const esiti = new Set(Object.values(saleScenes).flatMap((s) => s.rows.map((r) => r.outcome)));
    for (const atteso of ["sold_here", "delisted", "still_online", "manual_required", "error"]) {
      expect(esiti, `manca l'esito ${atteso}`).toContain(atteso);
    }
  });

  it("ha al più un «venduto qui» per vendita, e solo dove il marketplace è noto", () => {
    for (const [sku, scene] of Object.entries(saleScenes)) {
      const venduti = scene.rows.filter((r) => r.outcome === "sold_here");
      expect(venduti.length, `${sku}: più di un annuncio non può aver venduto`).toBeLessThanOrEqual(1);
      if (venduti.length === 1) {
        expect(scene.soldOn, `${sku}`).toBe(venduti[0].marketplace);
      }
    }
  });

  // `sales.listing_id` è nullable nel canonico: per una vendita registrata
  // fuori dai webhook non si sa dove sia avvenuta. Se i mock perdessero questo
  // caso, la view smetterebbe di saperlo mostrare.
  it("tiene una vendita senza marketplace noto", () => {
    const senza = Object.values(saleScenes).filter((s) => s.soldOn === null);
    expect(senza.length, "serve una scena con soldOn null").toBeGreaterThan(0);
    for (const s of senza) {
      expect(s.rows.some((r) => r.outcome === "sold_here"), "senza soldOn nessuna riga è «venduto qui»").toBe(false);
    }
  });

  it("tiene una vendita pubblicata su un solo marketplace", () => {
    const sole = Object.values(saleScenes).filter((s) => s.rows.length === 1);
    expect(sole.length, "serve il caso «non c'era altro da ritirare»").toBeGreaterThan(0);
  });

  it("dà un motivo dove l'esito lo richiede", () => {
    for (const [sku, scene] of Object.entries(saleScenes)) {
      for (const r of scene.rows) {
        if (r.outcome === "manual_required" || r.outcome === "error") {
          expect(r.detail, `${sku}/${r.marketplace}`).toBeTruthy();
        }
      }
    }
  });

  it("non mette una data di ritiro dove il ritiro non è avvenuto", () => {
    for (const [sku, scene] of Object.entries(saleScenes)) {
      for (const r of scene.rows) {
        if (r.outcome === "still_online" || r.outcome === "manual_required" || r.outcome === "error") {
          expect(r.at, `${sku}/${r.marketplace} non è stato ritirato`).toBeNull();
        }
      }
    }
  });

  it("ha un marketplace solo una volta per vendita", () => {
    for (const [sku, scene] of Object.entries(saleScenes)) {
      const visti = scene.rows.map((r) => r.marketplace);
      expect(new Set(visti).size, sku).toBe(visti.length);
    }
  });

  it("le scene puntano a vendite che esistono davvero", () => {
    for (const sku of Object.keys(saleScenes)) {
      expect(sales.find((s) => s.sku === sku), `nessuna vendita con sku ${sku}`).toBeTruthy();
    }
  });

  it("sceneForSale non trova niente per uno sku sconosciuto", () => {
    expect(sceneForSale("NON-ESISTE")).toBeNull();
  });
});

describe("DelistOutcomeBadge", () => {
  // La lista si legge per AZIONE: chi guarda deve trovare in un colpo d'occhio
  // le righe che chiedono qualcosa. Se «venduto qui» o «ritirato» diventassero
  // warn, la lettura si perderebbe.
  it("tiene in evidenza solo gli esiti che chiedono qualcosa", () => {
    const chiedono: DelistOutcome[] = ["still_online", "manual_required", "error"];
    const quieti: DelistOutcome[] = ["sold_here", "delisted"];
    for (const o of chiedono) expect(["warn", "danger"], o).toContain(DELIST_OUTCOME_PILL[o].tone);
    for (const o of quieti) expect(["neutral", "success"], o).toContain(DELIST_OUTCOME_PILL[o].tone);
  });

  it("dà una label a ogni esito", () => {
    for (const [o, entry] of Object.entries(DELIST_OUTCOME_PILL)) {
      expect(entry.label.trim(), o).not.toBe("");
    }
  });
});

describe("azionabilità delle righe", () => {
  // Una riga che descrive un problema senza offrire un'azione è un vicolo
  // cieco. Gli esiti che lasciano l'annuncio ONLINE devono essere azionabili;
  // quelli conclusi no, o la view inviterebbe a rifare ciò che è già fatto.
  const ONLINE: DelistOutcome[] = ["still_online", "manual_required", "error"];
  const CONCLUSI: DelistOutcome[] = ["sold_here", "delisted"];

  it("distingue gli esiti che lasciano l'annuncio online da quelli conclusi", () => {
    expect(new Set([...ONLINE, ...CONCLUSI]).size).toBe(Object.keys(DELIST_OUTCOME_PILL).length);
    for (const o of ONLINE) expect(CONCLUSI, o).not.toContain(o);
  });
});

describe("daRitirareRows", () => {
  it("include solo still_online e manual_required, su tutte le vendite", () => {
    const rows = daRitirareRows(saleScenes);
    expect(rows).toContainEqual({ saleSku: "B-091", marketplace: "depop", outcome: "still_online" });
    expect(rows).toContainEqual({ saleSku: "B-097", marketplace: "vinted", outcome: "manual_required" });
    expect(rows).toContainEqual({ saleSku: "B-074", marketplace: "depop", outcome: "still_online" });
  });

  it("esclude sold_here, delisted ed error", () => {
    const rows = daRitirareRows(saleScenes);
    expect(rows.find((r) => r.saleSku === "B-091" && r.marketplace === "vinted")).toBeUndefined();
    expect(rows.find((r) => r.saleSku === "B-091" && r.marketplace === "grailed")).toBeUndefined();
    expect(rows.find((r) => r.saleSku === "B-074" && r.marketplace === "grailed")).toBeUndefined();
  });

  it("con nessuna scena non ha righe", () => {
    expect(daRitirareRows({})).toEqual([]);
  });
});

describe("displayOutcome", () => {
  const row: DelistRow = { marketplace: "depop", outcome: "still_online", at: null, detail: null };

  it("mostra delisted quando l'azione di ritiro corrispondente è conclusa", () => {
    const done = { state: "done" } as MarketplaceAction;
    expect(displayOutcome(row, done)).toBe("delisted");
  });

  it("mostra l'esito del mock senza un'azione conclusa", () => {
    expect(displayOutcome(row, null)).toBe("still_online");
    const pending = { state: "pending" } as MarketplaceAction;
    expect(displayOutcome(row, pending)).toBe("still_online");
  });
});

describe("delistTargetId", () => {
  it("compone sku della vendita e marketplace", () => {
    expect(delistTargetId("B-091", "depop")).toBe("B-091:depop");
  });
});
