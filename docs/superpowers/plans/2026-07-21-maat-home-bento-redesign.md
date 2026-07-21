# Redesign bento Home (MAAT) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introdurre un sistema bento a due livelli sulla Home MAAT — griglia dei 6 widget-card e griglia interna delle metriche Panoramica — dove dimensione e forma riflettono una fascia fissa (grande/medio/piccolo), con badge/accento urgenza guidati dai dati reali.

**Architecture:** Fascia = proprietà statica su `WidgetDef`/`HomeMetric` (nessun calcolo a runtime). Un modulo `lib/tiers.ts` mappa fascia → classi Tailwind per il footprint in griglia. Un modulo `lib/urgency.ts` isola tutta la logica pura di "quando mostrare un accento" (età offerta, età coda, non letti, delta ricavi, soglie metriche), testata con vitest. Un nuovo componente `MetricTile` applica la silhouette per fascia dentro Panoramica. La griglia Home passa da 2 a 4 colonne con `grid-flow-dense` e span per fascia.

**Tech Stack:** Next.js 16 / React 19 / TypeScript / Tailwind v4 / `@dnd-kit` (invariato) / vitest (nuovo, solo per logica pura).

**Spec di riferimento:** `docs/superpowers/specs/2026-07-21-maat-home-bento-redesign-design.md`

## Global Constraints

- Non si tocca contenuto o priorità dei dati (quali metriche/widget esistono) — solo presentazione, dimensione, forma.
- Nessun effetto decorativo animato (niente canvas/`GridBeam`) — approccio già scartato in questa sessione.
- `useHomeLayout` (persistenza localStorage, add/remove widget, drag&drop) resta invariato nella sua logica — solo le classi CSS di span cambiano.
- Drag&drop: si tiene `rectSortingStrategy` esistente così com'è, nessuna riscrittura della strategia di collision/sorting in questo piano.
- Package manager: `pnpm` (repo usa `pnpm-lock.yaml`).
- Path alias `@/*` → root repo (`tsconfig.json`).
- Fascia (Tier) è una proprietà fissa nei dati (`registry.tsx`, `home-mock.ts`), mai un campo utente-editabile.

---

## Task 1: Setup vitest + `lib/tiers.ts`

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (devDependencies + script `test`)
- Create: `lib/tiers.ts`
- Test: `lib/tiers.test.ts`

**Interfaces:**
- Produces: `export type Tier = "grande" | "medio" | "piccolo"`, `export const WIDGET_TIER_GRID_CLASS: Record<Tier, string>`, `export const METRIC_TIER_GRID_CLASS: Record<Tier, string>` — usati da Task 3, 4, 6, 7.

- [ ] **Step 1: Installare vitest e il plugin path-alias**

Run: `pnpm add -D vitest vite-tsconfig-paths`

- [ ] **Step 2: Creare la config vitest**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 3: Aggiungere lo script di test a `package.json`**

Nella sezione `"scripts"`, aggiungere:

```json
"test": "vitest run"
```

- [ ] **Step 4: Scrivere il test che fallisce**

```ts
// lib/tiers.test.ts
import { describe, expect, it } from "vitest";
import { WIDGET_TIER_GRID_CLASS, METRIC_TIER_GRID_CLASS } from "./tiers";

describe("WIDGET_TIER_GRID_CLASS", () => {
  it("assegna un footprint diverso a ogni fascia", () => {
    expect(WIDGET_TIER_GRID_CLASS.grande).toBe("lg:col-span-2 lg:row-span-2");
    expect(WIDGET_TIER_GRID_CLASS.medio).toBe("lg:col-span-2 lg:row-span-1");
    expect(WIDGET_TIER_GRID_CLASS.piccolo).toBe("lg:col-span-1 lg:row-span-1");
  });
});

describe("METRIC_TIER_GRID_CLASS", () => {
  it("solo la fascia grande occupa 2 colonne dentro Panoramica", () => {
    expect(METRIC_TIER_GRID_CLASS.grande).toBe("sm:col-span-2 lg:col-span-2");
    expect(METRIC_TIER_GRID_CLASS.medio).toBe("col-span-1");
    expect(METRIC_TIER_GRID_CLASS.piccolo).toBe("col-span-1");
  });
});
```

- [ ] **Step 5: Eseguire il test e verificare che fallisca**

Run: `pnpm exec vitest run lib/tiers.test.ts`
Expected: FAIL con `Cannot find module './tiers'`

- [ ] **Step 6: Implementare `lib/tiers.ts`**

