# Redesign Inventario — colonne configurabili, toolbar, griglia ID-card

**Data:** 2026-07-21
**Scope:** `/inventario` (MAAT SalesOps prototype). Solo `InventoryView` + tipi/mock inventario. `/capi` legacy NON toccata.
**Stato dati:** mock locale + `localStorage` (nessun backend, coerente col resto del prototipo).

---

## 1. Obiettivo

Quattro interventi sulla vista `/inventario`:

1. **Toolbar filtri** con più gerarchia visiva (problema odierno: puramente estetico, non funzionale).
2. **Distribuzione campi** ridisegnata: Stato come prima colonna di default; sezione piattaforme rivista.
3. **Sistema di colonne configurabili**: mostra/nascondi + riordino drag, con **preset nominabili** salvabili.
4. **Vista griglia** con card orizzontale stile documento d'identità (foto laterale + campi in griglia).

Fuori scope: `/capi` legacy, backend reale, connessioni marketplace vere, colori piattaforma certificati (usiamo best-effort da fonti terze).

---

## 2. Modello dati

### 2.1 `InventoryItem` — nuovo campo foto

`lib/inventory-mock.ts` — aggiungere:

```ts
export interface InventoryItem {
  // …campi esistenti…
  photoUrl: string | null; // foto fronte; null = non ancora scattata (bozze)
}
```

I 15 item mock ricevono `photoUrl: null` (placeholder "FOTO FRONTE" renderizzato quando null, come già fa `CatalogCard`/`Thumb`). Le bozze restano coerentemente senza foto.

### 2.2 Definizione colonne

Nuovo modulo `lib/inventory-columns.ts` (tipi + config + default), separato da `InventoryView` per tenerlo testabile e fuori dal componente:

```ts
export type ColumnKey = "capo" | "stato" | "sku" | "categoria" | "taglia" | "prezzo" | "piattaforme";

export interface ColumnDef {
  key: ColumnKey;
  label: string;
  pinned?: boolean; // "capo" è pinned: sempre visibile, non rimovibile, non spostabile dalla testa
}

export const COLUMN_DEFS: Record<ColumnKey, ColumnDef> = { /* … */ };

// Ordine di default = distribuzione campi richiesta (Stato promosso in 2ª posizione,
// subito dopo l'identità pinnata "Capo").
export const DEFAULT_COLUMN_ORDER: ColumnKey[] = [
  "capo", "stato", "sku", "categoria", "taglia", "prezzo", "piattaforme",
];
```

`capo` è `pinned: true`: renderizza brand + tipoCapo + (in tabella) mini-thumb, e non compare mai nel pannello come rimovibile/spostabile.

---

## 3. Preset di colonne — store

Nuovo `lib/inventory-columns-store.tsx`, **stesso pattern context di `home-layout-store.tsx`** (Provider + `useEffect` di hydration + `useEffect` di persist, try/catch silenzioso).

```ts
export interface ColumnPreset {
  id: string;      // "default" | slug generato per i custom
  name: string;    // display
  visible: ColumnKey[]; // ordine + visibilità (esclude sempre "capo" pinned dallo storage)
  builtIn?: boolean;    // "default" non rinominabile/eliminabile
}
```

Stato persistito sotto `STORAGE_KEY = "maat.inventory.columns.v1"`:

```ts
{ activePresetId: string, presets: ColumnPreset[] }
```

Preset **Default** (builtIn) sempre presente, derivato da `DEFAULT_COLUMN_ORDER` meno `capo`. Non rinominabile né eliminabile.

API del context:

| Metodo | Effetto |
|---|---|
| `visibleColumns: ColumnKey[]` | ordine effettivo (senza `capo`) del preset attivo |
| `hiddenColumns: ColumnKey[]` | complemento (colonne non nel preset attivo) |
| `activePreset: ColumnPreset` | |
| `presets: ColumnPreset[]` | |
| `setActivePreset(id)` | |
| `reorderVisible(next: ColumnKey[])` | riordino drag |
| `showColumn(key)` / `hideColumn(key)` | sposta tra visibili/nascoste |
| `savePreset(name)` | crea preset custom dallo stato colonne corrente, lo attiva |
| `renamePreset(id, name)` / `deletePreset(id)` | solo su custom (no builtIn) |

**Nota edit-in-place:** quando l'utente sposta/riordina colonne mentre è attivo un preset, muta il preset attivo in memoria; su un builtIn ("Default") questo è ammesso ma la mutazione resta locale finché non fa "Salva come nuovo preset". Semplificazione accettata: niente stato "modificato ma non salvato" tracciato in UI (YAGNI per un prototipo). Se un domani serve, si aggiunge un flag `dirty`.

