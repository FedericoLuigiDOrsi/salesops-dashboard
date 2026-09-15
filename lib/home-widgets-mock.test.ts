import { describe, expect, it } from "vitest";
import { AGING_ITEMS } from "./home-widgets-mock";
import type { Marketplace } from "@/types/maat";

const VALID: Marketplace[] = ["vinted", "depop", "grailed", "vestiaire", "ebay"];

describe("AGING_ITEMS", () => {
  it("ogni capo fermo dichiara un marketplace valido, per l'azione Ritira", () => {
    for (const item of AGING_ITEMS) {
      expect(VALID).toContain(item.marketplace);
    }
  });
});
