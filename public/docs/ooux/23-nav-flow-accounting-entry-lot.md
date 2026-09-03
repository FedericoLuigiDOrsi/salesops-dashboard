---
title: "OOUX Fase 3 — Navigation Flow · Accounting Entry e Lot"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi disegna la Fase 5 (Sketch Brief) per Contabilità
---

# Fase 3 — Navigation Flow · Accounting Entry e Lot

> Il gap vero non è un entry point mancante — Contabilità esiste già e ospita entrambi gli
> oggetti. Il gap è un **ponte**: cosa succede dopo che un Carico è stato registrato.

## Entry Point

1. **Contabilità** *(esistente, riusato — non nuovo)* — unico entry point per entrambi gli
   oggetti. Accounting Entry ci vive come sezione transazioni (oggi su mock); Lot/Carico ci vive
   come sezione "Fornitori e Storico carichi", già separata dal filtro temporale delle vendite
   (commento nel codice: sono acquisto, non vendita). Nessun nuovo entry point top-level:
   spostarli altrove sarebbe disfare una IA che già funziona.

> Ammesso alla luce di Fase 1, 2° giro: Contabilità è Admin-only a livello RLS — questo entry
> point non compare per un Operator, non solo per scelta di nav ma per query bloccata a monte.

---

## Grafo di navigazione

```
[Contabilità]  (Admin-only)
│
├── Sezione Transazioni (Accounting Entry)
│     tabella, sort per colonna, filtro `period` (giorni)
│     ├── riga vendita ──► (NUOVO) modifica costi seller inline
│     │        campo `sellerCostsCents` — manuale, opzionale, stesso pattern di
│     │        `purchasePriceCents` su Catalog Entry (Track A)
│     └── badge stato: in attesa · finalizzato · in disputa ⚠️ (nuovo, Fase 2)
│              nessuna azione sul badge "in disputa" — solo visibilità onesta
│
└── Sezione Fornitori e Storico carichi (Lot)
      ├── CTA "Registra Carico" (esistente) ──► RegistraCaricoDialog (esistente)
      │        nome · tipo · quantità · categoria · fornitore · prezzo · data
      │        └── submit ──► Carico creato
      │              └── (NUOVO) "Aggiungi capi ora?"
      │                    ├── Sì ──► Acquisizione foto (Track A, stessa pipeline)
      │                    │        con lot_id fissato per tutta la sessione
      │                    │        └── Confirm capo ──► "Aggiungi un altro a
      │                    │              questo Carico?"
      │                    │              ├── Sì ──► torna ad Acquisizione (stesso lot_id)
      │                    │              └── No ──► torna al Carico, riepilogo N capi
      │                    └── No ──► Carico resta a 0 capi collegati, si
      │                          può riprendere più tardi (vedi sotto)
      │
      └── riga Carico esistente (tabella Storico carichi)
            ├── tap ──► (NUOVO) Detail Carico — GAP, non esiste oggi
            │        mostra i capi già collegati (0 o più) + CTA "Aggiungi capi"
            │        per riprendere il loop in un secondo momento
            └── (NUOVO, dal lato capo) da Track A: durante Review/Dettaglio capo,
                  CTA "Assegna a un Carico" — percorso indipendente dal loop bulk,
                  per un capo già catalogato che si vuole collegare a un lotto
                  a posteriori (Federico, grill-me: "ci deve essere possibilità
                  di associare i prodotti a un lotto singolo")
```

**Due percorsi per lo stesso collegamento, non uno**: il loop bulk (capo nuovo, nasce già
taggato) e l'assegnazione a posteriori (capo esistente, si aggiunge il tag dopo). Federico li ha
chiesti entrambi esplicitamente — non sono ridondanti, coprono due momenti diversi.

---

## View inventory

### Accounting Entry

- **Lista globale** — la sezione Transazioni esistente. Sort: per colonna (già implementato,
  incluso un rank custom per "Stato"). Filtri: `period` (esistente) + eventualmente per `status`
  una volta che include `disputed` (Fase 2) — non ancora specificato se serve un filtro dedicato
  o basta il badge visibile.
