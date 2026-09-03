---
title: "OOUX Fase 4 — CTA Matrix · Listing e Shipment"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi scrive i Sketch Brief (Fase 5) per Pubblicazione e Logistica
---

# Fase 4 — CTA Matrix · i due keystone di Track B

> Ogni CTA = ruolo × oggetto × view × effetto, forma **verbo + oggetto**. Mono-ruolo **Seller**
> (Admin/Operator pari capacità). Input: `11-nav-flow-listing-shipment.md` (Fase 3, validata
> 02/09). CTA di sistema escluse (webhook marketplace che crea Sale, worker che scrive
> `fulfillments` da eventi automatici) — solo azioni a iniziativa dell'utente.
>
> ⚠️ **Addendum correzione (02/09, dopo il commit di questa fase):** l'input di Fase 3 conteneva
> un errore, corretto con addendum in `11`. Le CTA sotto (Pubblica/Ritira/Riprova/Repubblica
> Listing) restano valide per il percorso `ToPublishTab`/`LiveTab`, ma **manca** dalla matrice
> una CTA reale già in produzione: `Toggle pubblicazione canale` su `ChannelDots` (tabella
> Inventario) — click su un pallino, pubblica/rimuove un capo da un canale senza passare da
> nessuna delle CTA elencate qui, copre solo 3 marketplace, e non ha equivalente dello stato
> `error`. Non aggiunta qui per non riscrivere una fase già validata — la porta Fase 5/6, che
> deve comunque decidere quale delle due implementazioni consolidare.

## Matrice principale

| CTA | Oggetto | Ruolo | View | Priorità | Effetto |
|---|---|---|---|---|---|
| Pubblica Listing | Listing | Seller | Lista "Da pubblicare" | Primaria | Crea N Listing (un capo × N marketplace selezionati). Per Vinted innesca il flusso browser-only via estensione, non un submit diretto |
| Ritira Listing | Listing | Seller | Lista "Live" | Secondaria | `per_listing_status: active → delisted` |
| Riprova Listing ⚠️ GAP | Listing | Seller | Detail (non esiste — Fase 5) | Primaria (contestuale) | Ritenta la pubblicazione per un Listing in `per_listing_status='error'` — stesso esito possibile di Pubblica |
| Repubblica Listing | Listing | Seller | RepublishSheet | Secondaria | `per_listing_status: delisted → active` (o `pending_manual`) |
| Segna pronto ⚠️ | Shipment | Seller | Board Kanban (drag → "Fatti") | Secondaria | UI: `status: da_fare → fatti`. Canonico: ⚠️ non chiaro se corrisponda a un evento `fulfillments` (dubbio aperto Fase 2/3) |
| Segna spedito | Shipment | Seller | Board Kanban (drag → "Spediti") | Primaria | UI: `status → spediti`. Canonico plausibile: nuovo evento `fulfillments.stage='shipped'` |
| Segna consegnato | Shipment | Seller | Board Kanban (drag → "Consegnati") | Primaria | UI: `status → consegnati`. Canonico plausibile: nuovo evento `fulfillments.stage='delivered'` (o `'completed'`) |
| Stampa etichetta | Shipment | Seller | Card (Board), solo `da_fare`/`fatti` | Secondaria | Nessun cambio di stato — genera/apre il documento etichetta. Copy reale: "Stampa etichetta" (prima volta) / "Ristampa etichetta" (successive) |

**Fuori da questa matrice, deliberatamente:** "Configura regole automatiche" (`StrategySheet`:
auto-delist/repricing/auto-relist) non è una CTA su un singolo Listing — agisce su `Publish
Strategy`/`tenant_publish_settings`, un oggetto diverso, fuori scope in questa fase (non
keystone). "Preview prezzo batch" (`BulkPricePreviewDialog`) non è una CTA a sé: è uno step di
conferma dentro il flusso di "Pubblica Listing", non un'azione con effetto proprio sull'oggetto.

---

## CTA per oggetto (view design reference)

### Listing

**Lista "Da pubblicare"**
- `Pubblica Listing` — Seller — Primaria — selezione singola o multipla + scelta marketplace
  (`PlatformChips`), poi conferma. Disabilitata se manca un Marketplace Account attivo per il
  marketplace scelto (Fase 2), con motivo visibile.

**Lista "Live"**
- `Ritira Listing` — Seller — Secondaria — su singola riga, richiede conferma (rimuove il capo
  da quel marketplace, non dagli altri).

**Card (in entrambe le liste, e nella sezione "Annunci" del Dettaglio capo, GAP)**
- Nessuna CTA propria sulla card — le azioni sono a livello di riga/selezione nella lista.

**Detail view ⚠️ GAP — non esiste, Fase 5 deve produrne il brief**
- `Riprova Listing` — Seller — Primaria (contestuale, solo su `error`) — è la ragione principale
  per cui questa view manca e va costruita: oggi un Listing in errore non ha nessun posto dove
  essere corretto.
