---
title: "OOUX Fase 3 — Navigation Flow · Listing e Shipment"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi disegna Fase 5 (Sketch Brief) per Pubblicazione e Logistica
---

# Fase 3 — Navigation Flow · i due keystone di Track B

> "Content is the navigation." Struttura emersa dagli edge MCSFD (Fase 1) e dai nomi canonici
> (Fase 2), non da convenzioni di menu. Piattaforma: **web-first**, responsive mobile (a
> differenza di Track A che è mobile-first). Non si nominano rotte/URL qui — quello è Fase 5.

## ⚠️ Addendum correzione (02/09, prima di Fase 5)

**Un capo mostra già il suo stato multi-marketplace.** L'Entry Point #3 sotto dichiarava
"verificato che nessun componente mostra lo stato multi-marketplace di un item" — falso: la
ricerca aveva coperto solo `publishing/` e `CatalogEntryDetail.tsx`, non `inventory/`. Lì esistono
`ChannelDots.tsx` (righe tabella Inventario, toggle diretto per canale) e `PlatformPills.tsx`
(vista a card, sola lettura). Sono i "tre pallini colorati" che l'handoff descriveva.

**Non annulla la conclusione ("serve un Listing Detail"): la aggrava.** Nessuno dei due mostra un
detail per singolo Listing (prezzo/URL/errore/retry) — restano indicatori inline, non view.
Quello che cambia è più serio: **esiste una seconda implementazione, divergente, dello stesso
concetto**, indipendente da `ToPublishTab`/`LiveTab`:

| | `ChannelDots`/`PlatformPills` (Inventario) | `ToPublishTab`/`LiveTab` (Pubblicazione) |
|---|---|---|
| Marketplace coperti | 3 (Vinted, Grailed, Depop) — `PLATFORM_KEYS` | 5, coerente col canonico |
| Stati | `active · pending · delisted · sold · null` | `per_listing_status`: `active · delisted · pending_manual · error` |
| Azione | Click su un pallino = toggle diretto pubblica/rimuovi | Selezione + `PlatformChips` + CTA batch |
| `sold` come stato listing | Sì — contraddice il canonico: chi diventa `sold` è l'**item**, non un singolo listing | Non esiste come `per_listing_status` |
| Stato `error` | **Assente** | Presente — è la ragione della CTA "Riprova Listing" (Fase 4) |

Non è terminologia: sono due data model diversi che oggi convivono senza essere mai stati
riconciliati. Questa fase non decide quale via consolidare — la nota è per Fase 5/6, che non
possono disegnare/costruire un Listing Detail senza sapere che c'è già un secondo posto nel
codice che pretende di fare la stessa cosa in modo diverso.

## Entry Point

1. **Pubblicazione** *(primario)* — la voce di nav dedicata è già un entry point di lavoro
   aggregato: il Seller ci entra per gestire annunci **attraverso** i capi, non partendo da un
   capo specifico. Due liste (da pubblicare / live), non una.
2. **Logistica** *(primario)* — stesso pattern per Shipment: entry point di lavoro aggregato, il
   Seller lavora la coda spedizioni indipendentemente da quale capo l'ha generata.
3. **Inventario** *(secondario, correzione 02/09 — vedi addendum)* — non "Dettaglio capo" come
   scritto in origine: `ChannelDots`/`PlatformPills` vivono nella **lista** Inventario (riga
   tabella o card), non in `CatalogEntryDetail`. Mostrano già lo stato multi-marketplace, ma solo
   per 3 canali e senza un vero Detail dietro. Resta comunque un secondo entry point verso
   Listing, indipendente da Pubblicazione — solo non quello che questa fase aveva descritto.

> Shipment non ha un entry point secondario via Dettaglio capo in questa fase: la catena
> Catalog Entry → Sale → Shipment passa da Sale, che non è un keystone qui — resta fuori scope.

---

## Grafo di navigazione

