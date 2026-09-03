---
title: "OOUX Fase 4 — CTA Matrix · Accounting Entry e Lot"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi scrive lo Sketch Brief (Fase 5) per Contabilità
---

# Fase 4 — CTA Matrix · Accounting Entry e Lot

> Contabilità è Admin-only (RLS+UI, Fase 1 2° giro) — ogni CTA su Accounting Entry porta il
> ruolo esplicito "Admin", non "Seller" generico. Lot non ha questa restrizione.

## Matrice principale

| CTA | Oggetto | Ruolo | View | Priorità | Effetto |
|---|---|---|---|---|---|
| Registra Carico | Lot | Seller | Sezione Storico carichi | Primaria | Crea il Lot (nome, tipo, quantità, fornitore, costo, data) — **esistente**, non nuova |
| Crea capo (da Carico) | Catalog Entry | Seller | Dopo "Registra Carico" | Primaria (contestuale) | Stessa CTA "Crea capo" di Track A, con `lot_id` pre-impostato — non una CTA nuova, una variante contestuale |
| Collega capo al Carico | Catalog Entry | Seller | Dettaglio capo (Track A) | Secondaria | `Catalog Entry.lot_id: null → <id>` — per capi già catalogati |
| Modifica costi Accounting Entry | Accounting Entry | **Admin** | Sezione Transazioni, riga | Secondaria | Imposta/aggiorna `sellerCostsCents` (stesso campo, prima volta = registra, dopo = modifica) |

**Non aggiunta**: una CTA per "chiudere" o "terminare" il loop di aggiunta capi — è un comportamento
di flusso (l'utente esce quando risponde "No" a "un altro?"), non un'azione con un oggetto e un
effetto propri.

---

## CTA per oggetto (view design reference)

### Lot

**Sezione Storico carichi (lista)**
- `Registra Carico` — Seller — Primaria — esistente, invariata

**Dopo la creazione (flusso, non una view a sé)**
- `Crea capo (da Carico)` — Seller — Primaria — variante contestuale di "Crea capo" (Track A),
  ripetibile in loop finché l'utente non esce

**Detail Carico** *(nuovo, Fase 3 lo dichiara necessario)*
- `Crea capo (da Carico)` — Seller — Primaria — per riprendere il loop se interrotto
- Nessuna CTA distruttiva identificata in questo giro (eliminare un Carico non è emerso da
  nessuna fase precedente — non è aggiunta qui per non inventarla)

### Accounting Entry

**Sezione Transazioni (lista)**
- `Modifica costi Accounting Entry` — **Admin** — Secondaria — inline sulla riga, non richiede
  una view dedicata

**Detail**: nessuno — Fase 3 aveva già lasciato aperto se serva, e questa fase non trova
nessun'altra CTA che lo giustifichi. Se resta solo questa singola CTA inline, un Detail a sé
sarebbe sovradimensionato.

### Catalog Entry *(CTA nuove che toccano un oggetto di Track A, non di questo giro)*

- `Collega capo al Carico` — Seller — Secondaria — dal Dettaglio capo esistente

---

## Flussi scatenati da CTA

### Flusso: Carico → capi in blocco
Trigger: `Registra Carico` seguito da `Crea capo (da Carico)` in loop
Steps: Lot creato → Acquisizione foto (Track A) → Processing → Review → Confirm → "un altro?" →
ripete o esce
Oggetti coinvolti: Lot (creato una volta) · Catalog Entry (N creati, ognuno con `lot_id`)
Transizioni di stato: ogni Catalog Entry segue il proprio ciclo esistente (Track A) — nessuna
transizione nuova sul Lot

### Flusso: collegare un capo esistente
Trigger: `Collega capo al Carico` dal Dettaglio capo
Steps: selezione Carico da lista esistenti → conferma
Oggetti coinvolti: Catalog Entry (aggiornato) · Lot (invariato, solo letto)
Transizioni di stato: `Catalog Entry.lot_id: null → <id>`

### Flusso: registrare un costo extra
Trigger: `Modifica costi Accounting Entry`
Steps: click sulla riga (o un'icona dedicata) → inserimento importo → salva
Oggetti coinvolti: Accounting Entry (o Sale — non deciso, Fase 3/6)
Transizioni di stato: nessuna, è un campo

---

## Sintesi per priorità

**CTA primarie MVP** (devono esserci nel Day 1):
- Registra Carico (già esiste)
- Crea capo (da Carico) — senza, il ponte che Fase 3 ha disegnato non ha nessun modo di attivarsi

**CTA secondarie** (Phase 2):
- Collega capo al Carico — utile ma non blocca il flusso principale (un capo può restare senza
  lotto, non è un errore)
- Modifica costi Accounting Entry — migliora la precisione del margine, non blocca la vendita

**CTA da validare** (non certe — richiedono decisione, non solo design):
- Se serve eliminare un Carico registrato per errore — nessuna fase l'ha richiesta finora, ma è
  il tipo di domanda che emerge appena qualcuno sbaglia un inserimento ⚠️

---

## Prossimo step → Fase 5

Input per Sketch Brief: **Detail Carico** (nuova view, priorità alta — sblocca sia il loop
ripreso sia la lista capi collegati) e il flusso `Crea capo (da Carico)` come **estensione** del
brief esistente di Track A per Acquisizione foto (non un brief nuovo da zero — solo la variante
con `lot_id` e il loop "un altro?").
