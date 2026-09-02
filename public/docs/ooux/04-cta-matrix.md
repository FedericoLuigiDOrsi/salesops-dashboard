# CTA Matrix — MAAT / Photo-to-Catalog

> ORCA Fase 4 · ogni CTA = contratto (ruolo × oggetto × view × effetto). Forma **verbo + oggetto**.
> Mono-ruolo **Seller** (MVP). Input: `03-nav-flow.md`. CTA di sistema escluse (lettura ArUco, sync auto, push Expo).

## Matrice principale

| CTA | Oggetto | Ruolo | View | Priorità | Effetto |
|-----|---------|-------|------|----------|---------|
| Crea capo | Catalog Entry | Seller | Lista globale (FAB) | Primaria | Avvia flusso Acquisizione → nuova Entry (`local_draft`/`to_be_reviewed`) |
| Conferma capo | Catalog Entry | Seller | Detail / Review | Primaria | **Gate AND** (deciso 20/07): 3 foto `validated` + campi obbligatori OK + `to_be_reviewed` → genera SKU → `available` |
| Modifica campo | Catalog Entry | Seller | Detail / Review–Manual Fill | Primaria (inline) | Apre editing di un attributo dei 10 (contratto v2, deciso 20/07 — vedi `02-object-guide.md`) |
| Elimina capo ⚠️ | Catalog Entry | Seller | Detail (+ swipe Lista) | Secondaria | Rimuove Entry · **cascade** su Notification correlate · conferma richiesta |
| Scatta foto | Photo | Seller | Slot vuoto / Acquisizione | Primaria (nel flusso) | Crea Photo per la label → `captured → processing` |
| Riprendi foto | Photo | Seller | Slot `rejected` | Secondaria (contestuale) | Sostituisce la Photo rifiutata → nuovo `captured` |
| Naviga al capo | Notification | Seller | Inbox (tap riga) | Primaria | Deep-link → Dettaglio capo · segna `letta` |
| Segna letta | Notification | Seller | Inbox (swipe/tap) | Secondaria | `letta: false → true` |
| Elimina notifica ⚠️ | Notification | Seller | Inbox (swipe) | Secondaria | Rimuove la Notification |

> **Nota forma:** `Modifica campo` agisce su un *attributo* della Catalog Entry (field-level), non su un oggetto separato — il "campo" è un attributo dell'Entry. Resta valida come azione granulare.

---

## CTA per oggetto (view design reference)

### Catalog Entry

**Lista globale** ("Lista capi")
- `Crea capo` — Seller — Primaria (FAB) — avvia Acquisizione.
- `Elimina capo` ⚠️ — Seller — swipe su card — conferma richiesta.

**Card (in Lista / in preview Notification)**
- tap → naviga a Detail (non è una CTA verbo+oggetto, è navigazione).

**Detail view** ("Dettaglio capo")
- `Conferma capo` — Seller — Primaria — **disabilitata** finché gate AND non soddisfatto (3 foto obbligatorie `validated` **e** campi obbligatori compilati, deciso 20/07); visibile solo su `to_be_reviewed`/`local_draft`.
- `Modifica campo` — Seller — Primaria inline — su ogni attributo.
- `Scatta foto` / `Riprendi foto` — Seller — via slot della griglia (vedi Photo).
- `Elimina capo` ⚠️ — Seller — Secondaria (overflow) — distruttiva.

**Sub-mode Review / Manual Fill** (`to_be_reviewed`)
- `Modifica campo` — Seller — Primaria — campi mancanti/incerti evidenziati.
- `Conferma capo` — Seller — Primaria — chiusura del flusso.

**Empty state**
- Lista vuota → la CTA è `Crea capo` (onboarding).

### Photo

**Slot in griglia** (dentro Detail Catalog Entry)
- `Scatta foto` — Seller — Primaria — solo su **slot vuoto**.
- `Riprendi foto` — Seller — contestuale — solo su slot **`rejected`**.
- foto `validated` → tap = preview/lightbox (navigazione, non CTA).

