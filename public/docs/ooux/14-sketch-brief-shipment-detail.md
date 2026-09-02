---
title: "OOUX Fase 5 — Sketch Brief · Shipment Detail"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi implementa il componente e chi lo porta in Stitch
---

# Fase 5 — Sketch Brief · Shipment Detail

> Seconda e ultima view di Fase 5. Non wireframe: struttura + comportamento. Colori/font/token
> → Fase 6.

## Perché questa view, e cosa non risolve

Fase 3 l'ha segnalata come gap: oggi Shipment ha solo `ShippingLabelDialog` (stampa etichetta),
nessun posto che mostri lo **storico eventi**. Senza, l'ambiguità aperta da Fase 2 — i 4 stati UI
(`da_fare · fatti · spediti · consegnati`) non hanno una mappatura 1:1 coi 5 stage canonici
(`packing · shipped · in_transit · delivered · completed`) — resta invisibile anche a chi la
cerca. **Questa view non risolve la mappatura**: la rende osservabile, mostrando gli eventi
`fulfillments` reali così come sono. Se per uno Shipment in "Da fare" non esiste ancora nessun
evento, la view lo mostra vuoto — non inventa un evento `packing` per far tornare i conti.

**Colonne canoniche più ricche di quanto Fase 1 avesse elencato**: verificando lo schema per
questo brief, `fulfillments` ha anche `carrier` · `tracking_code` · `expected_delivery_at`
(aggiunte in una migrazione successiva a quella lockdown, non ancora citate nelle fasi
precedenti). Sono per-evento, non per-shipment: un valore diverso per riga è possibile, non un
errore di dati. Il destinatario (`recipient`) è **PII**, esplicitamente escluso da
`fulfillments` — vive in `personal_data`, disponibile solo via join controllato o come
riferimento anonimo. Questo brief tratta `recipient` di conseguenza (vedi sotto).

---

## Detail View — Shipment

**Montaggio:** Sheet (drawer laterale) — non `Dialog` come `ShippingLabelDialog`, che resta un
surface separato e più stretto (solo etichetta stampabile). Sono due finestre diverse sullo
stesso oggetto, aperte da trigger diversi: non unificarle in questo brief, sarebbe una fusione di
scope non richiesta da nessuna fase precedente.
**Trigger:** tap su una `LogisticsCard` nella board Kanban.
**Ruoli con accesso:** Seller (Admin/Operator pari capacità).

### Contenuto (gerarchia informativa)

**Header (SheetHeader)**
- `itemLabel` + `sku` del capo venduto — tipo: testo (titolo)
- Badge stato corrente — **derivato**, non un campo: l'ultimo `stage` per `occurred_at` fra gli
  eventi mostrati sotto. Se zero eventi, badge "Da fare" per default (nessun evento ancora)
- `marketplace` — badge colore-brand (stesso pattern di Listing Detail, coerenza fra le due
  view del brief) — tipo: badge

**Corpo principale**
1. **Storico eventi** (sezione primaria, non secondaria — è la ragione della view) — lista
   ordinata `occurred_at` asc: per ogni evento, `stage` (label leggibile) · `occurred_at`
   (data/ora) · `carrier`/`tracking_code` se presenti su quella riga · `note` se presente.
   Vuota per uno Shipment senza eventi ancora registrati — vedi Empty state sotto
2. **Consegna prevista** — `expected_delivery_at` (dall'evento più recente che la valorizza, se
   presente) — tipo: testo, evidenziato se supera la data odierna (spedizione in ritardo)
3. **Destinazione** — `destinationCity` (nome + eventuale mappa puntuale, riuso pattern
   `LogisticsGlobe` non richiesto qui: un punto, non la board intera) — **non** il destinatario
   completo: mostra città/area, non nome+indirizzo (PII, vedi nota sopra). Se serve il dato PII
   completo per l'etichetta, resta compito di `ShippingLabelDialog`, non di questa view

