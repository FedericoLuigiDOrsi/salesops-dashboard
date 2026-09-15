import { describe, expect, it } from "vitest";
import { mockCatalogEntries } from "./maat-mock";
import { evaluateConfirmGate } from "./confirm-gate";
import { ATTRIBUTE_LABELS } from "./review-types";

describe("mockCatalogEntries", () => {
  it("contiene almeno una bozza già pronta per la conferma", () => {
    const ready = mockCatalogEntries.filter(
      (e) =>
        (e.status === "to_be_reviewed" || e.status === "local_draft") &&
        evaluateConfirmGate(e, ATTRIBUTE_LABELS).enabled
    );
    expect(ready.length).toBeGreaterThan(0);
  });
});
