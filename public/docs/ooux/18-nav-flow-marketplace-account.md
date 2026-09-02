---
title: "OOUX Fase 3 — Navigation Flow · Marketplace Account"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi disegna la Fase 5 (Sketch Brief) per questa view
---

# Fase 3 — Navigation Flow · Marketplace Account

> Un solo oggetto. La domanda lasciata aperta da Fase 2 (Pubblicazione o Impostazioni?) si
> scioglie qui, con una proposta motivata — non è un fatto già deciso altrove.

## La domanda di confine, sciolta

**Nessuna rotta `/impostazioni` esiste** (verificato: `apps/web/app/` ha 12 cartelle, nessuna si
chiama così). Track C, che possiederebbe quello spazio, non ha nemmeno un Round 1. Inventare qui
una voce di nav "Impostazioni" significherebbe fare scope creep su un track intero non ancora
iniziato, solo per ospitare un oggetto.

**Proposta di questa fase**: l'entry point vive **dentro Pubblicazione**, non come nuova voce di
nav. Motivazione: Marketplace Account non ha senso da solo — l'unico motivo per cui il Seller lo
cerca è "voglio pubblicare e non riesco" o "voglio vedere perché un marketplace è spento". È
esattamente il pattern che la Fase 3 di Track A userebbe per escludere un entry point: un oggetto
che non ha senso senza un contesto parent non è un entry point primario. Qui il parent è
Pubblicazione.

**Non è una chiusura del confine Track B/C**: se e quando Track C parte, "Impostazioni" potrebbe
diventare la sede definitiva e questa view si sposta — è dichiarato esplicitamente come possibile
in Layer/nota, non nascosto.

---

## Entry Point

1. **Pubblicazione** *(esistente, riusato — non nuovo)* — resta l'entry point primario per
   Listing (Fase 3 originale). Marketplace Account non aggiunge un nuovo entry point di primo
   livello: si raggiunge da lì.

> Nessun entry point secondario proposto in questo giro (es. da Home): con zero Marketplace
> Account collegati oggi in ogni tenant nuovo, l'unico momento in cui il Seller ne ha bisogno è
> mentre lavora dentro Pubblicazione — non prima.

---

## Grafo di navigazione

```
[Pubblicazione]
├── (esistente) Tab "Da pubblicare" / "Live" — vedi 11-nav-flow-listing-shipment.md
│
└── (NUOVO) "Gestisci marketplace" — affordance da aggiungere vicino a PlatformChips
      lista dei 5 marketplace possibili, con stato per riga:
      ├── nessun account (default per marketplace mai collegato)
      │     └── CTA "Collega" ──► flusso di collegamento (OAuth o credenziali — non
      │           specificato nel canonico, solo secret_ref esiste) ──► crea Marketplace
      │           Account, status iniziale probabile 'active' o 'error' a seconda dell'esito
      ├── account 'active'
      │     └── CTA "Scollega" ⚠️ — richiede conferma (interrompe la pubblicazione lì)
      └── account 'error' o 'inactive'
            └── CTA "Ricollega" — ripete il flusso di collegamento
```

**Perché dentro Pubblicazione e non un Sheet standalone raggiungibile da ovunque**: coerente col
pattern già stabilito (RepublishSheet, StrategySheet, e ora ListingDetail/ShipmentDetail) — tutto
ciò che riguarda la pubblicazione vive in quell'area, non sparso.

---

## View inventory

### Marketplace Account

- **Lista globale** — 5 righe fisse (una per marketplace), non una collezione con cardinality
  variabile: non serve sort (5 elementi, ordine fisso per rilevanza commerciale o alfabetico) né
  filtro (nessun criterio ha senso su 5 righe statiche).
- **Card (inline)** — dentro la lista "Gestisci marketplace": nome marketplace + badge stato +
  CTA contestuale (Collega/Scollega/Ricollega). Non serve una card separata altrove: l'oggetto
  non è mai annidato in nessun altro contesto verificato in questa fase.
- **Detail** — non necessario. A differenza di Listing/Shipment, l'oggetto ha solo 3 stati e un
  flusso lineare (collega/scollega) — non ha abbastanza contenuto per giustificare un Detail
  proprio. La card stessa è sufficiente.
- **Empty state** — non nel senso di "collezione vuota" (le 5 righe esistono sempre): lo stato
  "nessun account collegato da nessuna parte" è il default di ogni tenant nuovo, va comunicato
  una volta (es. in Onboarding, fuori scope qui) più che ripetuto ad ogni apertura della lista.

---

## Flussi cross-object

### Collegare un marketplace per sbloccare la pubblicazione
Job: "Quando il Seller prova a pubblicare su un marketplace e la CTA è disabilitata, vuole
capire perché e risolverlo senza uscire dal contesto in cui si trovava."
Path: Pubblicazione (CTA "Pubblica" disabilitata, motivo visibile — Fase 2 Listing) → "Gestisci
marketplace" → riga del marketplace mancante → "Collega" → flusso esterno (OAuth/credenziali,
non specificato) → Marketplace Account creato
Oggetti coinvolti: Marketplace Account (creato) · Listing (nessuna transizione diretta, ma la
CTA "Pubblica" si sblocca per quel marketplace)
Transizioni di stato: nessuna su Listing esistenti — è un prerequisito, non un effetto
collaterale su oggetti già creati

### Un account smette di funzionare
Job: "Quando il Seller nota che un marketplace è 'error', vuole sapere cosa è successo prima
che gli annunci lì restino inosservati."
Path: (nessun trigger UI verificato oggi — la transizione `active → error` è probabilmente
di sistema, non un'azione utente) → "Gestisci marketplace" mostra la riga in errore → Ricollega
⚠️ **Non verificato in questa fase**: cosa succede ai Listing già `active` su quel marketplace
quando l'account passa a `error`? Restano `active` (falsamente, dato che l'account non
funziona più) o vengono marcati diversamente? Non c'è una relazione diretta Marketplace
Account→Listing nello schema (Fase 1, secondo giro) quindi non c'è nemmeno un meccanismo
canonico per propagare l'errore. Segnalato per Fase 4/6, non deciso qui.

---

## Prossimo step → Fase 4

Input per CTA Matrix: **Marketplace Account** con 3 CTA note da questa fase (Collega · Scollega
⚠️ · Ricollega), tutte dentro la view "Gestisci marketplace" di Pubblicazione. Nessuna nuova
navigazione top-level da aggiungere alla matrice.
