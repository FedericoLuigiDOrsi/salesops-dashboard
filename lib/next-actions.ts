import { mockCatalogEntries } from "@/lib/maat-mock";
import { offers as mockOffers } from "@/lib/activity-mock";
import { actionQueue } from "@/lib/catalog-stats";
import { parseElapsedMinutes } from "@/lib/urgency";
import { formatEUR } from "@/lib/utils";
import type { CatalogEntry, Offer } from "@/types/maat";

/** Fascia di priorità: 0 = in ritardo, 1 = entro oggi, 2 = questa settimana. */
export type ActionBand = 0 | 1 | 2;
export type NextActionKind = "bozza" | "offerta";

export interface NextAction {
  id: string;
  kind: NextActionKind;
  name: string;
  meta: string;
  band: ActionBand;
  value: number; // centesimi, spareggio a parità di fascia
  urgLabel: string;
  ctaLabel: string;
  href: string;
}

function formatAge(hours: number): string {
  if (hours >= 24) return `${Math.floor(hours / 24)}g`;
  const rounded = Math.round(hours);
  return rounded < 1 ? "meno di 1h" : `${rounded}h`;
}

function bozzaToAction(entry: CatalogEntry, now: Date): NextAction {
  const ageHours = (now.getTime() - new Date(entry.createdAt).getTime()) / (60 * 60 * 1000);
  const band: ActionBand = ageHours >= 48 ? 0 : ageHours >= 24 ? 1 : 2;
  return {
    id: entry.id,
    kind: "bozza",
    name: `${entry.attributes.brand} — ${entry.attributes.tipoCapo}`,
    meta: `Taglia ${entry.attributes.taglia || "—"} · ${entry.sku ?? "—"}`,
    band,
    value: 0,
    urgLabel: `In bozza da ${formatAge(ageHours)}`,
    ctaLabel: "Revisiona",
    href: `/capi/${entry.id}`,
  };
}

function offertaToAction(offer: Offer): NextAction {
  const elapsedMin = parseElapsedMinutes(offer.time);
  const band: ActionBand = elapsedMin >= 360 ? 0 : elapsedMin >= 60 ? 1 : 2;
  return {
    id: offer.id,
    kind: "offerta",
    name: offer.itemLabel,
    meta: `${formatEUR(offer.offerCents)} · listino ${formatEUR(offer.listPriceCents)}`,
    band,
    value: offer.offerCents,
    urgLabel: `In attesa da ${offer.time}`,
    ctaLabel: "Rispondi",
    href: "/notifiche",
  };
}

/**
 * Coda unica di prossime azioni: bozze da revisionare + offerte in sospeso,
 * ordinate per fascia di urgenza e, a parità, per valore a rischio (€).
 */
export function nextActions(
  now = new Date(),
  entries: CatalogEntry[] = mockCatalogEntries,
  offers: Offer[] = mockOffers
): NextAction[] {
  const bozze = actionQueue(entries).map((e) => bozzaToAction(e, now));
  const pending = offers.filter((o) => o.status === "pending").map(offertaToAction);
  return [...bozze, ...pending].sort((a, b) => a.band - b.band || b.value - a.value);
}
