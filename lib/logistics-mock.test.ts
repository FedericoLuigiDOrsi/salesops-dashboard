import { describe, expect, it } from "vitest";
import { shipments } from "./logistics-mock";

describe("shipments mock", () => {
  it("ogni spedizione ha una destinationCity con coordinate valide", () => {
    for (const s of shipments) {
      expect(s.destinationCity).toBeDefined();
      expect(s.destinationCity.name.length).toBeGreaterThan(0);
      expect(s.destinationCity.lat).toBeGreaterThanOrEqual(-90);
      expect(s.destinationCity.lat).toBeLessThanOrEqual(90);
      expect(s.destinationCity.lng).toBeGreaterThanOrEqual(-180);
      expect(s.destinationCity.lng).toBeLessThanOrEqual(180);
    }
  });
});