```
[Pubblicazione]
├── Tab "Da pubblicare" (ToPublishTab)
│     lista Catalog Entry disponibili e senza Listing attivo sul marketplace scelto
│     ├── selezione singola o multipla + PlatformChips (marketplace)
│     └── CTA "Pubblica" (batch: onPublish(ids, platforms))
│            └── crea N Listing, uno per (capo × marketplace scelto)
│                 esito per_listing_status: active | pending_manual | error
│
├── Tab "Live" (LiveTab)
│     lista Listing con per_listing_status = 'active', aggregata su tutti i capi
│     ├── tap riga ──► [Listing] Detail  — GAP: non esiste oggi, vedi View inventory
│     ├── CTA "Ritira dall'annuncio" ──► per_listing_status → 'delisted'
│     └── → StrategySheet (regole automatiche per piattaforma: auto-delist ·
│              repricing · auto-relist — configurazione, non un singolo Listing)
│
├── RepublishSheet — rimette in vendita un Listing delistato (torna 'active'/'pending_manual')
└── BulkPricePreviewDialog — preview prezzo prima di pubblicare/repriceare in batch

[Logistica]
└── Board Kanban, 4 colonne = ShipmentStatus (Da fare · Fatti · Spediti · Consegnati)
      ⚠️ la derivazione delle prime due colonne da fulfillments.stage non è definita
      (vedi Fase 2) — questa fase non può dire con certezza come una card entra in
      "Da fare" o "Fatti" finché non è chiarito
      ├── LogisticsCard (drag&drop tra colonne)
      │     azione "segna spedito"/"segna consegnato" ──► scrive un NUOVO evento
      │     fulfillments, non sovrascrive un campo (Fase 2)
      ├── tap card ──► [Shipment] Detail — GAP parziale, vedi View inventory
      └── LogisticsGlobe — vista mappa aggregata della board, non un path verso il
            singolo Shipment: è contesto visivo, non navigazione

[Inventario]  (esiste già, ⚠️ correzione 02/09 — vedi addendum in testa al documento)
├── Tabella (InventoryTable) → cella "piattaforme" → ChannelDots
│     click su un pallino ──► toggle diretto pubblica/rimuovi (3 canali: Vinted·Grailed·Depop)
│     NON passa da [Listing] Detail, NON usa per_listing_status/error — modello a parte
└── Vista card (InventoryView) → PlatformPills
      sola lettura, stesso modello a 3 canali di ChannelDots — nessuna azione, nessun detail

└── ⚠️ NESSUNO dei due percorsi converge oggi verso lo stesso [Listing] Detail che nasce da
      Pubblicazione: sono due rappresentazioni indipendenti dello stesso concetto d'oggetto
```

**Profondità:** Pubblicazione(1) → tab(1.5) → Listing Detail(2). Logistica(1) → Shipment
Detail(2). Entrambe sostenibili, meno profonde di Track A — coerente col fatto che sono aree
di lavoro aggregate, non un flusso di creazione a step.

---

## View inventory

### Listing

- **Lista globale** — non una singola lista: **due**, con scope diverso sullo stesso oggetto.
  "Da pubblicare" (ToPublishTab) mostra Catalog Entry candidati, non Listing esistenti. "Live"
  (LiveTab) mostra Listing con `per_listing_status='active'`. Sort default: `published_at desc`
  per Live, `created_at desc` per Da pubblicare (da Fase 1). Filtri: `marketplace` ·
  `per_listing_status` (soprattutto `error`) · range prezzo.
- **Card (inline)** — dentro le due tab di Pubblicazione: marketplace badge + prezzo + stato.
  **Correzione 02/09**: esiste anche una terza rappresentazione inline, indipendente — `ChannelDots`
  (tabella Inventario, interattiva, 3 canali) e `PlatformPills` (card Inventario, sola lettura,
  stessi 3 canali) — vedi addendum in testa al documento. Non è la "sezione Annunci nel Dettaglio
  capo" che questo documento ipotizzava in origine: è nella lista, non nel detail del capo.