Il Provider avvolge la pagina `/inventario` (in `app/inventario/page.tsx` o layout locale), non l'intera app: lo store serve solo qui.

---

## 4. Toolbar (opzione 3 — due fasce)

Due fasce dentro un contenitore `rounded-xl border` unico, senza gap, seconda fascia con sfondo `bg-muted/40`:

**Fascia primaria** (padding pieno, sfondo card):
- Ricerca (invariata: `Input` + icona `Search`).
- Segmented **Stato** (`Tutti / Bozze / A catalogo / Venduti`) con conteggi live — logica invariata.
- Toggle **vista** Tabella / Griglia — invariato.

**Fascia secondaria** (`bg-muted/40`, padding ridotto, `rounded-b-xl`):
- Filtri `Categoria / Taglia / Prezzo / Piattaforma` come chip-select (Select shadcn, look chip).
- Bottone **Colonne**: mostra il nome del preset attivo + ▾ (`⋮⋮ {activePreset.name} ▾`). Apre il pannello (§5). Visibile **solo in vista Tabella** (in Griglia il layout della card è fisso).
- **Azzera** (solo se filtri attivi) + conteggio `{n} capi` a destra.

Responsive: la fascia secondaria va in `flex-wrap`; nessun overflow orizzontale. (Il pain era estetico, non mobile, ma il wrap resta pulito.)

---

## 5. Pannello Colonne (opzione B — due liste)

Reso in un **`Popover`** (shadcn) ancorato al bottone "Colonne". Larghezza ~ 420px, due colonne affiancate:

**Sinistra — "Visibili"** (riordinabile):
- Lista `@dnd-kit/sortable` (già dipendenza del progetto, stesso uso della Home widget-grid).
- Prima voce = **Capo**, pinnata: handle disabilitato, icona 🔒, nessuna azione. Non partecipa al `SortableContext`.
- Ogni altra voce: handle drag `⋮⋮` + label + bottone "×" (→ `hideColumn`).

**Destra — "Nascoste"**:
- Lista semplice (no drag), ogni voce con "+" (→ `showColumn`, la aggiunge in coda alle visibili).

**Barra preset** (sotto le due liste, full width):
- `Select` preset (Default + custom) → `setActivePreset`.
- Bottone **"Salva come…"** → prompt inline (piccolo input + conferma) → `savePreset(name)`.
- Su preset custom attivo: icone **rinomina** / **elimina**. Su "Default": nascoste.

dnd-kit: `PointerSensor` + `KeyboardSensor`, `verticalListSortingStrategy`. `onDragEnd` → `reorderVisible`.

---

## 6. Tabella — rendering dinamico

`InventoryView` legge `visibleColumns` dallo store e renderizza header + celle in ordine. `capo` sempre come prima colonna (pinned), poi le `visibleColumns`.

Mappa `ColumnKey → { header, cell(item) }` locale al componente:

| Colonna | Cella |
|---|---|
| `capo` (pinned) | mini-thumb 32px (foto o placeholder) + brand (font-medium) + tipoCapo (muted) |
| `stato` | `Badge` stato (bozza/catalogo/venduto), colori esistenti |
| `sku` | mono, muted |
| `categoria` | muted |
| `taglia` | muted |
| `prezzo` | mono, `formatEUR` |
| `piattaforme` | `<PlatformPills>` v2 (§8) |

Riga resta cliccabile → `/capi/{id}` (invariato). L'ordine header/celle deriva sempre dalla stessa `visibleColumns` per non disallineare.

---

## 7. Griglia — card ID-document (opzione B)

Card **orizzontale**: foto a piena altezza a sinistra + campi in **griglia label/valore a due colonne** a destra (tipo modulo anagrafico).

```
┌──────────┬─────────────────────────────┐
│          │ Capo   Stone Island — Over… │  ← span 2 colonne
│  FOTO    │ SKU        │ Stato          │
│  FRONTE  │ Categoria  │ Taglia         │
│  (4/5)   │ Prezzo     │ Piattaforme    │
└──────────┴─────────────────────────────┘
```

