---
title: "OOUX Fase 1 — MCSFD · aree operative (le 3 relazioni prioritarie)"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi esegue Fase 2 (Object Guide) e chi tocca schema/API di Contabilità, Logistica, Pubblicazione
---

# Fase 1 — MCSFD · le tre relazioni prioritarie di Track B

> Analisi Mechanics/Cardinality/Sorting/Filtering/Dependencies sulle 3 relazioni che
> [`08-object-map-aree-operative.md`](08-object-map-aree-operative.md) marca come prioritarie,
> dopo le decisioni bloccanti prese il 02/09 (`returns_disputes` fuori MVP, `marketplace_accounts`
> in scope, `settlement_ledger` aggregato). Verificata contro lo schema canonico
> (`services/backend/_sql/`), non contro il Round 1: **due delle tre relazioni divergono dal
> Round 1 nella mechanics**, non solo nei dettagli. Vedi §0.

## 0. Prima di leggere le tabelle — due correzioni al Round 1

Il Round 1 (`08`) modellava queste relazioni per analogia con Catalog Entry → Listing.
Verificando ognuna contro il proprio schema, non contro l'aspettativa, sono emerse due
divergenze reali:

1. **"Shipment" non è una riga, è uno stato calcolato.** Il canonico è `fulfillments`: un log
   eventi append-only (`sale_id` → N righe, una per `stage` raggiunto). Non esiste una riga
   "lo spedizione X". Lo stato che l'UI mostra è derivato: il `stage` con `occurred_at` più
   recente per quel `sale_id`.
2. **"Lot → Catalog Entry" non esiste nello schema.** `items.lot_id` non è mai stato costruito.
   Commento nella migrazione: «Legame opzionale items.lot_id -> lots.id: rimandato (i conteggi
   web derivano da lots, non serve per lo sblocco della vista)». `lots.quantity` è un contatore
   aggregato, indipendente da quali item esistano davvero.

Non sono difetti di questo documento: sono quello che l'MCSFD doveva trovare. Vale lo stesso
metodo del gate zero — verificare tutto, non solo il punto sospetto.

---

## 1. Catalog Entry → Listing

| Dimensione | Analisi |
|---|---|
| **Mechanics** | Creata da un **CTA esplicito** del Seller ("Pubblica su [marketplace]"), non automaticamente alla conferma del capo. Per Vinted il flusso è ibrido: l'estensione browser esegue la pubblicazione lato piattaforma (vincolo permanente, mai via API), poi il BFF scrive/aggiorna la riga `listings` per riflettere lo stato. Per altri marketplace la mechanics può essere via API diretta — da confermare per-marketplace in Fase 2 |
| **Cardinality** | Catalog Entry → Listing: **0‑N**, con `UNIQUE(item_id, marketplace)` — al più un listing per item per marketplace, N pari al numero di marketplace collegati e attivi. Listing → Catalog Entry: **1 obbligatoria** (`item_id not null`) |
| **Sorting** | Nel dettaglio capo (pochi listing, 2‑4): per marketplace, ordine fisso o alfabetico, non per data — l'operatore confronta marketplace, non cronologia. Nella vista aggregata (S‑04, dogana cross‑piattaforma): default `published_at desc` per "Live", `created_at desc` per "Da pubblicare". User‑controlled: sì, probabile toggle marketplace/prezzo |
| **Filtering** | `marketplace` · `per_listing_status` (soprattutto `error`, per isolare cosa è rotto) · range `price_cents`. Tutti user‑controlled. System‑imposed: `tenant_id` (RLS) |
| **Dependencies** | (a) `item.status` deve essere `available` prima che "Pubblica" sia disponibile — validazione UI + business rule. (b) Deve esistere un `marketplace_accounts` con `status='active'` per quel tenant+marketplace — **oggi bloccante di fatto**, ed è la ragione della decisione presa il 02/09 di tenere questa schermata in scope. (c) `per_listing_status='error'` deve avere un percorso di retry visibile, altrimenti è uno stato senza uscita |

