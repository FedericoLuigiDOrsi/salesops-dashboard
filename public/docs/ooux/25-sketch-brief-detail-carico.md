---
title: "OOUX Fase 5 — Sketch Brief · Detail Carico"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi implementa il componente e chi lo porta in Stitch
---

# Fase 5 — Sketch Brief · Detail Carico

> Prima view di questa fase (una alla volta). Priorità più alta da Fase 4: sblocca sia la
> ripresa del loop di aggiunta capi sia la lista di cosa è già collegato a un lotto.

## Detail View — Lot (Carico)

**Montaggio:** Sheet, aperto da tap sulla riga nella tabella "Storico carichi" (oggi la riga non
ha nessun click handler — verificato, solo gli header di sort sono cliccabili). Stesso pattern
di Listing/Shipment/Marketplace Account Detail.
**Ruoli con accesso:** Seller (nessuna restrizione nota su Lot, a differenza di Accounting
Entry).

### Contenuto (gerarchia informativa)

**Header (SheetHeader)**
- Titolo: `name` se presente, altrimenti `code` (es. "CAR-0142") — stesso fallback già previsto
  nel tipo esistente
- Badge tipo: `pezzo` o `ingrosso` — tipo: badge

**Corpo principale**
1. **Dati del Carico** (sola lettura — gli stessi raccolti da `RegistraCaricoDialog`, qui non
   editabili in questa view): fornitore · quantità (pezzi o kg, secondo `type`) · categoria ·
   costo pagato · data di esecuzione
2. **Capi collegati** (sezione relazione, la ragione per cui questa view esiste) — lista di
   Catalog Entry con `lot_id` uguale a questo Carico, card compatta (thumbnail + brand/tipo +
   badge status), 0 o più. Link a ciascun Dettaglio capo (Track A, esistente).
3. **Progresso**: nessun campo di stato dedicato — il "progresso" è implicito nel numero di capi
   collegati (es. "12 capi collegati"), non un campo separato da mantenere sincronizzato.

**Metadata (footer/secondario)**
- `acquiredAt` (se distinto da `executedAt`) — tipo: testo secondario

### CTA

| CTA | Posizione | Ruolo | Stato oggetto richiesto |
|---|---|---|---|
| Crea capo (da Carico) | SheetFooter, primaria | Seller | Sempre — riprende/continua il loop di aggiunta, con `lot_id` di questo Carico |

Nessuna CTA di modifica o eliminazione in questo brief: non richieste da nessuna fase precedente
(Fase 4 le aveva segnalate come "da validare", non da costruire ora).

### Relazioni navigate da questa view

| Relazione | View target | Come | Cardinality |
|---|---|---|---|
| → Catalog Entry | Card inline → Dettaglio capo (Track A) | Sezione "Capi collegati" | 0-many |

### Comportamenti

- **Empty state relazione (0 capi collegati)**: messaggio tipo "Nessun capo ancora catalogato da
  questo Carico" + la stessa CTA primaria `Crea capo (da Carico)` — non un empty state passivo,
  è il caso più comune subito dopo la registrazione.
- **`totalCostCents`/`allocationMethod`**: presenti nel tipo esistente ma **non mostrati in
  questa view**. Sono campi predisposti per un'eventuale allocazione costi automatica che la
  decisione del 02/09 ha esplicitamente escluso — mostrarli darebbe l'impressione che facciano
  qualcosa, mentre oggi non alimentano nulla.
- **Permessi**: nessuna differenza Admin/Operator (Lot non ha restrizione RLS, a differenza di
  Accounting Entry).

---

## Input per Fase 6 — spec-to-modular-ui

**Oggetto di questo brief:** Lot — dati read-only del Carico + lista Catalog Entry collegati.

**View inventory di questo brief:** 1 (Detail, montata come Sheet).

**Attributi enum → token candidati:**
- `Lot.type` (`pezzo`/`ingrosso`) → badge, riusa il pattern `MarketplaceBadge`/`StatusPill`
  solo se serve un colore — con 2 soli valori senza connotazione di stato (non è "buono/cattivo",
  è solo una categoria), potrebbe bastare un badge neutro senza semantica di tono. Da confermare
  in Fase 6, non un token nuovo necessariamente.

**Nessun nuovo token colore richiesto** — a differenza di Listing/Marketplace Account, questa
view non introduce un nuovo vocabolario di stato.

**Stack tech:** invariato (Next.js 16 · React 19 · Tailwind v4 · shadcn/ui, `Sheet`).
**Design anchor:** MP076, `maat-ds/DESIGN.md` (lockato).

**Prossima view di questa fase** (non in questo brief): la variante "Crea capo (da Carico)" del
flusso Acquisizione foto di Track A — estensione di un brief esistente, non un brief nuovo da
zero.