**Metadata (footer/secondario)**
- `priceCents` della vendita collegata — tipo: testo mono, contesto minore rispetto a Listing
  Detail (qui non è l'informazione primaria)

### CTA

| CTA | Posizione | Ruolo | Stato oggetto richiesto |
|---|---|---|---|
| Segna spedito | SheetFooter, primaria | Seller | Stato corrente derivato ≠ `spediti`/`consegnati` — **solo se non già raggiunto** |
| Segna consegnato | SheetFooter, primaria | Seller | Stato corrente derivato = `spediti` (o oltre) |
| Segna pronto ⚠️ | SheetFooter, secondaria | Seller | Stato corrente = `da_fare` — vedi nota sotto |
| Stampa/Ristampa etichetta | SheetFooter, secondaria | Seller | Sempre — apre `ShippingLabelDialog` sopra questo Sheet, non lo sostituisce |

⚠️ **Decisione di comportamento presa da questo brief, non ancora presa altrove:** le CTA sopra
sono mostrate **solo in avanti** rispetto allo stato corrente (non si può "Segna spedito" uno
Shipment già consegnato). Questo non risolve la domanda aperta di Fase 4 sul drag&drop della
board Kanban (che oggi non ha questo vincolo) — la introduce **qui**, in una view diversa. Se
Fase 6 vuole coerenza fra board e Detail, il drag&drop andrà allineato a questa regola, non il
contrario: un Detail con pulsanti liberi in ogni direzione normalizzerebbe un comportamento che
nessuna fase ha mai approvato.

`Segna pronto` resta ⚠️ per lo stesso motivo di Fase 2/3/4: non è chiaro se scriva un evento
canonico reale o sia un colore-scrivania senza corrispondenza in `fulfillments`. La CTA esiste
nel brief perché la board la offre già, ma la view non finge di sapere a quale `stage` si scrive.

### Relazioni navigate da questa view

| Relazione | View target | Come | Cardinality |
|---|---|---|---|
| → Listing/Catalog Entry | (nessuna, oggi) | Come per Listing Detail: il titolo mostra il capo ma non è cliccabile in questo brief | 1 |

### Comportamenti

- **Empty state storico eventi:** Shipment appena entrato in pipeline, zero eventi
  `fulfillments`. Messaggio: "Ancora nessun movimento registrato" — non un errore, è lo stato
  atteso per un pacco non ancora avviato.
- **Evento con `carrier`/`tracking_code` mancanti:** capita per eventi non generati da un
  corriere reale (es. un "segna pronto" manuale prima della spedizione vera) — la riga li omette
  invece di mostrare campi vuoti.
- **Permessi:** nessuna differenza Admin/Operator (Fase 1).

---

## Input per Fase 6 — spec-to-modular-ui

**Oggetti keystone di Fase 5:** Listing (`13`) + Shipment (questo brief) — Fase 5 di Track B è
completa con questi due.

**View inventory di questo brief:** 1 (Detail, montata come Sheet, distinta da
`ShippingLabelDialog` esistente).

**Attributi enum → token candidati:**
- Badge stato Shipment (derivato, non un campo diretto) → stessa famiglia di token di
  `SHIPMENT_STATUS_LABELS` esistente (`da_fare/fatti/spediti/consegnati`), ma la fonte dati
  cambia da campo diretto a calcolo sullo storico — impatto su Fase 6, non su questo brief
- `fulfillments.stage` (5 valori canonici) → non ha oggi un token proprio, serve se lo storico
  eventi mostra il nome dello stage canonico invece della sola label UI a 4 valori — **decisione
  aperta**: lo storico mostra gli stage canonici (5, più precisi) o li traduce nei 4 UI (più
  coerenti col resto dell'app ma con perdita di informazione)? Non decisa in questo brief

**Stack tech:** invariato dal brief precedente (Next.js 16 · React 19 · Tailwind v4 · shadcn/ui).
**Design anchor:** MP076, lockato.

**Non risolto in questo brief, per Fase 6:**
1. Se il drag&drop della board Kanban va allineato al vincolo avanti-solo introdotto qui
2. Se lo storico eventi mostra i 5 stage canonici o i 4 UI tradotti
3. La mappatura `da_fare`/`fatti` sui rispettivi eventi canonici (o l'assenza di essa), aperta
   da Fase 2

**Fase 5 di Track B è completa** con questo brief. Prossimo: Fase 6 (Atomic Bridge), che applica
il proprio ground-truth check e confirmation gate prima di toccare il design system esistente —
non da bypassare delegando in fretta (regola `orca-pipeline`).
