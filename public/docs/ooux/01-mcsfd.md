# ORCA Fase 1 — MCSFD · MAAT / Photo-to-Catalog

> My Cat Saving Fire Department · contratto dato↔design. Input: `00-object-map-handoff.md`.
> Ogni campo aggiunto ha una ragione **S**ort / **F**ilter / **D**ependency. Mono-ruolo Seller (MVP).

Relazioni analizzate:
1. Catalog Entry → Photo (1:N) — *edge keystone*
2. Catalog Entry → Notification (1:N) — *ownership*
3. Notification → Catalog Entry (N:1) — *navigazione (inbox)*
4. *(supplemento)* Catalog Entry — collection root (Lista capi)

---

## 1. Catalog Entry → Photo (1:N)

| Dimensione | Analisi |
|------------|---------|
| Mechanics | **Misto.** Seller crea via CTA `Scatta foto` / `Riprendi foto` durante `Acquisition`, scegliendo lo slot/label. Sistema arricchisce: assegna `photo_type` (la ArUco reference nasce dalla sotto-sequenza ArUco), calcola `quality_score`/`quality_flags` in `processing`. → label = decisione di design (slot-driven); quality/type = engineering spec. |
| Cardinality | **1 — (1..N).** Una Photo appartiene a 1 sola Entry. Min effettivo per confermare = 3 obbligatorie (`fronte`, `retro`, `brand`); `extra` ha un max (BBA: "rispettare min/max"). In `Acquisition` un'Entry può transitare con slot vuoti. → schema: FK `catalog_entry_id` su Photo + vincolo min mandatory al Confirm. |
| Sorting | **Per ordine semantico della label** (fronte → retro → brand → taglia → materiale → extra), che rispecchia la sequenza di scatto. **Non** user-controlled. Sort key = `label` come enum *ordinato*; `created_at` come spareggio. |
| Filtering | **System-imposed, leggero.** `photo_type = aruco` è reference tecnica → esclusa/separata dalla griglia del Seller. Nessun filtro utente sulla griglia (set piccolo). `quality_flags` guida un badge advisory, **non** un filtro. |
| Dependencies | **Bloccante.** Entry → `Confirmed` dipende dalla presenza + stato `validated` delle 3 Photo obbligatorie. Una Photo `rejected` blocca lo slot (richiede `Riprendi foto`). → validation rule UI (CTA Conferma disabilitata) + empty-state per slot mancante ("Upload Slot" placeholder). |

**Requisiti di dato emersi:**
- [x] `label` — enum **ordinato** {fronte, retro, brand, taglia, materiale, extra} — S + D
- [x] `photo_type` — enum {standard, aruco} — F (esclusione aruco dalla griglia)
- [x] `created_at` (Photo) — timestamp — S (spareggio)
- [x] `catalog_entry_id` — FK — schema + D
- [ ] `label_required` — mappa **config di sistema** label→bool {fronte✓ retro✓ brand✓} — D (gate Confirm, **AND** con campi obbligatori — deciso 20/07). Non è un campo per-record: è una costante.
- [ ] `min`/`max` per `extra` — config — validazione acquisizione

---

## 2. Catalog Entry → Notification (1:N)

| Dimensione | Analisi |
|------------|---------|
| Mechanics | **Solo Sistema.** Nessuna CTA utente. `draft_ready` emessa alla transizione Processing→Review/Draft (AI ha finito); `local_save` emessa alla creazione di `Local Draft` (offline). → engineering spec, trigger su transizione di stato. |
| Cardinality | **1 — (0..N).** Un'Entry può non avere notifiche o averne più lungo il ciclo di vita. Ogni Notification → esattamente 1 Entry. |
| Sorting | **N/A a livello UI per-entry.** In MVP non esiste una lista "notifiche di questo capo": le notifiche vivono nell'inbox globale (→ rel. 3). Qui l'edge è solo ownership dei dati (FK). |
| Filtering | **N/A per-entry** (vedi inbox, rel. 3). |
| Dependencies | **Cascade.** La Notification dipende dall'esistenza della sua Entry. `Elimina capo` deve eliminare/neutralizzare le notifiche correlate, altrimenti restano deep-link morti. → regola ON DELETE CASCADE (o soft) + empty-state se si apre una notifica con Entry cancellata. |

**Requisiti di dato emersi:**
- [x] `catalog_entry_id` (Notification) — FK — D (cascade) + nav
- [ ] regola cascade `delete Entry → delete/neutralize Notification` — vincolo dev

---

## 3. Notification → Catalog Entry (N:1) — *edge di navigazione*

