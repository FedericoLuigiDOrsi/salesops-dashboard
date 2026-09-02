---
title: "OOUX Fase 6 — Atomic Bridge + Token Contract · Listing e Shipment"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi implementa i due componenti Detail
---

# Fase 6 — Atomic Bridge · i due deliverable di Fase 5

> Capstone di Track B su Listing e Shipment (non tutte le 11 relazioni del Round 1 — solo le
> due view di Fase 5). A differenza della Fase 6 di Track A (`06-atomic-bridge.md`), qui lo
> stack **è** lockato e in produzione: i token sotto sono nomi reali già esistenti in
> `apps/web/app/globals.css`, non segnaposto in attesa di un anchor.

## Ground-truth check — fatto prima di scrivere questo documento

Trovato un conflitto reale fra `07-design-anchor-p2c.md` (frontmatter `status: locked`,
`superseded_by: null`) e `maat-ds/DESIGN.md` (nessun frontmatter, prosa che bollava 07 come
"bozza"). Nessuno dei due puntava esplicitamente all'altro. **Confermato da Federico (02/09):
`maat-ds/DESIGN.md` è il vincolo vivo.** Corretti entrambi i frontmatter in questa stessa PR:
`07` → `status: superseded, superseded_by: maat-ds/DESIGN.md`; `DESIGN.md` → aggiunto
`status: locked` (non l'aveva mai avuto esplicito).

---

## Layer 1 — Audit dei framework attivi (per queste due view)

| Layer | Framework | Stato | Output |
|---|---|---|---|
| Object Map | Round 1 Track B | ✅ | `08-object-map-aree-operative.md` |
| Requirements | Fase 1 MCSFD | ✅ | `09-mcsfd-aree-operative.md` |
| Glossario | Fase 2 Object Guide | ✅ | `10-object-guide-listing-shipment.md` |
| Navigation | Fase 3 Nav Flow | ✅ (corretta 02/09) | `11-nav-flow-listing-shipment.md` |
| Azioni | Fase 4 CTA Matrix | ✅ | `12-cta-matrix-listing-shipment.md` |
| Spec schermate | Fase 5 Sketch Brief | ✅ | `13` (Listing) + `14` (Shipment) |
| **Atomic Design** | *questo doc* | 🔨 in produzione | §3 |
| **Token contract** | *questo doc* | 🔨 in produzione | §4 |
| Linguaggio visivo | `maat-ds/DESIGN.md`, ora `locked` esplicito | ✅ | vedi ground-truth check sopra |
| QA/test | — | ❌ buco, ereditato da Track A | da definire |

**Buco reale non chiuso qui:** la riconciliazione fra il modello canonico di Listing e
`ChannelDots`/`PlatformPills` (Inventario) — segnalata in Fase 3/5, resta aperta. Questo layer
non la decide, la porta avanti come vincolo esplicito su cosa NON si estende in questo giro.

---

## Layer 2 — OOUX (già completo, non si ripete)

Round 1 + Fasi 1-5 chiuse. 2 oggetti keystone (Listing, Shipment), 2 view Detail, CTA note.
Non si ripete qui.

---

## Layer 3 — Atomic Design (derivato dai due brief)

### Token → Atomi → Molecole → Organismi

**ATOMI nuovi (2)**
| Atomo | Deriva da | Varianti/stati | Nota |
|---|---|---|---|
| `ListingStatusBadge` | `Listing.per_listing_status` | active · pending_manual · error · delisted | **Non estende** `StatusBadge` (tipizzato solo su `CatalogEntryStatus`, Fase 5) — nuovo componente, stesso pattern visivo (pillola, dot, mono uppercase) |
| `MarketplaceBadge` | `Listing.marketplace` / `Shipment.marketplace` | 5 valori (Vinted · Depop · Grailed · Vestiaire · eBay) | Estende il pattern di `PLATFORM_BRAND` (oggi 3 marketplace) — vedi Layer 4 per i 2 token colore mancanti |

**ATOMI riusati, non nuovi**
`Button` (già esiste, scala 32/36/40px confermata per apps/web — Blocco 1 debito design, non
44px) · `Badge` (shadcn, base di `ListingStatusBadge`) · `Link` (per "Apri su [marketplace]").

**MOLECOLE nuove (1)**
| Molecola | Composizione | Note |
|---|---|---|
| `FulfillmentEventRow` | `stage` label + `occurred_at` + `carrier`/`tracking_code` opzionali + `note` opzionale | Riga dello storico eventi di Shipment Detail (brief 14) — nuova, non esiste un equivalente da riusare |

**ORGANISMI nuovi (2, = i due Sketch Brief)**
| Organismo | Vista di | Composto da | Copre |
|---|---|---|---|
| `ListingDetail` | Listing | `Sheet` + `MarketplaceBadge` + `ListingStatusBadge` + sezione errore condizionale + link esterno + CTA (`Riprova`/`Ritira`) | brief `13` |
| `ShipmentDetail` | Shipment | `Sheet` + `MarketplaceBadge` + badge stato derivato + lista `FulfillmentEventRow`×N + CTA avanti-solo (`Segna spedito`/`Segna consegnato`/`Segna pronto`⚠️) | brief `14` |

**TEMPLATE riusato, non nuovo**
Entrambi montano su `Sheet` (shadcn), lo stesso pattern di `RepublishSheet`/`StrategySheet` —
nessun nuovo template di layout.

> Prova di modularità: `MarketplaceBadge` è la stessa molecola in entrambi gli organismi
> (Listing e Shipment condividono l'attributo `marketplace`). Non è duplicata due volte.

---

## Layer 4 — Design Token Contract

**Token reali, non segnaposto** — lo stack è lockato (Next.js 16 · React 19 · Tailwind v4 ·
shadcn/ui), i nomi sotto esistono già in `apps/web/app/globals.css` salvo dove segnalato "NUOVO".

```jsonc
// Estensione al contratto token esistente — non un file nuovo
{
  "listingStatus": {                    // Listing.per_listing_status → ListingStatusBadge
    "active":         "--success / --success-soft",
    "pending_manual": "--accent / --accent-soft",     // fluo, coerente con "in corso"
    "error":          "--danger / --danger-soft",
    "delisted":        "--neutral-soft"
  },
  "marketplace": {                      // Listing.marketplace / Shipment.marketplace
    "vinted":     "--channel-vinted",     // esiste
    "depop":      "--channel-depop",      // esiste
    "grailed":    "--channel-grailed",    // esiste
    "vestiaire":  "--channel-vestiaire",  // NUOVO — manca oggi (PLATFORM_BRAND copre solo 3)
    "ebay":       "--channel-ebay"        // NUOVO — manca oggi
  }
}
```

**Catena che chiude il cerchio:**
- `Listing.per_listing_status` (enum, Fase 1) → prop `status` di `ListingStatusBadge` → token
  `listingStatus.*`
- `Listing.marketplace` / `Shipment.marketplace` (enum, 5 valori) → prop `marketplace` di
  `MarketplaceBadge` → token `marketplace.*` — **2 dei 5 non hanno ancora un token colore**,
  coerente col gap già segnalato in Fase 5 (brief 13, `PLATFORM_BRAND` a 3/5)

**Regola dal MCSFD (Fase 1):** `per_listing_status` è marcato filterable → deve restare
metadata strutturato, non stringa libera nel componente. Stesso vincolo per `stage` nello
storico eventi di Shipment Detail: se un giorno serve filtrare lo storico, `stage` deve restare
un enum tipizzato, non testo formattato lato client.

**Non deciso qui:** se `ListingStatusBadge` deve prevedere anche gli stati di
`ChannelDots`/`PlatformPills` (`sold`, `pending` — diversi da `per_listing_status`) per un
eventuale consolidamento — dipende dalla riconciliazione ancora aperta (Layer 1).

---

## Layer 5 — JTBD: cosa mostro in ogni fase

Job: *"Quando il Seller vuole capire perché un annuncio non è andato a buon fine, o dove sia
arrivato un pacco, vuole la risposta subito, non doverla dedurre da una board."*

| Stadio | Primo piano | Organismo | CTA dominante |
|---|---|---|---|
| 1. Un annuncio ha un problema | badge `error` + motivo | `ListingDetail` | Riprova Listing |
| 2. Un annuncio è vivo e va gestito | prezzo + link esterno | `ListingDetail` | Ritira Listing |
| 3. Un pacco è in coda | storico eventi (anche vuoto) | `ShipmentDetail` | Segna spedito |
| 4. Un pacco è in viaggio | consegna prevista + ultimo evento | `ShipmentDetail` | Segna consegnato |

---

## Stack raccomandato (nessuna aggiunta — tutto già innestato)

A differenza di Track A (stack non lockato al momento della sua Fase 6), qui non c'è nulla da
raccomandare: Next.js 16 · React 19 · Tailwind v4 · shadcn/ui sono già lo stack reale, `Sheet`
e `Badge` già in uso. L'unico lavoro tecnico è additivo (2 token colore, 2 componenti nuovi),
non una scelta di stack.

---

## Pipeline spec→build e prossimi passi

1. Estendere `PLATFORM_BRAND`/i token `--channel-*` a 5 marketplace (blocca `MarketplaceBadge`
   completo, non blocca il resto).
2. Costruire `ListingStatusBadge` e `FulfillmentEventRow` come atomi/molecole nuovi.
3. Assemblare `ListingDetail` e `ShipmentDetail` sui rispettivi Sketch Brief.
4. **Prima di allargare oltre queste due view:** decidere la riconciliazione
   Listing/`ChannelDots` (Layer 1) — costruire `ListingDetail` senza quella decisione rischia di
   dover essere rifatto se Inventario resta la via che vince.
5. Track C (Home/Onboarding/Impostazioni/Auth) resta fuori scope: nessun Round 1 esiste ancora.

---

## Stato pipeline Track B — COMPLETA (Round 1 + 6/6 fasi su Listing/Shipment)

| Fase | Deliverable | File |
|---|---|---|
| R1 | Object Map | `08-object-map-aree-operative.md` |
| 1 | MCSFD | `09-mcsfd-aree-operative.md` |
| 2 | Object Guide | `10-object-guide-listing-shipment.md` |
| 3 | Navigation Flow | `11-nav-flow-listing-shipment.md` |
| 4 | CTA Matrix | `12-cta-matrix-listing-shipment.md` |
| 5 | Sketch Brief | `13` + `14` |
| 6 | Atomic Bridge + Token | `15-atomic-bridge-listing-shipment.md` (questo file) |

**Non completo:** le altre 9 relazioni del Round 1 Track B (fuori da Listing/Shipment) non
hanno attraversato le fasi 1-6 — questa Fase 6 chiude solo i due keystone, non l'intero Round 1.
→ Prossima esecuzione: implementazione tecnica dei due organismi, poi Track C.
