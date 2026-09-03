# ORCA Fase 6 — Atomic Bridge + Token Contract · MAAT / Photo-to-Catalog

> Capstone della pipeline OOUX (6/6). Trasforma gli oggetti in **libreria atomica** + **contratto token**.
> Il deliverable vero è il *metodo a 5 layer*, non la singola schermata. Input: `01..05`.
> **Stack runtime NON lockato** (WBA gate 4.7) → token e atomic sono **stack-agnostici**; il binding al framework si fa quando lo stack è confermato.

---

## Layer 1 — Audit dei framework attivi

| Layer | Framework | Stato | Output |
|-------|-----------|-------|--------|
| Requisiti / funzioni | MBSE (BBA/WBA) | ✅ BBA v3.1 · ⚠ WBA v0.5 sospesa (stack) | `maat-bba-photo-to-catalog.md`, `photo-to-catalog-wba.html` |
| Discovery → Object Map | mbse-to-ooux v1.2.0 | ✅ | `00-object-map-handoff.md` |
| Requirements (relazioni→dati) | ORCA Fase 1 MCSFD | ✅ | `01-mcsfd.md` |
| Glossario di sistema | ORCA Fase 2 Object Guide | ✅ | `02-object-guide.md` |
| Navigation | ORCA Fase 3 Nav Mapper | ✅ | `03-nav-flow.md` |
| Azioni | ORCA Fase 4 CTA Matrix | ✅ | `04-cta-matrix.md` |
| Spec schermate | ORCA Fase 5 Sketch Brief | ✅ | `05-sketch-brief.md` |
| **Atomic Design** | *questo doc* | 🔨 in produzione | §3 |
| **Token contract design↔dev** | *questo doc* | 🔨 in produzione | §4 |
| Linguaggio visivo | Stitch (anchor MP076: near-black+fluo, `07-design-anchor-p2c.md`) | 🟡 parziale (anchor lockato, ~11 screen — schermate esistenti pre-redirect, da rigenerare) | progetto Stitch MAAT |
| QA / test | — | ❌ **buco** | da definire |

**Buchi reali da chiudere:** (1) contratto token come single source of truth ← *colmato qui §4* · (2) stack runtime non lockato ← *blocca solo il binding, non l'architettura* · (3) layer QA/test assente ← *post-pipeline*.

---

## Layer 2 — OOUX (già completo)

Round 1 (Object Map) + Round 2 (MCSFD + Object Guide) **chiusi** nelle fasi 1-2. 3 oggetti, 4 relazioni, naming canonico risolto (Catalog Entry vs Inventory Item). 13 unità UI = **viste di 3 oggetti** → modularità provata. Non si ripete qui.

---

## Layer 3 — Atomic Design (derivato dagli oggetti)

Gerarchia derivata dagli oggetti, non a caso. **6 organismi + 1 shell coprono le 13 unità UI.**

### Token → Atomi → Molecole → Organismi → Template

**ATOMI** (≈9)
| Atomo | Deriva da | Varianti/stati |
|-------|-----------|----------------|
| `StatusBadge` | `CatalogEntry.status` | Locale · Bozza · Confermato |
| `Thumbnail` | `Photo.url` | sm (card) · lg (hero) |
| `Button` | CTA Matrix | primary · secondary · destructive ⚠️ · **disabled** (gate) |
| `Icon` | `Notification.tipo`, `Photo.label` | draft_ready · local_save · 6 label |
| `UnreadDot` | `Notification.letta` | on/off |
| `FieldValue` | 12 attr | read · edit |
| `ProvenanceTag` | AI confidence | confidente · incerto · mancante |
| `SegmentItem` | `status` filter | Tutti/Bozze/Confermati/Locali |
| `HelperText` | gate/validazione | info · warning · error |