**Requisiti di dato emersi:**
- [ ] Tipo TypeScript `Listing` in `types/maat.ts` — oggi **non esiste**, è il gap che questa fase doveva quantificare. Campi: rispecchia 1:1 la tabella `listings` (nessun campo canonico manca)
- [ ] Tipo `MarketplaceAccount` in `types/maat.ts` — stessa mancanza, necessario per la Dependency (b)
- [ ] Non manca nessuna colonna DB per S/F/D di questa relazione — il gap è tutto lato tipo/UI, non canonico

---

## 2. Sale → Shipment *(Return escluso, fuori MVP — deciso 02/09)*

| Dimensione | Analisi |
|---|---|
| **Mechanics** | `Sale` è creata dal **sistema**, non da un CTA: arriva via webhook marketplace, idempotente su `external_sale_id`. `Shipment` (concetto UI) evolve per eventi `fulfillments`, ciascuno creato o da webhook marketplace o da azione manuale del Seller ("segna spedito"/"segna consegnato") — mechanics mista, va chiarita per‑stage in Fase 2 |
| **Cardinality** | Sale → `fulfillments`: **1‑N append‑only**, cresce nel tempo, mai svuotato. Sale → "Shipment" **logico** (stato corrente): **1‑1**, ma è una vista (`MAX(occurred_at)` per `sale_id`), non una riga con FK diretta |
| **Sorting** | Board/lista operativa: default `sold_at asc` (le vendite più vecchie in cima — urgenza di spedizione). Dentro una colonna Kanban per `stage`, stesso criterio. User‑controlled: toggle asc/desc ragionevole |
| **Filtering** | `stage` corrente (già la logica del Kanban) · `marketplace` (ereditato, vedi nota sotto) · range `sold_at`. System‑imposed: `tenant_id` |
| **Dependencies** | (a) Nessun fulfillment senza una `Sale` a monte — ovvio ma va nella validazione. (b) **La feature-verbo del prodotto**: alla creazione di una `Sale`, tutti gli altri `listings` con lo stesso `item_id` devono passare a `per_listing_status='delisted'` — è la regola "venduto qui, sparisce ovunque", e va implementata come business logic esplicita, non assunta. (c) Return/Dispute escluso per decisione: `stage='completed'` è terminale in questa fase, nessuna transizione verso un ramo di reso da costruire ora |

⚠️ **Da chiarire in Fase 2, non assumere:** `sales.listing_id` è **nullable**. Se una vendita è
registrata senza un `listing_id` (es. import manuale, vendita diretta), non c'è modo di derivare
il `marketplace` dalla Sale stessa — il filtro per marketplace descritto sopra non funziona per
quelle righe. Va deciso se `listing_id` diventa obbligatorio o se `Sale` porta un `marketplace`
proprio.

**Requisiti di dato emersi:**
- [ ] Tipo TypeScript `Shipment`/`FulfillmentEvent` che rispecchi la natura **event-log** di
      `fulfillments`, non uno status singolo mutabile — il tipo UI attuale (`Shipment` con un solo
      `status`) va rifatto, non esteso
- [ ] Decisione tecnica (Fase 6, non qui): calcolare lo stage corrente lato query (VIEW o
      aggregazione) o materializzarlo — segnalato, non deciso in questa fase
- [ ] Business rule esplicita "Sale crea → delisting automatico degli altri Listing dello stesso
      item" — oggi non risulta implementata da nessuna parte verificata

---

## 3. Lot → Catalog Entry

| Dimensione | Analisi |
|---|---|
| **Mechanics** | ⚠️ **Nessuna, oggi.** Non è un problema di design: manca il collegamento a livello di schema. `items.lot_id` non esiste |
| **Cardinality** | Come intesa nel Round 1: 1‑N (un lot produce N capi). **Come è oggi: 0** — nessuna riga `items` collegata a nessuna riga `lots`. `lots.quantity` è un contatore indipendente, non derivato da un conteggio reale di item |
| **Sorting** | Non applicabile: non esiste una lista di Catalog Entry per Lot da ordinare, perché non esiste la relazione |
| **Filtering** | Stesso motivo: non applicabile finché manca la FK |
| **Dependencies** | La relazione dipende da un prerequisito **tecnico**, non di design: aggiungere `items.lot_id` (nullable — non ogni capo viene da un lotto). Finché non c'è, "ripartizione costi per singolo capo" via `allocation_method` non è calcolabile a livello di item: resta un numero aggregato sul lot (`total_cost_cents / quantity`, o pesato, ma mai per capo tracciato) |

