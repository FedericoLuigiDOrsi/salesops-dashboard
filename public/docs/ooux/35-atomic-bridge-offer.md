---
title: "OOUX Fase 6 — Atomic Bridge · Offer"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi estende ListingDetail.tsx con la sezione Offerte
---

# Fase 6 — Atomic Bridge · Offer

> Chiude Round1→Fase6 sul sesto oggetto Track B. Ground-truth check rieseguito, coerente
> (invariato dalla Fase 6 precedente).

---

## Layer 1-2 — non si ripetono

Già chiusi (`30`-`34`).

---

## Layer 3 — Atomic Design

### Decisione: `OfferStatus` USA `StatusPill`

A differenza di `Lot.type` (descrittivo, Fase 6 precedente → `Badge` neutro), `OfferStatus` è
**valutativo**: `accepted` è un successo, `rejected` un fallimento, `expired` una scadenza
mancata, `countered` uno stato intermedio attivo. Stesso profilo di `MarketplaceAccount.status`,
che già usa `StatusPill`.

**Decisione presa**: `OfferStatusBadge`, istanza di `StatusPill<OfferStatus>` (il primitivo
esiste già dalla Fase 6 di Marketplace Account — **seconda istanza**, non un nuovo primitivo).
Config: `pending`→neutro (nessun tono, è lo stato di attesa) · `accepted`→`success` ·
`rejected`→`danger` · `countered`→`accent` (fluo, "richiede attenzione/azione") ·
`expired`→`neutral`.

### Token → Atomi → Molecole → Organismi

**ATOMI**
| Atomo | Deriva da | Note |
|---|---|---|
| `OfferStatusBadge` | `Offer.status` | Istanza di `StatusPill<OfferStatus>` — riuso del primitivo, non nuovo componente da zero |

**MOLECOLE nuove (1)**
| Molecola | Composizione | Note |
|---|---|---|
| `OfferRow` | `OfferStatusBadge` + importo + diff% | Riga compatta per la sezione Offerte in ListingDetail. **Non riusa** la card di `OfferteWidget` (quella è per Home, più ricca — foto, marketplace, tempo relativo; questa è più densa, in un contesto che già sa il marketplace e il capo dal parent) |

**ORGANISMI**: nessuno nuovo — estende `ListingDetail` (esistente) con la sezione.

---

## Layer 4 — Design Token Contract

```jsonc
// Estensione al contratto token
{
  "offerStatus": {                 // Offer.status → OfferStatusBadge (StatusPill)
    "pending":   "neutral",         // nessun tono — stato di attesa, non un esito
    "accepted":  "success",
    "rejected":  "danger",
    "countered": "accent",          // fluo — richiede una risposta, non solo informativo
    "expired":   "neutral"
  }
}
```

**Catena**: `Offer.status` (5 valori, Fase 1 3° giro) → prop `status` di `OfferStatusBadge` →
`tone` → token esistenti. Nessun nuovo colore introdotto — quarto oggetto di fila (dopo
Marketplace Account, Lot, Accounting Entry) che non richiede token nuovi, solo riuso.

---

## Layer 5 — JTBD

Non necessario — nessun nuovo stadio multi-fase, è un'estensione puntuale di una view esistente.

---

## Pipeline spec→build e prossimi passi

1. Rinominare `OfferStatus`: aggiungere `expired`, `counter` → `countered`.
2. Costruire `OfferStatusBadge` come istanza di `StatusPill`.
3. Costruire `OfferRow` (molecola nuova, minima).
4. Estendere `ListingDetail.tsx` con la sezione Offerte (brief `34`), dopo Prezzo.
5. **Decisione ancora aperta** (Fase 5, non presa): comportamento delle offerte `expired` nella
   lista — riga non interattiva o esclusa.

---

## Stato pipeline Track B — Offer COMPLETO (Round 1 + 6/6)

| Fase | Deliverable | File |
|---|---|---|
| R1 | Object Map | `08-object-map-aree-operative.md` |
| 1 | MCSFD (3° giro) | `30-mcsfd-round3-aree-operative.md` |
| 2 | Object Guide | `31-object-guide-offer.md` |
| 3 | Navigation Flow | `32-nav-flow-offer.md` |
| 4 | CTA Matrix | `33-cta-matrix-offer.md` |
| 5 | Sketch Brief | `34-sketch-brief-offerte-in-listing-detail.md` |
| 6 | Atomic Bridge | `35-atomic-bridge-offer.md` (questo file) |

**Track B oggetti completi Round1→Fase6**: Listing, Shipment, Marketplace Account, Lot,
Accounting Entry, **Offer** (6/11). Restano: Supplier (decisione di design aperta, poi fasi 2-6),
Sale (nessun Object Guide, solo punto di validazione). Publish Strategy fuori MVP per decisione.
Track C non iniziato.
