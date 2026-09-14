import type {
  ActionPriorityClass,
  ActionTarget,
  Marketplace,
  MarketplaceAction,
  MarketplaceActionKind,
  MarketplaceActionState,
  OfferStatus,
} from "@/types/maat";

// Regole pure del registro delle azioni. Nessun React, nessun timer: il tempo
// entra come parametro, così ogni regola è testabile in ambiente node.

export const CANCELLABLE_STATES: readonly MarketplaceActionState[] = ["pending", "throttled"];
export const IN_FLIGHT_STATES: readonly MarketplaceActionState[] = ["composing", "submitting"];
export const BLOCKED_STATES: readonly MarketplaceActionState[] = ["awaiting_challenge", "needs_reauth"];
const FINAL_STATES: readonly MarketplaceActionState[] = ["done", "failed", "cancelled"];

const ALLOWED: Record<MarketplaceActionState, readonly MarketplaceActionState[]> = {
  pending: ["throttled", "composing", "submitting", "cancelled"],
  throttled: ["pending", "composing", "submitting", "cancelled"],
  composing: ["submitting", "done", "failed", "awaiting_challenge", "needs_reauth"],
  submitting: ["done", "failed", "awaiting_challenge", "needs_reauth"],
  awaiting_challenge: ["pending"],
  needs_reauth: ["pending"],
  failed: ["pending"],
  done: [],
  cancelled: [],
};

export function isActive(action: MarketplaceAction): boolean {
  return !FINAL_STATES.includes(action.state);
}

export function priorityClassOf(kind: MarketplaceActionKind): ActionPriorityClass {
  if (kind === "like_outreach") return "like";
  if (kind === "offer_accept" || kind === "offer_reject" || kind === "offer_counter" || kind === "thread_reply") {
    return "conversation";
  }
  return "listing";
}

export function targetKey(target: ActionTarget): string {
  return `${target.type}:${target.id}`;
}

export function canTransition(from: MarketplaceActionState, to: MarketplaceActionState): boolean {
  return ALLOWED[from].includes(to);
}

export function applyTransition(
  actions: MarketplaceAction[],
  id: string,
  to: MarketplaceActionState,
  now: number,
  patch: Partial<Pick<MarketplaceAction, "lastError" | "nextActionAt" | "attempts">> = {},
): MarketplaceAction[] {
  const current = actions.find((a) => a.id === id);
  if (!current || !canTransition(current.state, to)) return actions;
  return actions.map((a) => (a.id === id ? { ...a, ...patch, state: to, updatedAt: now } : a));
}

export interface EnqueueInput {
  kind: MarketplaceActionKind;
  marketplace: Marketplace;
  target: ActionTarget;
  payload?: MarketplaceAction["payload"];
}

export function enqueueAction(
  actions: MarketplaceAction[],
  input: EnqueueInput,
  now: number,
  gateMs: number,
  id: string,
): { actions: MarketplaceAction[]; action: MarketplaceAction; created: boolean } {
  const key = targetKey(input.target);
  const current = actions.find((a) => isActive(a) && targetKey(a.target) === key);

  // Regola 2: una sola azione attiva per oggetto. Regola 3: un'azione diversa
  // sostituisce la precedente solo finché è ancora annullabile.
  if (current && (current.kind === input.kind || !CANCELLABLE_STATES.includes(current.state))) {
    return { actions, action: current, created: false };
  }

  const action: MarketplaceAction = {
    id,
    kind: input.kind,
    marketplace: input.marketplace,
    target: input.target,
    payload: input.payload,
    state: "pending",
    priority: priorityClassOf(input.kind),
    createdAt: now,
    updatedAt: now,
    nextActionAt: now + gateMs,
    attempts: 0,
  };
  const base = current ? applyTransition(actions, current.id, "cancelled", now) : actions;
  return { actions: [...base, action], action, created: true };
}

export function cancelAction(
  actions: MarketplaceAction[],
  id: string,
  now: number,
): { actions: MarketplaceAction[]; result: "cancelled" | "too_late" } {
  const current = actions.find((a) => a.id === id);
  if (!current || !CANCELLABLE_STATES.includes(current.state)) return { actions, result: "too_late" };
  return { actions: applyTransition(actions, id, "cancelled", now), result: "cancelled" };
}

export function retryAction(actions: MarketplaceAction[], id: string, now: number, gateMs: number): MarketplaceAction[] {
  const current = actions.find((a) => a.id === id);
  if (!current || current.state !== "failed") return actions;
  // Regola 2: una sola azione attiva per oggetto. Se nel frattempo un'altra
  // azione sullo stesso oggetto è già attiva, la fallita non torna in coda.
  const key = targetKey(current.target);
  const hasActiveSibling = actions.some((a) => a.id !== current.id && targetKey(a.target) === key && isActive(a));
  if (hasActiveSibling) return actions;
  return applyTransition(actions, id, "pending", now, {
    attempts: current.attempts + 1,
    nextActionAt: now + gateMs,
    lastError: undefined,
  });
}

export const STALE_TOLERANCE_MS = 2 * 60_000;
export const DONE_LINGER_MS = 3_000;

