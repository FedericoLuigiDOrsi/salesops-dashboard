# Redesign bento Home — MAAT

Data: 2026-07-21
Repo: `salesops-dashboard` (main, partito da `116c691`)
Handoff di partenza: `.session/handoff.md` (vault Second Brain), sessione dedicata separata dal debug/navigazione live dello stesso giorno.

## Contesto

Un primo tentativo (stessa giornata) di applicare un effetto luce animato (`GridBeam`) alla Home è stato scartato: l'effetto aveva senso solo dove esiste già una griglia interna reale (Panoramica), non sui widget-lista. Questa spec riparte da zero sul problema vero: **come i widget Home comunicano importanza tramite dimensione e forma**, non tramite un effetto decorativo sopra un layout invariato.

## Obiettivo

Introdurre un sistema bento a due livelli — griglia Home (i 6 widget-card) e griglia interna di Panoramica (le tile KPI) — dove dimensione e forma di ogni elemento riflettono un'importanza fissa per ruolo, con piccole variazioni guidate dai dati reali dentro ogni fascia.

## Architettura: due livelli, stesso principio

1. **Livello Home** — i 6 widget-card (`Panoramica`, `Offerte`, `Vendite`, `Azioni richieste`, `Notifiche`, `Entrate`) in `components/maat/HomeDashboard.tsx`.
2. **Livello Panoramica** — le tile delle metriche configurabili dentro `PanoramicaWidget.tsx`, definite in `HOME_METRICS` (`lib/home-mock.ts`).

Stesso meccanismo su entrambi i livelli: **fascia fissa per ruolo** (grande/medio/piccolo, decisa a design-time, non calcolata) determina dimensione + trattamento visivo; **il dato live modula solo dentro la fascia** (badge/contatore, accento su urgenza) senza mai cambiare dimensione o posizione.

## Fasce

### Home (6 widget)

| Fascia | Widget | Perché |
|---|---|---|
| Grande | Panoramica, Offerte | overview d'ingresso + actionable/soldi/tempo |
| Medio | Azioni richieste, Entrate | backlog operativo / trend finanziario retrospettivo |
| Piccolo | Vendite, Notifiche | sola lettura / passivo |

### Panoramica (8 metriche in `HOME_METRICS`)

| Fascia | Metriche (key) |
|---|---|
| Grande | `entrate`, `offerte` |
| Medio | `bozze`, `escrow`, `spedizioni` |
| Piccolo | `catalogo`, `pubblicati`, `venduti` |

La fascia è una proprietà del widget-key / metric-key, non un campo che l'utente edita. Scelta di quali widget/metriche mostrare e il loro ordine restano liberi esattamente come oggi (`home-layout-store.tsx`, popover "Modifica" di Panoramica).

## Trattamento visivo per fascia — "Silhouette"

Non solo dimensione: **la struttura interna della tile cambia per fascia**, non solo raggio/bordo/padding.

- **Grande**: layout orizzontale — valore in evidenza a sinistra, contesto/delta a destra (es. Entrate: `€ 2.680` + `+12%` sulla stessa riga).
- **Medio**: layout verticale classico (label sopra, valore sotto) — sostanzialmente quello di oggi.
- **Piccolo**: layout a pillola/riga singola — dot + label + valore inline, niente stacking verticale.

Approvato dopo confronto visivo di 3 direzioni (companion su porta 51576, screen `tier-treatment.html`) contro le alternative "scala di peso" (solo spazio/tipografia) ed "elevazione" (ombra + fondo muted).

## Geometria griglia Home — bento incastrata

Griglia a 4 colonne con `grid-flow-dense`. Regola: **stessa fascia → stesso footprint**, per non vanificare il senso della gerarchia fissa.

- Grande → `col-span-2 row-span-2` (Panoramica, Offerte)
- Medio → `col-span-2 row-span-1` (Azioni richieste, Entrate)
- Piccolo → `col-span-1 row-span-1` (Vendite, Notifiche)

