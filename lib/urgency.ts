import type { CatalogEntry, Notification, Offer } from "@/types/maat";

const OFFER_URGENT_MINUTES = 6 * 60;
const ACTION_QUEUE_URGENT_MS = 48 * 60 * 60 * 1000;

export function parseElapsedMinutes(time: string): number {
  const t = time.trim().toLowerCase();
  if (t === "ieri") return 24 * 60;
  const dayMatch = t.match(/^(\d+)\s*g/);
  if (dayMatch) return Number(dayMatch[1]) * 24 * 60;
  const hourMatch = t.match(/^(\d+)\s*h/);
  if (hourMatch) return Number(hourMatch[1]) * 60;
  const minMatch = t.match(/^(\d+)\s*min/);
  if (minMatch) return Number(minMatch[1]);
  return 0;
}

/** Un'offerta pending è "urgente" se è ferma da 6 ore o più senza risposta. */
export function isOfferUrgent(offer: Offer): boolean {
  return parseElapsedMinutes(offer.time) >= OFFER_URGENT_MINUTES;
}

/** true se almeno un'offerta ancora pending è urgente. */
export function hasUrgentOffer(offers: Offer[]): boolean {
  return offers.some((o) => o.status === "pending" && isOfferUrgent(o));
}

/**
 * La coda azioni è "urgente" se il capo più vecchio è in coda da 48 ore o più.
 * Assume `entries` già ordinato per createdAt crescente (come restituisce `actionQueue()`).
 */
export function isActionQueueUrgent(entries: CatalogEntry[], nowIso: string): boolean {
  if (entries.length === 0) return false;
  const oldest = entries[0];
  const ageMs = new Date(nowIso).getTime() - new Date(oldest.createdAt).getTime();
  return ageMs >= ACTION_QUEUE_URGENT_MS;
}

/** true se c'è almeno una notifica non letta. */
export function hasUnreadNotifications(notifications: Notification[]): boolean {
  return notifications.some((n) => !n.letta);
}

/** Le entrate destano attenzione quando il trend settimanale è negativo. */
export function isRevenueDown(deltaPct: number): boolean {
  return deltaPct < 0;
}
