# Pubblicazione multipiattaforma — design

Data: 2026-07-29 · Owner: Federico D'Orsi

## Contesto

`/pubblicazione` esiste come stub (`components/maat/publishing/PublishingView.tsx`), un
`EmptyState` "in lavorazione" con solo un bottone Aggiorna finto. Questo spec disegna la
schermata vera.

Metafora guida: **dogana in/out**. La pagina governa il traffico dei capi tra MAAT e le
piattaforme esterne — sia l'uscita (capi mai pubblicati che partono) sia il rientro
operativo su capi già live (bulk price edit, ripubblicazione, ritiro, regole automatiche).

## Scope shift da Inventario

Oggi `AutomazioniDrawer` (`components/maat/inventory/AutomazioniDrawer.tsx`) vive dentro
Inventario e gestisce 4 blocchi: auto-delist, repricing automatico, auto-relist,
pubblicazione multipiattaforma manuale (globali, non per-piattaforma).

**Decisione**: Pubblicazione diventa l'unico centro comando per tutto ciò che è
cross-platform. Cambia:

- `InventoryToolbar` perde il bottone "Automazioni".
- `InventoryView.tsx` perde `automazioniOpen` state, l'import e il render di
  `AutomazioniDrawer` (righe 12, 42, 117-118, 243 nello stato pre-redesign).
- `AutomazioniDrawer.tsx` viene eliminato; la sua logica migra (rifattorizzata
  per-piattaforma, vedi sotto) in `publishing/StrategySheet.tsx`.
- Inventario resta **sola lettura** sullo stato piattaforma: tiene `PlatformPills`
  com'è oggi, nessun controllo di regole.

## Architettura pagina

```
app/pubblicazione/page.tsx → PublishingView.tsx

Header
  eyebrow "Pubblicazione multipiattaforma" · H1 "Pubblicazione" · subtitle
  [Strategie ⚡]  [Aggiorna ↻]

Tabs
  [Da pubblicare (N)]   [Live (N)]

Contenuto tab attiva
```

`Strategie` apre una `Sheet` (side="right", stesso pattern di `AutomazioniDrawer` oggi) —
non un terzo tab: separa "governo delle regole" da "lavoro operativo riga per riga".

### Dati sorgente

Nessuna nuova entità capo. Si riusano `InventoryItem` e `PlatformListingState` da
`lib/inventory-mock.ts`:

- **Da pubblicare** = `status === "catalogo"` e `platforms` tutti `null` (mai listato).
- **Live** = almeno un valore in `platforms` diverso da `null`.
- Righe con `status === "bozza"` non compaiono in nessuna delle due tab (non sono
  pronte): la pagina non le edita, mostra solo un banner con link a Inventario.

## Tab "Da pubblicare"

Tabella: thumb foto, brand/tipoCapo, SKU, categoria, taglia, prezzo, checkbox riga.
Toolbar: ricerca + filtro categoria (no filtro piattaforma, niente è ancora listato).

Banner condizionale sopra la tabella se esistono bozze non pronte:
> "N capi in bozza non ancora pronti per la pubblicazione → completali in Inventario"
> (link a `/inventario?status=bozza`)

Selezione righe → barra azione flottante in basso:
`N capi selezionati` · chip piattaforme (default = piattaforme predefinite configurate in
Strategie) · bottone **Avvia pubblicazione**.

Flusso: al click, le righe passano a stato visuale `pending` (badge + spinner inline);
dopo un timeout mock (~1.5s, pattern analogo al `refresh()` esistente ma più lungo per
dare sensazione di processo reale) i `platforms` selezionati passano ad `"active"` e la
riga migra nella tab Live.

## Tab "Live"

Tabella: thumb, brand/tipoCapo, SKU, prezzo, `PlatformPills` (riuso diretto del
componente esistente `components/maat/inventory/PlatformPills.tsx`), data ultima
modifica, checkbox riga. Filtro piattaforma (Vinted/Grailed/Depop) + ricerca.

Righe con almeno un platform `"sold"` e nessuno `"active"`/`"pending"` sono visivamente
attenuate ed escluse dalla selezione bulk (niente da fare su un capo già venduto ovunque).

### Azioni riga (kebab menu)

- **Ripubblica** → apre `RepublishSheet`: prezzo editabile + toggle piattaforme target,
  conferma. Editing limitato a prezzo e piattaforme — titolo/descrizione/foto non si
  toccano da qui (restano di competenza della scheda prodotto in Inventario).
- **Ritira** → delist manuale con conferma (pattern `ConfirmGateButton` esistente).

### Selezione multipla → barra azione flottante

