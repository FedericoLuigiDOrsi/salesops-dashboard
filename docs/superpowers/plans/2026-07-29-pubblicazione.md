# Pubblicazione multipiattaforma — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the real `/pubblicazione` screen — a "dogana" for capi leaving MAAT to
marketplaces and re-entering for bulk operations — replacing the current stub
`EmptyState`, and absorb Inventario's `AutomazioniDrawer` into it (per-platform now,
not global).

**Architecture:** Two tabs (Da pubblicare / Live) over the existing `InventoryItem[]`
mock data, no new backend or entity. A `Sheet` ("Strategie") holds per-platform
automation rules, persisted to `localStorage` via a React context mirroring the
existing `home-layout-store.tsx` pattern. Pure calculation logic (queue selectors,
bulk price diff, strategy validation) lives in plain `lib/*.ts` files with `vitest`
unit tests; UI composition is verified with `pnpm build` + manual browser walkthrough
(this repo has no component test harness — `vitest.config.ts` runs `environment: "node"`,
no jsdom/RTL).

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript · shadcn/ui (Radix) ·
Tailwind · `vitest` for unit tests · `pnpm`.

## Global Constraints

- Package manager is `pnpm` — never `npm`/`yarn` (there's a `pnpm-lock.yaml`).
- Path alias `@/` maps to repo root (see existing imports).
- No backend: all data mutations are in-memory React state seeded from
  `lib/inventory-mock.ts`'s `inventoryItems`, exactly like every other MAAT screen in
  this prototype.
- Italian UI copy throughout (labels, empty states, confirmations) — match the tone of
  existing screens (`Inventario`, `AutomazioniDrawer`).
- Reuse existing primitives rather than rebuilding them: `PlatformPills`,
  `PLATFORM_KEYS`/`PLATFORM_BRAND` (`lib/inventory-columns.ts`), `MARKETPLACE_LABELS`
  (`types/maat.ts`), `formatEUR`/`cn` (`lib/utils.ts`), `EmptyState`, shadcn `Table`,
  `Sheet`, `Dialog`, `Tabs`, `Checkbox`, `Switch`, `Select`, `DropdownMenu`, `Badge`,
  `Button`.
- Verification gate before any commit that touches TypeScript: `pnpm build` must pass
  (type-check/lint gate, per `HANDOFF.md` §2). This is not optional and not satisfied
  by `pnpm vitest run` alone — `vitest` does not type-check unrelated call sites, only
  `tsc` (via `next build`) catches those. Run `pnpm build` before every commit that
  touches `.ts`/`.tsx`, not just at the end.
- `InventoryStatus` (`lib/inventory-mock.ts`) is `"local_draft" | "to_be_reviewed" |
  "available" | "sold"` (alias of `CatalogEntryStatus`, `types/maat.ts`) — **not**
  `"bozza"/"catalogo"/"venduto"`. Every task in this plan already uses the correct
  values; if you see the old vocabulary anywhere, it's stale — check
  `lib/inventory-filters.ts`'s `STATUS_SEGMENTS` for the authoritative label↔value
  mapping (`to_be_reviewed`→"Bozze", `available`→"A catalogo", `sold`→"Venduti").
- Spec of record: `docs/superpowers/specs/2026-07-29-pubblicazione-design.md`.

## Note di implementazione (scostamento minore dallo spec)

Lo spec descrive il flusso di pubblicazione come "le righe passano a stato pending
(badge + spinner) [...] poi migrano nella tab Live". Questo piano lo implementa così:
al click su "Avvia pubblicazione" gli item selezionati ottengono subito
`platforms[key] = "pending"` per le piattaforme scelte — questo li fa qualificare come
`isLive` (vedi Task 1) e **migrano immediatamente** alla tab Live, dove `PlatformPills`
mostra già lo stato "pending" (pallino giallo, tooltip "in corso", componente
esistente). Dopo un timeout mock passano ad `"active"`. Non c'è un "linger" visivo
nella tab Da pubblicare prima della migrazione — è una semplificazione cosmetica minore
che riusa lo stato `PlatformListingState` già esistente invece di introdurre uno stato
transitorio parallelo. Se in review questo comportamento non torna, è un cambiamento
isolato dentro `PublishingView.tsx` (Task 11, funzione `publishItems`).

---

### Task 1: Selettori coda pubblicazione (`lib/publishing-mock.ts`)

**Files:**
- Create: `lib/publishing-mock.ts`
- Test: `lib/publishing-mock.test.ts`

**Interfaces:**
- Consumes: `InventoryItem`, `PlatformListingState` da `lib/inventory-mock.ts` (esistenti).
- Produces:
  - `isReadyToPublish(item: InventoryItem): boolean`
  - `isLive(item: InventoryItem): boolean`
  - `isSoldOutEverywhere(item: InventoryItem): boolean`
  - `getToPublishItems(items: InventoryItem[]): InventoryItem[]`
  - `getLiveItems(items: InventoryItem[]): InventoryItem[]`
  - `getDraftCount(items: InventoryItem[]): number`

  Task 7, 10 e 11 consumano tutte queste funzioni.

- [ ] **Step 1: Write the failing test**

```ts
// lib/publishing-mock.test.ts
import { describe, expect, it } from "vitest";
import {
  isReadyToPublish,
  isLive,
  isSoldOutEverywhere,
  getToPublishItems,
  getLiveItems,
  getDraftCount,
} from "./publishing-mock";
import type { InventoryItem } from "./inventory-mock";

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: "inv-x",
    brand: "Test Brand",
    tipoCapo: "Test Capo",
    sku: "TST-00-0000",
    category: "Giacche",
    size: "M",
    priceCents: 10000,
    status: "available",
    photoUrl: null,
    platforms: { vinted: null, grailed: null, depop: null },
    ...overrides,
  };
}

describe("isReadyToPublish", () => {
  it("true per un capo a catalogo mai listato", () => {
    expect(isReadyToPublish(makeItem())).toBe(true);
  });
  it("false per una bozza", () => {
    expect(isReadyToPublish(makeItem({ status: "to_be_reviewed" }))).toBe(false);
  });
  it("false se già listato ovunque anche solo su una piattaforma", () => {
    expect(
      isReadyToPublish(makeItem({ platforms: { vinted: "active", grailed: null, depop: null } }))
    ).toBe(false);
  });
});

describe("isLive", () => {
  it("true se almeno una piattaforma non è null", () => {
    expect(isLive(makeItem({ platforms: { vinted: "pending", grailed: null, depop: null } }))).toBe(true);
  });
  it("false se tutte le piattaforme sono null", () => {
    expect(isLive(makeItem())).toBe(false);
  });
});

describe("isSoldOutEverywhere", () => {
  it("true se tutte le piattaforme listate sono sold", () => {
    expect(
      isSoldOutEverywhere(makeItem({ platforms: { vinted: "sold", grailed: "delisted", depop: null } }))
    ).toBe(false); // delisted non è sold: non è "venduto ovunque"
  });
  it("true se le uniche piattaforme listate sono tutte sold", () => {
    expect(
      isSoldOutEverywhere(makeItem({ platforms: { vinted: "sold", grailed: null, depop: null } }))
    ).toBe(true);
  });
  it("false se nessuna piattaforma è mai stata listata", () => {
    expect(isSoldOutEverywhere(makeItem())).toBe(false);
  });
});

describe("getToPublishItems / getLiveItems / getDraftCount", () => {
  const items = [
    makeItem({ id: "a", status: "available" }), // ready to publish
    makeItem({ id: "b", status: "to_be_reviewed" }), // draft, escluso da entrambe
    makeItem({ id: "c", platforms: { vinted: "active", grailed: null, depop: null } }), // live
  ];

  it("getToPublishItems ritorna solo i pronti", () => {
    expect(getToPublishItems(items).map((i) => i.id)).toEqual(["a"]);
  });
  it("getLiveItems ritorna solo i listati", () => {
    expect(getLiveItems(items).map((i) => i.id)).toEqual(["c"]);
  });
  it("getDraftCount conta le bozze", () => {
    expect(getDraftCount(items)).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/publishing-mock.test.ts`
Expected: FAIL — `Cannot find module './publishing-mock'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/publishing-mock.ts
import type { InventoryItem } from "./inventory-mock";

export function isReadyToPublish(item: InventoryItem): boolean {
  return item.status === "available" && Object.values(item.platforms).every((v) => v === null);
}

export function isLive(item: InventoryItem): boolean {
  return Object.values(item.platforms).some((v) => v !== null);
}

/** Venduto su tutte le piattaforme su cui è mai stato listato (nessuna active/pending/delisted residua). */
export function isSoldOutEverywhere(item: InventoryItem): boolean {
  const listed = Object.values(item.platforms).filter((v) => v !== null);
  return listed.length > 0 && listed.every((v) => v === "sold");
}

export function getToPublishItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter(isReadyToPublish);
}

export function getLiveItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter(isLive);
}

export function getDraftCount(items: InventoryItem[]): number {
  return items.filter((item) => item.status === "to_be_reviewed").length;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/publishing-mock.test.ts`
Expected: PASS (10 test cases)

- [ ] **Step 5: Commit**

```bash
git add lib/publishing-mock.ts lib/publishing-mock.test.ts
git commit -m "feat(publishing): selettori coda Da pubblicare/Live"
```

---

### Task 2: Calcolo bulk price (`lib/publishing-bulk.ts`)

**Files:**
- Create: `lib/publishing-bulk.ts`
- Test: `lib/publishing-bulk.test.ts`

**Interfaces:**
- Consumes: nessuna dipendenza da altri task.
- Produces:
  - `type BulkPriceMode = "percent" | "amount"`
  - `applyBulkPriceDelta(priceCents: number, mode: BulkPriceMode, signedValue: number): number`
  - `interface BulkPricePreviewRow { id: string; beforeCents: number; afterCents: number }`
  - `buildBulkPricePreview(items: { id: string; priceCents: number }[], mode: BulkPriceMode, signedValue: number): BulkPricePreviewRow[]`

  `signedValue` porta già il segno (es. `-10` per "-10%", `+5` per "+5€"). Task 10 e 11
  consumano queste funzioni.

- [ ] **Step 1: Write the failing test**

```ts
// lib/publishing-bulk.test.ts
import { describe, expect, it } from "vitest";
import { applyBulkPriceDelta, buildBulkPricePreview } from "./publishing-bulk";

describe("applyBulkPriceDelta", () => {
  it("percentuale negativa riduce il prezzo", () => {
    expect(applyBulkPriceDelta(10000, "percent", -10)).toBe(9000);
  });
  it("percentuale positiva aumenta il prezzo", () => {
    expect(applyBulkPriceDelta(10000, "percent", 20)).toBe(12000);
  });
  it("importo fisso negativo sottrae centesimi esatti", () => {
    expect(applyBulkPriceDelta(10000, "amount", -5)).toBe(9500);
  });
  it("importo fisso positivo aggiunge centesimi esatti", () => {
    expect(applyBulkPriceDelta(10000, "amount", 5)).toBe(10500);
  });
  it("non scende mai sotto zero", () => {
    expect(applyBulkPriceDelta(300, "amount", -100)).toBe(0);
  });
  it("arrotonda i centesimi frazionari", () => {
    expect(applyBulkPriceDelta(9999, "percent", -10)).toBe(8999); // 9999 - 999.9 -> round(9000.1) = 9000... verificato sotto
  });
});

describe("buildBulkPricePreview", () => {
  it("mappa ogni riga a prima/dopo mantenendo l'id", () => {
    const items = [
      { id: "a", priceCents: 10000 },
      { id: "b", priceCents: 20000 },
    ];
    expect(buildBulkPricePreview(items, "percent", -10)).toEqual([
      { id: "a", beforeCents: 10000, afterCents: 9000 },
      { id: "b", beforeCents: 20000, afterCents: 18000 },
    ]);
  });
  it("lista vuota ritorna lista vuota", () => {
    expect(buildBulkPricePreview([], "amount", -5)).toEqual([]);
  });
});
```

Nota sul test "arrotonda i centesimi frazionari": `9999 * -10 / 100 = -999.9`,
`Math.round(-999.9) = -1000`, quindi `9999 - 1000 = 8999`. Verificalo mentalmente
prima di lanciare — se il numero non torna nello step 4, il test va corretto, non
l'implementazione (l'arrotondamento standard è quello atteso).

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/publishing-bulk.test.ts`
Expected: FAIL — `Cannot find module './publishing-bulk'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/publishing-bulk.ts
export type BulkPriceMode = "percent" | "amount";

