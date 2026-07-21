# Redesign Inventario Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ridisegnare `/inventario` con toolbar a due fasce, colonne configurabili con preset nominabili, pillole piattaforma con colore brand + tooltip, e vista griglia a card orizzontale stile documento d'identità.

**Architecture:** Config colonne e colori piattaforma isolati in `lib/inventory-columns.ts`. Preset colonne persistiti in un Context store (`lib/inventory-columns-store.tsx`) che ricalca 1:1 il pattern di `lib/home-layout-store.tsx` (Provider + hydration/persist localStorage). `InventoryView` legge lo store e renderizza header/celle tabella dinamicamente; un `ColumnManager` in Popover gestisce mostra/nascondi/riordino (drag `@dnd-kit`) e i preset.

**Tech Stack:** Next.js 15 (App Router, RSC + client components), React 19, TypeScript, Tailwind, shadcn/ui (Popover, Tooltip, Select, Checkbox, Table, Badge), `@dnd-kit/core` + `@dnd-kit/sortable`, `lucide-react`.

## Global Constraints

- **Nessun test framework nel progetto** (solo `build`, `dev`, `lint`). Il ciclo di verifica di ogni task è: `pnpm lint` → `pnpm build` (typecheck) → verifica visiva in browser su `/inventario`. Nessun unit test da scrivere; NON introdurre vitest/jest (scope creep contro il pattern del progetto).
- **Scope:** solo `/inventario`. NON toccare `/capi`, `CatalogCard`, `CatalogTable`.
- **Dati:** mock locale + `localStorage`. Nessun backend.
- **Persist key store colonne:** `maat.inventory.columns.v1` (esatta).
- **Colonna `capo` pinnata:** sempre prima, mai nascondibile/spostabile, esclusa dallo storage dei preset.
- **Ordine colonne di default:** `capo, stato, sku, categoria, taglia, prezzo, piattaforme` (Stato in 2ª posizione).
- **4 stati piattaforma preservati:** `active/pending/delisted/sold` — nessuna regressione a binario.
- **Colori brand piattaforma = best-effort, non ufficiali:** `vinted #007782`, `depop #FF2300`, `grailed #404040`. Il significato primario resta il pallino stato.
- **Commit convention:** `feat(inventario): …` / `refactor(inventario): …`. Ogni commit termina con la riga `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **`git add` mirato** ai file del task, mai `git add -A` (sessioni parallele possibili).

---

### Task 1: Fondamenta dati — config colonne + colori piattaforma + campo foto

**Files:**
- Create: `lib/inventory-columns.ts`
- Modify: `lib/inventory-mock.ts` (interfaccia `InventoryItem` + 15 item)

**Interfaces:**
- Produces:
  - `type PlatformKey = "vinted" | "grailed" | "depop"`
  - `const PLATFORM_KEYS: PlatformKey[]`
  - `type ColumnKey = "capo" | "stato" | "sku" | "categoria" | "taglia" | "prezzo" | "piattaforme"`
  - `interface ColumnDef { key: ColumnKey; label: string; pinned?: boolean }`
  - `const COLUMN_DEFS: Record<ColumnKey, ColumnDef>`
  - `const DEFAULT_COLUMN_ORDER: ColumnKey[]`
  - `const CONFIGURABLE_COLUMNS: ColumnKey[]` (default order senza `capo`)
  - `const PLATFORM_BRAND: Record<PlatformKey, { color: string; initial: string }>`
  - `InventoryItem.photoUrl: string | null`

- [ ] **Step 1: Creare `lib/inventory-columns.ts`**

```ts
// Config colonne inventario + identità/colori piattaforma.
// PlatformKey vive qui (non più dentro InventoryView) così store, pillole e
// tabella lo importano da un unico punto.
import type { Marketplace } from "@/types/maat";

export type PlatformKey = Extract<Marketplace, "vinted" | "grailed" | "depop">;
export const PLATFORM_KEYS: PlatformKey[] = ["vinted", "grailed", "depop"];

export type ColumnKey = "capo" | "stato" | "sku" | "categoria" | "taglia" | "prezzo" | "piattaforme";

export interface ColumnDef {
  key: ColumnKey;
  label: string;
  /** La colonna identità: sempre prima, mai nascosta/spostata, fuori dai preset. */
  pinned?: boolean;
}

export const COLUMN_DEFS: Record<ColumnKey, ColumnDef> = {
  capo: { key: "capo", label: "Capo", pinned: true },
  stato: { key: "stato", label: "Stato" },
  sku: { key: "sku", label: "SKU" },
  categoria: { key: "categoria", label: "Categoria" },
  taglia: { key: "taglia", label: "Taglia" },
  prezzo: { key: "prezzo", label: "Prezzo" },
  piattaforme: { key: "piattaforme", label: "Piattaforme" },
};

