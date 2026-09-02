---
title: "OOUX Fase 6 — Atomic Bridge + Token Contract · Lot"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi implementa Detail Carico e l'estensione di NuovoCapoForm
---

# Fase 6 — Atomic Bridge · Lot

> Chiude Round1→Fase6 su Lot (quarto oggetto Track B, dopo Listing/Shipment/Marketplace
> Account). Stack lockato: token reali.

## Ground-truth check

Rieseguito: frontmatter di `07-design-anchor-p2c.md` (`superseded`) e `maat-ds/DESIGN.md`
(`locked`) confermato coerente, invariato.

---

## Layer 1 — Audit dei framework attivi (per questa view)

| Layer | Framework | Stato | Output |
|---|---|---|---|
| Object Map | Round 1 Track B | ✅ | `08-object-map-aree-operative.md` |
| Requirements | Fase 1, 1° giro | ✅ | `09-mcsfd-aree-operative.md` |
| Glossario | Fase 2 | ✅ | `22-object-guide-accounting-entry-lot.md` |
| Navigation | Fase 3 | ✅ | `23-nav-flow-accounting-entry-lot.md` |
| Azioni | Fase 4 | ✅ | `24-cta-matrix-accounting-lot.md` |
| Spec view | Fase 5 | ✅ (2 view: Detail + estensione form) | `25` + `26` |
| **Atomic Design** | *questo doc* | 🔨 in produzione | §3 |
| **Token contract** | *questo doc* | 🔨 in produzione | §4 |

**Buco non chiuso qui**: la posizione esatta del prompt "un altro?" dentro il flusso di Review
(Track A) resta da decidere in implementazione — Fase 5 (26) l'ha segnalato, non risolto.

---

## Layer 2 — OOUX (già completo, non si ripete)

Round 1 + Fasi 1-5 chiuse su Lot. Non si ripete qui.

---

## Layer 3 — Atomic Design

### Decisione: `type` (pezzo/ingrosso) NON usa StatusPill

`per_listing_status` e `MarketplaceAccount.status` sono **valutativi**: dicono se qualcosa va
bene o male (attivo/errore/in attesa). `Lot.type` è **descrittivo**: dice solo a quale delle due
categorie appartiene un Carico, senza nessuna delle due essere "meglio". Il pattern
`StatusPill<T>` esiste per mappare stati a un tono semantico (successo/attenzione/pericolo/
neutro) — forzarlo su `type` significherebbe assegnare un tono a qualcosa che non ne ha uno, o
usarlo sempre con lo stesso tono neutro, il che è solo un `Badge` con passi in più.

**Decisione presa**: `Badge` shadcn semplice (`variant="secondary"`), nessun componente nuovo,
nessuna istanza di `StatusPill`. Non ogni enum è uno stato — questa è la distinzione che
giustifica di non generalizzare qui, dopo aver generalizzato per Marketplace Account.

### Token → Atomi → Molecole → Organismi

**ATOMI**: nessuno nuovo. `Badge` (shadcn, esistente) per `type`.

**MOLECOLE nuove (1)**
| Molecola | Composizione | Note |
|---|---|---|
| `LotContextBanner` | Testo (`code`/`name` + `supplierName`) | Header contestuale in `NuovoCapoForm` quando `lot_id` è presente — "Aggiungendo a: CAR-0142 — Fornitore X" |

**MOLECOLE riusate**: card capo (stessa card compatta già usata altrove per Catalog Entry in
lista, riusata nella sezione "Capi collegati" del Detail Carico).

**ORGANISMI**
| Organismo | Vista di | Composto da | Copre |
|---|---|---|---|
| `LotDetail` | Lot | `Sheet` + dati read-only + lista capi (card riusate) + CTA | brief `25` |
| `NuovoCapoForm` (esteso) | Catalog Entry, con contesto Lot | **Esistente**, + `LotContextBanner` + payload `lot_id` + step di loop dopo Review | brief `26` — non un organismo nuovo, un'estensione |

---

## Layer 4 — Design Token Contract

**Nessun nuovo token colore.** A differenza di Listing (2 `--channel-*`) e Marketplace Account
(0, riusa token esistenti), Lot non introduce nessun vocabolario di stato — `type` usa il
`Badge` neutro di default del design system, `Lot` non ha altri enum da mappare a token.

```jsonc
// Nessuna estensione al contratto token per questo brief
```

**Catena che chiude il cerchio**: `Lot.type` (enum, Fase 1) → prop `type` di `Badge` → nessun
token, il `Badge` neutro non ha varianti semantiche da scegliere.

**Payload esteso, non un token**: `createItem` (chiamata esistente in `NuovoCapoForm`) riceve
`lot_id` in più — è un campo dati, non un token di design.

---

## Layer 5 — JTBD

Job: *"Quando il Seller ha appena comprato un lotto, vuole passare dal registrarlo al vedere i
primi capi già a catalogo nel minor numero di passaggi possibile."*

| Stadio | Primo piano | Organismo | CTA dominante |
|---|---|---|---|
| 1. Lotto appena comprato | dati del Carico da registrare | `RegistraCaricoDialog` (esistente) | Registra Carico |
| 2. Deciso di iniziare subito | contesto Carico ben visibile | `NuovoCapoForm` esteso | Crea capo (da Carico) |
| 3. Un capo confermato | la domanda "un altro?" | (step dopo Review) | Aggiungi un altro / Fatto per ora |
| 4. Ripreso più tardi | quanti capi già collegati | `LotDetail` | Crea capo (da Carico) |

---

## Stack raccomandato

Nessuna aggiunta — tutto additivo su componenti esistenti (`Sheet`, `Badge`, `NuovoCapoForm`).

---

## Pipeline spec→build e prossimi passi

1. Migrazione: `items.lot_id uuid null references lots(id)`.
2. Estendere `createItem`/`NuovoCapoForm` con `lot_id` nel payload + `LotContextBanner`.
3. Decidere in implementazione (non qui) dove si innesta lo step "un altro?" dentro il flusso
   Review esistente.
4. Costruire `LotDetail` (Sheet, sul brief `25`).
5. **Accounting Entry resta a Fase 4** — nessun brief scritto per "Modifica costi", da valutare
   se ne serve uno a sé o basta la nota inline già in `24`.

---

## Stato pipeline Track B — Lot COMPLETO (Round 1 + 6/6)

| Fase | Deliverable | File |
|---|---|---|
| R1 | Object Map | `08-object-map-aree-operative.md` |
| 1 | MCSFD | `09-mcsfd-aree-operative.md` |
| 2 | Object Guide | `22-object-guide-accounting-entry-lot.md` |
| 3 | Navigation Flow | `23-nav-flow-accounting-entry-lot.md` |
| 4 | CTA Matrix | `24-cta-matrix-accounting-lot.md` |
| 5 | Sketch Brief | `25` + `26` |
| 6 | Atomic Bridge + Token | `27-atomic-bridge-lot.md` (questo file) |

**Track B oggetti completi Round1→Fase6**: Listing, Shipment, Marketplace Account, **Lot**
(4/11). Accounting Entry resta a Fase 4. Sale, Supplier, Offer mai toccati. Publish Strategy
fuori MVP per decisione. Track C non iniziato.