**MOLECOLE** (≈7)
| Molecola | Composizione | Note |
|----------|--------------|------|
| `PhotoSlot` | Thumbnail + Button + Icon + HelperText | 4 stati: empty(Upload Slot) · loading · validated · rejected |
| `AttributeField` | Icon? + FieldValue + ProvenanceTag + Button(Modifica) | inline edit |
| `CatalogCard` | Thumbnail + testo(brand/tipo/taglia) + StatusBadge | variante *list* e *preview-notifica* (compatta) |
| `NotificationRow` | Icon(tipo) + testo + CatalogCard(preview) + timestamp + UnreadDot | swipe actions |
| `SegmentedFilter` | SegmentItem ×4 | filtro status |
| `ConfirmGateButton` | Button(primary/disabled) + HelperText | gate "mancano: [label]" |
| `EmptyState` | Icon + testo + Button | 5 varianti (G del brief) |

**ORGANISMI** (= viste-oggetto, 6)
| Organismo | Vista di | Composto da | Copre unità UI |
|-----------|----------|-------------|----------------|
| `CatalogEntryDetail` | Catalog Entry | hero + `PhotoGrid` + `AttributeField`×N + misure + CTA | Dettaglio capo |
| `ReviewForm` | Catalog Entry (`to_be_reviewed`) | banner + `AttributeField` ordinati per urgenza + `ConfirmGateButton` | Review/Manual Fill |
| `PhotoCaptureFlow` | Photo | viewfinder + label header + slot-strip + shutter | Acquisizione foto |
| `CatalogList` | Catalog Entry (collection) | `SegmentedFilter` + `CatalogCard`×N + FAB + `EmptyState` | Lista capi |
| `NotificationInbox` | Notification (collection) | `NotificationRow`×N + `EmptyState` | Inbox |
| `PhotoGrid` | Photo (set) | `PhotoSlot`×6 in ordine label | riusato in Detail + Review |

**TEMPLATE** (3)
- `TabbedAppShell` — tab Capi · Notifiche (badge) + FAB `Crea capo` centrale.
- `ScrollDetailTemplate` — scroll + CTA sticky bottom (Detail, Review).
- `FullScreenFlow` — modale a tutto schermo (Acquisizione/camera).

> Prova di modularità: `CatalogCard` e `PhotoGrid` sono riusati in più organismi; `AttributeField` è la stessa molecola in Detail e Review. N schermate → poche viste di pochi oggetti.

---

## Layer 4 — Design Token Contract (single source of truth)

**Contratto, non handoff PDF.** Token semantici versionati, leggibili sia dal design tool (Stitch/Figma) sia dal codice. I *valori* sono quelli di `07-design-anchor-p2c.md` (MP076: near-black `#001F3F` + fluo `#DBE64C`, Geist + JetBrains Mono); i *nomi* (semantica) sono lockati ora. Quando lo stack è confermato, questo file si compila in `tailwind.config` **oppure** in un theme object RN/Expo — un solo cambio, letto da tutti.

```jsonc
// maat-design-tokens.json (semantica lockata · valori TBD da anchor)
{
  "status": {                       // CatalogEntry.status → StatusBadge
    "locale":      "--status-locale",       // local_draft
    "bozza":       "--status-bozza",        // to_be_reviewed
    "confermato":  "--status-confermato"    // available
  },
  "slot": {                         // Photo.state → PhotoSlot
    "empty":    "--slot-empty",
    "loading":  "--slot-loading",
    "ok":       "--slot-ok",        // validated
    "error":    "--slot-error",     // rejected
    "required": "--slot-required"   // bordo/marker label obbligatoria
  },
  "notif": {                        // Notification.tipo
    "draft":  "--notif-draft",      // draft_ready
    "local":  "--notif-local",      // local_save
    "unread": "--unread-indicator"  // letta=false
  },
  "cta": {                          // intent del Button
    "primary":      "--cta-primary",
    "secondary":    "--cta-secondary",
    "destructive":  "--cta-destructive",   // Elimina ⚠️
    "disabled":     "--cta-disabled"       // gate non soddisfatto
  },
  "provenance": {                   // AttributeField
    "confident": "--prov-confident",
    "uncertain": "--prov-uncertain",
    "missing":   "--prov-missing"
  }
}
```