// Stato promosso in seconda posizione, subito dopo l'identità pinnata.
export const DEFAULT_COLUMN_ORDER: ColumnKey[] = [
  "capo",
  "stato",
  "sku",
  "categoria",
  "taglia",
  "prezzo",
  "piattaforme",
];

// Tutte le colonne configurabili (mostra/nascondi/riordino) = default meno la pinnata.
export const CONFIGURABLE_COLUMNS: ColumnKey[] = DEFAULT_COLUMN_ORDER.filter(
  (k) => !COLUMN_DEFS[k].pinned
);

// ⚠️ Colori best-effort, NON ufficiali (fonti terze: mobbin, brandfetch).
// Da riprogettare/validare contro la palette calda/olive dell'app. Il valore
// semantico primario resta il pallino stato: il colore serve solo a identificare.
export const PLATFORM_BRAND: Record<PlatformKey, { color: string; initial: string }> = {
  vinted: { color: "#007782", initial: "V" },
  depop: { color: "#FF2300", initial: "D" },
  grailed: { color: "#404040", initial: "G" },
};
```

- [ ] **Step 2: Aggiungere `photoUrl` all'interfaccia in `lib/inventory-mock.ts`**

In `lib/inventory-mock.ts`, dentro `interface InventoryItem` (dopo `status: InventoryStatus;`), aggiungere:

```ts
  /** Foto fronte. null = non ancora scattata (es. bozze). */
  photoUrl: string | null;
```

- [ ] **Step 3: Aggiungere `photoUrl: null` a tutti i 15 item mock**

In ogni oggetto dell'array `inventoryItems`, aggiungere la riga `photoUrl: null,` (subito dopo la riga `status: ...,`). Tutti e 15 gli item ricevono `null` (placeholder foto renderizzato a valle).

- [ ] **Step 4: Lint + typecheck**

Run: `pnpm lint && pnpm build`
Expected: nessun errore. `InventoryItem` ora richiede `photoUrl`; se `build` segnala item mock senza `photoUrl`, aggiungerlo (deve essere presente su tutti e 15).

- [ ] **Step 5: Commit**

```bash
git add lib/inventory-columns.ts lib/inventory-mock.ts
git commit -m "feat(inventario): config colonne, colori piattaforma e campo foto

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Pillole piattaforma v2 (colore brand + pallino stato + tooltip)

**Files:**
- Create: `components/maat/inventory/PlatformPills.tsx`
- Modify: `components/maat/inventory/InventoryView.tsx` (rimuovere `PlatformPills` inline, importare il nuovo; rimuovere `PLATFORM_STATE_CLASS`; aggiornare import di `PlatformKey`/`PLATFORM_KEYS`)

**Interfaces:**
- Consumes: `PLATFORM_BRAND`, `PLATFORM_KEYS`, `PlatformKey` (Task 1); `InventoryItem`, `PlatformListingState` da `lib/inventory-mock`.
- Produces: `export function PlatformPills({ platforms }: { platforms: InventoryItem["platforms"] })`

- [ ] **Step 1: Creare `components/maat/inventory/PlatformPills.tsx`**

```tsx
"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MARKETPLACE_LABELS } from "@/types/maat";
import { PLATFORM_BRAND, PLATFORM_KEYS } from "@/lib/inventory-columns";
import type { InventoryItem, PlatformListingState } from "@/lib/inventory-mock";

// Colore del pallino d'angolo = stato del listing (fonte di significato primaria).
const STATE_DOT: Record<NonNullable<PlatformListingState>, string> = {
  active: "#2f9e4f",
  pending: "#c9a400",
  delisted: "#bbbbbb",
  sold: "#2a2a22",
};

const STATE_LABEL: Record<NonNullable<PlatformListingState>, string> = {
  active: "attivo",
  pending: "in corso",
  delisted: "rimosso",
  sold: "venduto",
};

/** Pillole piattaforma: quadratino colore-brand + iniziale + pallino stato + tooltip. */
export function PlatformPills({ platforms }: { platforms: InventoryItem["platforms"] }) {
  const listed = PLATFORM_KEYS.filter((key) => platforms[key] !== null);
  if (listed.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {listed.map((key) => {
        const state = platforms[key];
        if (!state) return null;
        const brand = PLATFORM_BRAND[key];
        return (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <span
                className="relative inline-flex size-6 items-center justify-center rounded-[7px] font-mono text-[10px] font-bold text-white"
                style={{ backgroundColor: brand.color }}
              >
                {brand.initial}
                <span
                  className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-background"
                  style={{ backgroundColor: STATE_DOT[state] }}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {MARKETPLACE_LABELS[key]} · {STATE_LABEL[state]}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
```

