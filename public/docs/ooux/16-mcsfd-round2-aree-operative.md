---
title: "OOUX Fase 1 (secondo giro) — MCSFD · Sale→Accounting Entry, Listing→Marketplace Account, Listing→Publish Strategy"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi esegue Fase 2 sui prossimi keystone e chi tocca schema/API di Contabilità e Pubblicazione
---

# Fase 1, secondo giro — tre relazioni oltre Listing/Shipment

> Dopo aver chiuso Round1→Fase6 su Listing e Shipment (PR #48-#59), questo giro copre tre
> relazioni rimaste fuori dal primo passaggio, scelte perché già citate come dipendenza o gap
> nelle fasi precedenti. Stesso metodo: verificare tutto contro lo schema, non il punto sospetto.

## 0. La scoperta più seria di questo giro: Contabilità gira ancora su mock

Cercando la mechanics di Sale → Accounting Entry ho trovato che **AccountingView non legge né
`accounting_entries` né la vista pensata per sostituirla**: l'unico writer/reader trovato è
`apps/web/lib/accounting-mock.ts`. La vista canonica `v_accounting_transactions`
(`26_v_accounting_transactions.sql`) esiste ma non è collegata al frontend, e porta con sé **due
TODO espliciti marcati "team-gated (Federico)" nel commento della migrazione stessa**:

1. `shipping_cost_cents` è hardcoded a `0` — «nessuna sorgente ancora (dove vive il costo
   spedizione a carico seller?)»
2. `entry_type` è hardcoded a `'sale'` per **ogni** riga — «return/refund/expense da mappare
   quando si chiude il set con Federico»

Questi non sono buchi che questa fase può colmare da sola: sono decisioni già segnalate come
tue nel codice stesso, prima ancora che questo documento esistesse.

---

## 1. Sale → Accounting Entry

| Dimensione | Analisi |
|---|---|
| **Mechanics** | ⚠️ **Non verificato nessun writer automatico di `accounting_entries`** (nessun trigger, nessun worker trovato). La vista `v_accounting_transactions` bypassa la tabella: proietta **direttamente da `sales`** una riga sintetica per vendita (join `items`+`listings`+`settlement_ledger`), non aggrega righe `accounting_entries` reali. Se `accounting_entries` viene mai scritta, il meccanismo non è nel layer SQL — è application-level non trovato, o non esiste ancora |
| **Cardinality** | Per schema: Sale 1‑N `accounting_entries` (`sale_id` nullable su `accounting_entries`, quindi anche 0). Per la vista realmente in uso: Sale **1‑1** → una riga sintetica, sempre `entry_type='sale'` (mai commission/vat/refund/adjustment separati, anche se il canonico li prevede) |
| **Sorting** | `AccountingView` reale (mock) ordina per colonna cliccabile, con un rank custom per "Stato". Default plausibile: `sold_at`/`event_date` desc — da confermare quando si passa dal mock alla vista reale |
| **Filtering** | `period` (range giorni, default 30, user-controlled) — reale nel codice. Per marketplace: la vista fa `left join listings`, quindi una Sale con `listing_id` NULL (caso già segnalato nel primo giro Fase 1) ha `marketplace` NULL nella riga — il filtro per marketplace su quelle righe non funziona |
| **Dependencies** | (a) La vista è **Admin-only a livello RLS** (`current_app_role() = 'admin'`, REQ-512) — non solo nascosta in UI: un Operator non vede Contabilità nemmeno per query diretta. È una divergenza di ruolo reale, diversa dal "pari capacità" assunto per il catalogo nelle fasi precedenti — quello si riferiva al catalogo, non a Contabilità. (b) Lo stato mostrato (`coalesce(sl.state, 'pending')`) passa **il valore grezzo** di `settlement_ledger.state` (`pending·finalized·disputed`) come `status` — ma il tipo UI `AccountingEntryStatus` si aspetta `confirmed·escrow·pending` (3 valori diversi). Se la vista sostituisse il mock oggi, `finalized` e `disputed` non avrebbero un badge configurato |

### Decisioni prese (02/09, dopo grill-me con Federico)

**1. `shipping_cost_cents` → diventa un campo manuale unico per vendita.** Il venditore anticipa
davvero delle spese vive su marketplace senza spedizione integrata (Catawiki, eBay, Depop,
Grailed — Vinted esclusa, ha la sua integrata), e può aggiungerci packaging e omaggi. Stesso
pattern di `purchasePriceCents` (già esistente): **un numero solo**, inserito a mano dal
venditore, non tre voci separate (spedizione/packaging/omaggi) — quella precisione non serve
oggi, la domanda vera è "il margine netto è quello vero", non "quanto spendo in packaging".
Nome proposto: `sellerCostsCents` o simile — non è più solo "spedizione", il nome deve
riflettere che copre più voci.

**2. `entry_type` → resta aggregato, come oggi.** Nessuna riga separata per commission/vat/
adjustment: una riga per vendita, come fa già `v_accounting_transactions`. Riapribile se emerge
un obbligo fiscale reale (l'IVA, a differenza della commissione, potrebbe averne uno — ma oggi
non c'è, quindi non si costruisce in anticipo).

**3. Vocabolario di stato → riconciliato, con onestà sulle dispute.** `AccountingEntryStatus`
(UI) deve rappresentare anche `disputed` (oggi assente), non solo `confirmed·escrow·pending`.
**Non riapre** la gestione attiva delle dispute (resta fuori MVP, coerente con `returns_disputes`
deciso il 02/09) — ma lo stato "in disputa" deve comparire onestamente quando succede (una
bandierina, non un'azione), invece di mostrare "confermato" su una vendita contestata. Il campo
esiste già nel canonico (`settlement_ledger.state`), costa pochissimo non nasconderlo.

**Requisiti di dato emersi (aggiornati):**
- [x] Decisione su (1)-(3) presa — sblocca Fase 2 su Accounting Entry
- [ ] Se si popola `accounting_entries` per davvero: resta **fuori scope** per decisione (2) — la
      vista aggregata basta, non serve chi scrive righe separate
- [ ] Nuovo campo canonico: `sales.seller_costs_cents` (o su `accounting_entries`, da decidere in
      Fase 6) — manuale, opzionale, unico per vendita

---

## 2. Listing → Marketplace Account

| Dimensione | Analisi |
|---|---|
| **Mechanics** | Marketplace Account è creato da un flusso di collegamento account (OAuth o credenziali, non specificato nel codice attuale — la tabella prevede solo `secret_ref` verso un vault, il flusso che lo popola non è nel frontend oggi). Nessuna UI verificata per crearlo: la CTA "Pubblica Listing" ne dipende ma non esiste un percorso per generarne uno |
| **Cardinality** | Tenant → Marketplace Account: **0‑5** (`UNIQUE(tenant_id, marketplace)`, un account al più per marketplace, 5 marketplace possibili). Marketplace Account → Listing: **1‑N logico** (un account abilita la pubblicazione di N Listing su quel marketplace), ma **non è una FK diretta** — `listings` non ha `marketplace_account_id`, il legame è solo "stesso `tenant_id` + stesso `marketplace`", implicito |
| **Sorting** | N/A — con 0‑5 righe per tenant, una lista di Marketplace Account non ha bisogno di ordinamento configurabile: 5 marketplace fissi bastano come righe statiche |
| **Filtering** | N/A per lo stesso motivo. L'unico stato rilevante da mostrare è `status` (`active·inactive·error`) per riga, non da filtrare |
| **Dependencies** | Questa è la direzione opposta a quella pensata finora: non è Marketplace Account che dipende da Listing, è **Listing che dipende da Marketplace Account** (già noto, Fase 2/4/5/6). La novità qui: la relazione non ha una FK, quindi verificare "questo marketplace ha un account attivo" richiede una query separata (join implicito su `tenant_id`+`marketplace`), non un semplice `listings.marketplace_account_id IS NOT NULL` |

**Requisiti di dato emersi:**
- [ ] Vista/schermata per **creare** un Marketplace Account — oggi non esiste nessun percorso
      verificato, solo la tabella. È il gap più bloccante di questo giro: senza, la CTA
      "Pubblica Listing" resta permanentemente disabilitata per ogni tenant nuovo
- [ ] Se si vuole un controllo diretto invece di un join implicito, valutare
      `listings.marketplace_account_id` — non deciso qui, è un cambio di schema

---

## 3. Publish Strategy → effetto su N Listing *(non 1:1 con un singolo Listing)*

| Dimensione | Analisi |
|---|---|
| **Mechanics** | Il Seller configura da `StrategySheet` (UI reale, `lib/publishing-strategy.ts`): 3 regole per marketplace (`autoDelist`, `repricing`, `autoRelist`), ciascuna con parametri numerici. **Nessuna di queste scritture arriva al canonico**: `tenant_publish_settings` ha solo `auto_publish` booleano — non un solo campo mancante, **manca lo schema per 6 dei 7 parametri configurabili** (`staleDays`, `discountPct`, `frequencyDays`×2, `floorPct`, più i 3 booleani `enabled` che non hanno granularità per-regola nel canonico) |
| **Cardinality** | Tenant × Marketplace → Publish Strategy: **1‑1** (PRIMARY KEY composita, coerente). Publish Strategy → Listing: **1‑N implicito** — le regole si applicano a tutti i Listing di quel tenant+marketplace, non referenziano righe specifiche |
| **Sorting** | N/A — config a riga fissa per marketplace, non una lista da ordinare |
| **Filtering** | N/A per lo stesso motivo |
| **Dependencies** | Ogni Listing `active` su un marketplace con `autoDelist.enabled=true` dovrebbe, in teoria, sparire da solo dopo `staleDays` — ma **nessuna colonna canonica registra `staleDays`**, quindi questo comportamento non può essere eseguito lato backend oggi, resta solo nella UI (se pure lì è collegato a un worker, non verificato in questo giro) |

### Decisione presa (02/09, dopo grill-me con Federico)

**Fuori MVP, dichiarato esplicitamente.** Le 8 colonne non si costruiscono ora: auto-delist,
repricing e auto-relist sono automazioni di ottimizzazione per seller con volume già rodato, non
funzioni che bloccano il ciclo base carica→pubblica→vendi. Nel frattempo, `StrategySheet` va
marcata **"in arrivo"** nell'interfaccia, non lasciata configurabile come se salvasse davvero —
un'interfaccia che sembra persistere qualcosa e invece non salva nulla è un problema di onestà
verso l'utente, non solo tecnico.

**Requisiti di dato emersi (aggiornati):**
- [ ] `tenant_publish_settings` manca: `auto_delist_enabled`, `auto_delist_stale_days`,
      `repricing_enabled`, `repricing_discount_pct`, `repricing_frequency_days`,
      `repricing_floor_pct`, `auto_relist_enabled`, `auto_relist_frequency_days` — 8 colonne,
      **non costruite ora**, restano come specifica per quando si riaprirà post-MVP
- [x] **Decisione di scope presa**: fuori MVP. `StrategySheet` da marcare "in arrivo"

---

## Requisiti di dato consolidati

| Campo/Decisione | Oggetto | Tipo | Esito |
|---|---|---|---|
| `AccountingEntryType` (4 UI) vs `accounting_entries.type` (5 canonici) | Accounting Entry | decisione | ✅ resta aggregato, nessuna riga separata |
| `AccountingEntryStatus` vs `settlement_ledger.state` | Accounting Entry | decisione | ✅ riconciliato, `disputed` compare onestamente |
| Sorgente costi seller (spedizione+packaging+omaggi) | Accounting Entry | decisione + colonna | ✅ campo manuale unico, nuovo (`seller_costs_cents` o simile) |
| Percorso di creazione Marketplace Account | Marketplace Account | vista/flusso | ✅ fatto (Fase 3-6, PR #63-#66) |
| 8 colonne mancanti in `tenant_publish_settings` | Publish Strategy | schema | ✅ fuori MVP, non costruite. UI marcata "in arrivo" |
| `items.lot_id` (primo giro, `09` §3) | Lot | migrazione | ✅ si costruisce, per flusso bulk (non allocazione costi) |

## Decisioni di design emerse

- Contabilità è **Admin-only a livello RLS**, non solo di visibilità UI — va rispettato ovunque
  si progetti quella vista, non solo dov'è già così oggi
- Marketplace Account↔Listing non ha FK diretta: qualunque UI che mostri "questo listing è
  collegato a quale account" deve fare un join su `tenant_id`+`marketplace`, non seguire un
  puntatore

## Tutte le decisioni di questo giro sono state prese (02/09)

Accounting Entry (3 punti) e Publish Strategy (1 di scope) sbloccati — vedi le sezioni dedicate
sopra. Lot→Catalog Entry (primo giro, `09` §3) sbloccato in parallelo con la stessa sessione di
grill-me.

## Prossimo step → Fase 2

**Accounting Entry** e **Marketplace Account** sono ora entrambi pronti per Fase 2 (Marketplace
Account già completata Round1→Fase6 separatamente, vedi handoff). **Publish Strategy** resta
fuori scope per decisione presa (non "bloccata", deliberatamente esclusa dall'MVP) — non procede
a Fase 2 finché non si riapre post-MVP.