```ts
// lib/tiers.ts

/** Fascia di importanza fissa per widget Home e metriche Panoramica. */
export type Tier = "grande" | "medio" | "piccolo";

/** Footprint in griglia (4 colonne, grid-flow-dense) per i 6 widget-card Home. */
export const WIDGET_TIER_GRID_CLASS: Record<Tier, string> = {
  grande: "lg:col-span-2 lg:row-span-2",
  medio: "lg:col-span-2 lg:row-span-1",
  piccolo: "lg:col-span-1 lg:row-span-1",
};

/** Span per le tile-metrica dentro Panoramica (griglia interna, fino a 4 colonne). */
export const METRIC_TIER_GRID_CLASS: Record<Tier, string> = {
  grande: "sm:col-span-2 lg:col-span-2",
  medio: "col-span-1",
  piccolo: "col-span-1",
};
```

- [ ] **Step 7: Eseguire il test e verificare che passi**

Run: `pnpm exec vitest run lib/tiers.test.ts`
Expected: PASS (2 test)

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml lib/tiers.ts lib/tiers.test.ts
git commit -m "feat: aggiungi vitest e lib/tiers per il sistema fasce Home"
```

---

## Task 2: `lib/urgency.ts` — segnali di urgenza

**Files:**
- Create: `lib/urgency.ts`
- Test: `lib/urgency.test.ts`

**Interfaces:**
- Consumes: `Offer` (`types/maat.ts`, campo `time: string`, `status: OfferStatus`), `CatalogEntry` (`types/maat.ts`, campo `createdAt: string`), `Notification` (`types/maat.ts`, campo `letta: boolean`), `HomeMetric` (`lib/home-mock.ts`, campi `key: string`, `value: string`).
- Produces: `isOfferUrgent(offer: Offer): boolean`, `hasUrgentOffer(offers: Offer[]): boolean`, `isActionQueueUrgent(entries: CatalogEntry[], nowIso: string): boolean`, `hasUnreadNotifications(notifications: Notification[]): boolean`, `isRevenueDown(deltaPct: number): boolean`, `isMetricUrgent(metric: HomeMetric): boolean` — usati da Task 6, 8, 9, 10, 11.

- [ ] **Step 1: Scrivere i test che falliscono**

```ts
// lib/urgency.test.ts
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
```

- [ ] **Step 2: Eseguire i test e verificare che falliscano**

Run: `pnpm exec vitest run lib/urgency.test.ts`
Expected: FAIL con `Cannot find module './urgency'`

- [ ] **Step 3: Implementare `lib/urgency.ts`**

```ts
// lib/urgency.ts
import type { CatalogEntry, Notification, Offer } from "@/types/maat";
import type { HomeMetric } from "./home-mock";

const OFFER_URGENT_MINUTES = 6 * 60;
const ACTION_QUEUE_URGENT_MS = 48 * 60 * 60 * 1000;

function parseElapsedMinutes(time: string): number {
  const t = time.trim().toLowerCase();
  if (t === "ieri") return 24 * 60;
  const dayMatch = t.match(/^(\d+)\s*g/);
  if (dayMatch) return Number(dayMatch[1]) * 24 * 60;
  const hourMatch = t.match(/^(\d+)\s*h/);
  if (hourMatch) return Number(hourMatch[1]) * 60;
  const minMatch = t.match(/^(\d+)\s*min/);
  if (minMatch) return Number(minMatch[1]);
  return 0;
}

/** Un'offerta pending è "urgente" se è ferma da 6 ore o più senza risposta. */
export function isOfferUrgent(offer: Offer): boolean {
  return parseElapsedMinutes(offer.time) >= OFFER_URGENT_MINUTES;
}

/** true se almeno un'offerta ancora pending è urgente. */
export function hasUrgentOffer(offers: Offer[]): boolean {
  return offers.some((o) => o.status === "pending" && isOfferUrgent(o));
}

/** La coda azioni è "urgente" se il capo più vecchio è in coda da 48 ore o più. Assume `entries` già ordinato per createdAt crescente (come restituisce `actionQueue()`). */
export function isActionQueueUrgent(entries: CatalogEntry[], nowIso: string): boolean {
  if (entries.length === 0) return false;
  const oldest = entries[0];
  const ageMs = new Date(nowIso).getTime() - new Date(oldest.createdAt).getTime();
  return ageMs >= ACTION_QUEUE_URGENT_MS;
}

/** true se c'è almeno una notifica non letta. */
export function hasUnreadNotifications(notifications: Notification[]): boolean {
  return notifications.some((n) => !n.letta);
}