- **Modifica prezzo bulk**: input con toggle `%` / `€`, bottone "Anteprima" → dialog con
  elenco righe selezionate, prezzo-prima → prezzo-dopo per riga, conferma applica.
- **Ripubblica selezionati**: stesso `RepublishSheet` in modalità multi-riga (piattaforme
  toggle comuni; prezzo bulk se serve si fa prima con l'azione sopra).
- **Ritira selezionati**: conferma, delist bulk.

## Sheet "Strategie"

Stessa struttura visuale di `AutomazioniDrawer` oggi (3 `AutoCard`: Auto-delist,
Repricing automatico, Auto-relist), ma ogni card ora contiene **una riga per
piattaforma** invece di un singolo switch globale:

```
Auto-delist
 ├ Vinted   [●on]  ritira invenduti dopo [90gg ▾]
 ├ Grailed  [○off]
 └ Depop    [●on]  ritira invenduti dopo [60gg ▾]

Repricing automatico
 ├ Vinted   [●on]  -5%  ogni 7gg   floor 40%
 ├ Grailed  [○off]
 └ Depop    [●on]  -10% ogni 14gg  floor 30%

Auto-relist
 ├ Vinted   [●on]  ogni 7gg
 ├ Grailed  [○off]
 └ Depop    [○off]
```

La 4ª card di oggi ("Pubblicazione multipiattaforma" manuale, coi chip piattaforme
predefinite) **non esiste più come card**: è ora letteralmente la tab "Da pubblicare"
della pagina. Le piattaforme predefinite restano una preferenza salvata, ma diventano
una riga compatta in cima alla sheet Strategie (chip piattaforme, senza switch/soglie:
non è una regola automatica, è solo il default che pre-seleziona la barra azione della
tab "Da pubblicare").

### Data model

Nuovo tipo in `lib/publishing-strategy.ts`:

```ts
type PlatformStrategy = {
  autoDelist: { enabled: boolean; staleDays: number };
  repricing: { enabled: boolean; discountPct: number; frequencyDays: number; floorPct: number };
  autoRelist: { enabled: boolean; frequencyDays: number };
};
type StrategyConfig = {
  defaultPublishPlatforms: PlatformKey[];
  platforms: Record<PlatformKey, PlatformStrategy>;
};
```

Persistenza: stesso pattern `localStorage` già usato da `settings-store.tsx` /
`home-layout-store.tsx` (context + localStorage), non uno store nuovo da zero.

## Componenti nuovi/modificati

- `components/maat/publishing/PublishingView.tsx` — riscritto (header, tabs, sheet trigger)
- `components/maat/publishing/ToPublishTab.tsx` — nuovo
- `components/maat/publishing/LiveTab.tsx` — nuovo
- `components/maat/publishing/StrategySheet.tsx` — nuovo (sostituisce `AutomazioniDrawer`)
- `components/maat/publishing/RepublishSheet.tsx` — nuovo
- `components/maat/publishing/BulkPriceBar.tsx` + `BulkPricePreviewDialog.tsx` — nuovi
- `components/maat/inventory/AutomazioniDrawer.tsx` — **eliminato**
- `components/maat/inventory/InventoryToolbar.tsx` — rimosso bottone "Automazioni"
- `components/maat/inventory/InventoryView.tsx` — rimosso state/import/render del drawer

## Out-of-scope (YAGNI)

- Nessun backend reale: tutto mock/localStorage come il resto dell'app, timeout finti
  per simulare publish/repricing.
- Nessun editing titolo/descrizione/foto per piattaforma dentro Pubblicazione — solo
  prezzo e piattaforme target. Editing contenuto capo resta in Inventario/scheda prodotto.
- Nessuna vista calendario/agenda delle prossime run automatiche (solo switch + soglie,
  come oggi in AutomazioniDrawer).
- Nessun bulk edit prezzo sulla tab "Da pubblicare" — lì si sceglie solo su quali
  piattaforme pubblicare; il prezzo si tocca solo su capi già Live.
- Nessuna selezione multi-capo per la tab "Da pubblicare" oltre a piattaforme comuni
  (non serve editing per-riga in quella fase, è pre-pubblicazione).

## Testing

Verifica principale = `pnpm build` (type-check/lint gate) + verifica visiva in browser
su entrambe le tab e la sheet Strategie. Il progetto ha `vitest` configurato
(`vitest.config.ts`) e test unitari già presenti su funzioni pure vicine per stile
(`lib/urgency.test.ts`, `lib/tiers.test.ts`, `lib/logistics-mock.test.ts`,
`lib/home-mock.test.ts`) — se emergono funzioni pure di calcolo (bulk price diff,
prossima data repricing) coprirle con un test unitario coerente con quel pattern.