| Dimensione | Analisi |
|------------|---------|
| Mechanics | **Sistema** fissa il riferimento alla creazione (sa già quale Entry). Il Seller lo *usa* via CTA `Naviga al capo` (tap → deep link). |
| Cardinality | **(0..N) — 1.** Molte Notification → 1 Entry; ogni Notification ha 1 target obbligatorio (senza target è priva di senso). |
| Sorting | **Collection inbox** (lista di Notification): `timestamp` **desc** (più recenti in alto), non lette (`letta=false`) raggruppate/in evidenza in cima. Non user-controlled in MVP. *(Nota: il target di nav è singolo → nessun sort sull'edge stesso.)* |
| Filtering | **Inbox:** filtro opzionale su `letta` (solo non lette) e/o `tipo` (draft_ready \| local_save). User-controlled opzionale. **System-imposed:** scope su account attivo (multi-account). |
| Dependencies | Il target deve esistere ancora → dead-link se Entry cancellata: empty-state "capo non più disponibile". Risoluzione deep-link per id. |

**Requisiti di dato emersi:**
- [x] `timestamp` — Notification — S (inbox)
- [x] `letta` — bool — S + F (unread)
- [x] `tipo` — enum {draft_ready, local_save} — F
- [x] `catalog_entry_id` — FK — nav + D
- [ ] **account scoping** per Notification — `account_id` su Notification *oppure* derivato via join con Entry — F (multi-account)

---

## 4. Catalog Entry — collection root (Lista capi) · *supplemento non-edge*

> Non è un edge, ma è l'**entry-point** dell'app: è dove vivono i requisiti S/F più pesanti. Incluso per fedeltà al contratto-dato.

| Dimensione | Analisi |
|------------|---------|
| Mechanics | Lista popolata da tutte le Entry persistite del Seller (status `local_draft` / `to_be_reviewed` / `available`). |
| Cardinality | 0..N card. Empty-state primo onboarding ("nessun capo, scatta il primo"). |
| Sorting | `created_at` **desc** (più recenti in alto), default. Non user-controlled in MVP. |
| Filtering | Per **status persistito**: segmented `Tutti / Bozze / Confermati / Locali`. Per `account_id` (system, multi-account). |
| Dependencies | — |

**⚠️ Chiarimento critico sugli stati (da Round 1):** la lista degli stati nel packet mescola due livelli:
- **Stati FSM di sessione** (transienti, vivono dentro la sessione P2C): `Acquisition` · `Processing` · `Review` · `Review–Manual Fill`. **Non** sono righe della Lista capi.
- **Status persistito** (catalogo): `Local Draft` → `Draft` (= `to_be_reviewed`) → `Confirmed` (= `available`). **Questo** è il campo filtro della Lista capi.

→ Decisione: introdurre `status` persistito come enum a 3 valori, separato dalla FSM di sessione.

---

## Requisiti di dato consolidati

Campi da aggiungere/chiarire nel data model (oltre Round 1):

| Campo | Oggetto | Tipo | Motivo |
|-------|---------|------|--------|
| `status` (persistito) | Catalog Entry | enum {local_draft, to_be_reviewed, available} | **F** (Lista capi) + **D** (gate Confirm) — distinto dalla FSM di sessione |
| `label_required` | *config sistema* | map label→bool | **D** (gate Confirm: 3 obbligatorie **AND** campi obbligatori — deciso 20/07) |
| `label` ordinata | Photo | enum ordinato | **S** (griglia) — confermare ordering |
| account scope | Notification | `account_id` o join | **F** (multi-account inbox) |
| cascade Entry→Notification | relazione | regola dev | **D** (no deep-link morti) |

Tutti gli altri campi (`created_at`, `photo_type`, `quality_flags`, `timestamp`, `letta`, `tipo`, FK) **esistono già** in Round 1.

## Decisioni di design emerse
- **Lista capi:** sort `created_at` desc · filtro segmented per status persistito (Tutti/Bozze/Confermati/Locali) · empty-state per segmento + onboarding.
- **Griglia foto:** layout slot-driven a ordine fisso di label · placeholder "Upload Slot" per slot mancante · `aruco` nascosta/separata.
- **Gate Confirm (AND, deciso 20/07):** CTA `Conferma capo` disabilitata finché le 3 foto obbligatorie non sono `validated` **e** i campi obbligatori non sono compilati · validazione inline.
  - **Quali sono i campi obbligatori** (aggiunto 03/08). La v2 mandava l'AND senza mai definire
    l'insieme, ed è il buco che ha prodotto prima il disallineamento #4 e poi il #8. Sono
    **quattro**, e la fonte di verità è il trigger `items_status_guard` in
    `services/backend/_sql/28_items_status_guard_validated.sql`, non questo documento:

    | Campo OOUX | Colonna / chiave canonica |
    |---|---|
    | `brand` | `items.brand` · fallback `attributes->>'brand'` |
    | `tipo capo` | `attributes->>'tipoCapo'` · fallback `product_type` o `items.category` |
    | `taglia` | `items.size` · fallback `attributes->>'taglia'` |
    | `condizioni` | `items.condition` · fallback `attributes->>'condizioni'` |

    Gli altri sei dei 10 (colore, materiale, genere, difetti, stile, stagionalità) sono
    **consigliati, non bloccanti**: migliorano la scheda ma il canonico accetta l'item senza.
    Questo scioglie anche il caso `stagionalita`, che il codice marcava come `UNCERTAIN_FIELDS`
    (bassa confidenza) e insieme pretendeva. Se l'insieme cambia, si cambia **prima** la
    migration e poi la UI, mai il contrario.
- **Inbox:** sort `timestamp` desc · non-lette in evidenza · filtro opzionale unread/tipo · scope account.
- **Dead-link:** empty-state "capo non più disponibile" se la Entry target è stata eliminata.

## Prossimo step → Fase 2 (Object Guide)
Oggetti **keystone** (più relazioni + CTA + complessità di stato):
1. **Catalog Entry** — primario, 4 CTA, 2 relazioni, doppio livello di stati (FSM + persistito).
2. **Photo** — logica slot/label, obbligatorie vs opzionali, stati CV (captured→processing→validated|rejected).

*Notification* resta semplice → non keystone, basta il packet.