Nota: il componente `Tooltip` di shadcn incapsula già il proprio `TooltipProvider` (vedi `components/ui/tooltip.tsx`), quindi non serve un provider a monte.

- [ ] **Step 2: In `InventoryView.tsx`, rimuovere la vecchia `PlatformPills` inline e `PLATFORM_STATE_CLASS`**

Cancellare da `InventoryView.tsx`:
- la costante `PLATFORM_STATE_CLASS` (le classi dei 4 stati);
- l'intera funzione `function PlatformPills({ platforms }) { … }` inline.

- [ ] **Step 3: Aggiornare gli import di `InventoryView.tsx`**

Sostituire le righe di import correlate. Rimuovere la definizione locale:

```ts
type PlatformKey = Extract<Marketplace, "vinted" | "grailed" | "depop">;
const PLATFORM_KEYS: PlatformKey[] = ["vinted", "grailed", "depop"];
```

e importare da `lib` + il nuovo componente:

```ts
import { MARKETPLACE_LABELS } from "@/types/maat";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/inventory-columns";
import { PlatformPills } from "@/components/maat/inventory/PlatformPills";
```

(Se `Marketplace` non è più usato altrove nel file, rimuoverlo dall'import di `@/types/maat`; `MARKETPLACE_LABELS` resta perché usato dal Select Piattaforma.)

- [ ] **Step 4: Lint + typecheck**

Run: `pnpm lint && pnpm build`
Expected: nessun errore, nessun import inutilizzato.

- [ ] **Step 5: Verifica browser**

Avvia il dev server (preview_start con la config del progetto, o `pnpm dev`) e apri `/inventario`.
Expected: in tabella e griglia le piattaforme ora sono quadratini colorati (Vinted teal, Depop rosso, Grailed grafite) con iniziale bianca e pallino d'angolo colorato per stato; hover su un quadratino mostra il tooltip "Vinted · attivo" ecc. Levi's 501 (venduto) mostra pallino scuro; le bozze senza piattaforme mostrano "—".

- [ ] **Step 6: Commit**

```bash
git add components/maat/inventory/PlatformPills.tsx components/maat/inventory/InventoryView.tsx
git commit -m "feat(inventario): pillole piattaforma con colore brand e tooltip

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Store preset colonne + wiring provider

**Files:**
- Create: `lib/inventory-columns-store.tsx`
- Modify: `app/inventario/page.tsx` (avvolge con il Provider)

**Interfaces:**
- Consumes: `CONFIGURABLE_COLUMNS`, `ColumnKey` (Task 1).
- Produces:
  - `interface ColumnPreset { id: string; name: string; visible: ColumnKey[]; builtIn?: boolean }`
  - `function InventoryColumnsProvider({ children }: { children: ReactNode })`
  - `function useInventoryColumns(): InventoryColumnsContextValue` con:
    `activePreset`, `presets`, `visibleColumns: ColumnKey[]`, `hiddenColumns: ColumnKey[]`,
    `setActivePreset(id: string)`, `reorderVisible(next: ColumnKey[])`,
    `showColumn(key: ColumnKey)`, `hideColumn(key: ColumnKey)`,
    `savePreset(name: string)`, `renamePreset(id: string, name: string)`, `deletePreset(id: string)`.

- [ ] **Step 1: Creare `lib/inventory-columns-store.tsx`**

```tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CONFIGURABLE_COLUMNS, type ColumnKey } from "@/lib/inventory-columns";

export interface ColumnPreset {
  id: string;
  name: string;
  /** Ordine + visibilità delle colonne configurabili (esclude sempre "capo"). */
  visible: ColumnKey[];
  /** Il preset Default: non rinominabile né eliminabile. */
  builtIn?: boolean;
}

const STORAGE_KEY = "maat.inventory.columns.v1";
const DEFAULT_PRESET_ID = "default";

function isColumnKey(value: unknown): value is ColumnKey {
  return typeof value === "string" && (CONFIGURABLE_COLUMNS as readonly string[]).includes(value);
}

function makeDefaultPreset(): ColumnPreset {
  return { id: DEFAULT_PRESET_ID, name: "Default", visible: [...CONFIGURABLE_COLUMNS], builtIn: true };
}

// id stabile per i preset custom, senza collisioni. Date.now è ammesso in runtime browser.
function newPresetId() {
  return `preset-${Date.now().toString(36)}`;
}

