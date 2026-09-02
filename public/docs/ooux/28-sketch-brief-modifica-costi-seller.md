---
title: "OOUX Fase 5 — Sketch Brief · Modifica costi seller (Accounting Entry)"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi implementa la modifica sulla tabella Transazioni
---

# Fase 5 — Sketch Brief · Modifica costi seller

> Unica view di Accounting Entry (Fase 3 aveva già escluso un Detail a sé — una sola CTA inline
> non lo giustifica). Brief volutamente piccolo: è un campo su una riga esistente, non una
> schermata nuova.

## Correzione rispetto a Fase 2

Fase 2 (`22`) proponeva un campo **nuovo**, `sellerCostsCents`. Verificato nel codice prima di
scrivere questo brief: **il campo esiste già**. La tabella Transazioni ha una colonna
`shippingCostCents` — sort key propria, mostrata in ogni riga (dedotta in rosso), già dentro il
calcolo di `netAmountCents`. È **read-only** (uno `<span>`, non un input), ma la colonna, il dato
e il calcolo ci sono.

Non è un campo da costruire da zero: è un campo esistente da **rendere editabile** e — coerente
con la decisione del 02/09 (copre spedizione+packaging+omaggi, non solo spedizione) — da
**rinominare**. Tenere il nome `shippingCostCents` mentirebbe sullo scopo reale, stesso
ragionamento già fatto in Fase 2. Proposta: rinominarlo in `sellerCostsCents` mantenendo
posizione, sort key e formula invariati — un rename, non una ristrutturazione.

---

## Modifica — riga Transazione (Accounting Entry)

**Montaggio:** nessuna nuova view. La cella esistente nella riga della tabella Transazioni passa
da testo a campo modificabile (inline edit, click-to-edit o icona matita — dettaglio di
implementazione, non deciso qui).
**Ruolo:** **Admin** (Contabilità è Admin-only, Fase 1 2° giro) — a differenza di tutte le altre
CTA di questo giro di lavoro (Lot, Marketplace Account), che sono Seller.

### Cosa cambia

- La cella `shippingCostCents` (rinominata `sellerCostsCents`) diventa editabile inline
- Il resto della riga resta invariato: `grossAmountCents`, `platformFeeCents`,
  `netAmountCents` restano calcolati/read-only — solo questo campo è manuale
- `netAmountCents` si ricalcola automaticamente quando il valore cambia (la formula esiste già:
  `gross − fee − shipping`, qui `shipping` diventa `sellerCosts`)

### CTA

| CTA | Posizione | Ruolo | Stato oggetto richiesto |
|---|---|---|---|
| Modifica costi Accounting Entry | Cella riga, inline | Admin | Sempre — il campo è opzionale, può restare a 0 |

### Comportamenti

- **Valore di default**: 0 (come oggi) — non tutte le vendite hanno costi extra (Vinted ha
  spedizione integrata, altri marketplace no — Fase 1 2° giro).
- **Nessuna conferma richiesta**: non è un'azione distruttiva, è l'aggiornamento di un numero.
- **Permessi**: nessuna vista per un Operator — l'intera riga, non solo questa cella, è dietro
  l'Admin-only RLS già esistente.

---

## Input per Fase 6 — spec-to-modular-ui

**Oggetto di questo brief:** Accounting Entry — un solo campo, `sellerCostsCents` (rename di
`shippingCostCents`), da read-only a editabile.

**View inventory di questo brief:** 0 nuove view — 1 modifica a un componente esistente (cella
tabella).

**Nessun nuovo token, nessun nuovo componente atomico** — riusa l'input numerico già nello
stile del design system (coerente con altri campi manuali come `purchasePriceCents`).

**Stack tech:** invariato.
**Design anchor:** MP076, `maat-ds/DESIGN.md`.

**Con questo si chiude anche Fase 5 su Accounting Entry** — nessun'altra view pendente per
questo oggetto in questo giro di lavoro.
