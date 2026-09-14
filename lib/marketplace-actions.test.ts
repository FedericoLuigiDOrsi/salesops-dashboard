import { describe, expect, it } from "vitest";
import type { MarketplaceAction } from "@/types/maat";
import {
  applyTransition,
  canTransition,
  cancelAction,
  enqueueAction,
  extensionStatus,
  isBlockingStatus,
  isLingering,
  isMarketplaceBusy,
  isStale,
  latestActionFor,
  nextClaimable,
  offerActionKind,
  offerDisplayState,
  priorityClassOf,
  resumeMarketplace,
  retryAction,
  targetKey,
} from "./marketplace-actions";

const T0 = 1_000_000;

function accept(offerId = "off-1") {
  return { kind: "offer_accept" as const, marketplace: "vinted" as const, target: { type: "offer" as const, id: offerId } };
}

describe("priorityClassOf", () => {
  it("offerte e risposte sono conversazioni, i like hanno classe propria, il resto sono annunci", () => {
    expect(priorityClassOf("offer_accept")).toBe("conversation");
    expect(priorityClassOf("offer_reject")).toBe("conversation");
    expect(priorityClassOf("offer_counter")).toBe("conversation");
    expect(priorityClassOf("thread_reply")).toBe("conversation");
    expect(priorityClassOf("like_outreach")).toBe("like");
    expect(priorityClassOf("delist")).toBe("listing");
    expect(priorityClassOf("publish")).toBe("listing");
  });
});

describe("targetKey", () => {
  it("unisce tipo e id", () => {
    expect(targetKey({ type: "offer", id: "off-1" })).toBe("offer:off-1");
  });
});

describe("canTransition", () => {
  it("ammette il percorso normale", () => {
    expect(canTransition("pending", "submitting")).toBe(true);
    expect(canTransition("submitting", "done")).toBe(true);
    expect(canTransition("failed", "pending")).toBe(true);
    expect(canTransition("awaiting_challenge", "pending")).toBe(true);
  });
  it("vieta di tornare indietro da stati chiusi e di annullare in volo", () => {
    expect(canTransition("done", "pending")).toBe(false);
    expect(canTransition("cancelled", "pending")).toBe(false);
    expect(canTransition("submitting", "cancelled")).toBe(false);
    expect(canTransition("composing", "cancelled")).toBe(false);
  });
});

describe("enqueueAction", () => {
  it("crea un'azione in attesa con la sua attesa e la classe di priorità", () => {
    const { actions, action, created } = enqueueAction([], accept(), T0, 20_000, "a1");
    expect(created).toBe(true);
    expect(actions).toHaveLength(1);
    expect(action).toMatchObject({
      id: "a1",
      state: "pending",
      priority: "conversation",
      createdAt: T0,
      updatedAt: T0,
      nextActionAt: T0 + 20_000,
      attempts: 0,
    });
  });

  it("un doppio tocco restituisce l'azione esistente", () => {
    const first = enqueueAction([], accept(), T0, 20_000, "a1");
    const second = enqueueAction(first.actions, accept(), T0 + 500, 20_000, "a2");
    expect(second.created).toBe(false);
    expect(second.action.id).toBe("a1");
    expect(second.actions).toBe(first.actions);
  });

  it("un'azione diversa sullo stesso oggetto sostituisce quella ancora annullabile", () => {
    const first = enqueueAction([], accept(), T0, 20_000, "a1");
    const reject = { ...accept(), kind: "offer_reject" as const };
    const second = enqueueAction(first.actions, reject, T0 + 1_000, 20_000, "a2");
    expect(second.created).toBe(true);
    expect(second.actions.find((a) => a.id === "a1")?.state).toBe("cancelled");
    expect(second.actions.find((a) => a.id === "a2")?.state).toBe("pending");
  });

  it("non sostituisce un'azione già in volo", () => {
    const first = enqueueAction([], accept(), T0, 20_000, "a1");
    const inFlight = applyTransition(first.actions, "a1", "submitting", T0 + 21_000);
    const reject = { ...accept(), kind: "offer_reject" as const };
    const second = enqueueAction(inFlight, reject, T0 + 22_000, 20_000, "a2");
    expect(second.created).toBe(false);
    expect(second.action.id).toBe("a1");
  });

  it("dopo un'azione fallita se ne può accodare una nuova", () => {
    const first = enqueueAction([], accept(), T0, 20_000, "a1");
    const failed = applyTransition(
      applyTransition(first.actions, "a1", "submitting", T0 + 21_000),
      "a1",
      "failed",
      T0 + 23_000,
    );
    const again = enqueueAction(failed, accept(), T0 + 30_000, 20_000, "a2");
    expect(again.created).toBe(true);
  });
});

