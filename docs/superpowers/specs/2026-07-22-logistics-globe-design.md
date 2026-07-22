# Globo spedizioni — Logistica

**Data**: 2026-07-22
**Stato**: approvato, pronto per il piano di implementazione

## Contesto

`components/maat/logistics/LogisticsView.tsx` mostra oggi una tabella di spedizioni (dati mock in `lib/logistics-mock.ts`). Federico vuole aggiungere un globo 3D con archi animati, ispirato a [Aceternity GitHub Globe](https://ui.aceternity.com/components/github-globe), per dare un colpo d'occhio visivo sulle spedizioni in corso prima della tabella.

## Scope

**Dentro lo scope:**
- Visualizzazione estetica/animata origine→destinazione, dati mock (nessuna integrazione con API di tracking dei corrieri — BRT, InPost, Poste, GLS restano fuori scope)
- Card globo sopra la tabella esistente, nella stessa pagina `Logistica`
- Comportamento passivo: il globo mostra tutte le spedizioni attive, indipendente da filtri/ricerca della tabella sotto
- Origine fissa: Napoli (magazzino DirtyTag)

**Fuori scope:**
- Tracking GPS/posizione reale dei pacchi
- Interattività bidirezionale con la tabella (hover riga ↔ arco) — rimandata a v2 se serve
- Mappa Italia stilizzata (alternativa scartata: il mix di destinazioni europee via Vinted giustifica il globo mondiale)

## Approccio: libreria

**react-globe.gl** (three.js sotto), non `cobe`. È la libreria che il riferimento Aceternity effettivamente incapsula: mappa mondo, archi curvi, atmosfera, ring pulse sui punti di arrivo — massima fedeltà visiva al riferimento. Trade-off accettato: bundle pesante (~200-400KB), client-only, nessuna dipendenza three.js preesistente nel progetto (package.json verificato: assente).

## Architettura

- Nuovo componente `components/maat/logistics/LogisticsGlobe.tsx`, client-only.
- Caricato in `LogisticsView.tsx` via `next/dynamic(() => import(...), { ssr: false })` con skeleton di caricamento — react-globe.gl referenzia `window`/WebGL, incompatibile con SSR.
- Self-contained: importa `shipments` direttamente da `@/lib/logistics-mock`, nessun prop drilling dalla view. Coerente con il comportamento passivo scelto (non riceve lo stato filtrato della tabella).

## Dati

`Shipment` (`types/maat.ts`) esteso con:
```ts
destinationCity: { name: string; lat: number; lng: number }
```
Ogni spedizione mock in `lib/logistics-mock.ts` riceve una città plausibile (mix Italia + qualche capitale UE, coerente con Vinted pan-europeo). Origine fissa: Napoli `{ lat: 40.85, lng: 14.27 }`.

`Shipment` è usato solo nel modulo logistica (verificato via grep: `LogisticsView.tsx`, `logistics-mock.ts`) — estensione a basso raggio d'impatto, nessun altro consumer da aggiornare.

Trasformazione isolata in funzione pura testabile, `lib/logistics-globe-data.ts`:
```ts
buildArcs(shipments: Shipment[], origin: { lat: number; lng: number }): ArcDatum[]
```
Ogni spedizione → un arco `{ startLat, startLng, endLat, endLng, color }`. Colore derivato da `status`, riusando la stessa semantica cromatica di `StatusBadge`. I punti di arrivo alimentano anche `ringsData` (pulse).

## Rendering

- Card `rounded-lg border border-border bg-card`, altezza fissa ~360px, inserita tra l'header "Logistica" e la barra filtri in `LogisticsView.tsx`.
- `pointOfView` iniziale centrato tra Napoli e il baricentro delle destinazioni (Mediterraneo/Europa), non vista globo-intero-da-lontano.
- `arcDashLength` / `arcDashGap` / `arcDashAnimateTime` → il trattino animato lungo l'arco è il "pacco in movimento" richiesto.
- `ringsData` con pulse sui punti di arrivo.
- Rotazione automatica lenta (`autoRotate`, velocità bassa).
- Palette coerente al design system: `--foreground` (#001F3F) per continenti/atmosfera, accenti dai colori di stato esistenti.

## Error handling

Feature-detect WebGL prima del mount (funzione minimale inline, nessuna dipendenza aggiuntiva). Se assente: la card mostra un placeholder testuale invece del canvas, nessun crash, nessun errore console.

## Testing

Unit test Vitest su `buildArcs()` — funzione pura, N spedizioni → N archi con coordinate/colore corretti. Nessun test sul rendering 3D in sé (comportamento visivo): verifica manuale in browser dopo l'implementazione.

## File coinvolti

- `types/maat.ts` — estendere `Shipment`
- `lib/logistics-mock.ts` — aggiungere `destinationCity` a ogni spedizione
- `lib/logistics-globe-data.ts` — nuovo, `buildArcs()` + test
- `components/maat/logistics/LogisticsGlobe.tsx` — nuovo componente
- `components/maat/logistics/LogisticsView.tsx` — dynamic import + inserimento card
- `package.json` — aggiungere `react-globe.gl`, `three`
