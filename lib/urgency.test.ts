import { describe, expect, it } from "vitest";
import {
  isOfferUrgent,
  hasUrgentOffer,
  isActionQueueUrgent,
  hasUnreadNotifications,
  isRevenueDown,
  isMetricUrgent,
} from "./urgency";
import type { Offer, CatalogEntry, Notification } from "@/types/maat";
import type { HomeMetric } from "./home-mock";

function makeOffer(time: string, status: Offer["status"] = "pending"): Offer {
  return { id: "o1", itemLabel: "Test", sku: "T-1", marketplace: "vinted", offerCents: 1000, listPriceCents: 1200, time, status };
}

describe("isOfferUrgent", () => {
  it("un'offerta arrivata 1 ora fa non è urgente", () => {
    expect(isOfferUrgent(makeOffer("1 h"))).toBe(false);
  });
  it("un'offerta arrivata 6 ore fa è urgente", () => {
    expect(isOfferUrgent(makeOffer("6 h"))).toBe(true);
  });
  it("un'offerta arrivata ieri è urgente", () => {
    expect(isOfferUrgent(makeOffer("ieri"))).toBe(true);
  });
});

describe("hasUrgentOffer", () => {
  it("true se almeno un'offerta pending è vecchia", () => {
    expect(hasUrgentOffer([makeOffer("1 h"), makeOffer("ieri")])).toBe(true);
  });
  it("ignora le offerte già risolte anche se vecchie", () => {
    expect(hasUrgentOffer([makeOffer("ieri", "accepted")])).toBe(false);
  });
  it("false se la lista è vuota", () => {
    expect(hasUrgentOffer([])).toBe(false);
  });
});

function makeEntry(createdAt: string): CatalogEntry {
  return {
    id: "e1", sku: null, status: "to_be_reviewed",
    attributes: { brand: "", tipoCapo: "", colore: "", taglia: "", materiale: "", genere: "", condizioni: "", difetti: "", stile: "", stagionalita: "" },
    measures: {}, photos: [], accountId: "acc-1", createdAt,
    purchasePriceCents: null, suggestedSalePriceCents: null,
  };
}

describe("isActionQueueUrgent", () => {
  const now = "2026-07-21T12:00:00.000Z";
  it("false se la coda è vuota", () => {
    expect(isActionQueueUrgent([], now)).toBe(false);
  });
  it("false se il più vecchio ha meno di 48 ore", () => {
    expect(isActionQueueUrgent([makeEntry("2026-07-20T12:00:00.000Z")], now)).toBe(false);
  });
  it("true se il più vecchio ha 48 ore o più", () => {
    expect(isActionQueueUrgent([makeEntry("2026-07-19T12:00:00.000Z")], now)).toBe(true);
  });
});

function makeNotification(letta: boolean): Notification {
  return { id: "n1", tipo: "draft_ready", messaggio: "Test", timestamp: "2026-07-21T10:00:00.000Z", letta, catalogEntryId: "e1" };
}

describe("hasUnreadNotifications", () => {
  it("true se almeno una non è letta", () => {
    expect(hasUnreadNotifications([makeNotification(true), makeNotification(false)])).toBe(true);
  });
  it("false se tutte lette", () => {
    expect(hasUnreadNotifications([makeNotification(true)])).toBe(false);
  });
});

describe("isRevenueDown", () => {
  it("true su delta negativo", () => {
    expect(isRevenueDown(-3.2)).toBe(true);
  });
  it("false su delta positivo o zero", () => {
    expect(isRevenueDown(14.5)).toBe(false);
    expect(isRevenueDown(0)).toBe(false);
  });
});

function makeMetric(key: string, value: string): HomeMetric {
  return { key, value, label: "Test", dotColor: "bg-primary", tier: "medio" };
}

describe("isMetricUrgent", () => {
  it("bozze >= 10 è urgente", () => {
    expect(isMetricUrgent(makeMetric("bozze", "12"))).toBe(true);
    expect(isMetricUrgent(makeMetric("bozze", "5"))).toBe(false);
  });
  it("escrow >= 500 euro è urgente", () => {
    expect(isMetricUrgent(makeMetric("escrow", "€ 940"))).toBe(true);
    expect(isMetricUrgent(makeMetric("escrow", "€ 120"))).toBe(false);
  });
  it("spedizioni >= 8 è urgente", () => {
    expect(isMetricUrgent(makeMetric("spedizioni", "10"))).toBe(true);
    expect(isMetricUrgent(makeMetric("spedizioni", "3"))).toBe(false);
  });
  it("una metrica senza soglia definita non è mai urgente", () => {
    expect(isMetricUrgent(makeMetric("catalogo", "9999"))).toBe(false);
  });
});
