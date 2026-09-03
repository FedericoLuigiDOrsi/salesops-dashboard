---
title: "OOUX Fase 1 (terzo giro) — MCSFD · Catalog Entry→Sale, Supplier→Lot, Listing→Offer"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi esegue Fase 2 sui prossimi keystone
---

# Fase 1, terzo giro — le ultime tre relazioni Round 1 mai toccate

> Dopo Listing, Shipment, Marketplace Account, Lot, Accounting Entry (5/11 completi
> Round1→Fase6), restano tre oggetti mai passati da nessuna fase: Sale, Supplier, Offer.
> Stesso metodo: verificare contro il codice, non contro il Round 1.

## 0. La scoperta di questo giro: Offer ha già UI reale, e diverge dal canonico

A differenza di Listing (partito da zero) e Marketplace Account (nessuna UI), **Offer ha già
un'interazione completa**: `OfferPopup.tsx` (accetta/rifiuta/controfferta), `OfferteWidget.tsx`
(widget Home), `overlays-store.tsx` (stato globale di risoluzione). Non è un gap di view — è un
gap di **coerenza fra UI e canonico**: `OfferStatus` (UI) ha 4 valori (`pending · accepted ·
rejected · counter`), il canonico (`offers.status`) ne ha 5 (`pending · accepted · rejected ·
expired · countered`). Due divergenze, non una: manca `expired` in UI, e `counter` (UI) vs
`countered` (canonico) sono scritti diversamente.

---

## 1. Catalog Entry → Sale

| Dimensione | Analisi |
|---|---|
| **Mechanics** | Sale è creata dal **sistema** (webhook marketplace, idempotente su `external_sale_id` — già noto dal primo giro Fase 1). Non c'è una CTA "Vendi capo": la vendita accade sul marketplace esterno, MAAT la registra |
| **Cardinality** | Catalog Entry → Sale: **0-1 di fatto** (un item può avere più righe `sales` per schema — `sale_id` non è univoco su `items` — ma il modello di stato Track A tratta `sold` come terminale, quindi nella pratica un item venduto non genera una seconda Sale). Sale → Catalog Entry: **1 obbligatoria** (`item_id not null`) |
| **Sorting/Filtering** | Non applicabile dal lato Catalog Entry: non esiste una "lista vendite di questo capo" da ordinare — un capo ha al più una vendita |
| **Dependencies** | Una Sale dovrebbe arrivare solo per un Catalog Entry `available` con almeno un Listing `active`. ⚠️ **Non verificato**: nessun vincolo trovato nel codice che impedisca (o segnali) una Sale per un item già `sold` o senza Listing corrispondente — è la stessa famiglia di gap del delisting automatico (primo giro Fase 1, mai confermato come implementato) |

**Requisiti di dato emersi:**
- [ ] Nessun nuovo campo — la relazione è già completa a livello di schema. Il gap è di
      **validazione**, non di dato: se arriva un webhook di vendita per un item già venduto o
      mai pubblicato, cosa succede? Non è stato verificato in nessun giro precedente

---

## 2. Supplier → Lot

> ⚠️ **Correzione (02/09, prima di Fase 2)**: la riga Mechanics sotto era imprecisa. Verificato
> di nuovo su `RegistraCaricoDialog.tsx`: **non è un campo di testo libero** — è un `Select` con
> i fornitori esistenti (`supplierChoice`), più un'opzione esplicita "nuovo fornitore"
> (`NEW_SUPPLIER`) che rivela un campo libero solo a quel punto. Il matching case-insensitive di
> `registerLoad` è un **secondo livello di sicurezza**, non l'unico. Il gap reale è più stretto
> di quanto scritto sotto: riguarda solo i quasi-duplicati creati scegliendo "nuovo fornitore"
> con un nome che *non* combacia esattamente (case-insensitive) con uno esistente — non ogni
> inserimento.

| Dimensione | Analisi |
|---|---|
| **Mechanics** | Un Supplier nasce per due vie: (a) scegliendo un fornitore esistente dal `Select` — nessuna ambiguità, riusa il nome esatto; (b) scegliendo "nuovo fornitore" e digitando un nome — `registerLoad` fa comunque un matching case-insensitive prima di crearne uno davvero nuovo. Nessuna CTA dedicata "Crea fornitore" a sé: è sempre un sottoprodotto di "Registra Carico" |
| **Cardinality** | Supplier → Lot: **1-N** (un fornitore, più carichi nel tempo). Lot → Supplier: **1 obbligatoria** su schema (`supplier_id` — verificare se nullable; il flusso UI lo popola sempre) |
| **Sorting** | La tabella "Fornitori" (sezione distinta da "Storico carichi" in `AccountingView`) ha un proprio sort — non ancora dettagliato in nessuna fase, da chiarire in Fase 3 se questa relazione procede |
| **Filtering** | Nessuno noto |
| **Dependencies** | Il gap reale, ristretto dopo la correzione sopra: due nomi che *non* sono uguali case-insensitive ma sono lo stesso fornitore per un umano ("Vintage Roma" vs "VintageRoma" senza spazio, o un typo vero) creano comunque un duplicato — solo nel ramo "nuovo fornitore" del `Select`, non nell'uso normale |

