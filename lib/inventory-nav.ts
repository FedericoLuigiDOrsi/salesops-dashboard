import type { InventoryItem } from "@/lib/inventory-mock";

// Dove porta un capo dell'inventario: i pre-catalogo aprono la Review — metà operatore del loop
// P2C, dove si completano gli attributi e si conferma — gli altri il dettaglio capo.
// Condiviso fra vista Tabella e vista Griglia.
//
// `to_be_reviewed` copre sia `draft` sia `incomplete` del canonico (vedi lib/lifecycle.ts);
// `local_draft` resta contemplato perché è uno stato del client mobile, non del DB.
export function itemHref(item: InventoryItem): string {
  return item.status === "local_draft" || item.status === "to_be_reviewed"
    ? `/review/${item.id}`
    : `/capi/${item.id}`;
}
