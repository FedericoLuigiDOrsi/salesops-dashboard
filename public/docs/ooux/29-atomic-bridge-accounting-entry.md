---
title: "OOUX Fase 6 — Atomic Bridge · Accounting Entry"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi implementa la cella editabile in Transazioni
---

# Fase 6 — Atomic Bridge · Accounting Entry

> Chiude Round1→Fase6 sul quinto oggetto Track B. Brief deliberatamente corto: la modifica è
> un rename + una cella che diventa editabile, non una nuova gerarchia di componenti.

## Ground-truth check

Rieseguito: frontmatter `07`/`DESIGN.md` coerente, invariato.

---

## Layer 1-2 — non si ripetono

Audit framework e OOUX già chiusi nelle fasi precedenti (`16`, `22`-`24`, `28`). Nessuna
relazione nuova da mappare in questo giro.

---

## Layer 3 — Atomic Design

**Nessun atomo/molecola/organismo nuovo.** La modifica è a un componente esistente: la cella
`shippingCostCents` nella tabella Transazioni (già una `<span>` con `formatEUR`), che diventa un
input numerico inline al posto del testo statico.

**Riuso, non nuovo componente**: la logica di parsing (virgola come decimale, conversione in
centesimi) già esiste in `PriceMarginCard.tsx` (`parseEuroInput`). Non riusare l'intero
componente (`PriceMarginCard` è una card a due campi con margine calcolato, sovradimensionata
per una singola cella) — riusare solo la funzione di parsing, o una sua estrazione condivisa se
serve altrove in futuro. Non deciso qui se estrarla in un utility comune: dipende da quante
altre celle editabili in valuta emergeranno, e oggi ne esiste solo questa.

---

## Layer 4 — Design Token Contract

**Nessuna estensione.** Rename di campo (`shippingCostCents` → `sellerCostsCents`), non un
nuovo enum, non un nuovo colore semantico. L'input riusa lo stile esistente per i campi numerici
in valuta (già visto in `PriceMarginCard`).

---

## Layer 5 — JTBD

Non necessario per una singola cella editabile — non c'è uno stadio multi-fase da mappare.

---

## Pipeline spec→build e prossimi passi

1. Rename `shippingCostCents` → `sellerCostsCents` nel tipo `AccountingEntry` e ovunque
   referenziato (formula `netAmountCents`, sort key, colonna tabella).
2. Sostituire lo `<span>` di quella cella con un input numerico inline (pattern parsing da
   `PriceMarginCard.parseEuroInput`, non l'intero componente).
3. Verificare che il ricalcolo di `netAmountCents` avvenga on-change, non solo al salvataggio.

---

## Stato pipeline Track B — Accounting Entry COMPLETO (Round 1 + 6/6)

| Fase | Deliverable | File |
|---|---|---|
| R1 | Object Map | `08-object-map-aree-operative.md` |
| 1 | MCSFD (2° giro) | `16-mcsfd-round2-aree-operative.md` |
| 2 | Object Guide | `22-object-guide-accounting-entry-lot.md` |
| 3 | Navigation Flow | `23-nav-flow-accounting-entry-lot.md` |
| 4 | CTA Matrix | `24-cta-matrix-accounting-lot.md` |
| 5 | Sketch Brief | `28-sketch-brief-modifica-costi-seller.md` |
| 6 | Atomic Bridge | `29-atomic-bridge-accounting-entry.md` (questo file) |

**Track B oggetti completi Round1→Fase6**: Listing, Shipment, Marketplace Account, Lot,
**Accounting Entry** (5/11). Sale, Supplier, Offer mai toccati. Publish Strategy fuori MVP per
decisione. Track C non iniziato.
