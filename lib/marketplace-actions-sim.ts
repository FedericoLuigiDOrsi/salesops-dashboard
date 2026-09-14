import {
  MARKETPLACES,
  type ActionPriorityClass,
  type Marketplace,
  type MarketplaceAction,
  type MarketplaceActionKind,
} from "@/types/maat";
import type { ActionDriver } from "./marketplace-actions-driver";
import {
  CANCELLABLE_STATES,
  applyTransition,
  cancelAction,
  enqueueAction,
  isMarketplaceBusy,
  nextClaimable,
  priorityClassOf,
  resumeMarketplace,
  retryAction,
  type EnqueueInput,
} from "./marketplace-actions";

// Simulatore del fattorino. Riproduce le attese del backend reale:
// - conversazioni 15-45 s: services/backend/app/api/publishing/publishingApp.ts, OFFER_GATE_MIN_MS/MAX
// - like 30-120 s: RICHIESTA-2026-08-03-blocco-6-decisioni-consolidate.md §2.3
// - annunci minimo 4 min: services/backend/lib/domain/publishing/throttlePolicy.ts, SPACING_FLOOR_MS
// La durata "in corso" (2-4 s) è un valore di simulazione, non misurato.

export type SimOutcome = "done" | "failed" | "awaiting_challenge" | "needs_reauth";

export interface SimSettings {
  extensionOn: boolean;
  nextOutcome: SimOutcome;
  speed: 1 | 10 | 60;
  accountConnected: boolean;
}

export const DEFAULT_SIM_SETTINGS: SimSettings = {
  extensionOn: true,
  nextOutcome: "done",
  speed: 1,
  accountConnected: true,
};

export const GATE_MS: Record<ActionPriorityClass, readonly [number, number]> = {
  conversation: [15_000, 45_000],
  like: [30_000, 120_000],
  listing: [240_000, 360_000],
};

export const IN_FLIGHT_MS: readonly [number, number] = [2_000, 4_000];

function between([min, max]: readonly [number, number], random: () => number): number {
  return min + random() * (max - min);
}

export function gateFor(kind: MarketplaceActionKind, random: () => number, speed: number): number {
  return Math.round(between(GATE_MS[priorityClassOf(kind)], random) / speed);
}

export interface SimulatedDriver extends ActionDriver {
  tick(): void;
  getSettings(): SimSettings;
  updateSettings(patch: Partial<SimSettings>): void;
  /** Forza la presa di un'azione in coda: serve a riprodurre "Troppo tardi". */
  claimNow(id: string): void;
  clear(): void;
}

export function createSimulatedDriver(
  options: {
    now?: () => number;
    random?: () => number;
    newId?: () => string;
    settings?: Partial<SimSettings>;
  } = {},
): SimulatedDriver {
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  let counter = 0;
  const newId = options.newId ?? (() => `act-${++counter}`);

  let actions: MarketplaceAction[] = [];
  let settings: SimSettings = { ...DEFAULT_SIM_SETTINGS, ...options.settings };
  const settleAt = new Map<string, number>();
  const listeners = new Set<() => void>();

  function notify() {
    listeners.forEach((fn) => fn());
  }

  function set(next: MarketplaceAction[]) {
    if (next === actions) return;
    actions = next;
    notify();
  }

  function claim(action: MarketplaceAction, t: number) {
    settleAt.set(action.id, t + Math.round(between(IN_FLIGHT_MS, random) / settings.speed));
    set(applyTransition(actions, action.id, "submitting", t));
  }

  return {
    getSnapshot: () => actions,

    subscribe(onChange) {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },

    submit(input: EnqueueInput) {
      const result = enqueueAction(actions, input, now(), gateFor(input.kind, random, settings.speed), newId());
      set(result.actions);
      return result.action;
    },

    async cancel(id) {
      const result = cancelAction(actions, id, now());
      set(result.actions);
      return result.result;
    },

    retry(id) {
      const action = actions.find((a) => a.id === id);
      if (!action) return;
      set(retryAction(actions, id, now(), gateFor(action.kind, random, settings.speed)));
    },

    resume(marketplace: Marketplace) {
      set(resumeMarketplace(actions, marketplace, now()));
    },

    tick() {
      const t = now();
      for (const action of actions) {
        if (action.state !== "submitting") continue;
        const at = settleAt.get(action.id);
        if (at === undefined || at > t) continue;
        settleAt.delete(action.id);
        const outcome = settings.nextOutcome;
        if (outcome !== "done") settings = { ...settings, nextOutcome: "done" };
        set(applyTransition(actions, action.id, outcome, t, outcome === "failed" ? { lastError: "Errore simulato" } : {}));
      }
      if (!settings.extensionOn || !settings.accountConnected) return;
      for (const marketplace of MARKETPLACES) {
        const next = nextClaimable(actions, marketplace, t);
        if (next) claim(next, t);
      }
    },

    getSettings: () => settings,

    updateSettings(patch) {
      settings = { ...settings, ...patch };
      notify();
    },

    claimNow(id) {
      const action = actions.find((a) => a.id === id);
      if (!action || !CANCELLABLE_STATES.includes(action.state) || isMarketplaceBusy(actions, action.marketplace)) return;
      claim(action, now());
    },

    clear() {
      settleAt.clear();
      set([]);
    },
  };
}
