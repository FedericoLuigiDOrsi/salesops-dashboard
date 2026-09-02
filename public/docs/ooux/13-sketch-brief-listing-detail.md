---
title: "OOUX Fase 5 — Sketch Brief · Listing Detail"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi implementa il componente e chi lo porta in Stitch
---

# Fase 5 — Sketch Brief · Listing Detail

> Una view alla volta, a partire dal Detail dell'oggetto keystone con priorità più alta (Fase 4).
> Non wireframe: struttura + comportamento. Colori/font/token → Fase 6.

## Su quale modello è disegnata questa view

Sul **canonico** (`listings`, 5 marketplace, `per_listing_status` con `error`), coerente con Fasi
1-4 — non sul modello di `ChannelDots`/`PlatformPills` (3 marketplace, nessun `error`), che è
quello disallineato (correzione 02/09, vedi `11-nav-flow-listing-shipment.md`). La
riconciliazione tra le due implementazioni resta una decisione per Fase 6/Federico, non presa
qui: questo brief non tocca `inventory/`.

---

## Detail View — Listing

**Montaggio:** Sheet (drawer laterale, `components/ui/sheet`) — non una route dedicata. Coerente
col pattern già in uso in Pubblicazione (`RepublishSheet`, `StrategySheet`): questa non è
un'eccezione, è la convenzione del backoffice.
**Trigger:** tap su una riga in LiveTab (Listing `active`/`pending_manual`/`error`). Il caso "un
Listing in errore appare nella lista 'Da pubblicare'" non è confermato da Fase 3 — se succede, lo
stesso Sheet si apre da lì; se non succede (l'errore emerge solo dopo la creazione, quindi solo
in Live), questa è l'unica via d'ingresso. Verificare in Fase 6 prima di implementare due entry
point per un caso che potrebbe non esistere.
**Ruoli con accesso:** Seller (Admin/Operator pari capacità, nessuna differenza in questa view).

### Contenuto (gerarchia informativa)

**Header (SheetHeader)**
- `marketplace` — badge colore-brand + iniziale (stesso pattern di `PLATFORM_BRAND`, ma esteso
  ai 5 marketplace reali, non solo 3) — tipo: badge
- Badge `per_listing_status` — nuovo componente, stesso pattern visivo di `StatusBadge`
  (pillola, dot, mono uppercase) ma con la propria config: `active`→verde (`--success`) ·
  `pending_manual`→fluo (`--primary`) · `error`→rosso (`--destructive`) · `delisted`→neutro
  (`--muted-foreground`) — tipo: badge
- Titolo: `brand` + `tipoCapo` del Catalog Entry collegato (il Listing non ha un nome proprio,
  eredita l'identità del capo) — tipo: testo, letto da `item_id`

**Corpo principale**
1. **Prezzo** — `price_cents` (formattato EUR) + flag `negotiable` se true — tipo: testo mono +
   badge secondario opzionale
2. **Errore** (solo se `per_listing_status='error'`) — sezione in evidenza, non un dettaglio
   minore: motivo del rifiuto se disponibile dal canonico, altrimenti messaggio generico
   "La piattaforma ha rifiutato la pubblicazione". È la ragione per cui questa view esiste —
   deve essere la prima cosa notata dopo l'header, non in fondo
3. **Link esterno** — `external_url` (solo se non nullo, cioè se è mai stato pubblicato) — link
   "Apri su [marketplace]" — tipo: link esterno
4. **Cronologia minima** — `published_at` · `delisted_at` (se presenti) — tipo: testo secondario,
   non un log completo (quello è per Shipment, oggetto diverso con mechanics diversa — Fase 1)

**Metadata (footer/secondario)**
- `created_at` · `updated_at` — tipo: testo minore, mono

### CTA

| CTA | Posizione | Ruolo | Stato oggetto richiesto |
|---|---|---|---|
| Riprova Listing | SheetFooter, primaria | Seller | `per_listing_status='error'` — **unica CTA visibile in questo stato**, sostituisce le altre due sotto |
| Ritira Listing ⚠️ | SheetFooter, secondaria | Seller | `per_listing_status='active'` — richiede conferma (il capo esce da quel marketplace) |
| Apri su [marketplace] | Inline, sezione Link esterno | Seller | `external_url` non nullo — non è una CTA di stato, è navigazione esterna |

Nessuna CTA "Modifica prezzo" in questa view: dal Round 1 e da Fase 4, il prezzo si cambia con
Repubblica (RepublishSheet, già esistente) o con Preview batch, non editando un Listing attivo
in place — coerente con Fase 4, che non aveva trovato questa CTA nel codice.

### Relazioni navigate da questa view

| Relazione | View target | Come | Cardinality |
|---|---|---|---|
| → Catalog Entry | (nessuna, oggi) | Il titolo mostra brand+tipoCapo ma non è cliccabile in questo brief — aprire anche il Dettaglio capo da qui è un'estensione futura, non richiesta da nessuna fase precedente | 1 |

### Comportamenti

- **Badge `per_listing_status`:** unico elemento sempre visibile che cambia il tono dell'intera
  view — su `error` la sezione Errore si espande automaticamente (non serve un click per
  vederla).
- **Vinted, browser-only:** se `Riprova Listing` su un Listing `marketplace='vinted'` innesca il
  flusso via estensione, il footer deve dirlo esplicitamente ("Continua nell'estensione Vinted"),
  non presentare un submit che sembra interno e poi salta fuori dal contesto senza preavviso.
- **`negotiable`:** se true, il prezzo mostra un badge secondario discreto ("Trattabile") — non
  è un campo con peso pari al prezzo stesso.
- **Permessi:** nessuna differenza Admin/Operator in questa view (mono-capacità sul catalogo,
  Fase 1).

---

## Input per Fase 6 — spec-to-modular-ui

**Oggetto keystone di questo brief:** Listing — `marketplace` (5 valori) · `per_listing_status`
(4 valori) · `price_cents` · `negotiable` · `external_url` · `published_at`/`delisted_at`.

**View inventory di questo brief:** 1 (Detail, montata come Sheet).

**Attributi enum → token candidati:**
- `Listing.per_listing_status` → nuovo componente badge, config propria (non riusa
  `StatusBadge`, che è tipizzato solo su `CatalogEntryStatus`): `active`→`--success` ·
  `pending_manual`→`--primary` · `error`→`--destructive` · `delisted`→`--muted-foreground`
- `Listing.marketplace` → estendere `PLATFORM_BRAND` (oggi 3 marketplace) ai 5 reali
  (`vinted · depop · grailed · vestiaire · ebay`); il commento nel codice lo segnala già come
  "da riprogettare/validare contro la palette dell'app" — questo brief conferma che va fatto,
  non introduce la richiesta

**Stack tech:** Next.js 16 · React 19 · Tailwind v4 · shadcn/ui (`Sheet`, `Badge` come base per
il nuovo componente stato).
**Design anchor:** MP076, lockato. Scala compatta (Button 32/36/40px, non 44px — decisione
Blocco 1 debito design, 02/09).

**Non risolto in questo brief, per Fase 6:** la riconciliazione con `ChannelDots`/
`PlatformPills` — quale via diventa quella vera, e cosa succede a quella scartata.