**Acquisizione singola** (camera per label)
- `Scatta foto` — Seller — Primaria — cattura + sotto-sequenza ArUco se richiesta.

**Empty state**
- Slot vuoto = "Upload Slot" → CTA `Scatta foto`.

### Notification

**Inbox (lista)**
- `Naviga al capo` — Seller — Primaria — tap sulla riga (deep-link + `letta`).
- `Segna letta` — Seller — Secondaria — swipe/azione esplicita.
- `Elimina notifica` ⚠️ — Seller — Secondaria — swipe.

**Empty state**
- Inbox vuota → nessuna CTA (stato informativo).

---

## Flussi scatenati da CTA

### Flusso: Crea → Conferma capo
Trigger: `Crea capo` su Catalog Entry.
Steps: Lista → Acquisizione (`Scatta foto` ×N) → Processing → Review (`Modifica campo`) → `Conferma capo`.
Oggetti coinvolti: Catalog Entry · Photo · Notification.
Transizioni: status `— → to_be_reviewed → available` · Photo `captured→processing→validated` · Notification `draft_ready` creata.

### Flusso: Conferma capo (gate + SKU)
Trigger: `Conferma capo` su Catalog Entry.
Steps: verifica gate AND (3 foto `validated` + campi obbligatori OK, deciso 20/07) → genera SKU atomico DB → `available`.
I campi obbligatori sono quattro (brand · tipo capo · taglia · condizioni), elencati con le
colonne canoniche in `01-mcsfd.md` §Gate Confirm. Fonte di verità: il trigger `items_status_guard`.
Transizioni: status `to_be_reviewed → available`. **Downstream:** il capo confermato diventa Inventory Item del sistema vendita (fuori scope OOUX P2C).

### Flusso: Elimina capo (cascade)
Trigger: `Elimina capo` su Catalog Entry.
Steps: conferma → rimuovi Entry → cascade rimuovi/neutralizza Notification correlate.
Oggetti coinvolti: Catalog Entry · Notification (· Photo).

### Flusso: Riprendi foto rifiutata
Trigger: `Riprendi foto` su slot `rejected`.
Steps: Acquisizione singola → nuovo `captured` → `processing` → `validated` → sblocca eventuale gate Confirm.

---

## Sintesi per priorità

**CTA primarie MVP (Day 1):**
- `Crea capo` · `Scatta foto` · `Modifica campo` · `Conferma capo` · `Naviga al capo`

**CTA secondarie (ma in MVP):**
- `Riprendi foto` · `Elimina capo` ⚠️ · `Segna letta` · `Elimina notifica` ⚠️

**CTA da validare** ⚠️ (richiedono una tua decisione):
- **`Modifica campo` su status `available`** — un capo già confermato è diventato Inventory Item a listino: la modifica va consentita (con avviso "stai modificando un capo a listino") o bloccata? *Proposta: consentita con avviso.*
- **`Elimina capo` su `available`** — eliminare un capo già a listino: consentito o solo archiviazione? *Proposta: post-MVP diventa "Archivia"; in MVP delete con conferma forte.*
- **`Segna letta` esplicita** — serve come azione separata o basta l'auto-letta al tap (`Naviga al capo`)? *Proposta: auto-letta al tap + swipe "segna letta" per gestione massiva.*

**Ruoli:** un solo ruolo (Seller) → tutte le CTA sono sue. Admin/Operatore con CTA differenziate = post-MVP. Nessun ruolo read-only in MVP.

---

## Prossimo step → Fase 5 (Sketch Brief)
Oggetti prioritari con view + CTA pronte: **Catalog Entry** (Detail → primo brief) · **Photo** (griglia/slot) · **Notification** (inbox). Partire dal **Detail di Catalog Entry** (oggetto primario).
