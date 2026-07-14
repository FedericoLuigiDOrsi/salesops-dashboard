import { mockCatalogEntries } from "@/lib/maat-mock";
import type { CatalogEntry } from "@/types/maat";

export interface CatalogCounts {
  totale: number;
  bozze: number; // to_be_reviewed
  confermati: number; // available
  locali: number; // local_draft
}

/** Conteggi per stato, condivisi tra Home e lista Capi (una sola fonte). */
export function catalogCounts(entries: CatalogEntry[] = mockCatalogEntries): CatalogCounts {
  return {
    totale: entries.length,
    bozze: entries.filter((e) => e.status === "to_be_reviewed").length,
    confermati: entries.filter((e) => e.status === "available").length,
    locali: entries.filter((e) => e.status === "local_draft").length,
  };
}

/** Coda di lavorazione: bozze da rivedere + capi salvati in locale, dai più vecchi (FIFO). */
export function actionQueue(entries: CatalogEntry[] = mockCatalogEntries): CatalogEntry[] {
  return entries
    .filter((e) => e.status === "to_be_reviewed" || e.status === "local_draft")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