interface PersistShape {
  activePresetId: string;
  presets: ColumnPreset[];
}

interface InventoryColumnsContextValue {
  activePreset: ColumnPreset;
  presets: ColumnPreset[];
  visibleColumns: ColumnKey[];
  hiddenColumns: ColumnKey[];
  setActivePreset: (id: string) => void;
  reorderVisible: (next: ColumnKey[]) => void;
  showColumn: (key: ColumnKey) => void;
  hideColumn: (key: ColumnKey) => void;
  savePreset: (name: string) => void;
  renamePreset: (id: string, name: string) => void;
  deletePreset: (id: string) => void;
}

const Ctx = createContext<InventoryColumnsContextValue | null>(null);

export function InventoryColumnsProvider({ children }: { children: ReactNode }) {
  const [presets, setPresets] = useState<ColumnPreset[]>([makeDefaultPreset()]);
  const [activePresetId, setActivePresetId] = useState<string>(DEFAULT_PRESET_ID);
  const hydrated = useRef(false);

  // Hydration da localStorage (una volta). Storage corrotto → default.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<PersistShape>;
        const cleaned = Array.isArray(saved.presets)
          ? saved.presets
              .filter((p): p is ColumnPreset => !!p && typeof p.id === "string" && typeof p.name === "string" && Array.isArray(p.visible))
              .map((p) => ({ ...p, visible: p.visible.filter(isColumnKey) }))
          : [];
        // Garantisce sempre la presenza del Default builtIn.
        const withDefault = cleaned.some((p) => p.id === DEFAULT_PRESET_ID)
          ? cleaned
          : [makeDefaultPreset(), ...cleaned];
        setPresets(withDefault);
        if (typeof saved.activePresetId === "string" && withDefault.some((p) => p.id === saved.activePresetId)) {
          setActivePresetId(saved.activePresetId);
        }
      }
    } catch {
      // storage non disponibile/corrotto: si resta sul default
    }
    hydrated.current = true;
  }, []);

  // Persist a ogni cambiamento (dopo l'hydration).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ activePresetId, presets }));
    } catch {
      // storage pieno/bloccato: lo stato resta in memoria
    }
  }, [activePresetId, presets]);

  const activePreset = useMemo(
    () => presets.find((p) => p.id === activePresetId) ?? presets[0] ?? makeDefaultPreset(),
    [presets, activePresetId]
  );

  const visibleColumns = activePreset.visible;
  const hiddenColumns = useMemo(
    () => CONFIGURABLE_COLUMNS.filter((k) => !visibleColumns.includes(k)),
    [visibleColumns]
  );

  // Muta il preset ATTIVO in place (nessun buffer "modificato non salvato": semplificazione accettata).
  function updateActive(fn: (visible: ColumnKey[]) => ColumnKey[]) {
    setPresets((prev) => prev.map((p) => (p.id === activePresetId ? { ...p, visible: fn(p.visible) } : p)));
  }

  const value = useMemo<InventoryColumnsContextValue>(
    () => ({
      activePreset,
      presets,
      visibleColumns,
      hiddenColumns,
      setActivePreset: (id) => setActivePresetId(id),
      reorderVisible: (next) => updateActive(() => next.filter(isColumnKey)),
      showColumn: (key) => updateActive((v) => (v.includes(key) ? v : [...v, key])),
      hideColumn: (key) => updateActive((v) => v.filter((k) => k !== key)),
      savePreset: (name) => {
        const id = newPresetId();
        setPresets((prev) => [...prev, { id, name: name.trim() || "Senza nome", visible: [...visibleColumns] }]);
        setActivePresetId(id);
      },
      renamePreset: (id, name) =>
        setPresets((prev) => prev.map((p) => (p.id === id && !p.builtIn ? { ...p, name: name.trim() || p.name } : p))),
      deletePreset: (id) => {
        setPresets((prev) => prev.filter((p) => p.id !== id || p.builtIn));
        setActivePresetId((cur) => (cur === id ? DEFAULT_PRESET_ID : cur));
      },
    }),
    // activePresetId serve a updateActive; visibleColumns/hiddenColumns derivano da activePreset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePreset, presets, visibleColumns, hiddenColumns, activePresetId]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInventoryColumns() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useInventoryColumns must be used within an InventoryColumnsProvider");
  return ctx;
}
```

- [ ] **Step 2: Avvolgere `/inventario` col Provider in `app/inventario/page.tsx`**

```tsx
import { InventoryView } from "@/components/maat/inventory/InventoryView";
import { InventoryColumnsProvider } from "@/lib/inventory-columns-store";

