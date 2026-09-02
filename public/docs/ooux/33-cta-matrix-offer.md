---
title: "OOUX Fase 4 — CTA Matrix · Offer"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi tocca OfferPopup o estende Listing Detail
---

# Fase 4 — CTA Matrix · Offer

> Le prime tre CTA sono già reali, verificate in `OfferPopup.tsx` — questa fase le formalizza.
> La quarta (Vedi offerte da Listing Detail) è nuova, confermata da Federico dopo la proposta di
> Fase 3.

## Matrice principale

| CTA | Oggetto | Ruolo | View | Priorità | Effetto |
|---|---|---|---|---|---|
| Accetta Offer | Offer | Seller | OfferPopup | Primaria | `status: pending → accepted` |
| Rifiuta Offer ⚠️ | Offer | Seller | OfferPopup | Secondaria | `status: pending → rejected` — **nessuna conferma oggi**, nonostante sia distruttiva (verificato nel codice, non deciso se cambiare) |
| Controfferta Offer | Offer | Seller | OfferPopup | Secondaria | Apre input inline → `Invia controfferta`: `status: pending → countered` |
| Vedi offerte Listing | Offer (collezione) | Seller | Listing Detail | Secondaria | Apre lista offerte del Listing corrente — nessun cambio di stato, è navigazione verso `OfferPopup` per ciascuna |

**Non aggiunta come riga a sé**: "Annulla" (dentro il modo controfferta) — è un back/cancel
nella stessa view, non un'azione con effetto su Offer.

**Non aggiunta**: "Vai all'annuncio" (link esterno al marketplace) — non è un'azione su Offer,
è navigazione fuori da MAAT (già escluso in Fase 3).

---

## CTA per oggetto (view design reference)

### Offer

**Lista globale (OfferteWidget, Home)**
- Nessuna CTA diretta sulla card — il tap apre `OfferPopup` (navigazione, non CTA a sé)

**Detail (OfferPopup)**
- `Accetta Offer` — Seller — Primaria
- `Controfferta Offer` — Seller — Secondaria
- `Rifiuta Offer` ⚠️ — Seller — Secondaria (distruttiva)

**Card (in contesto Listing Detail)** *(nuovo, da questo giro)*
- `Vedi offerte Listing` — Seller — Secondaria — non è propriamente una CTA "su" un'Offer
  specifica, è l'ingresso alla collezione. Ogni riga della lista risultante apre lo stesso
  `OfferPopup` con le sue 3 CTA — non ne servono di nuove

---

## Flussi scatenati da CTA

### Flusso: Rispondere a un'offerta
Trigger: `Accetta Offer` / `Rifiuta Offer` / `Controfferta Offer` su `OfferPopup`
Steps: apertura popup (da Home, Notifiche, o ora anche da Listing Detail) → scelta → chiusura
Oggetti coinvolti: Offer
Transizioni di stato: `pending → accepted` / `pending → rejected` / `pending → countered`
⚠️ **Non mappato in nessuna fase**: cosa succede dopo `accepted`? La relazione verso Sale
resta segnalata e non verificata (Fase 2) — questo flusso si ferma al cambio di stato
dell'Offer, non prosegue verso una vendita effettiva nel modello attuale.

### Flusso: Consultare le offerte di un annuncio
Trigger: `Vedi offerte Listing` da Listing Detail
Steps: Listing Detail → sezione Offerte (lista, 0-N righe) → tap riga → `OfferPopup` (stesso
componente, nessuna duplicazione)
Oggetti coinvolti: Listing (letto) · Offer (letti, poi eventualmente risolti)
Transizioni di stato: nessuna nel flusso di apertura — le transizioni avvengono dentro
`OfferPopup`, già coperte sopra

---

## Sintesi per priorità

**CTA primarie MVP** (devono esserci nel Day 1):
- Accetta Offer, Rifiuta Offer, Controfferta Offer — **già esistono**, non c'è nulla da
  costruire per l'MVP su queste tre

**CTA secondarie** (Phase 2):
- Vedi offerte Listing — nuova, migliora la scopribilità ma non blocca la risoluzione di
  un'offerta (che funziona già da Home/Notifiche)

**CTA da validare** (non certe — richiedono decisione, non solo design):
- `Rifiuta Offer` senza conferma ⚠️ — è così oggi, ma è una CTA distruttiva senza il pattern di
  conferma che le altre distruttive di Track B hanno (es. Scollega Marketplace Account). Non
  deciso se allinearla o se è una scelta consapevole per ridurre l'attrito su un'azione frequente

---

## Prossimo step → Fase 5

Input per Sketch Brief: **una sola view nuova**, la sezione Offerte in Listing Detail (lista
compatta, 0-N righe, ogni riga apre `OfferPopup` esistente). `OfferPopup` stesso non ha bisogno
di un brief — è già costruito e funzionante, questa fase lo ha solo formalizzato.