- Foto: `w-[110px]`, `aspect` gestito a piena altezza, placeholder "FOTO FRONTE" mono quando `photoUrl === null`.
- Campi: `grid grid-cols-2 gap-x-3 gap-y-2`, ogni cella = micro-label (`text-[9px] uppercase font-mono opacity-55`) + valore. "Capo" occupa entrambe le colonne.
- Stato = `Badge`; Piattaforme = `<PlatformPills>` v2.
- Card cliccabile → `/capi/{id}`.
- La griglia **non** rispetta il preset colonne (layout card fisso: mostra sempre gli stessi campi). Il preset governa solo la Tabella. → il bottone "Colonne" è nascosto in vista Griglia.

Grid contenitore: `grid-cols-1 lg:grid-cols-2` (card larghe orizzontali stanno bene a 2 per riga su desktop, 1 su mobile).

---

## 8. Piattaforme — pillole v2 (opzione 2, approvata)

Ogni piattaforma listata = quadratino `rounded-[7px]` con:
- **sfondo = colore brand della piattaforma** (identificazione),
- **iniziale** in bianco,
- **pallino d'angolo** = stato listing (attivo/in corso/rimosso/venduto),
- **`Tooltip` shadcn** (non attributo `title`): `"{Nome} · {stato}"`.

Colori stato (pallino), invariati concettualmente da oggi:

| Stato | Pallino |
|---|---|
| active | verde `#2f9e4f` |
| pending | ambra `#c9a400` |
| delisted | grigio `#bbbbbb` |
| sold | scuro `#2a2a22` |

### 8.1 Colori brand piattaforma — tabella di riferimento

Vivono in `lib/inventory-columns.ts` (o `lib/platform-brand.ts`), riusabili anche altrove (onboarding oggi non ha colori piattaforma). `PlatformKey` (oggi definito dentro `InventoryView.tsx` come `Extract<Marketplace, "vinted"|"grailed"|"depop">`) va **spostato in `lib/inventory-columns.ts`** ed esportato, così sia lo store che `PLATFORM_BRAND` lo importano da un unico punto.

> ⚠️ **Best-effort, NON ufficiali.** Nessuna delle tre piattaforme pubblica brand guideline con hex. Valori da fonti terze (mobbin, brandfetch), da rifinire/validare visivamente contro la palette calda/olive dell'app.

| Piattaforma | Hex proposto | Fonte |
|---|---|---|
| Vinted | `#007782` (teal) | mobbin.com/colors/brand/vinted |
| Depop | `#FF2300` (scarlatto) | mobbin.com/colors/brand/depop |
| Grailed | `#404040` (Tundora) + accento `#BD2426` | brandfetch.com/grailed.com |

```ts
export const PLATFORM_BRAND: Record<PlatformKey, { color: string; initial: string }> = {
  vinted:  { color: "#007782", initial: "V" },
  depop:   { color: "#FF2300", initial: "D" },
  grailed: { color: "#404040", initial: "G" },
};
```

**TODO estetico esplicito** (non blocca l'implementazione): questi colori vanno riprogettati/validati. Il valore semantico primario resta il **pallino stato**; il colore brand è solo identificazione, quindi anche se un colore è temporaneamente "sbagliato" la lettura dello stato non si rompe.

---

## 9. File toccati

| File | Azione |
|---|---|
| `lib/inventory-mock.ts` | + `photoUrl` sui 15 item |
| `lib/inventory-columns.ts` | **nuovo** — ColumnKey/Def, DEFAULT_COLUMN_ORDER, PLATFORM_BRAND |
| `lib/inventory-columns-store.tsx` | **nuovo** — Provider preset colonne (pattern home-layout-store) |
| `components/maat/inventory/InventoryView.tsx` | riscrittura toolbar + rendering colonne dinamico + griglia ID-card |
| `components/maat/inventory/ColumnManager.tsx` | **nuovo** — pannello Popover due liste + preset |
| `components/maat/inventory/PlatformPills.tsx` | **nuovo/estratto** — pillole v2 con Tooltip + colore brand |
| `app/inventario/page.tsx` | avvolge con `InventoryColumnsProvider` |

---

## 10. Verifica

- `pnpm build` verde.
- Preview browser `/inventario`: toolbar due fasce; Stato in 2ª colonna; nascondi/mostra/riordina colonne persiste al reload; "Salva come…" crea preset, switch tra preset cambia colonne; Default non rinominabile/eliminabile; tooltip piattaforma appare all'hover; vista Griglia mostra card orizzontali foto+campi; bottone Colonne assente in Griglia.
- Nessuna regressione: 4 stati piattaforma ancora distinti; drawer Automazioni ancora apribile; riga/card cliccabili → dettaglio capo.