describe("applyTransition", () => {
  it("ignora una transizione vietata restituendo lo stesso array", () => {
    const { actions } = enqueueAction([], accept(), T0, 20_000, "a1");
    const done = applyTransition(applyTransition(actions, "a1", "submitting", T0 + 1), "a1", "done", T0 + 2);
    expect(applyTransition(done, "a1", "pending", T0 + 3)).toBe(done);
  });

  it("aggiorna updatedAt e applica la patch", () => {
    const { actions } = enqueueAction([], accept(), T0, 20_000, "a1");
    const next = applyTransition(actions, "a1", "submitting", T0 + 5, { attempts: 1 });
    expect(next[0]).toMatchObject({ state: "submitting", updatedAt: T0 + 5, attempts: 1 });
  });
});

describe("cancelAction", () => {
  it("annulla un'azione in coda", () => {
    const { actions } = enqueueAction([], accept(), T0, 20_000, "a1");
    const res = cancelAction(actions, "a1", T0 + 1_000);
    expect(res.result).toBe("cancelled");
    expect(res.actions[0].state).toBe("cancelled");
  });

  it("dice troppo tardi se l'estensione l'ha già presa", () => {
    const { actions } = enqueueAction([], accept(), T0, 20_000, "a1");
    const inFlight = applyTransition(actions, "a1", "submitting", T0 + 21_000);
    const res = cancelAction(inFlight, "a1", T0 + 21_001);
    expect(res.result).toBe("too_late");
    expect(res.actions).toBe(inFlight);
  });

  it("dice troppo tardi per un id sconosciuto", () => {
    expect(cancelAction([], "nope", T0).result).toBe("too_late");
  });
});

describe("retryAction", () => {
  it("rimette in coda un'azione fallita e conta il tentativo", () => {
    const { actions } = enqueueAction([], accept(), T0, 20_000, "a1");
    const failed = applyTransition(
      applyTransition(actions, "a1", "submitting", T0 + 21_000),
      "a1",
      "failed",
      T0 + 22_000,
      { lastError: "Errore simulato" },
    );
    const retried = retryAction(failed, "a1", T0 + 30_000, 15_000);
    expect(retried[0]).toMatchObject({ state: "pending", attempts: 1, nextActionAt: T0 + 45_000, lastError: undefined });
  });

  it("non tocca un'azione che non è fallita", () => {
    const { actions } = enqueueAction([], accept(), T0, 20_000, "a1");
    expect(retryAction(actions, "a1", T0 + 1, 15_000)).toBe(actions);
  });

  it("non rimette in coda una fallita se sull'oggetto è già attiva un'altra azione", () => {
    const first = enqueueAction([], accept(), T0, 20_000, "a1");
    const failed = applyTransition(
      applyTransition(first.actions, "a1", "submitting", T0 + 21_000),
      "a1",
      "failed",
      T0 + 22_000,
    );
    // a1 è failed, non active: enqueueAction non la vede come "corrente" e
    // crea regolarmente una seconda azione (diversa) sullo stesso oggetto.
    const reject = { ...accept(), kind: "offer_reject" as const };
    const withSibling = enqueueAction(failed, reject, T0 + 23_000, 20_000, "b1");
    expect(withSibling.created).toBe(true);

    const retried = retryAction(withSibling.actions, "a1", T0 + 30_000, 15_000);
    expect(retried).toBe(withSibling.actions);
    expect(retried.find((a) => a.id === "a1")?.state).toBe("failed");
  });
});

