---
title: "OOUX Fase 5 — Sketch Brief · Sezione Offerte in Listing Detail"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi estende ListingDetail.tsx
---

# Fase 5 — Sketch Brief · Sezione Offerte in Listing Detail

> Unica view di Offer da progettare in questo giro (Accetta/Rifiuta/Controfferta esistono già).
> Non un brief per una nuova Sheet: un'estensione di `ListingDetail.tsx`, già costruito e reale
> (PR #67, brief `13`).

## Estensione — sezione "Offerte" dentro Listing Detail

**Montaggio:** nessuna nuova Sheet. Una `<section>` in più nel corpo di `ListingDetail.tsx`,
stesso pattern delle sezioni esistenti (Prezzo, Errore, Link esterno, Cronologia — verificate
nel file reale).
**Ruolo:** Seller (invariato, nessuna restrizione su Offer).

### Dove, nell'ordine esistente

`ListingDetail` ha oggi, in ordine: Prezzo → (Errore, se `status='error'`) → Link esterno →
Cronologia minima. La sezione Offerte va **dopo Prezzo**, prima delle altre — un'offerta
pendente è informazione ad alta priorità quanto il prezzo stesso (potrebbe cambiarlo), più
rilevante della cronologia di pubblicazione.

### Contenuto

- **Se ci sono offerte** (0-N su questo `listing.id`): lista compatta, una riga per Offer —
  importo offerto, differenza % dal prezzo di listino (stesso calcolo già in `OfferPopup`,
  `diffPct`), badge stato se non `pending` (accettata/rifiutata/in controfferta/scaduta — la
  riconciliazione a 5 valori di Fase 4)
- **Tap su una riga** → apre `OfferPopup` esistente (stesso componente, `openOffer(offer.id)`
  sul telecomando globale) — **non un secondo modo di risolvere un'offerta**
- **Se zero offerte**: la sezione stessa **non compare** — non è un empty state da mostrare
  attivamente (a differenza di "zero capi collegati" nel Detail Carico, che è uno stato atteso
  da comunicare), è semplicemente niente da vedere. Aggiungere una sezione vuota con un
  messaggio sarebbe rumore per il caso più comune (la maggior parte dei Listing non ha offerte
  pendenti in un dato momento)

### CTA

Nessuna CTA propria in questa sezione — il tap sulla riga è navigazione verso `OfferPopup`, che
porta già le sue 3 CTA (Fase 4). Coerente con "Vedi offerte Listing" della CTA Matrix: è
un'apertura di collezione, non un'azione con effetto diretto.

### Comportamenti

- **Offerte scadute**: se `expired` (Fase 4, valore ancora da aggiungere a `OfferStatus`)
  compare nella lista, mostrata come riga non interattiva (non ha più senso aprire il popup per
  rispondere a un'offerta scaduta) — o esclusa del tutto dalla lista, mostrando solo `pending` e
  gli esiti recenti. **Non deciso qui**: dipende da quanto la riconciliazione di stato (Fase 4)
  viene implementata e se un'offerta scaduta resta visibile come storico o sparisce
- **Ordine**: stesso criterio di `OfferteWidget`, `receivedAt` asc (le più vecchie/urgenti
  prima) — coerenza tra le due liste di Offer nell'app

---

## Input per Fase 6 — spec-to-modular-ui

**Oggetto di questo brief:** nessun oggetto nuovo — estende `ListingDetail` (Listing) con una
sezione che legge `Offer` filtrate per `listing_id`.

**View inventory di questo brief:** 0 nuove Sheet — 1 sezione in un componente esistente.

**Nessun nuovo token** — riusa badge stato Offer (da costruire comunque per la riconciliazione
di Fase 4, indipendentemente da questa sezione) e il pattern riga compatta già visto altrove
(es. righe in `OfferteWidget`).

**Stack tech:** invariato.
**Design anchor:** MP076, `maat-ds/DESIGN.md`.

**Con questo si chiude Fase 5 su Offer.** Prossimo: Fase 6.