/** Le entrate destano attenzione quando il trend settimanale è negativo. */
export function isRevenueDown(deltaPct: number): boolean {
  return deltaPct < 0;
}

function parseMetricNumber(value: string): number {
  return Number(value.replace(/[^\d]/g, ""));
}

const METRIC_URGENCY_THRESHOLD: Partial<Record<string, number>> = {
  bozze: 10,
  spedizioni: 8,
  escrow: 500,
};

/** Soglia fissa per metrica (bozze/spedizioni/escrow) — le altre non hanno mai accento urgenza. */
export function isMetricUrgent(metric: HomeMetric): boolean {
  const threshold = METRIC_URGENCY_THRESHOLD[metric.key];
  if (threshold === undefined) return false;
  return parseMetricNumber(metric.value) >= threshold;
}
```

- [ ] **Step 4: Eseguire i test e verificare che passino**

Run: `pnpm exec vitest run lib/urgency.test.ts`
Expected: PASS (14 test)

- [ ] **Step 5: Commit**

```bash
git add lib/urgency.ts lib/urgency.test.ts
git commit -m "feat: aggiungi lib/urgency per i segnali di urgenza Home"
```

---

## Task 3: Aggiungere `tier` a `HOME_METRICS`

**Files:**
- Modify: `lib/home-mock.ts`
- Test: `lib/home-mock.test.ts`

**Interfaces:**
- Consumes: `Tier` (Task 1, `lib/tiers.ts`).
- Produces: `HomeMetric.tier: Tier` — usato da Task 5 (`MetricTile`) e Task 6 (`PanoramicaWidget`).

- [ ] **Step 1: Scrivere il test che fallisce**

```ts
// lib/home-mock.test.ts
import { describe, expect, it } from "vitest";
import { HOME_METRICS } from "./home-mock";