const CLASS_ORDER: Record<ActionPriorityClass, number> = { conversation: 0, like: 1, listing: 2 };

/** Regola 7: ferma = ancora in coda oltre la sua attesa più la tolleranza (valore da tarare). */
export function isStale(action: MarketplaceAction, now: number, toleranceMs = STALE_TOLERANCE_MS): boolean {
  return CANCELLABLE_STATES.includes(action.state) && now > action.nextActionAt + toleranceMs;
}

/** Regole 4 e 5: una piattaforma con un'azione in volo o bloccata non ne prende altre. */
export function isMarketplaceBusy(actions: MarketplaceAction[], marketplace: Marketplace): boolean {
  return actions.some(
    (a) => a.marketplace === marketplace && (IN_FLIGHT_STATES.includes(a.state) || BLOCKED_STATES.includes(a.state)),
  );
}

export function nextClaimable(actions: MarketplaceAction[], marketplace: Marketplace, now: number): MarketplaceAction | null {
  if (isMarketplaceBusy(actions, marketplace)) return null;
  const ready = actions
    .filter((a) => a.marketplace === marketplace && CANCELLABLE_STATES.includes(a.state) && a.nextActionAt <= now)
    .sort((x, y) => CLASS_ORDER[x.priority] - CLASS_ORDER[y.priority] || x.createdAt - y.createdAt);
  return ready[0] ?? null;
}

export function resumeMarketplace(actions: MarketplaceAction[], marketplace: Marketplace, now: number): MarketplaceAction[] {
  let changed = false;
  const next = actions.map((a) => {
    if (a.marketplace !== marketplace || !BLOCKED_STATES.includes(a.state)) return a;
    changed = true;
    return { ...a, state: "pending" as const, nextActionAt: now, updatedAt: now };
  });
  return changed ? next : actions;
}

export function latestActionFor(actions: MarketplaceAction[], target: ActionTarget): MarketplaceAction | null {
  const key = targetKey(target);
  let latest: MarketplaceAction | null = null;
  for (const a of actions) {
    if (a.state === "cancelled" || targetKey(a.target) !== key) continue;
    if (!latest || a.updatedAt >= latest.updatedAt) latest = a;
  }
  return latest;
}

export function isLingering(action: MarketplaceAction, now: number): boolean {
  return action.state === "done" && now - action.updatedAt <= DONE_LINGER_MS;
}

/** Stato di un'offerta come lo vede l'utente: la base, oppure l'esito di un'azione conclusa. */
export function offerDisplayState(
  baseStatus: OfferStatus,
  baseCounterCents: number | undefined,
  action: MarketplaceAction | null,
): { status: OfferStatus; counterCents?: number } {
  if (action?.state === "done") {
    if (action.kind === "offer_accept") return { status: "accepted" };
    if (action.kind === "offer_reject") return { status: "rejected" };
    if (action.kind === "offer_counter") return { status: "counter", counterCents: action.payload?.counterCents };
  }
  return { status: baseStatus, counterCents: baseCounterCents };
}

export type ExtensionStatusKind = "reauth" | "challenge" | "stale" | "active" | "not_connected";

export interface ExtensionStatus {
  kind: ExtensionStatusKind;
  /** Azioni in coda o in volo. */
  queued: number;
  /** Azioni che aspettano di partire; per "stale" solo quelle ferme. */
  waiting: number;
  /** Marketplace bloccato per reauth/challenge; altrimenti null. */
  marketplace: Marketplace | null;
}

export function extensionStatus(actions: MarketplaceAction[], accountConnected: boolean, now: number): ExtensionStatus {
  const queued = actions.filter((a) => CANCELLABLE_STATES.includes(a.state) || IN_FLIGHT_STATES.includes(a.state)).length;
  const waiting = actions.filter((a) => CANCELLABLE_STATES.includes(a.state) || BLOCKED_STATES.includes(a.state)).length;
  // Ordine di gravità: se l'account non è collegato nessuna azione parte mai,
  // quindi va controllato prima di "stale" — altrimenti la coda ferma per
  // mancato collegamento si presenta come "azioni ferme" invece che "collega".
  const reauth = actions.find((a) => a.state === "needs_reauth");
  if (reauth) return { kind: "reauth", queued, waiting, marketplace: reauth.marketplace };
  const challenge = actions.find((a) => a.state === "awaiting_challenge");
  if (challenge) return { kind: "challenge", queued, waiting, marketplace: challenge.marketplace };
  if (!accountConnected) return { kind: "not_connected", queued, waiting, marketplace: null };
  const stale = actions.filter((a) => isStale(a, now)).length;
  if (stale > 0) return { kind: "stale", queued, waiting: stale, marketplace: null };
  return { kind: "active", queued, waiting, marketplace: null };
}

export function isBlockingStatus(kind: ExtensionStatusKind): boolean {
  return kind === "reauth" || kind === "challenge" || kind === "stale";
}

export function offerActionKind(status: OfferStatus): "offer_accept" | "offer_reject" | "offer_counter" | null {
  if (status === "accepted") return "offer_accept";
  if (status === "rejected") return "offer_reject";
  if (status === "counter") return "offer_counter";
  return null;
}