**Catena che chiude il cerchio:** `attributo Object Guide → prop componente → token`.
- `CatalogEntry.status` (enum) → prop `status` di `StatusBadge` → token `status.*`.
- `Photo.state` (enum, sortable in griglia) → prop `state` di `PhotoSlot` → token `slot.*`.
- `Notification.tipo` → prop `tipo` di `NotificationRow` → token `notif.*`.

**Regola dal MCSFD:** ogni campo marcato sortable/filterable (`created_at`, `status`, `timestamp`, `letta`, `tipo`, `label`) **deve** esistere come metadata strutturato → prop tipizzato → alimenta i filter/sort atoms (`SegmentedFilter`, ordinamento inbox). Nessun filtro senza campo.

---

## Layer 5 — JTBD: cosa mostro in ogni fase

Job: *"Quando il Seller ha un capo in mano, vuole metterlo a catalogo col minimo sforzo e zero tastiera."*

| Stadio | Primo piano | Organismo | CTA dominante |
|--------|-------------|-----------|---------------|
| 1. Cattura | gli slot foto da riempire | `PhotoCaptureFlow` / `PhotoGrid` | Scatta foto |
| 2. Arricchimento | progress AI (attesa) | banner Processing | — (sistema) |
| 3. Review | campi mancanti/incerti in cima | `ReviewForm` | Modifica campo |
| 4. Conferma | gate foto + esito SKU | `ConfirmGateButton` | Conferma capo |
| 5. Gestione | lista filtrabile + rientri | `CatalogList` / `NotificationInbox` | Naviga al capo |

Lo stadio decide la gerarchia visiva; i CTA per oggetto (Layer 2/Fase 4) sono già le azioni delle fasi.

---

## Stack raccomandato (innestato sull'esistente)

| Bisogno | Raccomandazione | Stato |
|---------|-----------------|-------|
| Design tool | **Stitch** (anchor MP076 già lockato in `07-design-anchor-p2c.md`, ~11 screen esistenti pre-redirect da rigenerare) → Figma opzionale per handoff | ✅ attivo |
| Token source | **`maat-design-tokens.json`** unico → build verso Tailwind config *o* RN theme | 🔨 da popolare valori |
| Runtime front-end | probabile **React Native / Expo** (push Expo citato nel BBA) | ⚠️ **PENDING gate 4.7** — confermare col team tecnico |
| Backend persistenza | Postgres (SKU sequence atomica, da WBA) | ⚠️ legato al lock stack |
| QA/test | layer assente → da introdurre post-lock | ❌ |

**Vincolo dal pipeline:** lettura ArUco, sync auto `local_draft`, SKU atomico = responsabilità **engineering**, non UI. Il design li tratta come stati/risultati, non come schermate.

---

## Pipeline spec→build e prossimi passi

1. **Lock design anchor** MAAT (riusa progetto Stitch esistente) → popola i *valori* dei token in `maat-design-tokens.json`.
2. **Slice end-to-end** (non tutte le schermate): `CatalogList → CatalogEntryDetail → PhotoCaptureFlow → ReviewForm → Conferma`. Prova l'architettura modulare prima di allargare.
3. **Genera in Stitch** gli organismi mancanti partendo dai brief Fase 5 (5 Tier-1 ancora da fare per il progetto MAAT).
4. **Sync tecnico:** sbloccare WBA gate 4.7 (Pugh matrix stack) → bindare i token al framework scelto.
5. **Itera** su slice misurato, poi estendi a post-MVP (editor Photoroom, ruoli Admin, campi custom).

---

## Stato pipeline ORCA — COMPLETA (6/6)

| Fase | Deliverable | File |
|------|-------------|------|
| R1 | Object Map | `00-object-map-handoff.md` |
| 1 | MCSFD | `01-mcsfd.md` |
| 2 | Object Guide | `02-object-guide.md` |
| 3 | Navigation Flow | `03-nav-flow.md` |
| 4 | CTA Matrix | `04-cta-matrix.md` |
| 5 | Sketch Brief | `05-sketch-brief.md` |
| 6 | Atomic Bridge + Token | `06-atomic-bridge.md` |

→ **Prossima esecuzione: Stitch** (generazione organismi) + **sync stack** (gate 4.7).
