import { describe, expect, it } from "vitest";
import type { MarketplaceActionState } from "@/types/maat";
import type { ExtensionStatusKind } from "./marketplace-actions";
import { ACTION_KIND_LABEL, ACTION_STATE_PILL, EXTENSION_STATUS_COPY } from "./marketplace-actions-copy";

const STATES: MarketplaceActionState[] = [
  "pending", "composing", "submitting", "throttled", "awaiting_challenge", "done", "failed", "needs_reauth", "cancelled",
];
const KINDS: ExtensionStatusKind[] = ["reauth", "challenge", "stale", "active", "not_connected"];

describe("ACTION_STATE_PILL", () => {
  it("dà un'etichetta a ogni stato del team", () => {
    for (const s of STATES) expect(ACTION_STATE_PILL[s].label.length).toBeGreaterThan(0);
  });

  it("usa le parole decise con Federico", () => {
    expect(ACTION_STATE_PILL.pending).toEqual({ label: "In coda", tone: "neutral" });
    expect(ACTION_STATE_PILL.throttled).toEqual({ label: "In coda", tone: "neutral" });
    expect(ACTION_STATE_PILL.submitting).toEqual({ label: "In corso", tone: "warn", live: true });
    expect(ACTION_STATE_PILL.composing).toEqual({ label: "In corso", tone: "warn", live: true });
    expect(ACTION_STATE_PILL.done).toEqual({ label: "Fatta", tone: "success" });
    expect(ACTION_STATE_PILL.failed).toEqual({ label: "Non riuscita", tone: "danger" });
    expect(ACTION_STATE_PILL.awaiting_challenge).toEqual({ label: "Bloccata", tone: "danger" });
    expect(ACTION_STATE_PILL.needs_reauth).toEqual({ label: "Bloccata", tone: "danger" });
  });

  it("anima il pallino solo in volo", () => {
    const live = STATES.filter((s) => "live" in ACTION_STATE_PILL[s] && ACTION_STATE_PILL[s].live);
    expect(live.sort()).toEqual(["composing", "submitting"]);
  });
});

describe("EXTENSION_STATUS_COPY", () => {
  it("ha testo per ogni stato dell'estensione", () => {
    for (const k of KINDS) {
      expect(EXTENSION_STATUS_COPY[k].label.length).toBeGreaterThan(0);
      expect(EXTENSION_STATUS_COPY[k].detail.length).toBeGreaterThan(0);
    }
  });

  it("offre un'azione per ricollegare, captcha e collegamento", () => {
    expect(EXTENSION_STATUS_COPY.reauth.cta).toEqual({ label: "Ricollega Vinted", href: "/pubblicazione" });
    expect(EXTENSION_STATUS_COPY.challenge.cta).toEqual({ label: "Ho risolto", resume: true });
    expect(EXTENSION_STATUS_COPY.challenge.secondary?.label).toBe("Apri Vinted");
    expect(EXTENSION_STATUS_COPY.not_connected.cta?.href).toBe("/pubblicazione");
  });

  it("i toni seguono la gravità", () => {
    expect(EXTENSION_STATUS_COPY.reauth.tone).toBe("danger");
    expect(EXTENSION_STATUS_COPY.challenge.tone).toBe("danger");
    expect(EXTENSION_STATUS_COPY.stale.tone).toBe("warn");
    expect(EXTENSION_STATUS_COPY.active.tone).toBe("success");
    expect(EXTENSION_STATUS_COPY.not_connected.tone).toBe("neutral");
  });
});

describe("ACTION_KIND_LABEL", () => {
  it("dà un nome in italiano a ognuna delle dieci azioni del team", () => {
    const kinds = [
      "publish", "draft", "hide", "unhide", "delist",
      "offer_accept", "offer_reject", "offer_counter", "thread_reply", "like_outreach",
    ] as const;
    for (const k of kinds) expect(ACTION_KIND_LABEL[k].length).toBeGreaterThan(0);
    expect(ACTION_KIND_LABEL.offer_accept).toBe("Accetta offerta");
    expect(ACTION_KIND_LABEL.like_outreach).toBe("Messaggio al like");
  });
});