export default function InventarioPage() {
  return (
    <InventoryColumnsProvider>
      <InventoryView />
    </InventoryColumnsProvider>
  );
}
```

- [ ] **Step 3: Lint + typecheck**

Run: `pnpm lint && pnpm build`
Expected: nessun errore. Il Provider è montato ma non ancora consumato (nessun cambiamento visivo previsto): OK.

- [ ] **Step 4: Commit**

```bash
git add lib/inventory-columns-store.tsx app/inventario/page.tsx
git commit -m "feat(inventario): store preset colonne (localStorage) + provider

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Toolbar a due fasce (opzione 3)

**Files:**
- Modify: `components/maat/inventory/InventoryView.tsx` (blocco toolbar JSX)

**Interfaces:**
- Consumes: nulla di nuovo (solo restyle del JSX esistente). La logica filtri/segmented/vista resta invariata.
- Produces: nessuna nuova API. Prepara il contenitore della fascia secondaria dove il Task 5 inserirà il bottone "Colonne".

- [ ] **Step 1: Ristrutturare il JSX della toolbar**

In `InventoryView.tsx`, sostituire il blocco toolbar attuale (il `div` con commento `{/* toolbar: ricerca + segmented stato/vista */}` fino alla chiusura della riga filtri, incluso `{/* riga filtri */}`) con un contenitore unico a due fasce:

```tsx
      {/* toolbar a due fasce: primaria (ricerca/stato/vista) + secondaria (filtri/colonne) */}
      <div className="overflow-hidden rounded-xl border border-border">
        {/* fascia primaria */}
        <div className="flex flex-wrap items-center gap-3 p-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per brand, tipo o SKU…"
              aria-label="Cerca"
              className="pl-8"
            />
          </div>

          <div className="ml-auto inline-flex flex-wrap rounded-md border border-border p-0.5">
            {STATUS_SEGMENTS.map((s) => (
              <button
                key={s.value}
                type="button"
                aria-pressed={statusFilter === s.value}
                onClick={() => setStatusFilter(s.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                  statusFilter === s.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0 text-[11px] font-mono",
                    statusFilter === s.value ? "bg-primary-foreground/20" : "bg-muted"
                  )}
                >
                  {statusCounts[s.value]}
                </span>
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-md border border-border p-0.5">
            <button
              type="button"
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="size-3.5" /> Tabella
            </button>
            <button
              type="button"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-3.5" /> Griglia
            </button>
          </div>
        </div>

        {/* fascia secondaria: filtri di servizio, sfondo distinto */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/40 px-3 py-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Categoria
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger size="sm" className="w-36" aria-label="Categoria">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Taglia
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger size="sm" className="w-24" aria-label="Taglia">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                {SIZE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Prezzo
            <Select value={price} onValueChange={(v) => setPrice(v as PriceBand)}>
              <SelectTrigger size="sm" className="w-28" aria-label="Prezzo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICE_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Piattaforma
            <Select value={platform} onValueChange={(v) => setPlatform(v as PlatformFilter)}>
              <SelectTrigger size="sm" className="w-28" aria-label="Piattaforma">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                {PLATFORM_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {MARKETPLACE_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {/* SLOT COLONNE — il Task 5 inserisce qui <ColumnManager /> (solo in vista Tabella) */}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Azzera
            </Button>
          )}

          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} capi</span>
        </div>
      </div>
```

- [ ] **Step 2: Lint + typecheck**

Run: `pnpm lint && pnpm build`
Expected: nessun errore.

- [ ] **Step 3: Verifica browser**

Apri `/inventario`.
Expected: la toolbar è ora un blocco `rounded-xl` con bordo: sopra ricerca + segmented stato + toggle vista; sotto, su sfondo leggermente più scuro (`bg-muted/40`), i 4 filtri + Azzera + conteggio "N capi". Filtri, segmented e toggle vista funzionano come prima. Su viewport stretto la fascia secondaria va a capo senza overflow orizzontale.

- [ ] **Step 4: Commit**

