import type { Marketplace, MarketplaceAccount } from "@/types/maat";

// Dati dimostrativi per «Gestisci marketplace».
//
// Sono mock: la tabella `marketplace_accounts` esiste nel canonico ma nessuna
// API la espone, e il flusso di collegamento vero esce dall'app (OAuth o
// credenziali, non specificato dal canonico — solo `secret_ref` esiste).
//
// La copertura è scelta perché la view sia provabile in tutti e quattro i casi
// di riga: collegato, rotto, scollegato, e MAI collegato. L'ultimo non è uno
// stato dell'enum — è l'assenza della riga nel canonico, ed è il default di
// ogni tenant nuovo. Senza almeno un marketplace assente non si vedrebbe.
//
// `secret_ref` non compare qui e non deve comparire mai lato client, nemmeno
// come riferimento: Object Guide 17, nota per il team dev.

function iso(daysAgo: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const marketplaceAccounts: MarketplaceAccount[] = [
  {
    id: "mka-vinted",
    marketplace: "vinted",
    status: "active",
    connectedAt: iso(64),
    checkedAt: iso(0, 9),
    errorReason: null,
  },
  {
    id: "mka-depop",
    marketplace: "depop",
    status: "active",
    connectedAt: iso(41),
    checkedAt: iso(0, 9),
    errorReason: null,
  },
  {
    id: "mka-grailed",
    marketplace: "grailed",
    status: "error",
    connectedAt: iso(88),
    checkedAt: iso(2, 7),
    errorReason: "Grailed ha rifiutato le credenziali: il collegamento è scaduto.",
  },
  {
    id: "mka-vestiaire",
    marketplace: "vestiaire",
    status: "inactive",
    connectedAt: iso(120),
    checkedAt: iso(12, 16),
    errorReason: null,
  },
  // eBay non c'è: mai collegato. È l'assenza, non uno stato — vedi sopra.
];

/** L'account per un marketplace, o `null` se non è mai stato collegato. */
export function accountFor(marketplace: Marketplace): MarketplaceAccount | null {
  return marketplaceAccounts.find((a) => a.marketplace === marketplace) ?? null;
}