function make(partial: Partial<MarketplaceAction> & Pick<MarketplaceAction, "id">): MarketplaceAction {
  return {
    kind: "offer_accept",
    marketplace: "vinted",
    target: { type: "offer", id: partial.id },
    state: "pending",
    priority: "conversation",
    createdAt: T0,
    updatedAt: T0,
    nextActionAt: T0,
    attempts: 0,
    ...partial,
  };
}

describe("nextClaimable", () => {
  it("prende prima le conversazioni, poi i like, poi gli annunci", () => {
    const actions = [
      make({ id: "l", kind: "delist", priority: "listing", createdAt: T0 - 3 }),
      make({ id: "k", kind: "like_outreach", priority: "like", createdAt: T0 - 2 }),
      make({ id: "c", priority: "conversation", createdAt: T0 - 1 }),
    ];
    expect(nextClaimable(actions, "vinted", T0)?.id).toBe("c");
  });

  it("a parità di classe prende la più vecchia", () => {
    const actions = [make({ id: "b", createdAt: T0 - 1 }), make({ id: "a", createdAt: T0 - 5 })];
    expect(nextClaimable(actions, "vinted", T0)?.id).toBe("a");
  });

  it("non prende azioni la cui attesa non è finita", () => {
    expect(nextClaimable([make({ id: "a", nextActionAt: T0 + 1 })], "vinted", T0)).toBeNull();
  });

  it("non prende niente se la piattaforma ha già un'azione in volo o bloccata", () => {
    expect(nextClaimable([make({ id: "a" }), make({ id: "b", state: "submitting" })], "vinted", T0)).toBeNull();
    expect(nextClaimable([make({ id: "a" }), make({ id: "b", state: "needs_reauth" })], "vinted", T0)).toBeNull();
  });

  it("le piattaforme sono indipendenti", () => {
    const actions = [make({ id: "v", state: "submitting" }), make({ id: "d", marketplace: "depop" })];
    expect(isMarketplaceBusy(actions, "vinted")).toBe(true);
    expect(nextClaimable(actions, "depop", T0)?.id).toBe("d");
  });
});

describe("resumeMarketplace", () => {
  it("rimette in coda le azioni bloccate di quella piattaforma", () => {
    const actions = [make({ id: "a", state: "awaiting_challenge" }), make({ id: "b", marketplace: "depop", state: "needs_reauth" })];
    const next = resumeMarketplace(actions, "vinted", T0 + 10);
    expect(next.find((a) => a.id === "a")).toMatchObject({ state: "pending", nextActionAt: T0 + 10 });
    expect(next.find((a) => a.id === "b")?.state).toBe("needs_reauth");
  });

  it("restituisce lo stesso array se non c'è niente da riprendere", () => {
    const actions = [make({ id: "a" })];
    expect(resumeMarketplace(actions, "vinted", T0)).toBe(actions);
  });
});

describe("isStale", () => {
  it("un'azione in coda è ferma oltre attesa più tolleranza", () => {
    const a = make({ id: "a", nextActionAt: T0 });
    expect(isStale(a, T0 + 120_000)).toBe(false);
    expect(isStale(a, T0 + 120_001)).toBe(true);
  });
  it("un'azione in volo non è mai ferma", () => {
    expect(isStale(make({ id: "a", state: "submitting" }), T0 + 999_999)).toBe(false);
  });
});

describe("latestActionFor e isLingering", () => {
  it("restituisce l'azione più recente per l'oggetto, ignorando le annullate", () => {
    const actions = [
      make({ id: "old", state: "cancelled", updatedAt: T0 + 5 }),
      make({ id: "new", state: "done", updatedAt: T0 + 2 }),
    ];
    expect(latestActionFor(actions, { type: "offer", id: "old" })).toBeNull();
    expect(latestActionFor(actions, { type: "offer", id: "new" })?.id).toBe("new");
  });

  it("una riga fatta resta visibile per 3 secondi", () => {
    const a = make({ id: "a", state: "done", updatedAt: T0 });
    expect(isLingering(a, T0 + 3_000)).toBe(true);
    expect(isLingering(a, T0 + 3_001)).toBe(false);
  });
});

