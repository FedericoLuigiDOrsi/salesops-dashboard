import { describe, expect, it } from "vitest";
import { marketplaceAccounts, accountFor } from "@/lib/marketplace-accounts-mock";
import { MARKETPLACES } from "@/types/maat";

describe("marketplaceAccounts", () => {
  it("ha cinque marketplace, non tre", () => {
    // PLATFORM_KEYS ne copre tre ed è la lista delle colonne dell'inventario,
    // non dei marketplace. Iterare su quella è l'errore che teneva
    // MarketplaceBadge fermo a tre su cinque.
    expect(MARKETPLACES).toHaveLength(5);
    expect(new Set(MARKETPLACES).size).toBe(5);
  });

  // La view esiste per rispondere a «perché non riesco a pubblicare qui».
  // Senza un errore e senza un marketplace mai collegato non è provabile.
  it("copre i quattro casi di riga, assenza inclusa", () => {
    const stati = new Set(marketplaceAccounts.map((a) => a.status));
    expect(stati).toContain("active");
    expect(stati).toContain("error");
    expect(stati).toContain("inactive");

    const senzaAccount = MARKETPLACES.filter((m) => accountFor(m) === null);
    expect(senzaAccount.length, "serve un marketplace mai collegato").toBeGreaterThan(0);
  });

  it("dà un motivo a ogni account in errore", () => {
    for (const a of marketplaceAccounts) {
      if (a.status === "error") expect(a.errorReason, a.id).toBeTruthy();
    }
  });

  it("non ha al più un account per marketplace", () => {
    const visti = marketplaceAccounts.map((a) => a.marketplace);
    expect(new Set(visti).size).toBe(visti.length);
  });

  // secret_ref punta a un secret nel vault e non deve raggiungere il client,
  // nemmeno come riferimento (Object Guide 17). Il tipo già non lo prevede:
  // questo test blocca chi lo aggiungesse ai dati passando dal tipo.
  it("non porta nessun campo che somigli a una credenziale", () => {
    const vietati = /secret|token|password|credential|api_?key/i;
    for (const a of marketplaceAccounts) {
      for (const chiave of Object.keys(a)) {
        expect(chiave, `${a.id}.${chiave}`).not.toMatch(vietati);
      }
    }
  });
});