Nota implementativa: Panoramica dentro il suo blocco 2×2 contiene a sua volta la bento interna delle metriche — verificare in implementazione che ci stia comodamente con la selezione di default (6 metriche); se è troppo stretta, l'unica valvola di sfogo è dare a Panoramica un footprint dedicato leggermente più ampio (es. `col-span-3`) restando comunque distinguibile da Offerte — da verificare quando si vede il rendering reale, non a priori.

Scartate due alternative più semplici (righe per fascia; altezza-sola con larghezza sempre metà/intera) perché "troppo poco bento" — Federico ha confermato la mosaic a span misti nonostante il costo implementativo più alto.

**Correzione post-approvazione (emersa scrivendo il piano di implementazione)**: la regola iniziale "mai sotto mezza larghezza" era incompatibile con la tabella dei footprint qui sopra (Piccolo a `col-span-1` su una griglia a 4 colonne È un quarto di larghezza). Federico ha confermato: **si accetta il quarto di larghezza per Piccolo** (Vendite, Notifiche), a patto di ridisegnare la loro resa compatta per starci — vedi sotto. Il vincolo di mezza larghezza minima è quindi rimosso, non si applica più.

**Resa compatta per Piccolo (Vendite, Notifiche) a 1/4 di colonna**:
- Vendite: riga compatta senza SKU (dot + nome capo troncato + prezzo), anteprima limitata alle 2 vendite più recenti (oggi ne mostra 4 senza limite) — invariato l'accesso a tutte tramite link "Tutte".
- Notifiche: anteprima limitata alle 2 notifiche più recenti (oggi 3), riga compatta con icona più piccola, messaggio troncato più aggressivamente.

Mobile: colonna singola come oggi, invariato.

## Drag & drop

`components/maat/HomeDashboard.tsx` usa `@dnd-kit` con `rectSortingStrategy`, pensata per celle uniformi. Con span misti l'animazione di riordino rischia di essere meno precisa.

**Decisione**: tenere il drag&drop libero così com'è (nessuna riscrittura della strategia di collision/sorting in questa fase) e verificarne il comportamento reale con gli span misti implementati. Se l'esperienza risulta visibilmente rotta (salti, animazioni scorrette), si interviene in un secondo passaggio — non bloccante per il primo ship.

## Variazione dati dentro la fascia

Fascia e posizione restano fisse; il dato reale modula **badge/contatore** e **accento cromatico su urgenza**, ancorati ai campi realmente disponibili:

| Widget/metrica | Segnale urgenza | Campo sorgente |
|---|---|---|
| Offerte | età dell'offerta pending più vecchia (es. "ieri" pesa più di "1 h") | `Offer.time` (`lib/activity-mock.ts`) |
| Azioni richieste | età del capo più vecchio in coda | `CatalogEntry.createdAt`, già ordinato in `actionQueue()` (`lib/catalog-stats.ts`) |
| Notifiche | conteggio non lette | `Notification.letta` |
| Entrate | accento solo se delta settimanale negativo | `weeklyKpi.revenueDeltaPct` (`lib/accounting-mock.ts`) — oggi +14.5%, quindi silente di default |
| Vendite | nessun accento | sola lettura, niente da segnalare |
| Panoramica (metriche) | badge/accento solo a soglia fissa, decisa in implementazione (`HOME_METRICS` non ha timestamp, solo valore statico) | `lib/home-mock.ts` |

## Fuori scope

- Non si tocca il contenuto/priorità dei dati mostrati (quali metriche esistono, cosa dice ogni widget) — solo presentazione, dimensione, forma.
- Non si introduce alcun effetto decorativo animato (niente `GridBeam`/canvas — approccio già scartato).
- Non si ridisegna la logica di `useHomeLayout` (persistenza localStorage, add/remove widget) — resta invariata.
- Soglie esatte per gli accenti a soglia fissa (bozze, escrow, spedizioni, ecc.) non sono definite qui — da tarare in implementazione con dati reali/Federico.

## Verifica

Dopo l'implementazione: verifica browser end-to-end (aggiunta/rimozione widget, drag&drop con span misti, toggle metriche Panoramica, resize mobile→colonna singola) prima di considerare il lavoro concluso — coerente con la skill `verify` già usata in questo repo.
