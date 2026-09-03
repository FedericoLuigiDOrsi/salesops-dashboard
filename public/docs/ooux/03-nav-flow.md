# Navigation Flow — MAAT / Photo-to-Catalog

> ORCA Fase 3 · "Content is the navigation". Struttura emersa dagli oggetti + edge MCSFD, non da pattern di menu.
> Piattaforma: **mobile** (app Seller). Input: `01-mcsfd.md` + `02-object-guide.md`.

## Entry Point

1. **Catalog Entry (Lista capi)** — *primario*. Home dell'app: aggrega tutti i capi, è dove il Seller scansiona/cerca, e da cui parte la CTA centrale `Crea capo`. Max CTA in uscita.
2. **Notification (Inbox)** — *secondario*. Il canale di rientro: riporta il Seller dentro una bozza pronta (`draft_ready`) o segnala un salvataggio offline (`local_save`), via deep-link.

> **Photo non è entry point**: esiste solo annidata in una Catalog Entry (slot della griglia). Conferma del modello.

Pattern mobile: **2 tab** (Capi · Notifiche con badge) + **azione centrale `Crea capo`** (FAB/bottone centrale).

---

## Grafo di navigazione

```
[TAB Capi] ── Lista capi  (segmented: Tutti · Bozze · Confermati · Locali · sort created_at desc)
   │
   ├─ (FAB) Crea capo ──► Acquisizione foto  [flusso full-screen a sequenza slot]
   │        slot: fronte* → retro* → brand* → taglia → materiale → extra  (+ sotto-seq ArUco)
   │        └─ submit ─► Processing (AI) ─► Review / Manual Fill ─► Dettaglio capo
   │
   ├─ tap card ──► Dettaglio capo
   │     ├─ griglia Photo (slot, ordine label) ─ tap slot ─► Acquisizione/Riprendi singola foto
   │     ├─ Review / Modifica campi (form 12 attr)        [edit-mode del Dettaglio]
   │     ├─ Conferma capo  ⟶ gate: 3 foto obbligatorie `validated` ⟶ genera SKU ⟶ available
   │     └─ Elimina capo   ⟶ cascade su Notification correlate
   │
   └─ empty state: "Nessun capo, scatta il primo" / per segmento ("nessuna bozza")

[TAB Notifiche] ── Inbox  (lista Notification · timestamp desc · non-lette in evidenza · filtro opz. unread/tipo)
   ├─ tap notifica ──► Naviga al capo ──► Dettaglio capo  [deep-link]
   ├─ Segna letta
   ├─ Elimina notifica
   └─ empty state: "Nessuna notifica" · dead-link: "capo non più disponibile" (Entry eliminata)
```

**Profondità:** Lista(1) → Dettaglio(2) → Acquisizione/Review(3). 3 livelli, sostenibile su mobile **a condizione** che Acquisizione e Review siano **flussi full-screen modali**, non stack annidati.

---

## View inventory

### Catalog Entry
- **Lista globale** ("Lista capi") — card scan: thumbnail `fronte`, `brand` + `tipo capo`, `taglia`, badge `status`. Sort `created_at` desc · filtro segmented `status` {Tutti/Bozze/Confermati/Locali} + scope `account_id`.
- **Card (inline)** — appare in Lista capi **e** come preview dentro una Notification. *Stesso componente card* (riuso). Attributi: thumbnail · brand+tipo · taglia · badge status. CTA primaria: tap → Dettaglio.
- **Detail** ("Dettaglio capo") — sezioni: (a) griglia Photo per slot, (b) 10 attributi AI (contratto v2, deciso 20/07) + misure derivate per categoria via ArUco, (c) `SKU` se `available`, (d) badge status. Relazioni navigate: → Photo (slot), badge → Notification. CTA: Conferma (gate AND: foto + campi) · Modifica campo · Elimina · (Scatta/Riprendi via slot).
- **Sub-mode Review / Manual Fill** — modalità *focalizzata* del Detail durante `to_be_reviewed`: campi mancanti/incerti evidenziati, editing inline dei 12 attr. È uno step del flusso di creazione **e** una modalità raggiungibile dal Dettaglio.
- **Empty state** — Lista vuota (onboarding) + empty per segmento.

### Photo
- **Lista globale** — *nessuna*: Photo non ha accesso autonomo.
- **Card / Slot** — nella griglia del Dettaglio: uno **slot per label** in ordine fisso. Pieno → thumbnail; vuoto → placeholder "Upload Slot"; `rejected` → slot rosso con badge `quality_flags`. CTA per stato: `Scatta foto` (vuoto) · `Riprendi foto` (rejected) · preview (validated).
- **Detail** ("Acquisizione foto") — camera per **singola label**, con guida e sotto-sequenza ArUco per la reference. Tap su foto `validated` → lightbox/preview. *(Editor stile Photoroom = post-MVP.)*
- **Empty state** — lo slot vuoto **è** l'empty state della label mancante ("Upload Slot").

### Notification
- **Lista globale** ("Inbox") — righe: icona `tipo` · `messaggio` · preview card capo · `timestamp` · dot unread. Sort `timestamp` desc · non-lette in evidenza · filtro opz. unread/tipo.
- **Card (inline)** — la riga stessa.
- **Detail** — *nessuna*: la notifica **è** azione (tap → naviga). No notification detail in MVP.
- **Empty state** — inbox vuota · dead-link se Entry target eliminata.

---

## Flussi cross-object

### Cataloga un capo nuovo
Job: "Quando il Seller vuole mettere a catalogo un capo da zero."
Path: Lista capi → **Crea capo** → Acquisizione foto (fronte*/retro*/brand* + opz. + ArUco) → submit → Processing → Review/Manual Fill → **Conferma capo** *(gate 3 foto validated)* → genera SKU → Dettaglio.
Transizioni: FSM sessione `Acquisition→Processing→Review→(Manual Fill)` · status persistito `— → to_be_reviewed → available` · Notification `draft_ready` a fine Processing.

### Riprendi e conferma una bozza
Job: "Quando il Seller vuole completare una bozza lasciata in sospeso."
Path A: Inbox → tap `draft_ready` → **Naviga al capo** → Dettaglio → Review/Modifica → **Conferma** → available.
Path B: Lista capi → filtro **Bozze** → tap card → Dettaglio → **Conferma**.
Transizioni: status `to_be_reviewed → available` · Notification `→ letta`.

### Cattura offline e sync
Job: "Quando il Seller cataloga senza rete."
Path: Lista capi → Crea capo → Acquisizione (offline) → salva → **Local Draft** → Notification `local_save` → (rete) **sync auto** → Draft.
Transizioni: status `— → local_draft → to_be_reviewed` · poi `draft_ready`.

### Riscatta una foto rifiutata
Job: "Quando una foto obbligatoria è venuta male."
Path: Dettaglio → griglia → slot `rejected` → **Riprendi foto** → Acquisizione singola → validated.
Transizioni: Photo `rejected → captured → processing → validated`.

---

## Prossimo step → Fase 4 (CTA Matrix)
Input: oggetti + view sopra definite · 9 CTA Seller del packet da incrociare oggetto × view × stato (gating incluso: es. Conferma disabilitata pre-gate, Riprendi solo su slot rejected).
