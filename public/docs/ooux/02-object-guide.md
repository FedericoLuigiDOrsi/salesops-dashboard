# Object Guide — MAAT / Photo-to-Catalog

> ORCA Fase 2 · glossario operativo di allineamento (designer ↔ dev ↔ riunioni ↔ Figma).
> **Non** è il content model tecnico: definisce *cosa intendiamo* per ogni oggetto, non i field types.
> Keystone documentati: **Catalog Entry** · **Photo**. *Notification* è omogenea e autoesplicativa → resta nel packet Round 1.

---

## Catalog Entry

**Etichetta utente (UI microcopy):** "Capo" — è il termine che il Seller vede e pensa. Resta nei bottoni (`Crea capo`, `Conferma capo`). **Non** è un alias da deprecare: è il volto utente dello stesso oggetto.

**Alias da deprecare:** `Articolo` · `Item` · `Inventory Item` · `Prodotto` · `Listing` · `Draft Entry` · `SKU` (lo SKU è un *attributo*, non l'oggetto).

**Definizione:**
Una Catalog Entry è il record di un singolo capo vintage che il Seller sta portando dalla foto al catalogo dentro MAAT. Nasce dallo scatto, viene arricchita dall'AI (12 attributi proposti nello spec originale; **superseduto 20/07 dal contratto v2 a 10 attributi**, `ATTRIBUTE_ORDER` del codice, + misure derivate per categoria via ArUco), e vive un ciclo Bozza → Confermato. Si distingue dall'*Inventory Item* del pricing engine DirtyTag perché la Catalog Entry è l'oggetto **pre-pubblicazione** (in lavorazione, ancora editabile, senza prezzo/vendita): l'Inventory Item è ciò che diventa *dopo* essere stata confermata e immessa a listino.

**Esempi:**
- Una felpa Stone Island anni '90, AI completata, SKU `B-10` generato, `status: available` — pronta a passare al pricing.
- Una giacca di jeans Levi's 501 scattata offline a un mercatino: `status: local_draft`, in attesa di sync quando torna la rete.
- Un tabi Maison Margiela elaborato dall'AI ma con vita e lunghezza non rilevate: `status: to_be_reviewed`, ferma sul gate finché il Seller non completa i campi.

**Tipi:**
- Nessun sottotipo per *comportamento* — oggetto omogeneo. La varietà è data dal **lifecycle** (`status`), non da un tipo. In MVP ogni Entry nasce AI-assistita; "entry manuale" è post-MVP.

**Note per il team dev:**
- **Due livelli di stato, non confonderli.** Gli stati `Acquisition · Processing · Review · Review–Manual Fill` sono **FSM transienti della sessione P2C** (vivono solo durante lo scatto, non sono righe di catalogo). Lo **`status` persistito** è un enum a 3 valori → `local_draft` → `to_be_reviewed` (UI: "Bozza") → `available` (UI: "Confermato"). Solo `status` filtra la Lista capi.
- **SKU** assegnato **solo** alla conferma, sequenziale e atomico lato DB (sequence Postgres) — mai "read-last-then-write" client per evitare race tra Seller concorrenti.
- **Gate Confirm (AND, deciso 20/07):** non promuovibile a `available` senza le 3 foto obbligatorie `validated` **e** i campi obbligatori compilati (vedi Photo).
- I 10 attributi AI (contratto v2) sono **sempre editabili** anche dopo la proposta automatica.

---

## Photo

**Alias da deprecare:** `Immagine` · `Scatto` · `Foto articolo` · `Asset` · `Upload` · `Upload Slot` (lo slot è **affordance UI**, non una Photo — vedi nota).

**Definizione:**
Una Photo è una singola immagine catturata e legata a uno **slot etichettato** di una Catalog Entry (es. lo slot "fronte"). Non è una galleria libera: ogni Photo occupa una label semantica precisa dell'enum, e il set di label guida cosa serve per confermare il capo. Si distingue dall'*Upload Slot* perché lo slot è solo il segnaposto UI di una label ancora vuota: non esiste come dato finché non ci scatti dentro.

**Esempi:**
- Lo scatto frontale della felpa Stone Island: `label: fronte`, `photo_type: standard`, `validated` — riempie uno slot obbligatorio.
- Un primo piano dell'etichetta brand venuto mosso: `quality_flags: ["blurry"]`, `rejected` → lo slot torna vuoto e chiede `Riprendi foto`.
- La reference ArUco per calibrazione colore/scala: `photo_type: aruco`, **nascosta** dalla griglia del Seller — serve alla CV, non all'occhio dell'utente.

**Tipi:**
- **Per `photo_type`:**
  - `standard` — le foto del capo che il Seller vede e gestisce.
  - `aruco` — Reference Photo di calibrazione (colore/scala), generata nella sotto-sequenza ArUco, di sistema e nascosta dalla griglia.
- **Per obbligatorietà della label** (config `label_required`):
  - **Obbligatoria** — `fronte` · `retro` · `brand`: senza queste 3 `validated` il capo non si conferma.
  - **Opzionale** — `taglia` · `materiale` · `extra` (con max).

**Note per il team dev:**
- **Upload Slot ≠ Photo.** Lo slot è UI-only: placeholder per una label mancante, non persiste nel modello dati.
- **`quality_flags`** è un array advisory di sistema (es. `["blurry","reflection"]`), **read-only** per il Seller: informa, non blocca (il blocco è lo stato `rejected`).
- Gli stati `captured → processing → validated | rejected` sono **stati della pipeline CV**, indipendenti dallo `status` della Catalog Entry.

---

## Convenzioni di naming

| Termine da evitare | Termine canonico | Motivo |
|--------------------|------------------|--------|
| Articolo / Item / Prodotto / Listing | **Catalog Entry** (UI: "Capo") | Un solo nome di sistema; "Capo" solo come microcopy |
| Inventory Item | **Catalog Entry** | L'Inventory Item è lo stadio *post-conferma* a listino (DirtyTag), non l'oggetto in lavorazione |
| Draft Entry | **Catalog Entry** con `status: to_be_reviewed` | "Draft" è uno stato, non un oggetto diverso |
| SKU (come oggetto) | attributo di **Catalog Entry** | Lo SKU è un campo, assegnato solo al Confirm |
| Immagine / Scatto / Asset | **Photo** | Un solo nome |
| Upload Slot | affordance UI (no oggetto) | Segnaposto di una label vuota, non persiste |
| ArUco Reference Photo | **Photo** con `photo_type: aruco` | Sottotipo, non oggetto separato |
| Stato (generico) | **FSM di sessione** *vs* **`status` persistito** | Due livelli distinti, mai mescolarli |

## Prossimo step → Fase 3 (Navigation Flow)
Input per il Nav Mapper:
- **Entry point** = Lista capi (collection di Catalog Entry).
- **Relazioni prioritarie** (da MCSFD): Catalog Entry →(griglia) Photo · Notification →(deep link) Catalog Entry.
- Keystone con più path: **Catalog Entry** (lista → dettaglio → acquisizione/review).
