# Sketch Brief — MAAT / Photo-to-Catalog

> ORCA Fase 5 · brief azionabili per view → **input diretto Stitch**. Specifica *struttura + comportamento*, non colori/font (→ Fase 6).
> Piattaforma: **mobile** (app Seller). Ogni view è la vista di un oggetto. Input: `01..04`.

Ordine: Detail keystone → flussi → liste globali → card/slot → empty state.

---

## A. DETAIL VIEW — Catalog Entry ("Dettaglio capo") · *primaria*

**Route:** `/capi/:id` · **Ruoli:** Seller

### Contenuto (gerarchia informativa)

**Hero / Intestazione**
- Thumbnail foto `fronte` (immagine grande) — tipo: immagine
- Badge `status` {Bozza · Confermato · Locale} — tipo: badge
- `brand` + `tipo capo` (titolo) — tipo: testo
- `SKU` (solo se `available`) — tipo: testo mono, secondario

**Corpo principale**
1. **Griglia Photo** (sezione relazione, in cima al corpo) → slot ordinati per label: `fronte* · retro* · brand* · taglia · materiale · extra` — view type: *slot inline* (vedi §C). Le obbligatorie marcate.
2. **Attributi capo** (12 AI) in ordine di forced ranking: `brand · tipo capo · genere · colore · taglia · materiale · periodo · fit · stile · rarità · stagionalità · difetti` — ogni riga editabile inline (`Modifica campo`).
3. **Misure** (sezione collassabile): `larghezza · lunghezza · manica · vita`.

**Metadata (footer/secondario)**
- `created_at` · `account_id` (se multi-account visibile)

### CTA

| CTA | Posizione | Stato oggetto richiesto |
|-----|-----------|-------------------------|
| Conferma capo | Sticky bottom (primaria) | `to_be_reviewed`/`local_draft` · **disabilitata** finché 3 foto obbligatorie ≠ `validated` |
| Modifica campo | Inline su ogni attributo | qualsiasi (su `available` → avviso "capo a listino") |
| Elimina capo ⚠️ | Overflow header | qualsiasi (su `available` → conferma forte) |
| Scatta / Riprendi foto | Sullo slot (vedi §C) | per stato slot |

### Relazioni navigate

| Relazione | View target | Come | Cardinality |
|-----------|-------------|------|-------------|
| → Photo | Slot inline | Griglia corpo | 1:(1..N) |
| → Notification | Badge header | (indiretta) | — |

### Comportamenti
- **Gate Confirm:** CTA disabilitata + helper "Mancano: [label obbligatorie non validated]".
- **Badge status:** `local_draft`→"Locale" · `to_be_reviewed`→"Bozza" · `available`→"Confermato".
- **Editing:** tutti i 12 attr sempre editabili; su `available` un avviso precede la modifica.

---

## B. SUB-MODE — Review / Manual Fill (Catalog Entry, `to_be_reviewed`)

**Route:** `/capi/:id/review` (step del flusso creazione + raggiungibile dal Dettaglio) · **Ruoli:** Seller

### Contenuto
- **Banner stato:** "Rivedi i campi proposti dall'AI" + progress (n campi mancanti).
- **Form 10 attributi** (contratto v2, deciso 20/07 — superseduti i 12 storici) in ordine forced ranking. Ogni campo con un indicatore di provenienza:
  - *AI confidente* → valore precompilato, normale.
  - *AI incerto* → valore precompilato evidenziato "da verificare".
  - *Mancante* → campo vuoto evidenziato, richiede input.
- **Misure** (sezione).
- **Thumbnail griglia foto** (read-only, riferimento mentre si compila).

### CTA

| CTA | Posizione | Stato |
|-----|-----------|-------|
| Modifica campo | Inline per campo | `to_be_reviewed` |
| Conferma capo | Sticky bottom | gate 3 foto validated |

### Comportamenti
- I campi *mancanti* e *incerti* sono in cima (ordinati per urgenza), i confidenti sotto.
- Conferma resta disabilitata finché gate foto non soddisfatto, **indipendentemente** dal completamento testuale (i 12 campi non sono tutti obbligatori; le 3 foto sì).

---

## C. FLOW VIEW — Acquisizione foto (Photo)

**Route:** `/capi/:id/foto/:label` (full-screen modale) · **Ruoli:** Seller

### Contenuto
- **Viewfinder camera** full-screen.
- **Label corrente** in testa (es. "Scatta: Fronte") + indicatore sequenza (es. 1/6, obbligatoria/opzionale).
- **Overlay guida:** sagoma/ghost del capo; per la reference → **sotto-sequenza ArUco** con istruzione di inquadrare il marker.
- **Strip slot** in basso: avanzamento label (pieni/vuoti/rejected).

### CTA

| CTA | Posizione | Stato |
|-----|-----------|-------|
| Scatta foto | Shutter centrale (primaria) | slot vuoto |
| Riprendi foto | Su slot `rejected` | slot rejected |
| (carica da galleria) | Secondaria | slot vuoto |

