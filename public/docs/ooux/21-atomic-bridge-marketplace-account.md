---
title: "OOUX Fase 6 — Atomic Bridge + Token Contract · Marketplace Account"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi implementa la view "Gestisci marketplace"
---

# Fase 6 — Atomic Bridge · Marketplace Account

> Chiude Round1→Fase6 su Marketplace Account, dopo Listing/Shipment (PR #59). Stack lockato:
> token reali, non segnaposto.

## Ground-truth check

Rieseguito prima di scrivere questo documento: frontmatter di `07-design-anchor-p2c.md`
(`superseded`) e `maat-ds/DESIGN.md` (`locked`) confermato coerente, invariato da quando risolto
nella Fase 6 precedente. Nessun nuovo conflitto trovato.

---

## Layer 1 — Audit dei framework attivi (per questa view)

| Layer | Framework | Stato | Output |
|---|---|---|---|
| Object Map | Round 1 Track B | ✅ | `08-object-map-aree-operative.md` |
| Requirements | Fase 1, secondo giro | ✅ | `16-mcsfd-round2-aree-operative.md` |
| Glossario | Fase 2 | ✅ | `17-object-guide-marketplace-account.md` |
| Navigation | Fase 3 | ✅ (proposta motivata, non fatto definitivo) | `18-nav-flow-marketplace-account.md` |
| Azioni | Fase 4 | ✅ | `19-cta-matrix-marketplace-account.md` |
| Spec view | Fase 5 | ✅ | `20-sketch-brief-marketplace-account.md` |
| **Atomic Design** | *questo doc* | 🔨 in produzione | §3 |
| **Token contract** | *questo doc* | 🔨 in produzione | §4 |
| Linguaggio visivo | `maat-ds/DESIGN.md`, `locked` | ✅ | ground-truth check sopra |

**Buco non chiuso qui**: la propagazione `Marketplace Account.error → Listing` (nessun
meccanismo canonico, segnalato Fase 3/4/5) resta aperta — non è un buco di questo layer, è un
buco di schema/backend che nessuna fase UI può colmare da sola.

---

## Layer 2 — OOUX (già completo, non si ripete)

Round 1 + Fasi 1-5 chiuse su questo oggetto. Non si ripete qui.

---

## Layer 3 — Atomic Design

### Decisione: generalizzare il badge di stato, ma senza toccare quelli esistenti

Con questo oggetto sono **3** quelli che richiedono un proprio badge di stato con vocabolario
diverso (Catalog Entry: 4 valori · Listing: 4 valori diversi · Marketplace Account: 3 valori),
stessa forma visiva in tutti e tre (pillola + dot + mono uppercase, verificato su `StatusBadge`
esistente). **Regola del tre**: tre istanze quasi identiche giustificano un'astrazione, non la
aspettano ancora.

**Decisione presa qui, motivata**: introdurre `StatusPill<T extends string>` — un primitivo
condiviso che accetta `value: T` e `config: Record<T, {label: string; tone: 'success' |
'warn' | 'danger' | 'neutral'}>`, dove `tone` risolve ai token esistenti.

> **Corretto il 02/09, in implementazione.** Questa fase aveva proposto
> `warn`→`--accent`/`--accent-soft` e `danger`→`--danger`/`--danger-soft`. Nessuna delle due
> regge contro `apps/web/app/globals.css`:
>
> - **`--accent` è un grigio** (`rgba(91,102,112,.10)`), non il fluo. Il fluo è `--primary`
>   (`#DBE64C`), e il soft del fluo è `--accent-soft`/`--accent-ink` — nomi vicini, colori
>   diversi.
> - **`--color-danger` non è esposto in `@theme`**, solo `--color-danger-soft`. In Tailwind v4
>   l'utility esiste solo se esiste il `--color-*`: scrivere `text-danger` non produce nessuna
>   classe e il testo **eredita il colore senza errori né avvisi**. È un fallimento silenzioso,
>   il tipo peggiore in un contratto token.
>
> La mappa vera, ricavata dalle due istanze già in codice (`StatusBadge`, `ListingStatusBadge`)
> invece che dai nomi dei token:
>
> | tone | classi reali | perché |
> |---|---|---|
> | `success` | `bg-success-soft text-success` | invariato |
> | `warn` | `bg-primary text-primary-foreground` | fluo **pieno**: è il trattamento che sia `StatusBadge` sia `ListingStatusBadge` danno già al proprio stato «sta succedendo qualcosa». Due istanze indipendenti concordano |
> | `danger` | `bg-destructive/12 text-destructive` | `--danger` e `--destructive` sono lo stesso `#E5484D`, ma solo `destructive` è esposto come utility di testo |
> | `neutral` | `bg-neutral-soft text-muted-foreground` | invariato |
>
> Un test in `StatusPill.test.ts` vieta le utility che il tema non genera, così la trappola non
> si può ripresentare. Questa correzione supersede anche i «token candidati» di `20`, che
> facevano la stessa ipotesi.

**Cosa NON fa questa decisione**: non tocca `StatusBadge` (Catalog Entry, **già in produzione**)
né rideclina `ListingStatusBadge`. Migrarli su `StatusPill` sarebbe un remap di un artefatto
esistente — richiede il proprio piano/diff e la propria conferma, non implicita in questa PR.

> **Aggiornato il 02/09.** La premessa su `ListingStatusBadge` («solo speccato, non ancora
> costruito») è durata poche ore: è stato costruito lo stesso giorno con la PR #67. Federico ha
> quindi deciso di migrarlo **subito** su `StatusPill` (PR #71), mentre aveva un solo call-site:
> rimandare avrebbe trasformato la stessa modifica in un remap. La migrazione è coperta da un
> test che confronta le classi prodotte con quelle di prima, stato per stato, mutation-testato.
>
> `StatusBadge` (Catalog Entry) **resta fuori**, come questa fase prescriveva: è in produzione da
> mesi e vuole il suo piano.

### Token → Atomi → Molecole → Organismi

**ATOMI**
| Atomo | Deriva da | Note |
|---|---|---|
| `StatusPill<T>` | — (primitivo condiviso, nuovo) | Generico, vedi decisione sopra |
| `MarketplaceAccountStatusBadge` | `MarketplaceAccount.status` | Istanza di `StatusPill<'active'\|'inactive'\|'error'>` con la config sotto |
| `MarketplaceBadge` | `MarketplaceAccount.marketplace` / `Listing.marketplace` | **Riusato**, non nuovo — già specificato Fase 6 precedente |

**ATOMI riusati**: `Button`, `Badge` (shadcn, base di `StatusPill`).

**ORGANISMI nuovi (1)**
| Organismo | Vista di | Composto da | Copre |
|---|---|---|---|
| `MarketplaceAccountList` | Marketplace Account (collezione fissa 5) | `Sheet` + 5× (`MarketplaceBadge` + `MarketplaceAccountStatusBadge` + CTA contestuale) | brief `20` |

**TEMPLATE riusato**: `Sheet`, nessun nuovo pattern di layout.

---

## Layer 4 — Design Token Contract

```jsonc
// Estensione al contratto token esistente
{
  // I `tone` sono nomi del contratto, NON nomi di token: la mappa tone→classi
  // sta in StatusPill.tsx ed è quella corretta il 02/09 (vedi §Layer 3).
  "marketplaceAccountStatus": {           // MarketplaceAccount.status → StatusPill (tone)
    "active":   "success",                 // bg-success-soft text-success
    "inactive": "neutral",                 // bg-neutral-soft text-muted-foreground
    "error":    "danger"                   // bg-destructive/12 text-destructive
  }
}
```

**Catena che chiude il cerchio:**
- `MarketplaceAccount.status` (enum, Fase 1) → prop `value` di `MarketplaceAccountStatusBadge`
  (istanza di `StatusPill`) → `tone` → token esistenti, nessun nuovo token colore introdotto
  (a differenza di Listing/Shipment, che avevano richiesto 2 nuovi `--channel-*`)

**Nessun campo sortable/filterable** in questa view (Fase 5: 5 righe fisse, nessun sort/filtro)
— la regola MCSFD "ogni sort/filter key deve essere metadata strutturato" non si applica qui,
non per omissione ma perché non esiste nessun sort/filtro da vincolare.

---

## Layer 5 — JTBD

Job: *"Quando il Seller scopre di non poter pubblicare da qualche parte, vuole capire perché e
risolverlo senza cercare in giro."*

| Stadio | Primo piano | Organismo | CTA dominante |
|---|---|---|---|
| 1. Bloccato da un account mancante | quale marketplace manca | `MarketplaceAccountList` | Collega Marketplace Account |
| 2. Un account è rotto | badge `error` in evidenza | `MarketplaceAccountList` | Ricollega Marketplace Account |
| 3. Non serve più un marketplace | — | `MarketplaceAccountList` | Scollega Marketplace Account ⚠️ |

---

## Stack raccomandato

Nessuna aggiunta — `StatusPill` si costruisce su `Badge` (shadcn) già presente, `Sheet` già
presente. Puramente additivo.

---

## Pipeline spec→build e prossimi passi

1. ✅ **Fatto il 02/09 (PR #71)** — `StatusPill<T>` costruito come primitivo nuovo.
2. ✅ **Fatto** — `MarketplaceAccountStatusBadge` istanziato su di esso.
3. ✅ **Fatto** — `MarketplaceAccountList` assemblato sul brief `20`. Una deviazione dichiarata:
   il trigger sta in header accanto a «Strategie», non accanto a `PlatformChips` come proponeva
   il brief — nel codice reale `PlatformChips` vive in una barra fluttuante che compare solo a
   capi selezionati, e dentro `StrategySheet`, che è già un `Sheet`. Il brief marcava il trigger
   come non specificato.
4. ✅ **Deciso e fatto** — `ListingStatusBadge` migrato su `StatusPill`, vedi §Layer 3.
5. Restano bloccati da decisioni di Federico: Accounting Entry (3 punti), Publish Strategy (1 di
   scope), Lot→Catalog Entry (1 di scope) — vedi `09` §3 e `16`.

---

## Stato pipeline Track B — Marketplace Account COMPLETO (Round 1 + 6/6)

| Fase | Deliverable | File |
|---|---|---|
| R1 | Object Map | `08-object-map-aree-operative.md` |
| 1 | MCSFD (2° giro) | `16-mcsfd-round2-aree-operative.md` |
| 2 | Object Guide | `17-object-guide-marketplace-account.md` |
| 3 | Navigation Flow | `18-nav-flow-marketplace-account.md` |
| 4 | CTA Matrix | `19-cta-matrix-marketplace-account.md` |
| 5 | Sketch Brief | `20-sketch-brief-marketplace-account.md` |
| 6 | Atomic Bridge + Token | `21-atomic-bridge-marketplace-account.md` (questo file) |

**Track B oggetti completi Round1→Fase6**: Listing, Shipment, Marketplace Account (3 su 11).
**Ancora da fare**: Accounting Entry, Publish Strategy (bloccati), Sale (mai briefato da solo),
Supplier, Lot (bloccato), Offer. Track C non iniziato.