- **Detail** — ⚠️ **non esiste come view a sé oggi**. Questa fase la dichiara necessaria: senza
  un detail per singolo Listing non c'è dove mettere il retry su `per_listing_status='error'`
  (Fase 2, nota vincolante per Fase 5) né dove mostrare `external_url`/prezzo/stato di **un**
  annuncio specifico quando un capo ne ha tre. Sezioni attese: marketplace · prezzo · stato ·
  link esterno · azione ritira/riprova. Il brief va prodotto in Fase 5, non qui.
- **Empty state** — "Da pubblicare" vuoto: tutti i capi disponibili sono già pubblicati ovunque
  (positivo, non un errore). "Live" vuoto: nessun annuncio attivo — se la causa è l'assenza di un
  Marketplace Account collegato, l'empty state deve dirlo e puntare lì, non limitarsi a "niente
  da mostrare" (dependency da Fase 1/2).

### Shipment

- **Lista globale** — la board Kanban di Logistica, organizzata per stage/colonna, non una lista
  piatta ordinabile liberamente.
- **Card** — `LogisticsCard`, già esiste: drag&drop tra colonne.
- **Detail** — parziale. Oggi c'è solo `onOpenLabel` (stampa etichetta), non un vero detail con
  lo storico eventi. ⚠️ Senza un detail che mostri il **log** `fulfillments` (non solo lo stage
  corrente derivato), l'ambiguità Da fare/Fatti segnalata in Fase 2 resta invisibile anche
  all'utente più attento — nessuno vedrebbe MAI l'evidenza per capire da dove viene lo stato di
  una card.
- **Empty state** — colonna vuota (es. "Consegnati" vuoto a inizio giornata): già gestito dal
  Kanban esistente, non un gap di questa fase.

---

## Flussi cross-object

### Pubblicare un capo su un marketplace
Job: "Quando il Seller vuole mettere in vendita un capo pronto..."
Path: Inventario/ToPublishTab → seleziona capo(i) → PlatformChips (marketplace) → CTA "Pubblica"
→ **Listing** creato
Transizioni di stato: Catalog Entry resta `available` (non cambia). Listing nasce già nello
stato risultante della pubblicazione — non esiste uno stato "bozza" del Listing prima della CTA.
Dependency: richiede un Marketplace Account attivo per quel marketplace (Fase 2) — se manca, la
CTA è disabilitata con motivo visibile, non nascosta.

### Un capo si vende, sparisce dagli altri annunci *(feature-verbo del prodotto)*
Job: "Quando arriva una vendita da un marketplace..."
Path: webhook marketplace → **Sale** creata dal sistema (non CTA) → [ipotesi Fase 1: gli altri
Listing dello stesso `item_id` passano a `delisted`] → **Shipment** implicito nasce (zero eventi
`fulfillments` ancora, colonna "Da fare")
Transizioni di stato: Listing.per_listing_status: `active → delisted` per i "fratelli" dello
stesso capo · Catalog Entry.status: `available → sold` (già noto da Track A)
⚠️ **Questo flusso descrive l'intento, non necessariamente il comportamento verificato.** Fase 1
ha segnalato che la business rule di delisting automatico non risulta implementata da nessuna
parte confermata nel codice — resta un requisito, non un fatto osservato.

### Seguire una spedizione fino alla consegna
Job: "Quando il Seller vuole sapere a che punto è un pacco..."
Path: Logistica (board) → LogisticsCard → azione "segna spedito"/"segna consegnato" → nuovo
evento `fulfillments` → la card si sposta di colonna
⚠️ Il passo finale ("si sposta di colonna") è certo solo per Spediti→Consegnati. Per
Da fare→Fatti resta la domanda aperta di Fase 2: quale evento, se esiste, causa quello
spostamento.

---

## Prossimo step → Fase 4

Input per CTA Matrix: **Listing** (view: due liste aggregate + card + detail da progettare) e
**Shipment** (view: board Kanban + card + detail parziale da completare), entrambi con la CTA
"Pubblica"/"segna spedito" già note da questa fase. La CTA Matrix deve anche coprire le CTA di
retry (`per_listing_status='error'`) e ritiro/repubblicazione (RepublishSheet), oggi presenti nel
codice ma non ancora formalizzate come CTA di un oggetto Listing esplicito.