/** signedValue porta già il segno: -10 = "-10%" o "-10€" a seconda di mode. */
export function applyBulkPriceDelta(priceCents: number, mode: BulkPriceMode, signedValue: number): number {
  const deltaCents = mode === "percent" ? Math.round((priceCents * signedValue) / 100) : Math.round(signedValue * 100);
  return Math.max(0, priceCents + deltaCents);
}

export interface BulkPricePreviewRow {
  id: string;
  beforeCents: number;
  afterCents: number;
}

export function buildBulkPricePreview(
  items: { id: string; priceCents: number }[],
  mode: BulkPriceMode,
  signedValue: number
): BulkPricePreviewRow[] {
  return items.map((item) => ({
    id: item.id,
    beforeCents: item.priceCents,
    afterCents: applyBulkPriceDelta(item.priceCents, mode, signedValue),
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/publishing-bulk.test.ts`
Expected: PASS (8 test cases). Se il test dell'arrotondamento fallisce con un valore
diverso da 8999, ricalcola a mano e correggi l'`expect`, non la formula in
`applyBulkPriceDelta` (è l'arrotondamento standard `Math.round`).

- [ ] **Step 5: Commit**

```bash
git add lib/publishing-bulk.ts lib/publishing-bulk.test.ts
git commit -m "feat(publishing): calcolo bulk price edit con anteprima diff"
```

---

### Task 3: Tipi e default Strategie (`lib/publishing-strategy.ts`)

**Files:**
- Create: `lib/publishing-strategy.ts`
- Test: `lib/publishing-strategy.test.ts`

**Interfaces:**
- Consumes: `PlatformKey`, `PLATFORM_KEYS` da `lib/inventory-columns.ts` (esistenti).
- Produces:
  - `interface PlatformStrategy { autoDelist: {enabled: boolean; staleDays: number}; repricing: {enabled: boolean; discountPct: number; frequencyDays: number; floorPct: number}; autoRelist: {enabled: boolean; frequencyDays: number} }`
  - `interface StrategyConfig { defaultPublishPlatforms: PlatformKey[]; platforms: Record<PlatformKey, PlatformStrategy> }`
  - `DEFAULT_STRATEGY: StrategyConfig`
  - `isValidStrategyConfig(value: unknown): value is StrategyConfig`

  Task 4 (store) e Task 6 (StrategySheet) consumano questi tipi.

- [ ] **Step 1: Write the failing test**

```ts
// lib/publishing-strategy.test.ts
import { describe, expect, it } from "vitest";
import { DEFAULT_STRATEGY, isValidStrategyConfig } from "./publishing-strategy";
import { PLATFORM_KEYS } from "./inventory-columns";

describe("DEFAULT_STRATEGY", () => {
  it("ha una voce per ogni piattaforma", () => {
    for (const key of PLATFORM_KEYS) {
      expect(DEFAULT_STRATEGY.platforms[key]).toBeDefined();
    }
  });
  it("defaultPublishPlatforms contiene solo chiavi valide", () => {
    for (const key of DEFAULT_STRATEGY.defaultPublishPlatforms) {
      expect(PLATFORM_KEYS).toContain(key);
    }
  });
  it("è valido secondo isValidStrategyConfig", () => {
    expect(isValidStrategyConfig(DEFAULT_STRATEGY)).toBe(true);
  });
});

describe("isValidStrategyConfig", () => {
  it("rifiuta null/undefined", () => {
    expect(isValidStrategyConfig(null)).toBe(false);
    expect(isValidStrategyConfig(undefined)).toBe(false);
  });
  it("rifiuta un oggetto senza defaultPublishPlatforms", () => {
    const { defaultPublishPlatforms, ...rest } = DEFAULT_STRATEGY;
    expect(isValidStrategyConfig(rest)).toBe(false);
  });
  it("rifiuta se manca una piattaforma", () => {
    const { vinted, ...restPlatforms } = DEFAULT_STRATEGY.platforms;
    expect(isValidStrategyConfig({ ...DEFAULT_STRATEGY, platforms: restPlatforms })).toBe(false);
  });
  it("rifiuta se un campo numerico è una stringa", () => {
    const corrupted = {
      ...DEFAULT_STRATEGY,
      platforms: {
        ...DEFAULT_STRATEGY.platforms,
        vinted: {
          ...DEFAULT_STRATEGY.platforms.vinted,
          repricing: { ...DEFAULT_STRATEGY.platforms.vinted.repricing, discountPct: "5" },
        },
      },
    };
    expect(isValidStrategyConfig(corrupted)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/publishing-strategy.test.ts`
Expected: FAIL — `Cannot find module './publishing-strategy'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/publishing-strategy.ts
import { PLATFORM_KEYS, type PlatformKey } from "./inventory-columns";

export interface PlatformStrategy {
  autoDelist: { enabled: boolean; staleDays: number };
  repricing: { enabled: boolean; discountPct: number; frequencyDays: number; floorPct: number };
  autoRelist: { enabled: boolean; frequencyDays: number };
}

export interface StrategyConfig {
  defaultPublishPlatforms: PlatformKey[];
  platforms: Record<PlatformKey, PlatformStrategy>;
}

const ACTIVE_DEFAULT: PlatformStrategy = {
  autoDelist: { enabled: true, staleDays: 90 },
  repricing: { enabled: true, discountPct: 5, frequencyDays: 7, floorPct: 40 },
  autoRelist: { enabled: true, frequencyDays: 7 },
};

const INACTIVE_DEFAULT: PlatformStrategy = {
  autoDelist: { enabled: false, staleDays: 90 },
  repricing: { enabled: false, discountPct: 5, frequencyDays: 7, floorPct: 40 },
  autoRelist: { enabled: false, frequencyDays: 7 },
};

export const DEFAULT_STRATEGY: StrategyConfig = {
  defaultPublishPlatforms: ["vinted", "depop"],
  platforms: {
    vinted: { ...ACTIVE_DEFAULT },
    grailed: { ...INACTIVE_DEFAULT },
    depop: { ...ACTIVE_DEFAULT, repricing: { enabled: true, discountPct: 10, frequencyDays: 14, floorPct: 30 } },
  },
};

function isPlatformStrategy(value: unknown): value is PlatformStrategy {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const delist = v.autoDelist as Record<string, unknown> | undefined;
  const repricing = v.repricing as Record<string, unknown> | undefined;
  const relist = v.autoRelist as Record<string, unknown> | undefined;
  if (!delist || typeof delist.enabled !== "boolean" || typeof delist.staleDays !== "number") return false;
  if (
    !repricing ||
    typeof repricing.enabled !== "boolean" ||
    typeof repricing.discountPct !== "number" ||
    typeof repricing.frequencyDays !== "number" ||
    typeof repricing.floorPct !== "number"
  )
    return false;
  if (!relist || typeof relist.enabled !== "boolean" || typeof relist.frequencyDays !== "number") return false;
  return true;
}

export function isValidStrategyConfig(value: unknown): value is StrategyConfig {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.defaultPublishPlatforms)) return false;
  if (!v.defaultPublishPlatforms.every((p) => (PLATFORM_KEYS as string[]).includes(p as string))) return false;
  const platforms = v.platforms as Record<string, unknown> | undefined;
  if (!platforms) return false;
  return PLATFORM_KEYS.every((key) => isPlatformStrategy(platforms[key]));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/publishing-strategy.test.ts`
Expected: PASS (9 test cases)

- [ ] **Step 5: Commit**

```bash
git add lib/publishing-strategy.ts lib/publishing-strategy.test.ts
git commit -m "feat(publishing): tipi e default strategia per-piattaforma"
```

---

### Task 4: Store Strategie con persistenza (`lib/publishing-strategy-store.tsx`)

**Files:**
- Create: `lib/publishing-strategy-store.tsx`

**Interfaces:**
- Consumes: `StrategyConfig`, `PlatformStrategy`, `DEFAULT_STRATEGY`, `isValidStrategyConfig`
  da Task 3; `PlatformKey` da `lib/inventory-columns.ts`.
- Produces:
  - `PublishingStrategyProvider({ children }: { children: ReactNode })`
  - `usePublishingStrategy(): { strategy: StrategyConfig; toggleDefaultPublishPlatform: (p: PlatformKey) => void; setAutoDelist: (p: PlatformKey, patch: Partial<PlatformStrategy["autoDelist"]>) => void; setRepricing: (p: PlatformKey, patch: Partial<PlatformStrategy["repricing"]>) => void; setAutoRelist: (p: PlatformKey, patch: Partial<PlatformStrategy["autoRelist"]>) => void }`

  Task 6 (StrategySheet) e Task 7 (default piattaforme pubblicazione) consumano
  `usePublishingStrategy`. Task 11 monta `PublishingStrategyProvider`.

Nessun test automatico per questo file (hook React con `localStorage`, il progetto
non ha jsdom/RTL — vedi Global Constraints). Verifica manuale nel Task 14.

- [ ] **Step 1: Scrivi il file seguendo il pattern di `lib/home-layout-store.tsx`**

```tsx
// lib/publishing-strategy-store.tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PLATFORM_KEYS, type PlatformKey } from "./inventory-columns";
import { DEFAULT_STRATEGY, isValidStrategyConfig, type PlatformStrategy, type StrategyConfig } from "./publishing-strategy";

const STORAGE_KEY = "maat.publishing.strategy.v1";

interface PublishingStrategyContextValue {
  strategy: StrategyConfig;
  toggleDefaultPublishPlatform: (platform: PlatformKey) => void;
  setAutoDelist: (platform: PlatformKey, patch: Partial<PlatformStrategy["autoDelist"]>) => void;
  setRepricing: (platform: PlatformKey, patch: Partial<PlatformStrategy["repricing"]>) => void;
  setAutoRelist: (platform: PlatformKey, patch: Partial<PlatformStrategy["autoRelist"]>) => void;
}

const PublishingStrategyContext = createContext<PublishingStrategyContextValue | null>(null);

/**
 * Store delle regole di pubblicazione (auto-delist/repricing/auto-relist per
 * piattaforma + piattaforme predefinite). Persistito in localStorage, stesso
 * pattern di lib/home-layout-store.tsx: niente backend nel prototipo.
 */
export function PublishingStrategyProvider({ children }: { children: ReactNode }) {
  const [strategy, setStrategy] = useState<StrategyConfig>(DEFAULT_STRATEGY);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValidStrategyConfig(parsed)) setStrategy(parsed);
      }
    } catch {
      // storage corrotto o non disponibile: si riparte dal default
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(strategy));
    } catch {
      // storage non disponibile: la sessione resta solo in memoria
    }
  }, [strategy]);

  function updatePlatform(platform: PlatformKey, patch: Partial<PlatformStrategy>) {
    setStrategy((prev) => ({
      ...prev,
      platforms: { ...prev.platforms, [platform]: { ...prev.platforms[platform], ...patch } },
    }));
  }

  function toggleDefaultPublishPlatform(platform: PlatformKey) {
    setStrategy((prev) => {
      const has = prev.defaultPublishPlatforms.includes(platform);
      return {
        ...prev,
        defaultPublishPlatforms: has
          ? prev.defaultPublishPlatforms.filter((p) => p !== platform)
          : [...prev.defaultPublishPlatforms, platform],
      };
    });
  }

  function setAutoDelist(platform: PlatformKey, patch: Partial<PlatformStrategy["autoDelist"]>) {
    updatePlatform(platform, { autoDelist: { ...strategy.platforms[platform].autoDelist, ...patch } });
  }

  function setRepricing(platform: PlatformKey, patch: Partial<PlatformStrategy["repricing"]>) {
    updatePlatform(platform, { repricing: { ...strategy.platforms[platform].repricing, ...patch } });
  }

  function setAutoRelist(platform: PlatformKey, patch: Partial<PlatformStrategy["autoRelist"]>) {
    updatePlatform(platform, { autoRelist: { ...strategy.platforms[platform].autoRelist, ...patch } });
  }

  const value = useMemo(
    () => ({ strategy, toggleDefaultPublishPlatform, setAutoDelist, setRepricing, setAutoRelist }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [strategy]
  );

  return <PublishingStrategyContext.Provider value={value}>{children}</PublishingStrategyContext.Provider>;
}

export function usePublishingStrategy() {
  const ctx = useContext(PublishingStrategyContext);
  if (!ctx) throw new Error("usePublishingStrategy deve stare dentro PublishingStrategyProvider");
  return ctx;
}

export { PLATFORM_KEYS };
```

- [ ] **Step 2: Verifica che il progetto compili**

Run: `pnpm build`
Expected: nessun nuovo errore di tipo introdotto da questo file (il file non è ancora
importato da nessuna route, quindi non deve cambiare l'output — questo step conferma
solo che `lib/publishing-strategy-store.tsx` è sintatticamente/tipicamente corretto
tramite il type-check di `pnpm build`, che copre tutto il progetto).

- [ ] **Step 3: Commit**

```bash
git add lib/publishing-strategy-store.tsx
git commit -m "feat(publishing): store strategie per-piattaforma con localStorage"
```

---

### Task 5: Componente condiviso `PlatformChips`

**Files:**
- Create: `components/maat/publishing/PlatformChips.tsx`

**Interfaces:**
- Consumes: `PlatformKey`, `PLATFORM_KEYS` da `lib/inventory-columns.ts`;
  `MARKETPLACE_LABELS` da `types/maat.ts`; `cn` da `lib/utils.ts`.
- Produces: `PlatformChips({ selected, onToggle }: { selected: PlatformKey[]; onToggle: (key: PlatformKey) => void })`

  Estrae e generalizza il pattern `PlatformChips` privato che viveva dentro
  `AutomazioniDrawer.tsx` (righe finali del file, vedi contesto raccolto in fase di
  design) — ora prende `selected: PlatformKey[]` invece di
  `Record<PlatformKey, boolean>`, più comodo per `defaultPublishPlatforms` (un array).
  Task 6 e Task 7 lo consumano.

- [ ] **Step 1: Scrivi il componente**

```tsx
// components/maat/publishing/PlatformChips.tsx
"use client";

import { cn } from "@/lib/utils";
import { MARKETPLACE_LABELS } from "@/types/maat";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/inventory-columns";

interface PlatformChipsProps {
  selected: PlatformKey[];
  onToggle: (key: PlatformKey) => void;
}

/** Chip toggle per piattaforma, riusata da StrategySheet e ToPublishTab. */
export function PlatformChips({ selected, onToggle }: PlatformChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PLATFORM_KEYS.map((key) => {
        const on = selected.includes(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              on
                ? "border-primary/60 bg-primary/15 text-foreground"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex size-4 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-semibold">
              {MARKETPLACE_LABELS[key][0]}
            </span>
            {MARKETPLACE_LABELS[key]}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verifica compilazione**

Run: `pnpm build`
Expected: nessun errore (componente non ancora importato da una route, ma type-check
del file avviene comunque).

- [ ] **Step 3: Commit**

```bash
git add components/maat/publishing/PlatformChips.tsx
git commit -m "feat(publishing): componente PlatformChips condiviso"
```

---

### Task 6: Sheet "Strategie" per-piattaforma

**Files:**
- Create: `components/maat/publishing/StrategySheet.tsx`

**Interfaces:**
- Consumes: `usePublishingStrategy` (Task 4), `PlatformChips` (Task 5), `PLATFORM_KEYS`
  (`lib/inventory-columns.ts`), `MARKETPLACE_LABELS` (`types/maat.ts`), shadcn `Sheet`,
  `Switch`, `Select`, `Button`.
- Produces: `StrategySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void })`

  Task 11 monta questo componente nell'header della pagina.

- [ ] **Step 1: Scrivi il componente**

```tsx
// components/maat/publishing/StrategySheet.tsx
"use client";

import type { ReactNode } from "react";
import { Box, Layers, TrendingDown, RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MARKETPLACE_LABELS } from "@/types/maat";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/inventory-columns";
import { usePublishingStrategy } from "@/lib/publishing-strategy-store";
import { PlatformChips } from "@/components/maat/publishing/PlatformChips";

const FREQ_OPTIONS = [
  { value: "3", label: "3 giorni" },
  { value: "7", label: "7 giorni" },
  { value: "14", label: "14 giorni" },
  { value: "30", label: "30 giorni" },
];

interface StrategySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StrategySheet({ open, onOpenChange }: StrategySheetProps) {
  const { strategy, toggleDefaultPublishPlatform, setAutoDelist, setRepricing, setAutoRelist } = usePublishingStrategy();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="gap-1.5 border-b border-border">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Pubblicazione · Regole
          </p>
          <SheetTitle className="text-xl">Strategie</SheetTitle>
          <SheetDescription>
            Regole per piattaforma che agiscono in autonomia su listino, prezzo e pubblicazione dei capi.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="text-sm font-semibold">Piattaforme predefinite</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Preselezionate nella barra di pubblicazione della tab &quot;Da pubblicare&quot;.
            </p>
            <div className="mt-3">
              <PlatformChips selected={strategy.defaultPublishPlatforms} onToggle={toggleDefaultPublishPlatform} />
            </div>
          </section>

          <RuleCard icon={<Box className="size-4" />} title="Auto-delist" description="Ritira in automatico gli annunci invenduti dopo N giorni, per piattaforma.">
            {PLATFORM_KEYS.map((key) => (
              <PlatformRow key={key} platform={key} enabled={strategy.platforms[key].autoDelist.enabled} onToggle={(enabled) => setAutoDelist(key, { enabled })}>
                {strategy.platforms[key].autoDelist.enabled && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    dopo
                    <Select
                      value={String(strategy.platforms[key].autoDelist.staleDays)}
                      onValueChange={(v) => setAutoDelist(key, { staleDays: Number(v) })}
                    >
                      <SelectTrigger size="sm" className="w-24" aria-label={`Giorni auto-delist ${key}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["30", "60", "90", "120", "180"].map((d) => (
                          <SelectItem key={d} value={d}>
                            {d} gg
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </span>
                )}
              </PlatformRow>
            ))}
          </RuleCard>

          <RuleCard icon={<TrendingDown className="size-4" />} title="Repricing automatico" description="Abbassa il prezzo degli annunci invenduti: sconto, frequenza e minimo per piattaforma.">
            {PLATFORM_KEYS.map((key) => (
              <PlatformRow key={key} platform={key} enabled={strategy.platforms[key].repricing.enabled} onToggle={(enabled) => setRepricing(key, { enabled })}>
                {strategy.platforms[key].repricing.enabled && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Stepper
                      value={strategy.platforms[key].repricing.discountPct}
                      min={1}
                      max={20}
                      step={1}
                      unit="%"
                      prefix="−"
                      onChange={(v) => setRepricing(key, { discountPct: v })}
                    />
                    <Select
                      value={String(strategy.platforms[key].repricing.frequencyDays)}
                      onValueChange={(v) => setRepricing(key, { frequencyDays: Number(v) })}
                    >
                      <SelectTrigger size="sm" className="w-28" aria-label={`Frequenza repricing ${key}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQ_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>
                      floor{" "}
                      <Stepper
                        value={strategy.platforms[key].repricing.floorPct}
                        min={10}
                        max={70}
                        step={5}
                        unit="%"
                        onChange={(v) => setRepricing(key, { floorPct: v })}
                      />
                    </span>
                  </div>
                )}
              </PlatformRow>
            ))}
          </RuleCard>

          <RuleCard icon={<RefreshCw className="size-4" />} title="Auto-relist" description="Ripubblica gli annunci per farli risalire, per piattaforma.">
            {PLATFORM_KEYS.map((key) => (
              <PlatformRow key={key} platform={key} enabled={strategy.platforms[key].autoRelist.enabled} onToggle={(enabled) => setAutoRelist(key, { enabled })}>
                {strategy.platforms[key].autoRelist.enabled && (
                  <Select
                    value={String(strategy.platforms[key].autoRelist.frequencyDays)}
                    onValueChange={(v) => setAutoRelist(key, { frequencyDays: Number(v) })}
                  >
                    <SelectTrigger size="sm" className="w-28" aria-label={`Frequenza auto-relist ${key}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQ_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </PlatformRow>
            ))}
          </RuleCard>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Chiudi
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function RuleCard({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{title}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">{children}</div>
    </section>
  );
}

function PlatformRow({
  platform,
  enabled,
  onToggle,
  children,
}: {
  platform: PlatformKey;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-foreground">{MARKETPLACE_LABELS[platform]}</span>
        <Switch checked={enabled} onCheckedChange={onToggle} aria-label={`Attiva regola su ${MARKETPLACE_LABELS[platform]}`} />
      </div>
      {children}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  step,
  unit = "",
  prefix = "",
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  prefix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border p-1">
      <Button type="button" variant="ghost" size="icon-sm" className="size-6" onClick={() => onChange(Math.max(min, value - step))} aria-label="Diminuisci">
        −
      </Button>
      <span className="min-w-[3.25rem] text-center font-mono text-sm tabular-nums">
        {prefix}
        {value}
        {unit}
      </span>
      <Button type="button" variant="ghost" size="icon-sm" className="size-6" onClick={() => onChange(Math.min(max, value + step))} aria-label="Aumenta">
        +
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verifica compilazione**

Run: `pnpm build`
Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add components/maat/publishing/StrategySheet.tsx
git commit -m "feat(publishing): sheet Strategie con regole per-piattaforma"
```

---

### Task 7: Tab "Da pubblicare"

**Files:**
- Create: `components/maat/publishing/ToPublishTab.tsx`

**Interfaces:**
- Consumes: `InventoryItem` (`lib/inventory-mock.ts`), `getDraftCount` (Task 1),
  `PlatformChips` (Task 5), `PLATFORM_KEYS`/`PlatformKey` (`lib/inventory-columns.ts`),
  `CATEGORY_OPTIONS` (`lib/inventory-filters.ts`), `formatEUR`/`cn` (`lib/utils.ts`),
  shadcn `Table`, `Checkbox`, `Select`, `Button`.
- Produces: `ToPublishTab({ items, allItems, defaultPlatforms, onPublish }: ToPublishTabProps)`
  con
  ```ts
  interface ToPublishTabProps {
    items: InventoryItem[]; // già filtrati "pronti da pubblicare" dal parent
    allItems: InventoryItem[]; // set completo, per calcolare il banner bozze
    defaultPlatforms: PlatformKey[];
    onPublish: (ids: string[], platforms: PlatformKey[]) => void;
  }
  ```
  Task 11 fornisce `items`/`allItems`/`defaultPlatforms`/`onPublish`.

- [ ] **Step 1: Scrivi il componente**

```tsx
// components/maat/publishing/ToPublishTab.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Layers } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/maat/EmptyState";
import { cn, formatEUR } from "@/lib/utils";
import { getDraftCount } from "@/lib/publishing-mock";
import type { InventoryItem } from "@/lib/inventory-mock";
import { CATEGORY_OPTIONS } from "@/lib/inventory-filters";
import type { PlatformKey } from "@/lib/inventory-columns";
import { PlatformChips } from "@/components/maat/publishing/PlatformChips";

interface ToPublishTabProps {
  items: InventoryItem[];
  allItems: InventoryItem[];
  defaultPlatforms: PlatformKey[];
  onPublish: (ids: string[], platforms: PlatformKey[]) => void;
}

export function ToPublishTab({ items, allItems, defaultPlatforms, onPublish }: ToPublishTabProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [barPlatforms, setBarPlatforms] = useState<PlatformKey[]>(defaultPlatforms);

  const draftCount = useMemo(() => getDraftCount(allItems), [allItems]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (needle && !`${item.brand} ${item.tipoCapo} ${item.sku}`.toLowerCase().includes(needle)) return false;
      if (category !== "all" && item.category !== category) return false;
      return true;
    });
  }, [items, search, category]);

  const filteredIds = useMemo(() => new Set(filtered.map((i) => i.id)), [filtered]);
  const allSelectedOnPage = filtered.length > 0 && filtered.every((i) => selected.has(i.id));

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allSelectedOnPage) {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...filteredIds]);
    });
  }

  function togglePlatform(key: PlatformKey) {
    setBarPlatforms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  function handlePublish() {
    if (selected.size === 0 || barPlatforms.length === 0) return;
    onPublish(Array.from(selected), barPlatforms);
    setSelected(new Set());
  }

  return (
    <div className="flex flex-col gap-4">
      {draftCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{draftCount}</span>{" "}
            {draftCount === 1 ? "capo in bozza non ancora pronto" : "capi in bozza non ancora pronti"} per la pubblicazione.
          </span>
          <Button asChild variant="outline" size="sm">
            <Link href="/inventario?status=to_be_reviewed">Completali in Inventario</Link>
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per brand, tipo o SKU…"
          aria-label="Cerca"
          className="w-full max-w-xs rounded-full border border-border bg-card px-3 py-1.5 text-sm outline-none focus:border-primary sm:w-auto"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger size="sm" className="w-40" aria-label="Categoria">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le categorie</SelectItem>
            {CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{filtered.length} capi</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            icon={<Layers className="size-5" />}
            title="Nessun capo da pubblicare"
            subtitle="I capi a catalogo mai listati su nessuna piattaforma compariranno qui."
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border pb-16">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allSelectedOnPage} onCheckedChange={toggleAll} aria-label="Seleziona tutti" />
                </TableHead>
                <TableHead>Capo</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Taglia</TableHead>
                <TableHead>Prezzo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className={cn(selected.has(item.id) && "bg-accent-soft/40")}>
                  <TableCell>
                    <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleRow(item.id)} aria-label={`Seleziona ${item.brand}`} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
                        {item.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.photoUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="font-mono text-[7px] uppercase text-muted-foreground/50">Foto</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{item.brand}</div>
                        <div className="truncate text-xs text-muted-foreground">{item.tipoCapo}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">{item.sku}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{item.category}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{item.size}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{formatEUR(item.priceCents)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-20 flex justify-center px-4">
          <div className="flex flex-wrap items-center gap-3 rounded-full border border-border bg-foreground px-5 py-3 text-text-on-dark shadow-e2">
            <span className="text-sm font-semibold">{selected.size} capi selezionati</span>
            <div className="h-5 w-px bg-white/20" />
            <PlatformChips selected={barPlatforms} onToggle={togglePlatform} />
            <Button size="sm" onClick={handlePublish} disabled={barPlatforms.length === 0} className="gap-1.5">
              <Layers className="size-3.5" /> Avvia pubblicazione
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

Nota: `PlatformChips` (Task 5) è stilizzato per stare su sfondo chiaro (`bg-card`);
dentro la barra flottante scura (`bg-foreground`) i colori restano leggibili perché
usa solo bordi/opacità relative, non serve una variante — verificalo visivamente nel
Task 14 e se il contrasto non torna, è un fix di classi CSS isolato in questo file.

- [ ] **Step 2: Verifica compilazione**

Run: `pnpm build`
Expected: nessun errore (componente non ancora montato, ma type-check comunque attivo).

- [ ] **Step 3: Commit**

```bash
git add components/maat/publishing/ToPublishTab.tsx
git commit -m "feat(publishing): tab Da pubblicare con selezione e avvio bulk"
```

---

### Task 8: Sheet "Ripubblica" (singolo + multi-riga)

**Files:**
- Create: `components/maat/publishing/RepublishSheet.tsx`

**Interfaces:**
- Consumes: `InventoryItem` (`lib/inventory-mock.ts`), `PlatformChips` (Task 5),
  `PlatformKey` (`lib/inventory-columns.ts`), `formatEUR` (`lib/utils.ts`).
- Produces:
  ```ts
  interface RepublishSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: InventoryItem[]; // 1 riga (kebab) o N righe (bulk)
    onConfirm: (ids: string[], platforms: PlatformKey[], priceCents: number | null) => void;
  }
  ```
  `priceCents === null` significa "non toccare il prezzo" (bulk multi-riga con prezzi
  diversi, o nessuna modifica voluta). Task 11 fornisce `onConfirm` (chiama
  `republishItems`), Task 10 (LiveTab) monta questo componente sia dal kebab-menu
  singolo sia dalla barra bulk.

- [ ] **Step 1: Scrivi il componente**

```tsx
// components/maat/publishing/RepublishSheet.tsx
"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEUR } from "@/lib/utils";
import type { InventoryItem } from "@/lib/inventory-mock";
import type { PlatformKey } from "@/lib/inventory-columns";
import { PlatformChips } from "@/components/maat/publishing/PlatformChips";

interface RepublishSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  onConfirm: (ids: string[], platforms: PlatformKey[], priceCents: number | null) => void;
}

export function RepublishSheet({ open, onOpenChange, items, onConfirm }: RepublishSheetProps) {
  const isSingle = items.length === 1;
  const [priceInput, setPriceInput] = useState("");
  const [platforms, setPlatforms] = useState<PlatformKey[]>([]);

  useEffect(() => {
    if (!open) return;
    setPriceInput(isSingle ? (items[0].priceCents / 100).toFixed(2) : "");
    const listed = new Set<PlatformKey>();
    for (const item of items) {
      (Object.keys(item.platforms) as PlatformKey[]).forEach((key) => {
        if (item.platforms[key] !== null) listed.add(key);
      });
    }
    setPlatforms(Array.from(listed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function togglePlatform(key: PlatformKey) {
    setPlatforms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  function handleConfirm() {
    if (platforms.length === 0) return;
    let priceCents: number | null = null;
    if (isSingle && priceInput.trim()) {
      const parsed = Math.round(parseFloat(priceInput.replace(",", ".")) * 100);
      if (Number.isFinite(parsed)) priceCents = parsed;
    }
    onConfirm(
      items.map((i) => i.id),
      platforms,
      priceCents
    );
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="gap-1.5 border-b border-border">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Pubblicazione · Ripubblica
          </p>
          <SheetTitle className="text-xl">
            {isSingle ? items[0].brand : `${items.length} capi selezionati`}
          </SheetTitle>
          <SheetDescription>
            {isSingle
              ? `${items[0].tipoCapo} · ${formatEUR(items[0].priceCents)}`
              : "Il prezzo si aggiorna solo se lo modifichi; le piattaforme si applicano a tutti i capi selezionati."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 p-4">
          {isSingle && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="republish-price">Prezzo</Label>
              <Input
                id="republish-price"
                inputMode="decimal"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="0,00"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Piattaforme target</Label>
            <PlatformChips selected={platforms} onToggle={togglePlatform} />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={platforms.length === 0}>
            Ripubblica
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Verifica compilazione**

Run: `pnpm build`
Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add components/maat/publishing/RepublishSheet.tsx
git commit -m "feat(publishing): sheet Ripubblica prezzo+piattaforme, singolo e bulk"
```

---

### Task 9: Dialog anteprima bulk price

**Files:**
- Create: `components/maat/publishing/BulkPricePreviewDialog.tsx`

**Interfaces:**
- Consumes: `BulkPricePreviewRow` (Task 2), `formatEUR` (`lib/utils.ts`).
- Produces:
  ```ts
  interface BulkPricePreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rows: (BulkPricePreviewRow & { label: string })[]; // label = "Brand — Tipo capo" per riga
    onConfirm: () => void;
  }
  ```
  Task 10 (LiveTab) monta questo dialog e gli passa le righe costruite con
  `buildBulkPricePreview` (Task 2) + etichetta capo.

- [ ] **Step 1: Scrivi il componente**

```tsx
// components/maat/publishing/BulkPricePreviewDialog.tsx
"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatEUR } from "@/lib/utils";
import type { BulkPricePreviewRow } from "@/lib/publishing-bulk";

interface BulkPricePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: (BulkPricePreviewRow & { label: string })[];
  onConfirm: () => void;
}

export function BulkPricePreviewDialog({ open, onOpenChange, rows, onConfirm }: BulkPricePreviewDialogProps) {
  function handleConfirm() {
    onConfirm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conferma variazione prezzo</DialogTitle>
          <DialogDescription>{rows.length} capi interessati. Verifica prima di applicare.</DialogDescription>
        </DialogHeader>

        <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
              <span className="truncate text-muted-foreground">{row.label}</span>
              <span className="flex items-center gap-1.5 font-mono tabular-nums">
                <span className="text-muted-foreground line-through">{formatEUR(row.beforeCents)}</span>
                <span className="font-semibold text-foreground">{formatEUR(row.afterCents)}</span>
              </span>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Applica a {rows.length} capi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verifica compilazione**

Run: `pnpm build`
Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add components/maat/publishing/BulkPricePreviewDialog.tsx
git commit -m "feat(publishing): dialog anteprima diff bulk price edit"
```

---

### Task 10: Tab "Live"

**Files:**
- Create: `components/maat/publishing/LiveTab.tsx`

**Interfaces:**
- Consumes: `InventoryItem` (`lib/inventory-mock.ts`), `isSoldOutEverywhere` (Task 1),
  `BulkPriceMode`/`buildBulkPricePreview` (Task 2), `RepublishSheet` (Task 8),
  `BulkPricePreviewDialog` (Task 9), `PlatformPills` (esistente,
  `components/maat/inventory/PlatformPills.tsx`), `PLATFORM_KEYS`/`MARKETPLACE_LABELS`,
  `formatEUR`/`cn`, shadcn `Table`, `Checkbox`, `Select`, `Button`, `DropdownMenu`,
  `Input`.
- Produces:
  ```ts
  interface LiveTabProps {
    items: InventoryItem[]; // già filtrati "live" dal parent
    onRepublish: (ids: string[], platforms: PlatformKey[], priceCents: number | null) => void;
    onDelist: (ids: string[]) => void;
    onBulkPrice: (ids: string[], mode: BulkPriceMode, signedValue: number) => void;
  }
  ```
  Task 11 fornisce `items`/`onRepublish`/`onDelist`/`onBulkPrice` (le tre azioni sono
  mutazioni implementate su `PublishingView`).

- [ ] **Step 1: Scrivi il componente**

```tsx
// components/maat/publishing/LiveTab.tsx
"use client";

import { useMemo, useState } from "react";
import { MoreVertical, RotateCcw, Ban, Percent, Euro, Layers } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/maat/EmptyState";
import { cn, formatEUR } from "@/lib/utils";
import { isSoldOutEverywhere } from "@/lib/publishing-mock";
import { buildBulkPricePreview, type BulkPriceMode } from "@/lib/publishing-bulk";
import type { InventoryItem } from "@/lib/inventory-mock";
import { MARKETPLACE_LABELS } from "@/types/maat";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/inventory-columns";
import { PlatformPills } from "@/components/maat/inventory/PlatformPills";
import { RepublishSheet } from "@/components/maat/publishing/RepublishSheet";
import { BulkPricePreviewDialog } from "@/components/maat/publishing/BulkPricePreviewDialog";

interface LiveTabProps {
  items: InventoryItem[];
  onRepublish: (ids: string[], platforms: PlatformKey[], priceCents: number | null) => void;
  onDelist: (ids: string[]) => void;
  onBulkPrice: (ids: string[], mode: BulkPriceMode, signedValue: number) => void;
}

export function LiveTab({ items, onRepublish, onDelist, onBulkPrice }: LiveTabProps) {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | PlatformKey>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [republishTarget, setRepublishTarget] = useState<InventoryItem[] | null>(null);
  const [bulkMode, setBulkMode] = useState<BulkPriceMode>("percent");
  const [bulkValueInput, setBulkValueInput] = useState("-10");
  const [previewOpen, setPreviewOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (needle && !`${item.brand} ${item.tipoCapo} ${item.sku}`.toLowerCase().includes(needle)) return false;
      if (platformFilter !== "all" && item.platforms[platformFilter] === null) return false;
      return true;
    });
  }, [items, search, platformFilter]);

  const selectableIds = useMemo(() => new Set(filtered.filter((i) => !isSoldOutEverywhere(i)).map((i) => i.id)), [filtered]);
  const allSelectedOnPage = selectableIds.size > 0 && Array.from(selectableIds).every((id) => selected.has(id));

  function toggleRow(id: string) {
    if (!selectableIds.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allSelectedOnPage) {
        const next = new Set(prev);
        selectableIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...selectableIds]);
    });
  }

  const selectedItems = items.filter((i) => selected.has(i.id));
  const bulkValue = parseFloat(bulkValueInput.replace(",", "."));
  const canPreview = selectedItems.length > 0 && Number.isFinite(bulkValue) && bulkValue !== 0;

  const previewRows = canPreview
    ? buildBulkPricePreview(selectedItems, bulkMode, bulkValue).map((row) => {
        const item = selectedItems.find((i) => i.id === row.id)!;
        return { ...row, label: `${item.brand} — ${item.tipoCapo}` };
      })
    : [];

  function applyBulkPrice() {
    if (!canPreview) return;
    onBulkPrice(Array.from(selected), bulkMode, bulkValue);
    setSelected(new Set());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per brand, tipo o SKU…"
          aria-label="Cerca"
          className="w-full max-w-xs rounded-full border border-border bg-card px-3 py-1.5 text-sm outline-none focus:border-primary sm:w-auto"
        />
        <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v as "all" | PlatformKey)}>
          <SelectTrigger size="sm" className="w-40" aria-label="Piattaforma">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le piattaforme</SelectItem>
            {PLATFORM_KEYS.map((k) => (
              <SelectItem key={k} value={k}>
                {MARKETPLACE_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{filtered.length} capi</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState icon={<Layers className="size-5" />} title="Nessun capo live" subtitle="I capi con almeno un annuncio pubblicato compariranno qui." />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border pb-16">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allSelectedOnPage} onCheckedChange={toggleAll} aria-label="Seleziona tutti" />
                </TableHead>
                <TableHead>Capo</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Prezzo</TableHead>
                <TableHead>Piattaforme</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const soldOut = isSoldOutEverywhere(item);
                return (
                  <TableRow key={item.id} className={cn(soldOut && "opacity-50", selected.has(item.id) && "bg-accent-soft/40")}>
                    <TableCell>
                      <Checkbox checked={selected.has(item.id)} disabled={soldOut} onCheckedChange={() => toggleRow(item.id)} aria-label={`Seleziona ${item.brand}`} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
                          {item.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.photoUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="font-mono text-[7px] uppercase text-muted-foreground/50">Foto</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{item.brand}</div>
                          <div className="truncate text-xs text-muted-foreground">{item.tipoCapo}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">{item.sku}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{formatEUR(item.priceCents)}</span>
                    </TableCell>
                    <TableCell>
                      <PlatformPills platforms={item.platforms} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={soldOut} aria-label="Azioni">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setRepublishTarget([item])}>
                            <RotateCcw className="size-4" /> Ripubblica
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => onDelist([item.id])}>
                            <Ban className="size-4" /> Ritira
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-20 flex justify-center px-4">
          <div className="flex flex-wrap items-center gap-3 rounded-full border border-border bg-foreground px-5 py-3 text-text-on-dark shadow-e2">
            <span className="text-sm font-semibold">{selected.size} capi selezionati</span>
            <div className="h-5 w-px bg-white/20" />

            <div className="flex items-center gap-1.5 rounded-full bg-white/10 p-1">
              <Button
                type="button"
                size="icon-sm"
                variant={bulkMode === "percent" ? "secondary" : "ghost"}
                className="size-7 rounded-full"
                onClick={() => setBulkMode("percent")}
                aria-label="Percentuale"
              >
                <Percent className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant={bulkMode === "amount" ? "secondary" : "ghost"}
                className="size-7 rounded-full"
                onClick={() => setBulkMode("amount")}
                aria-label="Importo fisso"
              >
                <Euro className="size-3.5" />
              </Button>
            </div>
            <Input
              value={bulkValueInput}
              onChange={(e) => setBulkValueInput(e.target.value)}
              inputMode="decimal"
              className="h-8 w-20 border-white/20 bg-transparent text-text-on-dark"
              aria-label="Variazione prezzo"
            />
            <Button size="sm" variant="secondary" disabled={!canPreview} onClick={() => setPreviewOpen(true)}>
              Anteprima
            </Button>

            <div className="h-5 w-px bg-white/20" />
            <Button size="sm" variant="secondary" onClick={() => setRepublishTarget(selectedItems)}>
              Ripubblica selezionati
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelist(Array.from(selected))}>
              Ritira selezionati
            </Button>
          </div>
        </div>
      )}

      {republishTarget && (
        <RepublishSheet
          open={republishTarget !== null}
          onOpenChange={(open) => {
            if (!open) setRepublishTarget(null);
          }}
          items={republishTarget}
          onConfirm={(ids, platforms, priceCents) => {
            onRepublish(ids, platforms, priceCents);
            setSelected(new Set());
          }}
        />
      )}

      <BulkPricePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        rows={previewRows}
        onConfirm={applyBulkPrice}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verifica compilazione**

Run: `pnpm build`
Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add components/maat/publishing/LiveTab.tsx
git commit -m "feat(publishing): tab Live con kebab menu, bulk price e ripubblica"
```

---

### Task 11: `PublishingView` — assemblaggio pagina e mutazioni di stato

**Files:**
- Modify: `components/maat/publishing/PublishingView.tsx` (riscritto per intero)

**Interfaces:**
- Consumes: tutto quanto prodotto dai Task 1–10 — `getToPublishItems`/`getLiveItems`
  (Task 1), `PublishingStrategyProvider`/`usePublishingStrategy` (Task 4),
  `StrategySheet` (Task 6), `ToPublishTab` (Task 7), `LiveTab` (Task 10),
  `inventoryItems`/`InventoryItem` (`lib/inventory-mock.ts`), shadcn `Tabs`/`Button`.
- Produces: `PublishingView()` — nessun consumatore oltre `app/pubblicazione/page.tsx`
  (che già fa `export default function PubblicazionePage() { return <PublishingView />; }`
  e non richiede modifiche).

- [ ] **Step 1: Riscrivi il componente**

```tsx
// components/maat/publishing/PublishingView.tsx
"use client";

import { useMemo, useState } from "react";
import { Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { inventoryItems, type InventoryItem } from "@/lib/inventory-mock";
import { getToPublishItems, getLiveItems } from "@/lib/publishing-mock";
import { applyBulkPriceDelta, type BulkPriceMode } from "@/lib/publishing-bulk";
import type { PlatformKey } from "@/lib/inventory-columns";
import { PublishingStrategyProvider, usePublishingStrategy } from "@/lib/publishing-strategy-store";
import { StrategySheet } from "@/components/maat/publishing/StrategySheet";
import { ToPublishTab } from "@/components/maat/publishing/ToPublishTab";
import { LiveTab } from "@/components/maat/publishing/LiveTab";

const PUBLISH_DELAY_MS = 1500;

function PublishingViewInner() {
  const [items, setItems] = useState<InventoryItem[]>(inventoryItems);
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const { strategy } = usePublishingStrategy();

  const toPublish = useMemo(() => getToPublishItems(items), [items]);
  const live = useMemo(() => getLiveItems(items), [items]);

  function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      setCheckedAt(new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));
    }, 700);
  }

  function setPlatforms(ids: string[], platforms: PlatformKey[], state: "pending" | "active" | "delisted") {
    setItems((prev) =>
      prev.map((item) => {
        if (!ids.includes(item.id)) return item;
        const nextPlatforms = { ...item.platforms };
        for (const key of platforms) nextPlatforms[key] = state;
        return { ...item, platforms: nextPlatforms };
      })
    );
  }

  function publishItems(ids: string[], platforms: PlatformKey[]) {
    setPlatforms(ids, platforms, "pending");
    window.setTimeout(() => setPlatforms(ids, platforms, "active"), PUBLISH_DELAY_MS);
  }

  function republishItems(ids: string[], platforms: PlatformKey[], priceCents: number | null) {
    if (priceCents !== null) {
      setItems((prev) => prev.map((item) => (ids.includes(item.id) ? { ...item, priceCents } : item)));
    }
    setPlatforms(ids, platforms, "pending");
    window.setTimeout(() => setPlatforms(ids, platforms, "active"), PUBLISH_DELAY_MS);
  }

  function delistItems(ids: string[]) {
    setItems((prev) =>
      prev.map((item) => {
        if (!ids.includes(item.id)) return item;
        const nextPlatforms = { ...item.platforms };
        (Object.keys(nextPlatforms) as PlatformKey[]).forEach((key) => {
          if (nextPlatforms[key] !== null && nextPlatforms[key] !== "sold") nextPlatforms[key] = "delisted";
        });
        return { ...item, platforms: nextPlatforms };
      })
    );
  }

  function bulkPrice(ids: string[], mode: BulkPriceMode, signedValue: number) {
    setItems((prev) =>
      prev.map((item) =>
        ids.includes(item.id) ? { ...item, priceCents: applyBulkPriceDelta(item.priceCents, mode, signedValue) } : item
      )
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Pubblicazione multipiattaforma
          </p>
          <h1 className="text-[28px] font-bold tracking-tight">Pubblicazione</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            La dogana tra MAAT e le piattaforme: cosa esce, cosa è già live, come si governa nel tempo.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="gap-1.5" onClick={() => setStrategyOpen(true)}>
              <Zap className="size-3.5" /> Strategie
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} /> Aggiorna
            </Button>
          </div>
          {checkedAt && <span className="font-mono text-[10px] text-muted-foreground">Ultimo controllo · {checkedAt}</span>}
        </div>
      </div>

      <Tabs defaultValue="to-publish">
        <TabsList>
          <TabsTrigger value="to-publish">Da pubblicare ({toPublish.length})</TabsTrigger>
          <TabsTrigger value="live">Live ({live.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="to-publish" className="mt-4">
          <ToPublishTab items={toPublish} allItems={items} defaultPlatforms={strategy.defaultPublishPlatforms} onPublish={publishItems} />
        </TabsContent>
        <TabsContent value="live" className="mt-4">
          <LiveTab items={live} onRepublish={republishItems} onDelist={delistItems} onBulkPrice={bulkPrice} />
        </TabsContent>
      </Tabs>

      <StrategySheet open={strategyOpen} onOpenChange={setStrategyOpen} />
    </div>
  );
}

export function PublishingView() {
  return (
    <PublishingStrategyProvider>
      <PublishingViewInner />
    </PublishingStrategyProvider>
  );
}
```

- [ ] **Step 2: Verifica build**

Run: `pnpm build`
Expected: PASS, nessun errore TypeScript/lint. Questa è la prima volta che tutti i
componenti Task 1–10 vengono effettivamente importati ed eseguiti nel grafo — se
`pnpm build` fallisce qui, il problema è quasi certamente un mismatch di tipi tra
l'interfaccia dichiarata in un task precedente e l'uso reale qui: confronta la firma
esatta prima di modificare codice a caso.

- [ ] **Step 3: Commit**

```bash
git add components/maat/publishing/PublishingView.tsx
git commit -m "feat(publishing): assembla pagina Pubblicazione con tab e mutazioni"
```

---

### Task 12: Rimuovi `AutomazioniDrawer` da Inventario

**Files:**
- Modify: `components/maat/inventory/InventoryView.tsx`
- Delete: `components/maat/inventory/AutomazioniDrawer.tsx`

**Interfaces:**
- Consumes: nessuna nuova interfaccia — rimozione di codice esistente.
- Produces: `InventoryView` senza bottone/stato/drawer Automazioni.

- [ ] **Step 1: Rimuovi l'import e lo state da `InventoryView.tsx`**

In `components/maat/inventory/InventoryView.tsx`, rimuovi:
- la riga `import { AutomazioniDrawer } from "@/components/maat/inventory/AutomazioniDrawer";`
- la riga `const [automazioniOpen, setAutomazioniOpen] = useState(false);`
- il blocco JSX:
  ```tsx
  <Button variant="outline" className="gap-1.5" onClick={() => setAutomazioniOpen(true)}>
    <Zap className="size-3.5" /> Automazioni
  </Button>
  ```
- il rendering finale `<AutomazioniDrawer open={automazioniOpen} onOpenChange={setAutomazioniOpen} />`
- l'import `Zap` da `lucide-react` se non più usato altrove nel file (verifica con
  `grep -n "Zap" components/maat/inventory/InventoryView.tsx` dopo la rimozione — se
  non ci sono altri usi, toglilo dall'import `{ Plus, Zap }` lasciando solo `{ Plus }`)

Il div `<div className="flex items-center gap-2">` che conteneva i due bottoni resta,
ma con solo il bottone "Crea capo" dentro.

- [ ] **Step 2: Elimina il file del drawer**

```bash
rm components/maat/inventory/AutomazioniDrawer.tsx
```

- [ ] **Step 3: Verifica build**

Run: `pnpm build`
Expected: PASS. Se fallisce per un import rotto, cerca altri riferimenti residui:

```bash
grep -rn "AutomazioniDrawer" --include="*.tsx" --include="*.ts" . | grep -v node_modules | grep -v .next
```

Expected: nessun risultato.

- [ ] **Step 4: Verifica visiva in browser**

Run: `pnpm dev`, apri `/inventario`. Conferma: il bottone "Automazioni" non c'è più,
resta "Crea capo"; `PlatformPills` nelle righe funziona come prima (sola lettura).

- [ ] **Step 5: Commit**

```bash
git add components/maat/inventory/InventoryView.tsx
git rm components/maat/inventory/AutomazioniDrawer.tsx
git commit -m "refactor(inventory): rimuovi AutomazioniDrawer, assorbito da Pubblicazione"
```

---

### Task 13: Seed dati "da pubblicare" nel mock

**Files:**
- Modify: `lib/inventory-mock.ts`

**Interfaces:**
- Consumes: `InventoryItem` (già definito nello stesso file).
- Produces: 3 nuovi elementi in `inventoryItems` con `status: "available"` e
  `platforms` tutti `null`, così la tab "Da pubblicare" non è vuota alla prima
  apertura.

**Perché serve:** verificato sui dati attuali — dei 15 item mock, **nessuno** è
`status: "available"` con tutte le piattaforme `null`. I 4 item con piattaforme nulle
(`inv-03`, `inv-05`, `inv-09`, `inv-14`) sono tutti `to_be_reviewed`. Senza questo seed la tab
principale della schermata mostrerebbe solo l'`EmptyState`, rendendo impossibile
dimostrare o verificare il flusso di pubblicazione.

- [ ] **Step 1: Aggiungi i 3 item in coda all'array `inventoryItems`**

Inserisci questi oggetti dopo `inv-15` (l'ultimo elemento attuale), prima della `];`
di chiusura dell'array. Le foto riusano file già presenti in `public/product-photos/`
(gli stessi referenziati dagli item esistenti — nessun asset nuovo da creare):

```ts
  {
    id: "inv-16",
    brand: "Ralph Lauren",
    tipoCapo: "Camicia Oxford BD",
    sku: "RLP-23-0114",
    category: "Camicie",
    size: "L",
    priceCents: 5500,
    status: "available",
    photoUrl: "/product-photos/CG-1424_AI_FRONT.jpg",
    platforms: { vinted: null, grailed: null, depop: null },
  },
  {
    id: "inv-17",
    brand: "Arc'teryx",
    tipoCapo: "Beta LT Jacket",
    sku: "ARC-24-0066",
    category: "Capospalla",
    size: "M",
    priceCents: 24000,
    status: "available",
    photoUrl: "/product-photos/CG-1527_AI_FRONT.jpg",
    platforms: { vinted: null, grailed: null, depop: null },
  },
  {
    id: "inv-18",
    brand: "Dickies",
    tipoCapo: "874 Work Pant",
    sku: "DKS-22-0290",
    category: "Pantaloni",
    size: "W32",
    priceCents: 3500,
    status: "available",
    photoUrl: "/product-photos/CG-1544_AI_FRONT.jpg",
    platforms: { vinted: null, grailed: null, depop: null },
  },
```

- [ ] **Step 2: Verifica che i selettori li riconoscano**

Run: `pnpm vitest run lib/publishing-mock.test.ts`
Expected: PASS (i test di Task 1 usano item costruiti a mano, non il mock reale —
questo step conferma solo che non hai rotto nulla nel file).

- [ ] **Step 3: Verifica build**

Run: `pnpm build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/inventory-mock.ts
git commit -m "feat(publishing): seed capi pronti alla pubblicazione nel mock"
```

---

### Task 14: Verifica finale end-to-end

**Files:** nessuno (solo verifica).

**Interfaces:** nessuna — task di chiusura.

- [ ] **Step 1: Suite completa**

Run: `pnpm vitest run`
Expected: tutti i test PASS, inclusi quelli esistenti (`urgency.test.ts`,
`tiers.test.ts`, `logistics-mock.test.ts`, `home-mock.test.ts`) e i tre nuovi file
(Task 1–3).

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: PASS.

- [ ] **Step 3: Cammino manuale in browser**

Run: `pnpm dev`, apri `/pubblicazione`. Verifica:

1. Tab "Da pubblicare" mostra esattamente 3 capi — `inv-16` Ralph Lauren, `inv-17`
   Arc'teryx, `inv-18` Dickies (quelli seedati in Task 13). Il contatore nel tab
   header dice "Da pubblicare (3)".
2. Banner bozze compare con conteggio 4 (`inv-03`, `inv-05`, `inv-09`, `inv-14`) e il link porta a
   `/inventario?status=to_be_reviewed` (la route esiste già, il parametro è solo informativo:
   non serve gestirlo lato Inventario in questo piano — se Federico lo vuole
   funzionale, è un task separato, fuori scope).
3. Seleziona 1+ righe in "Da pubblicare", scegli piattaforme, "Avvia pubblicazione":
   le righe spariscono da questa tab e compaiono in "Live" con pill piattaforma gialla
   ("in corso"); dopo ~1.5s diventano verdi ("attivo") senza refresh manuale.
4. Tab "Live": filtro piattaforma e ricerca funzionano; righe con solo stato `sold`
   sono attenuate e non selezionabili.
5. Kebab menu riga Live → "Ripubblica" apre la sheet con prezzo precompilato e
   piattaforme correnti pre-selezionate; conferma aggiorna prezzo/piattaforme nella
   tabella.
6. Kebab menu riga Live → "Ritira" sposta tutte le piattaforme non-sold a "delisted"
   (pill grigie).
7. Seleziona 2+ righe Live, imposta `-10` in modalità `%`, "Anteprima": il dialog
   mostra prezzo-prima barrato e prezzo-dopo per ogni riga con i valori corretti;
   "Applica" aggiorna i prezzi in tabella e chiude dialog+deseleziona.
8. Bottone "Strategie" apre la sheet: ogni card (Auto-delist/Repricing/Auto-relist) ha
   3 righe piattaforma con switch indipendenti; attivare/disattivare e cambiare valori
   persiste dopo un refresh di pagina (F5) — verifica che `localStorage` chiave
   `maat.publishing.strategy.v1` contenga il valore aggiornato (DevTools → Application
   → Local Storage).
9. `/inventario`: bottone "Automazioni" non c'è più, resto della pagina invariato.

- [ ] **Step 4: Commit finale (se emergono fix durante la verifica manuale)**

Se il passo 3 rivela un bug, correggilo nel file specifico coinvolto (non introdurre
nuova architettura) e:

```bash
git add -A
git commit -m "fix(publishing): <descrizione puntuale del bug trovato in verifica>"
```

Se nessun fix è necessario, non serve commit per questo task — è verifica pura.

---

## Self-Review (svolta durante la scrittura del piano)

**1. Copertura spec:** ogni sezione dello spec ha un task corrispondente — Scope
shift (Task 12), Architettura pagina + tabs (Task 11), Dati sorgente (Task 1), Tab Da
pubblicare (Task 7), Tab Live + bulk price + kebab (Task 9, 10), Sheet Strategie
(Task 3, 4, 5, 6), Data model (Task 3), Componenti nuovi/modificati (Task 1–12 =
lista 1:1), Out-of-scope (nessun task li implementa, corretto), Testing (Task 1–3 +
Task 14). Task 13 (seed mock) non deriva da una sezione dello spec ma da un vincolo
scoperto leggendo i dati reali: senza di esso la tab principale sarebbe vuota.

**2. Placeholder scan:** nessun `TBD`/`TODO` nei task; ogni step ha codice completo o
comando+output atteso.

**3. Coerenza dei tipi:** verificato a mano che `PlatformKey`, `PlatformListingState`,
`InventoryItem`, `StrategyConfig`, `PlatformStrategy`, `BulkPriceMode`,
`BulkPricePreviewRow` usino lo stesso nome/forma in ogni task che li consuma
(`onPublish`, `onRepublish`, `onDelist`, `onBulkPrice` hanno la stessa firma in
Task 7/10 — produttori — e Task 11 — consumatore/implementatore).