**Requisiti di dato emersi:**
- [ ] `items.lot_id uuid null references lots(id)` — colonna canonica **mancante**, prerequisito
      per qualunque S/F/D reale su questa relazione. Senza, questa non è una fase di design, è
      una migrazione da scrivere prima
- [x] **Decisione di scope presa (02/09)**: si costruisce la FK, per abilitare l'inserimento
      bulk — non per ripartizione costi automatica. Vedi sezione dedicata sotto

---

## Requisiti di dato consolidati

| Campo/Tipo | Oggetto | Tipo | Motivo |
|---|---|---|---|
| `Listing` (tipo TS) | Listing | interface | Mechanics — oggi assente, blocca qualunque componente |
| `MarketplaceAccount` (tipo TS) | Marketplace Account | interface | Dependency (relazione 1) |
| `Shipment`/`FulfillmentEvent` (tipo TS, event-log) | Shipment | interface | Mechanics — il tipo attuale modella la cosa sbagliata |
| `items.lot_id` | Catalog Entry | `uuid null` (migrazione) | Mechanics — la relazione 3 non esiste senza |

## Decisioni di design emerse

- La CTA "Pubblica" su Catalog Entry deve essere **disabilitata, non nascosta**, quando manca un
  `marketplace_accounts` attivo per quel marketplace — coerente con la decisione 02/09 che tiene
  quella schermata in scope
- La board Logistica deve trattare lo stato-spedizione come **derivato**, non editabile
  direttamente: qualunque azione "segna spedito" scrive un nuovo evento `fulfillments`, non
  sovrascrive un campo
- Il delisting automatico alla vendita (relazione 2, Dependency b) è **la feature-verbo del
  prodotto** e non ha oggi una business rule verificata: è un candidato forte per lo stesso
  trattamento delle 3 decisioni bloccanti, se non lo è già altrove nel backend (da verificare,
  non assunto qui — fuori scope di questa fase)

## Decisione presa (02/09, dopo grill-me con Federico)

**Si costruisce `items.lot_id`.** Non per calcolare automaticamente un costo-per-capo pesato:
quel numero resta **manuale**, come oggi (`purchasePriceCents` su Catalog Entry, già esistente,
già usato via `PriceMarginCard`). La FK serve per abilitare un **flusso di inserimento bulk**,
distinto da quello a capo singolo:

1. Il Seller crea un Lot (costo totale, quantità, fornitore)
2. Entra in una modalità di inserimento in loop: ogni capo passa per la **stessa pipeline AI**
   di oggi (nessuna seconda pipeline "leggera" — scartato esplicitamente, raddoppierebbe il
   lavoro per un guadagno di velocità ottenibile restando su una pipeline sola), taggato col
   `lot_id` di provenienza
3. Deve restare possibile associare un capo già catalogato a un lotto anche dopo, non solo
   durante l'inserimento bulk (dettaglio non ancora specificato — Federico: "non so come
   dovrebbe funzionare")

**Perché non allocazione automatica**: nel mondo reale, il costo per capo si stima a memoria per
similarità ("prodotti simili hanno prezzi simili"), non si calcola dividendo il lotto. Il campo
manuale esistente serve già a questo — costruire un'allocazione automatica risolverebbe un
problema che non c'è.

**Nota per Fase 5 (non ancora decisa, solo segnalata)**: si potrebbe precompilare
`purchasePriceCents` col costo lotto diviso quantità come default modificabile in modalità
bulk, invece di lasciarlo sempre vuoto — dettaglio UX da disegnare quando si arriva al brief,
non deciso qui.

## Prossimo step → Fase 2

Oggetti keystone confermati, invariati rispetto al context packet dell'handoff:

1. **Listing** — zero rappresentazione UI oggi, centro della catena di destra, la relazione più
   matura per l'Object Guide
2. **Shipment** — la relazione con la mechanics più complessa (event-log, non stato), la guida
   deve chiarire questo prima che diventi un componente