describe("HOME_METRICS", () => {
  it("ogni metrica ha una fascia valida", () => {
    const validTiers = ["grande", "medio", "piccolo"];
    for (const m of HOME_METRICS) {
      expect(validTiers).toContain(m.tier);
    }
  });
  it("le fasce grande sono esattamente entrate e offerte", () => {
    const grande = HOME_METRICS.filter((m) => m.tier === "grande").map((m) => m.key).sort();
    expect(grande).toEqual(["entrate", "offerte"]);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `pnpm exec vitest run lib/home-mock.test.ts`
Expected: FAIL — `m.tier` è `undefined`, non nella lista valida

- [ ] **Step 3: Aggiungere il campo `tier` a `HomeMetric` e a ogni voce di `HOME_METRICS`**

```ts
// lib/home-mock.ts
import type { Tier } from "./tiers";

// Catalogo delle metriche disponibili per il box "Panoramica" configurabile
// in Home. L'utente sceglie quali mostrare (persistito solo in stato locale
// per ora); qui vive solo il dato — valori statici allineati al mockup
// public/mobile/maat-shell-account.html (righe 3653-3699).

export interface HomeMetric {
  key: string;
  value: string;
  label: string;
  /** Classe Tailwind per il pallino colorato accanto alla label. */
  dotColor: string;
  /** Fascia fissa: determina lo span in griglia e la silhouette della tile. */
  tier: Tier;
}

export const HOME_METRICS: HomeMetric[] = [
  { key: "catalogo", value: "96", label: "Capi a catalogo", dotColor: "bg-muted-foreground", tier: "piccolo" },
  { key: "bozze", value: "12", label: "Bozze da revisionare", dotColor: "bg-primary", tier: "medio" },
  { key: "pubblicati", value: "27", label: "Capi pubblicati", dotColor: "bg-[var(--chart-1)]", tier: "piccolo" },
  { key: "venduti", value: "9", label: "Articoli venduti", dotColor: "bg-[var(--chart-2)]", tier: "piccolo" },
  { key: "entrate", value: "€ 2.680", label: "Entrate · settimana", dotColor: "bg-primary", tier: "grande" },
  { key: "offerte", value: "3", label: "Offerte in sospeso", dotColor: "bg-[var(--chart-1)]", tier: "grande" },
  { key: "spedizioni", value: "10", label: "Spedizioni in corso", dotColor: "bg-muted-foreground", tier: "medio" },
  { key: "escrow", value: "€ 940", label: "In escrow", dotColor: "bg-primary/60", tier: "medio" },
];

export const DEFAULT_SELECTED_METRICS: string[] = [
  "catalogo",
  "bozze",
  "entrate",
  "spedizioni",
  "offerte",
  "escrow",
];
```

- [ ] **Step 4: Eseguire il test e verificare che passi**

Run: `pnpm exec vitest run lib/home-mock.test.ts`
Expected: PASS (2 test)

- [ ] **Step 5: Commit**

```bash
git add lib/home-mock.ts lib/home-mock.test.ts
git commit -m "feat: aggiungi fascia (tier) a HOME_METRICS"
```

---

## Task 4: Aggiungere `tier` a `HOME_WIDGETS`, rimuovere `span`

**Files:**
- Modify: `components/maat/widgets/registry.tsx`
- Test: `components/maat/widgets/registry.test.ts`

**Interfaces:**
- Consumes: `Tier` (Task 1).
- Produces: `WidgetDef.tier: Tier` (campo `span` rimosso) — usato da Task 7 (`HomeDashboard`).

- [ ] **Step 1: Scrivere il test che fallisce**

```ts
// components/maat/widgets/registry.test.ts
import { describe, expect, it } from "vitest";
import { HOME_WIDGETS } from "./registry";

describe("HOME_WIDGETS", () => {
  it("ogni widget ha una fascia valida", () => {
    const validTiers = ["grande", "medio", "piccolo"];
    for (const w of HOME_WIDGETS) {
      expect(validTiers).toContain(w.tier);
    }
  });
  it("le fasce grande sono esattamente panoramica e offerte", () => {
    const grande = HOME_WIDGETS.filter((w) => w.tier === "grande").map((w) => w.key).sort();
    expect(grande).toEqual(["offerte", "panoramica"]);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `pnpm exec vitest run components/maat/widgets/registry.test.ts`
Expected: FAIL — `w.tier` è `undefined`

- [ ] **Step 3: Modificare `registry.tsx`: sostituire `span` con `tier`**

```tsx
// components/maat/widgets/registry.tsx
import type { ComponentType } from "react";
import { BadgeEuro, Bell, ChartColumn, Gauge, HandCoins, ListChecks, type LucideIcon } from "lucide-react";
import type { WidgetKey } from "@/lib/home-layout-store";
import type { Tier } from "@/lib/tiers";
import { AzioniWidget } from "./AzioniWidget";
import { EntrateWidget } from "./EntrateWidget";
import { NotificheWidget } from "./NotificheWidget";
import { OfferteWidget } from "./OfferteWidget";
import { PanoramicaWidget } from "./PanoramicaWidget";
import { VenditeWidget } from "./VenditeWidget";

export interface WidgetDef {
  key: WidgetKey;
  /** Nome mostrato nel catalogo "Aggiungi widget". */
  title: string;
  /** Una riga di spiegazione nel catalogo. */
  description: string;
  icon: LucideIcon;
  /** Fascia fissa: determina il footprint nella bento grid desktop (mobile è sempre 1 colonna). */
  tier: Tier;
  component: ComponentType;
}

export const HOME_WIDGETS: WidgetDef[] = [
  {
    key: "panoramica",
    title: "Panoramica",
    description: "Le metriche chiave del negozio, configurabili",
    icon: Gauge,
    tier: "grande",
    component: PanoramicaWidget,
  },
  {
    key: "offerte",
    title: "Offerte",
    description: "Offerte in sospeso, accetta o rifiuta al volo",
    icon: HandCoins,
    tier: "grande",
    component: OfferteWidget,
  },
  {
    key: "vendite",
    title: "Vendite",
    description: "Le vendite più recenti sui marketplace",
    icon: BadgeEuro,
    tier: "piccolo",
    component: VenditeWidget,
  },
  {
    key: "azioni",
    title: "Azioni richieste",
    description: "Bozze e capi in attesa di revisione",
    icon: ListChecks,
    tier: "medio",
    component: AzioniWidget,
  },
  {
    key: "notifiche",
    title: "Notifiche",
    description: "Le ultime novità dal tuo account",
    icon: Bell,
    tier: "piccolo",
    component: NotificheWidget,
  },
  {
    key: "entrate",
    title: "Entrate",
    description: "Andamento ricavi delle ultime settimane",
    icon: ChartColumn,
    tier: "medio",
    component: EntrateWidget,
  },
];

export function getWidget(key: WidgetKey): WidgetDef {
  const def = HOME_WIDGETS.find((w) => w.key === key);
  if (!def) throw new Error(`Widget sconosciuto: ${key}`);
  return def;
}
```

- [ ] **Step 4: Eseguire il test e verificare che passi**

Run: `pnpm exec vitest run components/maat/widgets/registry.test.ts`
Expected: PASS (2 test)

- [ ] **Step 5: Commit**

```bash
git add components/maat/widgets/registry.tsx components/maat/widgets/registry.test.ts
git commit -m "feat: sostituisci span con tier in HOME_WIDGETS"
```

---

## Task 5: Componente `MetricTile` — silhouette per fascia

**Files:**
- Create: `components/maat/widgets/MetricTile.tsx`

**Interfaces:**
- Consumes: `HomeMetric` (Task 3), `isMetricUrgent` (Task 2), `cn` (`lib/utils.ts`, già esistente).
- Produces: `MetricTile({ metric: HomeMetric }): JSX.Element` — usato da Task 6 (`PanoramicaWidget`).

- [ ] **Step 1: Creare il componente**

```tsx
// components/maat/widgets/MetricTile.tsx
"use client";

import { cn } from "@/lib/utils";
import type { HomeMetric } from "@/lib/home-mock";
import { isMetricUrgent } from "@/lib/urgency";

/**
 * Tile di una metrica Panoramica. La struttura interna cambia per fascia
 * (silhouette), non solo raggio/bordo/padding:
 * grande = orizzontale (valore grande + label a destra), medio = verticale
 * classico, piccolo = pillola a una riga.
 */
export function MetricTile({ metric }: { metric: HomeMetric }) {
  const urgent = isMetricUrgent(metric);
  const dotClass = cn("size-1.5 shrink-0 rounded-full", urgent ? "bg-destructive" : metric.dotColor);

  if (metric.tier === "grande") {
    return (
      <div className="flex h-full items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-4 py-3">
        <span className="font-mono text-3xl font-semibold tabular-nums">{metric.value}</span>
        <span className="flex shrink-0 items-center gap-1.5 text-right text-[13px] text-muted-foreground">
          {metric.label}
          <span className={dotClass} />
        </span>
      </div>
    );
  }

  if (metric.tier === "piccolo") {
    return (
      <div className="flex items-center justify-between gap-2 rounded-full border border-border bg-background/40 px-3 py-1.5">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className={dotClass} />
          <span className="truncate">{metric.label}</span>
        </span>
        <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">{metric.value}</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-1.5 rounded-lg border border-border bg-background/40 px-4 py-3">
      <span className="font-mono text-2xl font-semibold tabular-nums">{metric.value}</span>
      <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <span className={dotClass} />
        {metric.label}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Verificare i tipi**

Run: `pnpm exec tsc --noEmit`
Expected: nessun errore relativo a `MetricTile.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/maat/widgets/MetricTile.tsx
git commit -m "feat: aggiungi MetricTile con silhouette per fascia"
```

---

## Task 6: `PanoramicaWidget` — usare `MetricTile` in griglia a mosaic

**Files:**
- Modify: `components/maat/widgets/PanoramicaWidget.tsx`

**Interfaces:**
- Consumes: `MetricTile` (Task 5), `METRIC_TIER_GRID_CLASS` (Task 1).

- [ ] **Step 1: Sostituire il blocco di rendering delle tile**

In `components/maat/widgets/PanoramicaWidget.tsx`, sostituire l'intero blocco:

```tsx
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleMetrics.map((m) => (
            <div key={m.key} className="flex flex-col gap-1.5 rounded-lg border border-border bg-background/40 px-4 py-3">
              <span className="font-mono text-2xl font-semibold tabular-nums">{m.value}</span>
              <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <span className={cn("size-1.5 shrink-0 rounded-full", m.dotColor)} />
                {m.label}
              </span>
            </div>
          ))}
        </div>
```

con:

```tsx
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:grid-flow-dense">
          {visibleMetrics.map((m) => (
            <div key={m.key} className={METRIC_TIER_GRID_CLASS[m.tier]}>
              <MetricTile metric={m} />
            </div>
          ))}
        </div>
```

e aggiungere gli import in cima al file:

```tsx
import { METRIC_TIER_GRID_CLASS } from "@/lib/tiers";
import { MetricTile } from "./MetricTile";
```

(l'import di `cn` resta, è ancora usato altrove nel file per `visibleMetrics.length === 0` non serve `cn` lì — verificare con `tsc` che non resti un import inutilizzato).

- [ ] **Step 2: Verificare i tipi**

Run: `pnpm exec tsc --noEmit`
Expected: nessun errore. Se `cn` risulta importato ma non più usato in questo file, rimuovere l'import.

- [ ] **Step 3: Commit**

```bash
git add components/maat/widgets/PanoramicaWidget.tsx
git commit -m "feat: PanoramicaWidget usa MetricTile con mosaic per fascia"
```

---

## Task 7: `HomeDashboard` — griglia a 4 colonne con span per fascia

**Files:**
- Modify: `components/maat/HomeDashboard.tsx`

**Interfaces:**
- Consumes: `WIDGET_TIER_GRID_CLASS` (Task 1), `WidgetDef.tier` (Task 4).

- [ ] **Step 1: Aggiornare `SortableWidget` per usare la fascia invece di `span`**

Sostituire:

```tsx
      className={cn(
        def.span === 2 && "lg:col-span-2",
        editing && "cursor-grab touch-none active:cursor-grabbing",
        isDragging && "z-10 opacity-80"
      )}
```

con:

```tsx
      className={cn(
        WIDGET_TIER_GRID_CLASS[def.tier],
        editing && "cursor-grab touch-none active:cursor-grabbing",
        isDragging && "z-10 opacity-80"
      )}
```

e aggiungere l'import:

```tsx
import { WIDGET_TIER_GRID_CLASS } from "@/lib/tiers";
```

- [ ] **Step 2: Aggiornare il contenitore griglia da 2 a 4 colonne**

Sostituire:

```tsx
            <div className="mt-6 grid grid-flow-dense grid-cols-1 gap-6 lg:grid-cols-2">
```

con:

```tsx
            <div className="mt-6 grid grid-flow-dense grid-cols-1 gap-6 lg:grid-cols-4 lg:auto-rows-[180px]">
```

- [ ] **Step 3: Verificare i tipi**

Run: `pnpm exec tsc --noEmit`
Expected: nessun errore

- [ ] **Step 4: Commit**

```bash
git add components/maat/HomeDashboard.tsx
git commit -m "feat: HomeDashboard usa griglia bento a 4 colonne per fascia"
```

---

## Task 8: `OfferteWidget` — accento urgenza

**Files:**
- Modify: `components/maat/widgets/OfferteWidget.tsx`

**Interfaces:**
- Consumes: `hasUrgentOffer` (Task 2).

- [ ] **Step 1: Aggiungere il pallino urgenza nell'header**

Sostituire:

```tsx
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Offerte
          </p>
          <span className="font-mono text-xs text-muted-foreground">{offers.length}</span>
        </div>
```

con:

```tsx
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Offerte
          </p>
          <span className="font-mono text-xs text-muted-foreground">{offers.length}</span>
          {hasUrgentOffer(offers) ? (
            <span aria-label="Offerte in attesa da tempo" className="size-1.5 shrink-0 rounded-full bg-destructive" />
          ) : null}
        </div>
```

e aggiungere l'import:

```tsx
import { hasUrgentOffer } from "@/lib/urgency";
```

- [ ] **Step 2: Verificare i tipi**

Run: `pnpm exec tsc --noEmit`
Expected: nessun errore

- [ ] **Step 3: Commit**

```bash
git add components/maat/widgets/OfferteWidget.tsx
git commit -m "feat: OfferteWidget mostra accento urgenza su offerte vecchie"
```

---

## Task 9: `AzioniWidget` — accento urgenza

**Files:**
- Modify: `components/maat/widgets/AzioniWidget.tsx`

**Interfaces:**
- Consumes: `isActionQueueUrgent` (Task 2).

- [ ] **Step 1: Aggiungere il pallino urgenza nell'header**

Sostituire:

```tsx
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Azioni richieste
          </p>
          <span className="font-mono text-xs text-muted-foreground">{queue.length}</span>
        </div>
```

con:

```tsx
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Azioni richieste
          </p>
          <span className="font-mono text-xs text-muted-foreground">{queue.length}</span>
          {isActionQueueUrgent(queue, new Date().toISOString()) ? (
            <span aria-label="Capi in coda da tempo" className="size-1.5 shrink-0 rounded-full bg-destructive" />
          ) : null}
        </div>
```

e aggiungere l'import:

```tsx
import { isActionQueueUrgent } from "@/lib/urgency";
```

- [ ] **Step 2: Verificare i tipi**

Run: `pnpm exec tsc --noEmit`
Expected: nessun errore

- [ ] **Step 3: Commit**

```bash
git add components/maat/widgets/AzioniWidget.tsx
git commit -m "feat: AzioniWidget mostra accento urgenza su coda vecchia"
```

---

## Task 10: `NotificheWidget` — cap a 2, truncate, accento non lette

**Files:**
- Modify: `components/maat/widgets/NotificheWidget.tsx`

**Interfaces:**
- Consumes: `hasUnreadNotifications` (Task 2).

- [ ] **Step 1: Limitare l'anteprima a 2 e aggiungere l'accento**

Sostituire:

```tsx
  const recent = [...notifications]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 3);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
          Notifiche
        </p>
        <Link
          href="/notifiche"
          className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Vedi tutte <ArrowRight className="size-3.5" />
        </Link>
      </div>
```

con:

```tsx
  const recent = [...notifications]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 2);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Notifiche
          </p>
          {hasUnreadNotifications(notifications) ? (
            <span aria-label="Notifiche non lette" className="size-1.5 shrink-0 rounded-full bg-destructive" />
          ) : null}
        </div>
        <Link
          href="/notifiche"
          className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Vedi tutte <ArrowRight className="size-3.5" />
        </Link>
      </div>
```

- [ ] **Step 2: Troncare il messaggio su una riga**

Sostituire:

```tsx
                  <p className="text-[13px] font-medium leading-snug">{n.messaggio}</p>
```

con:

```tsx
                  <p className="truncate text-[13px] font-medium leading-snug">{n.messaggio}</p>
```

- [ ] **Step 3: Aggiungere l'import**

```tsx
import { hasUnreadNotifications } from "@/lib/urgency";
```

- [ ] **Step 4: Verificare i tipi**

Run: `pnpm exec tsc --noEmit`
Expected: nessun errore

- [ ] **Step 5: Commit**

```bash
git add components/maat/widgets/NotificheWidget.tsx
git commit -m "feat: NotificheWidget compatto a 1/4 colonna (cap 2, truncate, accento)"
```

---

## Task 11: `EntrateWidget` — accento su delta negativo

**Files:**
- Modify: `components/maat/widgets/EntrateWidget.tsx`

**Interfaces:**
- Consumes: `isRevenueDown` (Task 2).

- [ ] **Step 1: Aggiungere il pallino urgenza nell'header**

Sostituire:

```tsx
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
          Entrate
        </p>
        <Link
          href="/contabilita"
          className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Contabilità <ArrowRight className="size-3.5" />
        </Link>
      </div>
```

con:

```tsx
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Entrate
          </p>
          {isRevenueDown(weeklyKpi.revenueDeltaPct) ? (
            <span aria-label="Ricavi in calo" className="size-1.5 shrink-0 rounded-full bg-destructive" />
          ) : null}
        </div>
        <Link
          href="/contabilita"
          className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Contabilità <ArrowRight className="size-3.5" />
        </Link>
      </div>
```

e aggiungere l'import:

```tsx
import { isRevenueDown } from "@/lib/urgency";
```

- [ ] **Step 2: Verificare i tipi**

Run: `pnpm exec tsc --noEmit`
Expected: nessun errore

- [ ] **Step 3: Commit**

```bash
git add components/maat/widgets/EntrateWidget.tsx
git commit -m "feat: EntrateWidget mostra accento su delta ricavi negativo"
```

---

## Task 12: `VenditeWidget` — resa compatta a 1/4 colonna

**Files:**
- Modify: `components/maat/widgets/VenditeWidget.tsx`

- [ ] **Step 1: Rimuovere lo SKU e limitare l'anteprima a 2**

Sostituire:

```tsx
        <div className="flex flex-col gap-1">
          {sales.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-foreground/[.03]">
              <span className="size-1.5 shrink-0 rounded-full bg-[var(--chart-2)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{s.itemLabel}</p>
                <p className="font-mono text-xs text-muted-foreground">{s.sku}</p>
              </div>
              <span className="font-mono text-[13px] font-semibold text-[var(--chart-2)]">
                {formatEUR(s.priceCents)}
              </span>
            </div>
          ))}
        </div>
```

con:

```tsx
        <div className="flex flex-col gap-1">
          {sales.slice(0, 2).map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-foreground/[.03]">
              <span className="size-1.5 shrink-0 rounded-full bg-[var(--chart-2)]" />
              <p className="min-w-0 flex-1 truncate text-[13px] font-medium">{s.itemLabel}</p>
              <span className="font-mono text-[13px] font-semibold text-[var(--chart-2)]">
                {formatEUR(s.priceCents)}
              </span>
            </div>
          ))}
        </div>
```

(il badge `{sales.length}` nell'header resta invariato — mostra il totale, non l'anteprima).

- [ ] **Step 2: Verificare i tipi**

Run: `pnpm exec tsc --noEmit`
Expected: nessun errore

- [ ] **Step 3: Commit**

```bash
git add components/maat/widgets/VenditeWidget.tsx
git commit -m "feat: VenditeWidget compatto a 1/4 colonna (no SKU, cap 2)"
```

---

## Task 13: Verifica end-to-end nel browser

**Files:** nessuno (solo verifica)

- [ ] **Step 1: Build pulita**

Run: `pnpm build`
Expected: build verde, nessun errore TypeScript/lint

- [ ] **Step 2: Avviare il dev server e aprire la Home**

Run: `pnpm dev` (o tramite lo strumento di preview del browser)
Navigare su `/` (Home).

- [ ] **Step 3: Verificare il layout desktop di default**

Con il layout di default (Panoramica, Offerte, Vendite): Panoramica occupa un blocco 2×2, Offerte 2×2 accanto, Vendite 1×1 più piccola. Dentro Panoramica: le tile `entrate`/`offerte` sono orizzontali (silhouette grande), `bozze`/`spedizioni`/`escrow` verticali (medio), `catalogo` a pillola (piccolo).

- [ ] **Step 4: Aggiungere tutti i widget dal catalogo ("Modifica layout" → "Aggiungi widget")**

Verificare che Azioni/Entrate occupino un blocco 2×1 e Notifiche un blocco 1×1 accanto a Vendite, senza sovrapposizioni né buchi vistosi (grazie a `grid-flow-dense`).

- [ ] **Step 5: Verificare gli accenti urgenza con i dati mock**

- Offerte: deve mostrare il pallino urgenza (l'offerta "ieri" in `lib/activity-mock.ts` supera la soglia di 6 ore).
- Panoramica: `bozze` (12) ed `escrow` (€ 940) devono mostrare il pallino urgenza (soglie 10 e 500 superate); `spedizioni` (10) pure (soglia 8).
- Entrate: nessun pallino (delta mock è +14.5%, positivo).

- [ ] **Step 6: Verificare drag&drop**

Con "Modifica layout" attivo, trascinare un paio di widget in posizioni diverse. Verificare che il riordino funzioni senza crash; annotare se l'animazione con gli span misti risulta visibilmente scattosa (non bloccante per questo piano, per decisione di spec — solo da segnalare).

- [ ] **Step 7: Verificare Vendite e Notifiche compatte**

Vendite mostra al massimo 2 righe senza SKU. Notifiche mostra al massimo 2 righe con messaggio troncato su una riga.

- [ ] **Step 8: Verificare il collasso mobile**

Ridimensionare a viewport mobile (o preset `mobile` dello strumento di preview): tutti i widget tornano a colonna singola, nessuno span residuo.

- [ ] **Step 9: Screenshot di conferma**

Catturare uno screenshot della Home desktop con tutti e 6 i widget, da allegare come prova a Federico.

---

## Self-Review (eseguita durante la stesura di questo piano)

**Copertura spec:** ogni sezione della spec (`2026-07-21-maat-home-bento-redesign-design.md`) ha un task corrispondente — fasce (Task 3-4), silhouette (Task 5-6), geometria griglia Home (Task 7), variazione dati/urgenza (Task 2, 8-11), resa compatta Piccolo (Task 10, 12), verifica (Task 13).

**Placeholder scan:** nessun TBD/TODO; le soglie urgenza (bozze≥10, escrow≥€500, spedizioni≥8, offerta≥6h, coda≥48h) sono valori concreti scelti in questo piano, coerenti con la nota di spec "da tarare in implementazione" — sono tarabili in futuro cambiando le costanti in `lib/urgency.ts`, non lasciate indefinite.

**Type consistency:** `Tier` definito una sola volta in `lib/tiers.ts` (Task 1) e riusato identico in `HomeMetric.tier` (Task 3), `WidgetDef.tier` (Task 4), `MetricTile` (Task 5); `WIDGET_TIER_GRID_CLASS`/`METRIC_TIER_GRID_CLASS` hanno le stesse chiavi (`grande`/`medio`/`piccolo`) ovunque referenziate.

**Correzione emersa in fase di piano:** il vincolo "mai sotto mezza larghezza" della spec originale era incompatibile con Piccolo = `col-span-1` su 4 colonne. Federico ha confermato di accettare il quarto di larghezza per Vendite/Notifiche (Task 10, 12) — la spec è stata aggiornata di conseguenza (commit `796cb3e`).
