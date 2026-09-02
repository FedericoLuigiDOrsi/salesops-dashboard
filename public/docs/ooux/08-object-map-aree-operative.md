---
title: "OOUX Round 1 — Object Map · aree operative (Contabilità · Logistica · Pubblicazione)"
date: 2026-08-03
status: draft
owner: Federico D'Orsi
audience: chi lavora su apps/web, schema canonico, design system
---

# Round 1 — Object Map · aree operative

> Estensione del metodo OOUX alle tre aree costruite **senza** object map. Il packet originale
> (`00-object-map-handoff.md`) copre il solo P2C con 3 oggetti (Catalog Entry · Photo ·
> Notification) e si dichiara «MVP, piattaforma mobile, 2 tab + FAB». `apps/web` ha però 6 sezioni
> e 75 componenti, 44 dei quali in aree che quel packet non modella: era la riga «L'OOUX modella 3
> oggetti, l'interfaccia costruita ne implica ~10» del registro disallineamenti.
>
> **Questo è Round 1 e basta.** MCSFD, Object Guide, Nav Flow e CTA Matrix vengono dopo, una fase
> alla volta, come prescrive `orca-pipeline`. Serve la validazione di Federico prima di procedere.

## Decisioni prese da Federico (02/09)

Le tre domande bloccanti dell'handoff (§4) hanno risposta. Fase 1 può procedere.

| Oggetto canonico | Domanda | Deciso |
|---|---|---|
| `returns_disputes` | Il post-vendita entra nell'MVP? | **No, fuori MVP.** I quattro stati invisibili (§2) restano tali per scelta: `Return/Dispute` non entra nell'object map di questo giro. La priorità 2 del context packet dell'handoff (`Sale → Shipment → Return`) si accorcia a `Sale → Shipment` |
| `marketplace_accounts` | Serve una schermata per collegare un account? | **Sì, serve.** Resta oggetto di prima classe da modellare in Fase 1, come già previsto in §3 |
| `settlement_ledger` | Oggetto o aggregato? | **Aggregato.** Resta il numero calcolato che è oggi (`cassaSettlement`), non entra nell'object map: si tratta come *derived data*, insieme a `WeeklyRevenuePoint` e alle altre viste calcolate di §1 |

---

## Metodo: ricavati, non inventati

Nessun oggetto qui è di fantasia. Ognuno è già presente in **almeno una** di queste due fonti, ed
è annotato con entrambe:

- **UI** — un tipo in `apps/web/types/maat.ts` che i componenti manipolano davvero
- **Canonico** — una tabella in `services/backend/_sql/`

La colonna più interessante è dove le due **non** coincidono: è lì che il disallineamento vive.

---

## 1. Contabilità

| Oggetto | UI (`types/maat.ts`) | Canonico (`_sql/`) | Stato |
|---|---|---|---|
| **Accounting Entry** *(primario)* | `AccountingEntry` | `accounting_entries` | ✅ esiste in entrambe |
| **Sale** | `Sale` | `sales` · `sales_snapshots` | ✅ entrambe |
| **Supplier** | `Supplier` | `suppliers` | ✅ entrambe |
| **Lot** *(«carico»)* | `Lot` | `lots` | ✅ entrambe |
| **Settlement** | ❌ solo l'aggregato `cassaSettlement` in `accounting-mock.ts` | `settlement_ledger` | ✅ **deciso 02/09: aggregato, non oggetto** — fuori dall'object map |

**Aggregati, non oggetti.** `WeeklyRevenuePoint`, `PlatformShare`, `CategoryShare` sono viste
calcolate, non entità con identità e ciclo di vita. Non entrano nell'object map: entreranno come
*derived data* nei brief di Fase 5.

**Attributi core** (dai tipi reali, importi sempre in centesimi):
- Accounting Entry: `eventDate` · `itemLabel` · `category` · `marketplace` · `entryType`
  {sale, return, expense, refund} · `status` {confirmed, escrow, pending} · `grossAmountCents` ·
  `platformFeeCents` · `shippingCostCents` · `netAmountCents`
- Lot: `code` · `supplierName` · `acquiredAt` · `executedAt` · `type` {pezzo, ingrosso} ·
  `quantity` · `category` · `allocationMethod` {uniform, weight_based, manual} ·
  `totalCostCents` · `pricePaidCents`

**Domanda aperta per Fase 1.** `entryType: "return"` esiste in Contabilità, ma il reso **non è un
oggetto** da nessuna parte nella UI (vedi §2). Oggi il reso è una riga contabile senza il fatto
logistico che l'ha generata.

---

## 2. Logistica

| Oggetto | UI (`types/maat.ts`) | Canonico (`_sql/`) | Stato |
|---|---|---|---|
| **Shipment** *(primario)* | `Shipment` | `fulfillments` | ✅ entrambe |
| **Return / Dispute** | ❌ **assente** | `returns_disputes` | ✅ **deciso 02/09: fuori MVP** — resta invisibile per scelta, non entra nell'object map di questo giro |

**Attributi core di Shipment:** `itemLabel` · `sku` · `marketplace` · `carrier` · `trackingCode` ·
`recipient` · `status` {da_fare, fatti, spediti, consegnati} · `hoursAgo` · `priceCents` ·
`destinationCity {name, lat, lng}`.