**Requisiti di dato emersi:**
- [x] **Decisione presa (02/09)**: sì, autocomplete/typeahead — ma è un **potenziamento** del
      `Select` esistente (correzione sopra), non l'introduzione di qualcosa che manca del tutto.
      Il `Select` resta per la scelta tra fornitori noti; il ramo "nuovo fornitore" guadagna un
      suggerimento fuzzy (non solo case-insensitive) contro i nomi esistenti, per intercettare i
      quasi-duplicati che il matching attuale lascia passare

---

## 3. Listing → Offer

| Dimensione | Analisi |
|---|---|
| **Mechanics** | Offer è creata dal **sistema** (un acquirente fa un'offerta sul marketplace, arriva via webhook/sync — stesso pattern di Sale). La **risposta** dell'Offer (accetta/rifiuta/controfferta) è invece **utente-iniziata**: `OfferPopup` con 3 CTA reali |
| **Cardinality** | Listing → Offer: **1-N** (un annuncio può ricevere più offerte nel tempo, anche in sequenza dopo un rifiuto). Offer → Listing: **1 obbligatoria** (`listing_id not null`) |
| **Sorting** | `OfferteWidget`: `receivedAt` **ascendente** (le più vecchie prima) — verificato nel codice. Coerente con l'urgenza: un'offerta vecchia rischia di scadere prima |
| **Filtering** | `pendingCount` calcolato per badge, ma non trovato un filtro esplicito per stato nella UI attuale — solo un conteggio |
| **Dependencies** | `expires_at` esiste nel canonico ("REQ-616: auto-reject alla scadenza") ma **`expired` non esiste nel tipo UI**: se un'offerta scade, il canonico ha uno stato per dirlo, la UI non ha modo di mostrarlo. Stesso pattern del gate zero e di Accounting Entry: un valore canonico senza rappresentazione |

**Requisiti di dato emersi:**
- [ ] `OfferStatus` (UI) va esteso con `expired` (manca) e allineato a `countered` (oggi
      `counter`, disallineato dal canonico anche nello spelling) — stessa famiglia di
      riconciliazione già fatta per `AccountingEntryStatus` (secondo giro)
- [ ] Se un'offerta scade (`expires_at` superato) senza risposta del Seller, la UI oggi non ha
      un modo di mostrarlo — verificare se un auto-reject lato backend esiste già (REQ-616 lo
      cita) o se anche questo è solo previsto e non implementato, come il delisting automatico

---

## Requisiti di dato consolidati

| Campo/Decisione | Oggetto | Tipo | Esito |
|---|---|---|---|
| Validazione Sale su item non vendibile | Sale | business logic | ⚠️ non verificato, segnalato |
| Matching Supplier per nome libero vs autocomplete | Supplier | decisione UX | ✅ autocomplete, deciso 02/09 |
| `OfferStatus`: aggiungere `expired`, allineare `counter`→`countered` | Offer | tipo TS | ⚠️ riconciliazione necessaria |
| Rappresentazione UI di un'offerta scaduta | Offer | UI/decisione | ⚠️ segnalato, non deciso |

## Decisioni di design emerse

- Offer non è un oggetto "da zero" come Listing era: ha già mechanics, view e CTA reali. Il
  lavoro delle fasi successive è **riconciliazione**, non costruzione — un profilo di lavoro
  diverso da quello fatto finora su questo Track, più vicino a quello di Marketplace Account
  (che invece era zero UI) rovesciato
- Sale conferma di non avere bisogno di un proprio Object Guide/CTA Matrix a sé: non ha CTA
  utente dirette (è sempre creata dal sistema), le sue "azioni" sono tutte sugli oggetti
  collegati (Shipment, Accounting Entry, ora anche l'assenza di validazione verso Catalog Entry)

## Prossimo step → Fase 2

**Offer** è il candidato più chiaro: ha CTA reali da formalizzare (Accetta/Rifiuta/
Controfferta) e una riconciliazione di stato da fare, coerente col lavoro già impostato per gli
altri oggetti. **Supplier** ha una decisione di design aperta (matching nome) che probabilmente
conviene chiarire prima di scrivere l'Object Guide, non dopo — rischia di essere l'ennesima
"decisione presa a metà". **Sale** non procede a un proprio Object Guide: la sua relazione con
Catalog Entry resta un punto di validazione da segnalare a Federico, non un oggetto da
disegnare.