- Lettura: marketplace · prezzo · stato · `external_url` (se pubblicato).

### Shipment

**Board Kanban**
- `Segna pronto` ⚠️ — Seller — Secondaria — drag verso "Fatti". Vedi nota mechanics: la
  corrispondenza con un evento canonico non è confermata.
- `Segna spedito` — Seller — Primaria — drag verso "Spediti".
- `Segna consegnato` — Seller — Primaria — drag verso "Consegnati".

⚠️ **Nota per il team dev, non solo di naming.** Verificato nel codice
(`LogisticsView.handleDrop`): il drag&drop oggi **non valida la direzione** — una card può
essere trascinata da "Consegnati" a "Da fare" senza alcun blocco, e la funzione sovrascrive
`status` direttamente sull'oggetto in memoria. Non c'è un guard equivalente a quello che
`items_status_guard` applica a Catalog Entry (nessuna transizione all'indietro da stati chiusi).
Se le 3 CTA sopra diventano transizioni scritte sul canonico (eventi `fulfillments`), la
domanda se permettere un drag all'indietro **non è già stata decisa da nessuna parte** — va
posta esplicitamente, non ereditata dal comportamento del mock.

**Card**
- `Stampa etichetta` — Seller — Secondaria — visibile solo su `da_fare`/`fatti` (`canPrintLabel`
  nel codice). Nessun effetto sullo stato.

**Detail view — parziale, Fase 5 deve completarla**
- Oggi: solo il dialog di stampa etichetta (`ShippingLabelDialog`). Manca un detail che mostri
  lo storico eventi `fulfillments` (segnalato Fase 3) — senza, nessuna delle CTA di questa
  sezione ha un posto dove far vedere *perché* una card è nella colonna in cui è.

---

## Flussi scatenati da CTA

### Flusso: Pubblicare un capo su un marketplace
Trigger: `Pubblica Listing` su Catalog Entry selezionati, dalla lista "Da pubblicare"
Steps: seleziona capo/i → `PlatformChips` (marketplace) → `BulkPricePreviewDialog` (preview,
step di conferma non una CTA a sé) → conferma → per Vinted: flusso browser-only via estensione;
per altri marketplace: presumibilmente via API (da confermare in Fase 6)
Oggetti coinvolti: Catalog Entry (letto, non modificato) · Listing (creato) · Marketplace
Account (letto, dependency)
Transizioni di stato: Listing nasce direttamente in `active`, `pending_manual` o `error` a
seconda dell'esito — non esiste uno stato "bozza" del Listing prima della CTA

### Flusso: Ritirare e ripubblicare un annuncio
Trigger: `Ritira Listing` (Live) → poi eventualmente `Repubblica Listing` (RepublishSheet)
Steps: Live → Ritira → Listing esce da "Live", entra (implicitamente) in una lista di
delistati/archiviati non ancora mappata in questa fase → Repubblica → torna in "Da pubblicare"
o direttamente "Live"
Oggetti coinvolti: Listing
Transizioni di stato: `active → delisted → active` (o `pending_manual`)
⚠️ La view dove un Listing `delisted` vive tra il ritiro e la ripubblicazione non è stata
identificata in Fase 3 — segnalato per Fase 5.

### Flusso: Far avanzare una spedizione
Trigger: `Segna pronto` / `Segna spedito` / `Segna consegnato` su Shipment, board Logistica
Steps: drag della card nella colonna target → (se collegato al canonico) nuovo evento
`fulfillments` con lo `stage` corrispondente
Oggetti coinvolti: Shipment (derivato da Sale + `fulfillments`)
Transizioni di stato: UI, `status` cambia direttamente sull'oggetto in memoria oggi (mock);
canonico, dovrebbe essere append di un evento — la Fase 6 decide come chiudere questo divario

---

## Sintesi per priorità

**CTA primarie MVP** (devono esserci nel Day 1):
- Pubblica Listing
- Segna spedito
- Segna consegnato

**CTA secondarie** (Phase 2):
- Ritira Listing
- Repubblica Listing
- Segna pronto
- Stampa etichetta

**CTA da validare** (non certe — richiedono decisione, non solo design):
- Riprova Listing ⚠️ — l'oggetto (Detail di Listing) non esiste ancora, la CTA è certa nel
  bisogno ma non nella collocazione
- Segna pronto ⚠️ — la sua corrispondenza con un evento canonico resta da chiarire prima che
  valga la pena disegnarla bene
- Direzione del drag su Shipment (avanti-solo o libero) ⚠️ — decisione di prodotto, non di
  interfaccia, non presa da nessuna parte finora

---

## Prossimo step → Fase 5

Input per Sketch Brief: **Listing Detail** (nuova view, priorità alta — sblocca `Riprova
Listing` e la sezione "Annunci" del Dettaglio capo) e il completamento del **Shipment Detail**
(storico eventi, sblocca la leggibilità delle 3 CTA di stato). Entrambe le view partono da zero
o quasi: non c'è un brief precedente da cui ripartire, a differenza di Track A.