🔴 **Il buco più serio dell'estensione.** `returns_disputes` esiste sul canonico con i suoi stati
(`returning`, `ready_for_pickup`, `returned`, `disputed`, `resolved`), e `items.status` ne porta
quattro nel proprio ciclo di vita. Ma `lib/lifecycle.ts` li collassa **tutti su `sold`**: un capo
in reso appare **VENDUTO**, e nessuna schermata lo contraddice. L'unica traccia della parola
«reso» in tutta la UI è una notifica mock.

È la stessa cosa che il registro traccia come «quattro stati canonici su undici sono invisibili».
Qui si vede da dove viene: **manca l'oggetto**, non una schermata. Finché Return/Dispute non è un
oggetto di prima classe, non c'è posto dove metterlo.

---

## 3. Pubblicazione

| Oggetto | UI (`types/maat.ts`) | Canonico (`_sql/`) | Stato |
|---|---|---|---|
| **Listing** *(primario atteso)* | ❌ **nessun tipo** | `listings` | 🔴 **oggetto canonico senza oggetto UI** |
| **Offer** | `Offer` | `offers` | ⚠️ esiste in UI ma **vive in Home e Notifiche**, non in Pubblicazione |
| **Marketplace Account** | ❌ assente | `marketplace_accounts` | 🔴 assente in UI — ✅ **deciso 02/09: in scope**, serve la schermata |
| **Publish Strategy** | `StrategyConfig` / `PlatformStrategy` (store locale) | `tenant_publish_settings` | ⚠️ solo `localStorage`, mai persistita |

🔴 **Pubblicazione non ha un oggetto proprio.** `lib/publishing-mock.ts` non esporta **un solo
tipo**: esporta sei funzioni (`isReadyToPublish`, `isLive`, `isSoldOutEverywhere`,
`getToPublishItems`, `getLiveItems`, `getDraftCount`) che filtrano o contano `InventoryItem`. La
schermata è quindi una **vista filtrata di Catalog Entry**, non la gestione di un oggetto Listing.

Ma `listings` è una tabella canonica con identità propria (`external_id`, `external_url`,
`price_cents`, `negotiable`, `per_listing_status`, `published_at`, `delisted_at`). Un capo
pubblicato su tre marketplace ha **tre Listing**, con prezzi e stati diversi. Oggi la UI lo
rappresenta come tre pallini colorati su una riga di inventario.

Questa è la conseguenza diretta del fatto che l'area non è mai passata da OOUX: senza Round 1
nessuno si è chiesto «qual è l'oggetto qui», e la risposta di default è stata «il capo».

**Nota terminologica.** Il registro disallineamenti ha confermato (03/08) che S-04 è la **dogana
cross-piattaforma** ed è questa pagina. Il nome è giusto: la dogana è il posto dove il Catalog
Entry diventa uno o più Listing. Serve però l'oggetto che ci passa attraverso.

---

## Relationship Map (bozza, da validare in Fase 1)

```
Catalog Entry ──1:N──► Listing ──1:N──► Offer
      │                   │
      │                   └──N:1──► Marketplace Account
      │
      └──1:1──► Sale ──1:1──► Shipment ──0:1──► Return/Dispute   [fuori MVP, deciso 02/09]
                  │                                  │
                  └──────1:N──► Accounting Entry ◄───┘

Lot ──1:N──► Catalog Entry          (un carico produce N capi)
Supplier ──1:N──► Lot
Publish Strategy ──config──► Listing (per-marketplace)
```

Due catene, un solo punto di giunzione: **Catalog Entry**. La catena di sinistra è
acquisto→catalogo (Lot, Supplier), quella di destra è pubblicazione→vendita→spedizione→denaro.

---

## Cosa questo Round 1 dice, in breve

1. **Contabilità e Logistica hanno oggetti veri** e già allineati fra UI e canonico. Sono le due
   aree più sane: l'estensione OOUX lì serve a formalizzare, non a raddrizzare.
2. **Pubblicazione no.** È l'unica delle tre a non avere un oggetto proprio, e la mancanza si vede
   nel codice (zero tipi esportati, solo predicati). Va costruito **Listing** come oggetto.
3. **Return/Dispute manca ovunque nella UI** pur essendo canonico, ed è la causa dei quattro stati
   invisibili.
4. Tre oggetti canonici non avevano alcuna rappresentazione UI: `settlement_ledger`,
   `returns_disputes`, `marketplace_accounts`. **Decisi il 02/09** (vedi sezione dedicata sopra):
   `settlement_ledger` resta aggregato, `returns_disputes` fuori MVP, `marketplace_accounts` in
   scope.

## Prossima fase

Fase 1 — MCSFD sulle relazioni, prioritizzando le tre di maggiore impatto:

1. `Catalog Entry → Listing` (1:N) — *edge keystone*, è l'edge che oggi non esiste
2. `Sale → Shipment` — Return/Dispute escluso, fuori MVP per decisione 02/09
3. `Lot → Catalog Entry` (1:N) — la ripartizione costi, che tocca il pricing

Non prima della validazione di questo Round 1.
