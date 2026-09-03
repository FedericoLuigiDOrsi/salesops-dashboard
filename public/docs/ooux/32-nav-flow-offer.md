---
title: "OOUX Fase 3 — Navigation Flow · Offer"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi disegna la Fase 5 (Sketch Brief) se emergono nuove view
---

# Fase 3 — Navigation Flow · Offer

> Conferma di una struttura che esiste già, non progettazione da zero (Fase 2 lo aveva
> anticipato). Un'unica proposta di estensione, verificata come genuinamente assente.

## Entry Point

1. **Home** *(esistente)* — `OfferteWidget` aggrega tutte le offerte pendenti, ordinate
   `receivedAt` asc (le più vecchie prima).
2. **Notifiche** *(esistente)* — `NotificationInboxContent`, tap su una notifica di tipo offerta.

Entrambi chiamano lo stesso `openOffer(offerId)` sul context globale "telecomando"
(`overlays-store`), che monta `OfferPopup` via `OverlayHost` — **verificato nel codice**: sono
gli unici due punti di ingresso reali, nessun terzo trovato.

> Nessun nuovo entry point top-level proposto: Offer non ha bisogno di una propria voce di nav,
> coerente col criterio "oggetto senza contesto parent" già applicato a Marketplace Account.

---

## Grafo di navigazione

```
[Home] ── OfferteWidget ──► tap offerta ──► openOffer(id) ──► OfferPopup (overlay globale)
[Notifiche] ── tap notifica offerta ──► openOffer(id) ──► OfferPopup (stesso overlay)

OfferPopup:
  ├── Accetta ──► status: pending → accepted
  ├── Rifiuta ──► status: pending → rejected  (nessuna conferma oggi, Fase 2)
  ├── Controfferta ──► input inline ──► Invia controfferta ──► status: pending → countered
  │                                  └── Annulla ──► torna alle 3 CTA
  └── "Vai all'annuncio" ──► link esterno al Listing sul marketplace (non naviga dentro MAAT)

[Listing Detail] (Track B, già costruito — PR #67)
  └── ⚠️ GAP verificato: nessun riferimento a Offer nel componente reale
       (grep su ListingDetail.tsx: zero risultati). Nessuna vista mostra
       "le offerte ricevute su QUESTO annuncio" isolate dalle altre.
```

---

## View inventory

### Offer

- **Lista globale** — `OfferteWidget` (Home), esistente. Sort: `receivedAt` asc (Fase 1 3° giro).
  Filtro: nessuno esplicito, solo conteggio `pendingCount` per badge.
- **Card (inline)** — riga nel widget, esistente.
- **Detail** — `OfferPopup`, esistente. Non un "Detail" nel senso classico (non è una pagina, è
  un overlay di risoluzione), ma copre lo stesso ruolo: tutti gli attributi + CTA complete.
- **Empty state**: nessuna offerta pendente — non verificato in questo giro se `OfferteWidget`
  ha già un messaggio per questo caso (probabile, dato quanto è maturo il componente) o se va
  aggiunto: fuori scope di una Navigation Flow, verificabile in Fase 5 se si tocca il widget.

---

## Proposta di estensione (non richiesta da nessuna fase precedente)

**Sezione "Offerte" in Listing Detail** — bassa priorità, non bloccante. Mostrerebbe le offerte
ricevute su quel Listing specifico (0 o più), riusando `OfferPopup` per la risoluzione invece di
duplicare la UI. Motivazione: oggi l'unico modo di trovare le offerte di un annuncio specifico è
scorrere Home o Notifiche cercandolo — funziona con poche offerte, non scala.

**Non aggiunta al CTA Matrix di Offer** (Fase 4 non è ancora stata fatta su questo giro) finché
Federico non conferma che vale la pena costruirla: è un miglioramento navigazionale, non un gap
che blocca nessun flusso esistente.

---

## Prossimo step → Fase 4

Input per CTA Matrix: **Offer** con le 3 CTA già note e verificate (Accetta · Rifiuta ·
Controfferta), più la domanda aperta sopra (sezione Offerte in Listing Detail: sì o no) da
risolvere prima o insieme alla Fase 4.