describe("offerDisplayState", () => {
  it("senza azione fatta mostra lo stato di base", () => {
    expect(offerDisplayState("pending", undefined, null)).toEqual({ status: "pending", counterCents: undefined });
    expect(offerDisplayState("pending", undefined, make({ id: "a" }))).toEqual({ status: "pending", counterCents: undefined });
  });
  it("un'azione fatta diventa l'esito dell'offerta", () => {
    expect(offerDisplayState("pending", undefined, make({ id: "a", state: "done" })).status).toBe("accepted");
    expect(offerDisplayState("pending", undefined, make({ id: "a", kind: "offer_reject", state: "done" })).status).toBe("rejected");
    expect(
      offerDisplayState("pending", undefined, make({ id: "a", kind: "offer_counter", state: "done", payload: { counterCents: 6200 } })),
    ).toEqual({ status: "counter", counterCents: 6200 });
  });
});

describe("extensionStatus", () => {
  it("ordina per gravità: ricollegare, captcha, ferme, non collegata, attiva", () => {
    const stale = make({ id: "s", nextActionAt: T0 - 200_000 });
    expect(extensionStatus([stale, make({ id: "r", state: "needs_reauth" }), make({ id: "c", state: "awaiting_challenge" })], true, T0).kind).toBe("reauth");
    expect(extensionStatus([stale, make({ id: "c", state: "awaiting_challenge" })], true, T0).kind).toBe("challenge");
    expect(extensionStatus([stale], true, T0).kind).toBe("stale");
    expect(extensionStatus([], false, T0).kind).toBe("not_connected");
    expect(extensionStatus([], true, T0).kind).toBe("active");
  });

  it("conta le azioni in coda e quelle che aspettano", () => {
    const actions = [make({ id: "a" }), make({ id: "b", state: "submitting" }), make({ id: "c", state: "done" })];
    expect(extensionStatus(actions, true, T0)).toEqual({ kind: "active", queued: 2, waiting: 1, marketplace: null });
  });

  it("per le azioni ferme conta solo quelle ferme", () => {
    const actions = [make({ id: "a", nextActionAt: T0 - 200_000 }), make({ id: "b", nextActionAt: T0 })];
    expect(extensionStatus(actions, true, T0)).toMatchObject({ kind: "stale", waiting: 1 });
  });

  it("account non collegato vince su un'azione ferma: not_connected, non stale", () => {
    const stale = make({ id: "s", nextActionAt: T0 - 200_000 });
    expect(extensionStatus([stale], false, T0).kind).toBe("not_connected");
  });

  it("popola il marketplace bloccato per reauth e challenge, null altrimenti", () => {
    expect(extensionStatus([make({ id: "r", state: "needs_reauth", marketplace: "depop" })], true, T0).marketplace).toBe(
      "depop",
    );
    expect(
      extensionStatus([make({ id: "c", state: "awaiting_challenge", marketplace: "grailed" })], true, T0).marketplace,
    ).toBe("grailed");
    expect(extensionStatus([], true, T0).marketplace).toBeNull();
  });

  it("solo ricollegare, captcha e ferme bloccano", () => {
    expect(isBlockingStatus("reauth")).toBe(true);
    expect(isBlockingStatus("challenge")).toBe(true);
    expect(isBlockingStatus("stale")).toBe(true);
    expect(isBlockingStatus("active")).toBe(false);
    expect(isBlockingStatus("not_connected")).toBe(false);
  });
});

describe("offerActionKind", () => {
  it("traduce la risposta dell'utente nell'azione del team", () => {
    expect(offerActionKind("accepted")).toBe("offer_accept");
    expect(offerActionKind("rejected")).toBe("offer_reject");
    expect(offerActionKind("counter")).toBe("offer_counter");
    expect(offerActionKind("pending")).toBeNull();
  });
});
