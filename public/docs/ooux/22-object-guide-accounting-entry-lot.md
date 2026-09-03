---
title: "OOUX Fase 2 — Object Guide · Accounting Entry e Lot"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi disegna la Fase 3 (Navigation Flow) su questi due oggetti
---

# Fase 2 — Object Guide · Accounting Entry e Lot

> Due oggetti sbloccati dalle decisioni del 02/09 (grill-me, PR #68). Entrambi legati a
> Contabilità, ma con vincoli di ruolo diversi — non trattarli come pari.

## Accounting Entry

**Alias da deprecare:** nessuno trovato in conflitto — il termine "movimento contabile" o
"transazione" può comparire in copy italiano, ma non c'è un secondo nome tecnico già in uso da
correggere.

**Definizione:**
Un Accounting Entry è la registrazione di **un evento di denaro** legato a una vendita, nel
sistema contabile di MAAT. Si distingue dalla Sale perché la Sale è "questo capo è stato
venduto"; l'Accounting Entry è "questo movimento di denaro è successo" — nella decisione presa
il 02/09, i due coincidono quasi sempre 1:1 (una riga aggregata per vendita, non spezzata in
commissione/IVA separate), ma restano concettualmente oggetti diversi: uno è l'evento
commerciale, l'altro la sua rappresentazione contabile.

**Esempi:**
- Una vendita da 89€ su Vinted, commissione e IVA trattenute dalla piattaforma: una riga,
  importo netto, stato "in attesa" finché non passano i 14 giorni di escrow
- La stessa vendita, 15 giorni dopo: stato "finalizzato" — stesso Accounting Entry, stato
  aggiornato, non una riga nuova
- Una vendita contestata dal compratore: stato "in disputa" — visibile come bandierina, senza
  che esista ancora uno strumento per gestirla attivamente (deciso fuori MVP)

**Tipi:**
Nessun sottotipo esposto in UI (deciso 02/09: `type` resta sempre aggregato come "vendita",
anche se il canonico distingue internamente sale/commission/vat/refund/adjustment). Se in futuro
un obbligo fiscale reale imporrà di isolare l'IVA, questa sezione andrà riaperta — non è
un'ipotesi da disegnare ora.

**Note per il team dev:**
- **Contabilità è Admin-only a livello database** (RLS, REQ-512), non solo nascosta in UI — un
  Operator non la vede nemmeno interrogando l'API direttamente. Diverso dal resto del catalogo,
  dove Admin e Operator hanno pari capacità.
- Il campo `status` di questo oggetto **non condivide vocabolario** con nessun altro status già
  documentato in Track B (non è `per_listing_status`, non è `CatalogEntryStatus`): i suoi valori
  sono `in attesa · finalizzato · in disputa`, derivati da `settlement_ledger.state`.
- **Attributo deciso il 02/09**: un costo a carico del venditore, manuale, unico per vendita —
  copre spedizione (sui marketplace senza integrazione: Catawiki, eBay, Depop, Grailed),
  packaging, omaggi. Nome canonico proposto in questa fase: **`sellerCostsCents`** (non
  "shippingCostCents" — il nome vecchio mentirebbe, dato che copre più di una voce). Stesso
  pattern UI di `purchasePriceCents` su Catalog Entry: un campo, non tre.
  ⚠️ **Correzione Fase 5 (`28-sketch-brief-modifica-costi-seller.md`)**: non è un campo da
  costruire da zero — `shippingCostCents` esiste già nella tabella Transazioni (colonna, sort
  key, dentro il calcolo di `netAmountCents`), solo read-only. È un **rename + renderlo
  editabile**, non un componente nuovo.

---

## Lot

**Alias da deprecare:** nessuno — **"Carico" è già il nome operativo in uso**
(`RegistraCaricoDialog`, sezione "Carico" in `AccountingView`). Non è un alias da correggere, è
la traduzione italiana corretta del canonico "Lot". Stessa regola di Listing/"annuncio": nome
canonico in codice, "Carico" in copy.

**Definizione:**
Un Lot (Carico) è un **acquisto collettivo** da un fornitore — uno o più capi comprati insieme, a
un prezzo unico, in un solo momento. Si distingue dal Catalog Entry perché il Lot è l'evento di
*acquisizione*, non il singolo capo: un Carico da 50 pezzi genera (dopo la decisione del 02/09)
fino a 50 Catalog Entry collegati, ma il Carico esiste anche prima che un solo capo sia stato
catalogato — è registrato per conto proprio, con costo e quantità dichiarati subito.

**Esempi:**
- Un Carico "pezzo" di un capo singolo, comprato da un privato a 15€: `quantity=1`
- Un Carico "ingrosso" da un grossista, 25kg di capi vintage misti a 400€ totali: `quantity`
  espressa in peso, non in numero di pezzi (il tipo `ingrosso` misura diversamente da `pezzo`)
- Un Carico registrato oggi ma i cui capi vengono caricati (fotografati, passati per l'AI) nei
  giorni successivi, uno alla volta: il Carico non aspetta che tutti i capi siano dentro per
  esistere

**Tipi:**
- `pezzo` — quantità in numero di capi, per acquisti mirati/singoli
- `ingrosso` — quantità in peso (kg), per acquisti massivi dove contare i pezzi uno a uno non è
  pratico al momento dell'acquisto

**Note per il team dev:**
- **`RegistraCaricoDialog` esiste già e resta valido**: copre la creazione del Carico (nome,
  tipo, quantità, categoria, fornitore, prezzo, data). La decisione del 02/09 non lo sostituisce,
  lo **estende**: dopo aver registrato il Carico, serve un modo per entrare in una modalità di
  aggiunta capi in loop, ognuno taggato con quel Carico — oggi quel passaggio successivo non
  esiste.
- `items.lot_id` è **nullable**: non ogni Catalog Entry viene da un Carico registrato (un
  acquisto singolo non tracciato come Carico resta possibile).
- **Non confondere con l'allocazione costi**: `allocation_method` esiste nello schema
  (`uniform · weight_based · manual`) ma la decisione del 02/09 lo lascia **inutilizzato per
  ora** — il costo per capo resta il campo manuale `purchasePriceCents`, non un calcolo derivato
  dal Carico. `allocation_method` è metadata pronto per un'eventuale funzione futura, non un
  requisito di questa fase.
- Nessuna restrizione di ruolo verificata (RLS solo `tenant_isolation`, come Marketplace
  Account) — a differenza di Accounting Entry.

---

## Convenzioni di naming

| Termine da evitare | Termine canonico | Motivo |
|---|---|---|
| "Transazione" per Accounting Entry (se usato come nome dell'oggetto, non come sinonimo di frase) | Accounting Entry | Evitare un terzo nome quando "movimento contabile" in copy già basta |
| "Costo di spedizione" per il nuovo campo | "costi a mio carico" / `sellerCostsCents` | Copre più di una voce (spedizione+packaging+omaggi) — chiamarlo solo spedizione è impreciso e fuorviante |
| "Lotto" come termine tecnico a sé, distinto da "Carico" | Lot in codice, **Carico** in copy (invariato) | Sono la stessa cosa — non introdurre un terzo termine, "Carico" è già quello giusto |

---

## Prossimo step → Fase 3

Input per Navigation Flow: **Accounting Entry** (view: dentro Contabilità, Admin-only — nessuna
nuova nav, la schermata esiste già anche se su mock) e **Lot** (view: la sezione "Carico" già
esistente in `AccountingView` si estende con il flusso bulk deciso — non un nuovo entry point,
un'estensione di uno che c'è). Relazione da mappare in Fase 3: come si passa dal "Carico appena
registrato" al "loop di aggiunta capi" — oggi quel ponte non esiste in nessuna view.
