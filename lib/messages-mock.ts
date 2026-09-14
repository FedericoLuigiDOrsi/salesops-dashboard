import type { Marketplace } from "@/types/maat";

// Messaggi acquirenti: domande pre-vendita, richieste di sconto fuori dal
// flusso offerta, chiarimenti su taglia/spedizione. Distinti dalle Offerte
// (que hanno un prezzo e uno stato accetta/rifiuta) e dalle Notifiche
// (eventi di sistema): qui è sempre una persona che scrive.

export interface BuyerMessage {
  id: string;
  sender: string;
  itemLabel: string;
  sku: string;
  marketplace: Marketplace;
  preview: string;
  time: string;
  unread: boolean;
}

export const messages: BuyerMessage[] = [
  { id: "msg-1", sender: "S. Laurent", itemLabel: "Gucci · Horsebit loafer", sku: "B-120", marketplace: "vestiaire", preview: "È disponibile anche in 42?", time: "18 min", unread: true },
  { id: "msg-2", sender: "T. Weber", itemLabel: "Carhartt WIP · Detroit", sku: "B-110", marketplace: "grailed", preview: "Fai 90€ spedizione inclusa?", time: "1 h", unread: true },
  { id: "msg-3", sender: "F. Romano", itemLabel: "Nike · Hoodie vintage", sku: "B-093", marketplace: "vinted", preview: "Quanto ci mette ad arrivare a Bologna?", time: "3 h", unread: true },
  { id: "msg-4", sender: "J. Smith", itemLabel: "Casio · G-Shock DW", sku: "B-130", marketplace: "ebay", preview: "Grazie mille, arrivato perfetto!", time: "ieri", unread: false },
];

export function unreadMessagesCount(): number {
  return messages.filter((m) => m.unread).length;
}
