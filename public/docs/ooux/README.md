# OOUX / ORCA Pipeline — MAAT

> ⚠️ **Il metodo è passato su una capability su sei.** Questo packet copre **Photo-to-Catalog**,
> completo per tutte e sei le fasi. Contabilità, Logistica e Pubblicazione hanno solo un Round 1
> ([`08`](08-object-map-aree-operative.md)); Home, Onboarding e Impostazioni non hanno nemmeno
> quello. Il piano per chiudere il buco:
> [`HANDOFF-2026-09-02-completamento-ooux.md`](HANDOFF-2026-09-02-completamento-ooux.md).

Bridge **spec MBSE → UI modulare** per il modulo Photo-to-Catalog. Prodotto con la pipeline ORCA (6 fasi) a valle di mbse-to-ooux. Modello OOUX **indipendente dallo stack**: procede verso Stitch anche con WBA gate 4.7 (Pugh matrix) ancora aperto.

## Indice

| # | Fase | File | Cosa contiene |
|---|------|------|---------------|
| 0 | Object Map | [`00-object-map-handoff.md`](00-object-map-handoff.md) | Input canonico (3 oggetti, relazioni, CTA, schermate) da mbse-to-ooux v1.2.0 |
| 1 | MCSFD | [`01-mcsfd.md`](01-mcsfd.md) | Relazioni → requisiti di dato. Split stati FSM-sessione vs status persistito |
| 2 | Object Guide | [`02-object-guide.md`](02-object-guide.md) | Glossario: Catalog Entry vs Inventory Item, Photo, alias da deprecare |
| 3 | Navigation Flow | [`03-nav-flow.md`](03-nav-flow.md) | 2 entry point, 2 tab + FAB, 4 flussi cross-object, view inventory |
| 4 | CTA Matrix | [`04-cta-matrix.md`](04-cta-matrix.md) | 9 CTA × view × stato + gating Confirm |
| 5 | Sketch Brief | [`05-sketch-brief.md`](05-sketch-brief.md) | 13 unità UI, brief azionabili → **input Stitch** |
| 6 | Atomic Bridge | [`06-atomic-bridge.md`](06-atomic-bridge.md) | Atomic Design (6 organismi) + token contract + stack |

## I 3 oggetti

- **Catalog Entry** (primario) — il capo in lavorazione, pre-pubblicazione. Status `local_draft → to_be_reviewed → available`. Al Confirm genera SKU e diventa Inventory Item del sistema vendita.
- **Photo** (nested, slot-driven) — una immagine per label (`fronte*·retro*·brand*·taglia·materiale·extra`). Tipi `standard|aruco`.
- **Notification** (inbox) — deep-link al capo. Tipi `draft_ready|local_save`.

## Decisioni chiave bloccate
1. Stati su **due livelli**: FSM di sessione (transienti) ≠ `status` persistito (3 valori, filtro Lista capi).
2. Confine **Catalog Entry** (pre-conferma, MAAT) vs **Inventory Item** (post-conferma a listino, DirtyTag).
3. Gate Confirm: 3 foto obbligatorie `validated` **AND** i 4 attributi bloccanti
   (`brand` · `tipo capo` · `taglia` · `condizioni`). L'insieme è stato definito il 03/08 e la
   fonte di verità è il trigger `items_status_guard`, non questo documento — vedi
   [`01-mcsfd.md`](01-mcsfd.md) §Gate Confirm.
4. Mono-ruolo Seller (MVP); Admin/Operatore + editor Photoroom + campi custom = post-MVP.

## Stato

| Track | Copertura | Fasi |
|---|---|---|
| **A · Photo-to-Catalog** | 3 oggetti | ✅ 6/6. Il Round 1 in `00` ha un **addendum** (02/09) col contratto vivo: 10 attributi, misure per categoria, 4 stati, 8 label, gate a 3 foto + 4 attributi |
| **B · Aree operative** | 11 oggetti, 3 aree | Round 1 fatto ([`08`](08-object-map-aree-operative.md)), fasi 1-6 da fare |
| **C · Cornice** | Home · Onboarding · Impostazioni · Auth | Nessun Round 1 |

Prossima azione: Track B Fase 1 (MCSFD). Ordine,
context packet e gate in [`HANDOFF-2026-09-02-completamento-ooux.md`](HANDOFF-2026-09-02-completamento-ooux.md).