```bash
git add components/maat/inventory/InventoryView.tsx
git commit -m "refactor(inventario): toolbar a due fasce per gerarchia visiva

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Colonne configurabili — ColumnManager + tabella dinamica

**Files:**
- Create: `components/maat/inventory/ColumnManager.tsx`
- Modify: `components/maat/inventory/InventoryView.tsx` (montare `<ColumnManager />` nello SLOT COLONNE; rendere la tabella dinamica dallo store)

**Interfaces:**
- Consumes: `useInventoryColumns` (Task 3); `COLUMN_DEFS`, `ColumnKey` (Task 1); `PlatformPills` (Task 2); pattern dnd-kit come `HomeDashboard`.
- Produces: `export function ColumnManager()` (bottone Popover autonomo, legge/scrive lo store via hook).

- [ ] **Step 1: Creare `components/maat/inventory/ColumnManager.tsx`**

```tsx
"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Lock, Pencil, Plus, Settings2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { COLUMN_DEFS, type ColumnKey } from "@/lib/inventory-columns";
import { useInventoryColumns } from "@/lib/inventory-columns-store";

/** Riga trascinabile della lista "Visibili". */
function SortableColumnRow({ column, onHide }: { column: ColumnKey; onHide: (k: ColumnKey) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]",
        isDragging ? "bg-background shadow-sm" : "hover:bg-foreground/[.03]"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground/50 active:cursor-grabbing"
        aria-label={`Trascina ${COLUMN_DEFS[column].label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      <span className="flex-1">{COLUMN_DEFS[column].label}</span>
      <button
        type="button"
        onClick={() => onHide(column)}
        className="text-muted-foreground/60 hover:text-foreground"
        aria-label={`Nascondi ${COLUMN_DEFS[column].label}`}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function ColumnManager() {
  const {
    activePreset,
    presets,
    visibleColumns,
    hiddenColumns,
    setActivePreset,
    reorderVisible,
    showColumn,
    hideColumn,
    savePreset,
    renamePreset,
    deletePreset,
  } = useInventoryColumns();

  const [savingName, setSavingName] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = visibleColumns.indexOf(active.id as ColumnKey);
    const to = visibleColumns.indexOf(over.id as ColumnKey);
    if (from < 0 || to < 0) return;
    reorderVisible(arrayMove(visibleColumns, from, to));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings2 className="size-3.5" /> Colonne · {activePreset.name}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[420px] p-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Visibili */}
          <div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">Visibili</p>
            {/* Capo: pinnata, fuori dal drag */}
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] opacity-70">
              <Lock className="size-3 text-muted-foreground/50" />
              <span className="flex-1">{COLUMN_DEFS.capo.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground/50">fissa</span>
            </div>
            <DndContext
              id="inventory-columns"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={visibleColumns} strategy={verticalListSortingStrategy}>
                {visibleColumns.map((col) => (
                  <SortableColumnRow key={col} column={col} onHide={hideColumn} />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Nascoste */}
          <div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">Nascoste</p>
            {hiddenColumns.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground/50">Tutte visibili</p>
            ) : (
              hiddenColumns.map((col) => (
                <div key={col} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-foreground/[.03]">
                  <span className="flex-1 text-muted-foreground">{COLUMN_DEFS[col].label}</span>
                  <button
                    type="button"
                    onClick={() => showColumn(col)}
                    className="text-muted-foreground/60 hover:text-foreground"
                    aria-label={`Mostra ${COLUMN_DEFS[col].label}`}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Barra preset */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Select value={activePreset.id} onValueChange={setActivePreset}>
            <SelectTrigger size="sm" className="w-36" aria-label="Preset colonne">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {savingName === null ? (
            <Button variant="ghost" size="sm" onClick={() => setSavingName("")}>
              Salva come…
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                value={savingName}
                onChange={(e) => setSavingName(e.target.value)}
                placeholder="Nome preset"
                className="h-8 w-32"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && savingName.trim()) {
                    savePreset(savingName);
                    setSavingName(null);
                  }
                  if (e.key === "Escape") setSavingName(null);
                }}
              />
              <Button
                size="sm"
                className="h-8 px-2"
                disabled={!savingName.trim()}
                onClick={() => {
                  savePreset(savingName);
                  setSavingName(null);
                }}
                aria-label="Conferma salvataggio preset"
              >
                <Check className="size-3.5" />
              </Button>
            </div>
          )}

          {!activePreset.builtIn && savingName === null && (
            <div className="ml-auto flex items-center gap-1">
              {renaming ? (
                <div className="flex items-center gap-1">
                  <Input
                    autoFocus
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                    className="h-8 w-28"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && renameName.trim()) {
                        renamePreset(activePreset.id, renameName);
                        setRenaming(false);
                      }
                      if (e.key === "Escape") setRenaming(false);
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-8 px-2"
                    disabled={!renameName.trim()}
                    onClick={() => {
                      renamePreset(activePreset.id, renameName);
                      setRenaming(false);
                    }}
                    aria-label="Conferma rinomina preset"
                  >
                    <Check className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => {
                      setRenameName(activePreset.name);
                      setRenaming(true);
                    }}
                    aria-label="Rinomina preset"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-destructive hover:text-destructive"
                    onClick={() => deletePreset(activePreset.id)}
                    aria-label="Elimina preset"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Montare `<ColumnManager />` nello SLOT COLONNE (solo vista Tabella)**

In `InventoryView.tsx`, importare in cima:

```ts
import { ColumnManager } from "@/components/maat/inventory/ColumnManager";
import { useInventoryColumns } from "@/lib/inventory-columns-store";
import { COLUMN_DEFS, type ColumnKey } from "@/lib/inventory-columns";
```

Sostituire il commento `{/* SLOT COLONNE … */}` con:

```tsx
          {view === "table" && <ColumnManager />}
```

- [ ] **Step 3: Leggere lo store dentro il componente**

Dentro `InventoryView`, dopo gli altri hook di stato, aggiungere:

```ts
  const { visibleColumns } = useInventoryColumns();
```

- [ ] **Step 4: Rendere la tabella dinamica**

In `InventoryView.tsx`, sostituire l'intero blocco `view === "table"` (l'`<div className="overflow-hidden rounded-xl border border-border"><Table>…</Table></div>`) con una versione guidata da `visibleColumns`. Aggiungere, sopra il `return` del componente, un renderer di cella per colonna:

```tsx
  const renderCell: Record<ColumnKey, (item: InventoryItem) => React.ReactNode> = {
    capo: (item) => (
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
    ),
    stato: (item) => (
      <Badge className={cn("text-[11px]", STATUS_CLASS[item.status])}>{STATUS_LABEL[item.status]}</Badge>
    ),
    sku: (item) => <span className="font-mono text-xs text-muted-foreground">{item.sku}</span>,
    categoria: (item) => <span className="text-sm text-muted-foreground">{item.category}</span>,
    taglia: (item) => <span className="text-sm text-muted-foreground">{item.size}</span>,
    prezzo: (item) => <span className="font-mono text-sm">{formatEUR(item.priceCents)}</span>,
    piattaforme: (item) => <PlatformPills platforms={item.platforms} />,
  };

  const orderedColumns: ColumnKey[] = ["capo", ...visibleColumns];
```

E il blocco tabella diventa:

```tsx
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                {orderedColumns.map((col) => (
                  <TableHead key={col}>{COLUMN_DEFS[col].label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow
                  key={item.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/capi/${item.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(`/capi/${item.id}`);
                  }}
                  className="cursor-pointer hover:bg-muted/40"
                >
                  {orderedColumns.map((col) => (
                    <TableCell key={col}>{renderCell[col](item)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
```

Nota: aggiungere `import type React from "react";` se non già presente (per `React.ReactNode`), oppure usare `import { type ReactNode } from "react"` e sostituire `React.ReactNode` con `ReactNode`.

- [ ] **Step 5: Lint + typecheck**

Run: `pnpm lint && pnpm build`
Expected: nessun errore.

- [ ] **Step 6: Verifica browser**

Apri `/inventario` in vista Tabella.
Expected:
- Ordine colonne di default: Capo (con mini-thumb) · Stato · SKU · Categoria · Taglia · Prezzo · Piattaforme.
- Bottone "Colonne · Default" nella fascia secondaria; assente in vista Griglia.
- Popover: lista Visibili con Capo pinnata (lucchetto, "fissa"); "×" nasconde una colonna → passa a Nascoste; "+" la rimostra; drag riordina.
- "Salva come…" → digita nome → il preset diventa attivo e il bottone mostra il nuovo nome; su preset custom compaiono rinomina/elimina; su Default no.
- Reload pagina: preset attivo, ordine e visibilità persistono.

- [ ] **Step 7: Commit**

```bash
git add components/maat/inventory/ColumnManager.tsx components/maat/inventory/InventoryView.tsx
git commit -m "feat(inventario): colonne configurabili con preset nominabili

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Vista griglia — card documento d'identità (opzione B)

**Files:**
- Modify: `components/maat/inventory/InventoryView.tsx` (blocco `view === "grid"`)

**Interfaces:**
- Consumes: `PlatformPills` (Task 2), `STATUS_CLASS`/`STATUS_LABEL` esistenti, `formatEUR`.
- Produces: nessuna nuova API.

- [ ] **Step 1: Sostituire il blocco griglia**

In `InventoryView.tsx`, sostituire l'intero ramo `else` della griglia (il `<div className="grid grid-cols-1 …">` con i `<Link>` card verticali) con card orizzontali foto-laterale + campi in griglia:

```tsx
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={`/capi/${item.id}`}
              className="flex overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/25"
            >
              {/* foto laterale a piena altezza */}
              <div className="flex w-[110px] shrink-0 items-center justify-center border-r border-border bg-background">
                {item.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photoUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-center font-mono text-[9px] uppercase tracking-wide text-muted-foreground/50">
                    Foto
                    <br />
                    fronte
                  </span>
                )}
              </div>

              {/* campi in griglia label/valore a due colonne */}
              <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-2 p-4">
                <div className="col-span-2">
                  <FieldLabel>Capo</FieldLabel>
                  <div className="truncate text-[15px] font-semibold">
                    {item.brand} — {item.tipoCapo}
                  </div>
                </div>
                <div>
                  <FieldLabel>SKU</FieldLabel>
                  <div className="font-mono text-xs text-muted-foreground">{item.sku}</div>
                </div>
                <div>
                  <FieldLabel>Stato</FieldLabel>
                  <Badge className={cn("text-[11px]", STATUS_CLASS[item.status])}>{STATUS_LABEL[item.status]}</Badge>
                </div>
                <div>
                  <FieldLabel>Categoria</FieldLabel>
                  <div className="text-sm text-muted-foreground">{item.category}</div>
                </div>
                <div>
                  <FieldLabel>Taglia</FieldLabel>
                  <div className="text-sm text-muted-foreground">{item.size}</div>
                </div>
                <div>
                  <FieldLabel>Prezzo</FieldLabel>
                  <div className="font-mono text-sm font-semibold">{formatEUR(item.priceCents)}</div>
                </div>
                <div>
                  <FieldLabel>Piattaforme</FieldLabel>
                  <PlatformPills platforms={item.platforms} />
                </div>
              </div>
            </Link>
          ))}
        </div>
```

- [ ] **Step 2: Aggiungere il micro-componente `FieldLabel`**

In `InventoryView.tsx`, prima di `export function InventoryView()`, aggiungere:

```tsx
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-0.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground/55">{children}</div>
  );
}
```

(Coerente con la scelta su `React.ReactNode`/`ReactNode` fatta al Task 5.)

- [ ] **Step 3: Lint + typecheck**

Run: `pnpm lint && pnpm build`
Expected: nessun errore.

- [ ] **Step 4: Verifica browser**

Apri `/inventario`, passa a vista Griglia.
Expected: card orizzontali, foto (placeholder "FOTO FRONTE") a piena altezza a sinistra, a destra griglia a 2 colonne con Capo (span pieno), SKU, Stato (badge), Categoria, Taglia, Prezzo, Piattaforme (pillole v2). Due card per riga su desktop, una su mobile. Card cliccabile → dettaglio capo. Il bottone "Colonne" resta nascosto in questa vista.

- [ ] **Step 5: Commit**

```bash
git add components/maat/inventory/InventoryView.tsx
git commit -m "feat(inventario): vista griglia card documento d'identita

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- §2.1 photoUrl → Task 1 ✓
- §2.2 config colonne → Task 1 ✓
- §3 store preset → Task 3 ✓
- §4 toolbar due fasce → Task 4 ✓
- §5 ColumnManager due liste + preset → Task 5 ✓
- §6 tabella dinamica, Stato 2ª → Task 5 ✓ (DEFAULT_COLUMN_ORDER Task 1)
- §7 griglia ID-card opzione B → Task 6 ✓
- §8 pillole v2 + colori brand + tooltip → Task 2 (+ tabella colori Task 1) ✓
- §9 file toccati → tutti mappati ✓
- §10 verifica → step di verifica browser in Task 2/4/5/6 ✓

**Type consistency:** `PlatformKey`/`PLATFORM_KEYS` centralizzati in Task 1, consumati identici in Task 2/4. `ColumnKey`, `COLUMN_DEFS`, `CONFIGURABLE_COLUMNS`, `DEFAULT_COLUMN_ORDER` definiti Task 1, usati Task 3/5. Store API (`visibleColumns`, `hiddenColumns`, `reorderVisible`, `showColumn`, `hideColumn`, `savePreset`, `renamePreset`, `deletePreset`, `setActivePreset`, `activePreset`, `presets`) definita Task 3, consumata identica in Task 5. `PlatformPills` firma `{ platforms }` definita Task 2, usata Task 5/6. `React.ReactNode` vs `ReactNode`: nota di coerenza esplicita in Task 5 e Task 6.

**Placeholder scan:** nessun TBD/TODO azionabile lasciato aperto. L'unico "TODO estetico" (colori piattaforma) è deliberato, marcato nello spec e in `PLATFORM_BRAND`, e non blocca l'implementazione.