### Comportamenti
- Dopo lo scatto → stato `captured → processing`; se `quality_flags` critici → `rejected` con messaggio advisory + invito a `Riprendi`.
- Sequenza guidata: completate le 3 obbligatorie, le opzionali sono skippabili.
- ArUco: passo dedicato, `photo_type: aruco`, non entra nella griglia visibile del Seller.

---

## D. LISTA GLOBALE — Catalog Entry ("Lista capi") · *entry point*

**Route:** `/capi` (tab Capi) · **Ruoli:** Seller

### Card di lista (forced ranking)
1. Thumbnail `fronte` (identità visiva)
2. `brand` + `tipo capo` (titolo discriminante)
3. `taglia` (metadata rapido)
4. Badge `status`
CTA inline sulla card: tap → Detail · swipe → `Elimina capo` ⚠️

### Filtri e sort
- **Sort default:** `created_at` desc. (MVP: non cambiabile.)
- **Filtri:** segmented control `Tutti · Bozze · Confermati · Locali` (= `status`). Scope `account_id` (system).

### Comportamenti lista
- **Empty globale:** onboarding "Nessun capo ancora — scatta il primo" + CTA `Crea capo`.
- **Zero post-filtro:** "Nessun capo in [segmento]" (es. nessuna bozza).
- **Paginazione:** infinite scroll (da confermare con dev).
- **CTA globale:** `Crea capo` = **FAB centrale** / sticky bottom.

---

## E. LISTA GLOBALE — Notification ("Inbox") · *entry point secondario*

**Route:** `/notifiche` (tab Notifiche, badge unread) · **Ruoli:** Seller

### Riga di lista (forced ranking)
1. Icona `tipo` (`draft_ready` · `local_save`)
2. `messaggio`
3. Preview card capo correlato (mini-thumb + brand)
4. `timestamp` (relativo)
5. Dot unread (se `letta=false`)
CTA: tap riga → `Naviga al capo` (+ auto `letta`) · swipe → `Segna letta` / `Elimina notifica` ⚠️

### Filtri e sort
- **Sort default:** `timestamp` desc, non-lette in evidenza in cima.
- **Filtri (opz.):** unread-only · `tipo`. Scope account.

### Comportamenti
- **Empty:** "Nessuna notifica."
- **Dead-link:** se la Entry target è stata eliminata → "Questo capo non è più disponibile."

---

## F. CARD / SLOT — varianti per contesto

### Card — Catalog Entry (variante *Lista*)
Appare in: `/capi`. Cardinality 0..N. Attributi: thumb fronte · brand+tipo · taglia · badge status. CTA: tap/swipe-delete.

### Card — Catalog Entry (variante *preview in Notification*)
Appare in: riga Inbox. **Più compatta:** mini-thumb + brand + status. Nessuna CTA propria (la riga gestisce il tap). *Differenza:* read-only, solo riconoscimento.

### Slot — Photo (4 stati visivi)
Appare in: griglia Detail. Cardinality 1:(1..N) per label.
- **vuoto** → "Upload Slot" placeholder + `Scatta foto` · obbligatorio marcato.
- **captured/processing** → thumb + spinner.
- **validated** → thumb piena · tap = lightbox.
- **rejected** → thumb con overlay + `quality_flags` advisory + `Riprendi foto`.

### Row — Notification
Vedi §E. Stato unread = dot + peso visivo maggiore.

---

## G. Empty state (consolidati)
| View | Trigger | Messaggio | CTA |
|------|---------|-----------|-----|
| Lista capi | 0 capi | "Scatta il primo capo" | Crea capo |
| Lista capi | 0 post-filtro | "Nessun capo in [segmento]" | reset filtro |
| Slot Photo | label vuota | "Upload Slot" | Scatta foto |
| Inbox | 0 notifiche | "Nessuna notifica" | — |
| Deep-link | Entry eliminata | "Capo non più disponibile" | torna all'inbox |

---

## Input per Fase 6 — spec-to-modular-ui

**Oggetti keystone:** Catalog Entry (12 attr + misure + SKU + status) · Photo (label/url/photo_type/quality/state) · Notification (tipo/messaggio/letta/timestamp).

**View inventory completo:** 5 schermate + 3 card/slot varianti + 5 empty state = **13 unità UI**.

**Attributi enum → token candidati:**
- `CatalogEntry.status` = {local_draft, to_be_reviewed, available} → `--status-locale / --status-bozza / --status-confermato`
- `Photo.state` = {captured, processing, validated, rejected} → `--slot-empty / --slot-loading / --slot-ok / --slot-error`
- `Photo.label` = {fronte, retro, brand, taglia, materiale, extra} → set slot ordinato; obbligatorie vs opzionali → `--slot-required`
- `Photo.photo_type` = {standard, aruco} → aruco hidden
- `Notification.tipo` = {draft_ready, local_save} → `--notif-draft / --notif-local`
- `Notification.letta` = {false, true} → `--unread-indicator`

**Stack tech:** ⚠ **non lockato** (WBA gate 4.7 aperto). Front-end probabile React Native/Expo (push Expo citato) — **da confermare col team tecnico prima della Fase 6/codifica.**

**Design anchor:** da definire (no anchor lockato per P2C; riferimento brand MAAT = chiaro, verde+oro — vedi progetto Stitch MAAT esistente).
