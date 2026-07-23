import { describe, it, expect } from "vitest";
import { offerToNotification } from "@/lib/notifications-mock";
import type { Offer } from "@/types/maat";

const base: Offer = {
  id: "off-1",
  itemLabel: "Burberry · Trench",
  sku: "B-088",
  marketplace: "grailed",
  offerCents: 19000,
  listPriceCents: 24000,
  time: "1 h",
  receivedAt: "2026-07-23T08:00:00.000Z",
  status: "pending",
};

describe("offerToNotification", () => {
  it("preserva l'id base (non n-off-1) e i campi principali", () => {
    const n = offerToNotification(base);
    expect(n.id).toBe("off-1");
    expect(n.type).toBe("offerta");
    expect(n.offerCents).toBe(19000);
    expect(n.listPriceCents).toBe(24000);
    expect(n.status).toBe("pending");
  });

  it("applica l'override di stato e controfferta", () => {
    const n = offerToNotification(base, { status: "counter", counterCents: 21000 });
    expect(n.status).toBe("counter");
    expect(n.counterCents).toBe(21000);
  });

  it("propaga photoUrl/listingUrl quando presenti", () => {
    const n = offerToNotification({ ...base, photoUrl: "/x.jpg", listingUrl: "https://grailed.com/x" });
    expect(n.photoUrl).toBe("/x.jpg");
    expect(n.listingUrl).toBe("https://grailed.com/x");
  });
});
