---
title: "OOUX Fase 5 — Sketch Brief · Gestisci marketplace (Marketplace Account)"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi implementa il componente e chi lo porta in Stitch
---

# Fase 5 — Sketch Brief · Gestisci marketplace

> Unica view di Marketplace Account (Fase 3 ha escluso un Detail separato). Non wireframe:
> struttura + comportamento. Colori/font/token → Fase 6.

## Lista — Marketplace Account (5 righe fisse)

**Montaggio:** Sheet, aperto da un'affordance dentro Pubblicazione (vicino a `PlatformChips` —
non ancora specificato il trigger esatto, proposta: icona/link "Gestisci marketplace" accanto
alla selezione piattaforme). Non una route dedicata, stesso pattern di `RepublishSheet`/
`StrategySheet`/`ListingDetail`.
**Ruoli con accesso:** Seller (nessuna differenza Admin/Operator, Fase 2 — a differenza di
Contabilità).

### Righe di lista

A differenza di una lista globale ordinaria (Fase 1: cardinality fissa, non 0‑N), **le 5 righe
esistono sempre**, una per marketplace, indipendentemente da quanti account sono collegati.
Attributi visibili per riga, in ordine di priorità visiva:
1. `MarketplaceBadge` (atomo riusato da Fase 6 di Listing/Shipment — non inventarne un altro) —
   identifica il marketplace, sempre presente
2. Badge di stato — **nuovo componente**, non esiste un atomo riusabile per {active, inactive,
   error} (vedi nota in Input per Fase 6). Assente/vuoto per un marketplace mai collegato — non
   è uno stato dell'enum, è l'assenza della riga corrispondente nel canonico
3. CTA contestuale (vedi sotto) — sempre una sola CTA primaria visibile per riga, mai più di una

CTA sulla riga: `Collega Marketplace Account` (righe senza account) · `Ricollega Marketplace
Account` (righe `error`/`inactive`) · `Scollega Marketplace Account` ⚠️ (righe `active`, in
posizione secondaria/overflow, non alla pari della CTA primaria — è distruttiva)

### Sort e filtri

**Nessuno.** Con 5 righe fisse e ordine di marketplace stabile (proposta: ordine di rilevanza
commerciale — Vinted primo, dato che è l'unico con vincolo browser-only citato più volte nelle
fasi precedenti — o alfabetico se non c'è una gerarchia dichiarata), sort/filtro non hanno senso.
Nessun campo di questa view è mai stato marcato sortable/filterable in nessuna fase precedente.

### Comportamenti lista

- **Empty state globale**: non esiste nel senso classico (le righe ci sono sempre). Lo stato
  "zero account collegati" è il default di ogni tenant nuovo — un banner discreto in cima
  ("Nessun marketplace collegato ancora") è sufficiente, non serve un empty-state a piena
  pagina come per una lista vuota vera
- **Zero risultati post-filtro**: N/A, non c'è filtro
- **CTA globale**: nessuna — non esiste un "Collega tutti" o un "Aggiungi marketplace" generico,
  ogni riga ha la propria CTA indipendente

### Il flusso "Collega"/"Ricollega" esce dall'app

Nessuna delle due CTA apre un form interno completo: il canonico prevede solo `secret_ref`
(riferimento a un vault), non credenziali dirette. Il brief tratta questo come **un passaggio a
un flusso esterno** (probabile OAuth del marketplace, o una schermata di credenziali fuori
dall'app stessa) — la Sheet mostra un messaggio tipo "Continua su [Marketplace]" prima di
lasciare il contesto, non finge un submit locale. Coerente col precedente già stabilito per
Vinted (browser-only, mai un submit interno).

**`secret_ref` non compare mai in questa view** — né in chiaro né come riferimento visibile. Lo
stato (`active`/`inactive`/`error`) è l'unico segnale che la view mostra sul collegamento.

### Comportamento della CTA distruttiva

`Scollega Marketplace Account` ⚠️ richiede conferma esplicita (modale o pattern equivalente già
in uso altrove nel design system) prima di eseguire. Il messaggio di conferma deve dire cosa
succede ai Listing già pubblicati su quel marketplace — ma **questo brief non può specificarlo
con certezza**: Fase 3/4 hanno segnalato che non c'è un meccanismo canonico verificato che lega
Marketplace Account ai Listing esistenti. Il messaggio di conferma, per ora, si limita a
"interromperà la pubblicazione su [Marketplace]" senza promettere cosa succede ai Listing già
attivi lì — promettere di più sarebbe inventare un comportamento non verificato.

---

## Input per Fase 6 — spec-to-modular-ui

**Oggetto di questo brief:** Marketplace Account — `marketplace` (5 valori, riusa
`MarketplaceBadge`) · `status` (3 valori, nuovo badge).

**View inventory di questo brief:** 1 (lista a righe fisse, montata come Sheet).

**Attributi enum → token candidati:**
- `Marketplace Account.status` → **nuovo componente badge** (nome proposto:
  `MarketplaceAccountStatusBadge` o generalizzare in un badge di stato parametrico condiviso —
  decisione di Fase 6, non presa qui). Nessuno dei due badge di stato esistenti (`StatusBadge`
  su `CatalogEntryStatus`, `ListingStatusBadge` su `per_listing_status`) è tipizzato per
  {active, inactive, error}. Token candidati: `active`→`--success`/`--success-soft` ·
  `error`→`--danger`/`--danger-soft` · `inactive`→`--neutral-soft`
- `Marketplace Account.marketplace` → riusa `MarketplaceBadge` (Fase 6 di Listing/Shipment),
  nessun nuovo token

**Segnalato per Fase 6, non deciso qui**: con questo terzo oggetto (Catalog Entry, Listing,
Marketplace Account) che necessita ciascuno del proprio badge di stato con vocabolario diverso,
vale la pena valutare se generalizzare in un unico componente parametrico invece di continuare
ad aggiungerne uno per oggetto — è un giudizio di design system, non di questa fase.

**Stack tech:** invariato (Next.js 16 · React 19 · Tailwind v4 · shadcn/ui, `Sheet` come base).
**Design anchor:** MP076, `maat-ds/DESIGN.md` (lockato esplicitamente da Fase 6 precedente).