- **Card (inline)** — riga di tabella, non una card separata: brand+capo · marketplace · importo
  · badge stato.
- **Detail**: non un Detail a sé — l'unica azione nuova (editare `sellerCostsCents`) può vivere
  inline sulla riga o in un piccolo popover, coerente con quanto poco contenuto ha in più
  rispetto a oggi. Se in Fase 5 risultasse che serve più spazio, si riconsidera.
- **Empty state**: nessuna vendita nel periodo selezionato — messaggio + eventualmente CTA per
  allargare il periodo. Non è un empty state "vero" (zero vendite in assoluto) diverso da "zero
  vendite in questi 30 giorni" — da distinguere in Fase 5 se serve.

### Lot (Carico)

- **Lista globale** — la sezione "Storico carichi" esistente. Nessun sort/filtro noto oltre
  quanto già implementato (verificare in Fase 5 se serve altro).
- **Card (inline)** — riga della tabella storico: nome/codice · tipo · quantità · fornitore ·
  costo.
- **Detail** — ⚠️ **non esiste oggi**, e questa fase lo dichiara necessario: senza, non c'è dove
  vedere quali capi sono collegati a un Carico né dove riprendere il loop di aggiunta se
  interrotto. Sezioni attese: dati del Carico (già in `RegistraCaricoDialog`, qui in sola
  lettura) + lista capi collegati (0 o più, con link al Dettaglio capo di ciascuno) + CTA
  "Aggiungi capi".
- **Empty state**: nessun Carico registrato ancora — messaggio + CTA "Registra Carico" (già
  esiste come pattern, solo da confermare come empty state formale).

---

## Flussi cross-object

### Registrare un carico e caricare i capi in blocco
Job: "Quando il Seller ha appena comprato un lotto di capi, vuole registrarlo e iniziare subito
a catalogarli senza dover ripetere dati comuni (fornitore, data) per ognuno."
Path: Contabilità → "Registra Carico" → RegistraCaricoDialog → submit → "Aggiungi capi ora?" →
Sì → Acquisizione foto (Track A) con `lot_id` fisso → Confirm → "Un altro?" → loop finché "No" →
torna al Carico
Oggetti coinvolti: Lot (creato) · Catalog Entry (N creati, ognuno con `lot_id` valorizzato)
Transizioni di stato: nessuna sul Lot stesso (non ha uno stato di avanzamento nel canonico) — il
"progresso" è implicito nel numero di capi collegati, non un campo

### Assegnare un capo esistente a un Carico
Job: "Quando il Seller si accorge che un capo già catalogato viene da un lotto che ha appena
registrato (o dimenticato di taggare), vuole collegarlo senza ricatalogarlo."
Path: Dettaglio capo (Track A, esistente) → CTA "Assegna a un Carico" (NUOVA) → selezione da
lista Carichi esistenti → conferma
Oggetti coinvolti: Catalog Entry (aggiornato, `lot_id` valorizzato) · Lot (invariato)
Transizioni di stato: `Catalog Entry.lot_id: null → <id>`

### Registrare un costo extra su una vendita
Job: "Quando il Seller ha dovuto pagare di tasca sua la spedizione (marketplace senza
integrazione) o del packaging, vuole che il margine netto lo rifletta."
Path: Contabilità → riga vendita → modifica inline `sellerCostsCents` → salva
Oggetti coinvolti: Accounting Entry (o Sale, secondo dove finisce il campo — non deciso in
questa fase, era aperto anche in Fase 2)
Transizioni di stato: nessuna — è un campo, non uno stato

---

## Prossimo step → Fase 4

Input per CTA Matrix: **Lot** con le CTA più numerose di questo giro (Registra Carico —
esistente, Aggiungi capi — nuova, Assegna a un Carico — nuova) e **Accounting Entry** con una
sola CTA nuova (modifica costi seller). Il Detail Carico (nuovo) è la view con più contenuto da
disegnare in Fase 5.
