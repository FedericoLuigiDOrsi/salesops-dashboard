# Anteprime storiche del design system — luglio 2026

> **Non sono la fonte di verità di come si vede MAAT.** Lo è l'applicazione che gira.
> Queste otto anteprime sono il punto di partenza, congelate il 02/09/2026.

## Perché sono state congelate

Sono nate per portare il design system dentro Claude Design via `@dsCard`, quando l'app non
esisteva ancora. Adesso i componenti hanno un'implementazione React viva, e un'anteprima statica
che mostra la stessa cosa diventa **una seconda fonte di verità sull'aspetto**: quella che diverge
in silenzio e che nessuno si accorge sia diventata falsa.

Non è un'ipotesi, è successo. Al momento del congelamento:

- tre di queste mostravano `CatalogCard` e `StatTile`, cancellati come orfani lo stesso giorno
- `30-pattern.html` si intitola «Stat, Banner, Toast, Accordion, Progress, Modal, Skeleton»:
  **cinque di quei sette non esistono nell'app** (verificato per importatori, 02/09)
- hanno un solo commit, il consolidamento in blocco del 03/08, quindi la loro età reale non è
  ricavabile dal git log. È la stessa trappola che `11-disallineamenti-attivi.md` documenta:
  la data git non dice quanto è vecchio il contenuto

## Cosa resta vivo, un livello sopra

In `../` restano le cinque anteprime che **non duplicano** un componente, ma sono la sorgente da
cui un pezzo di design è nato, come i mockup di Marco in `apps/web/public/mobile/`:

| File | Cos'è |
|---|---|
| `50-acquisizione-foto-v2b.html` | la board da cui è nato `PhotoCaptureMobile` |
| `51-onboarding-schermate.html` | la board da cui è nato `OnboardingFlow` |
| `onboarding-export.html` | l'export dell'onboarding animato |
| `_anim-proto-demo.html` · `_anim-export.html` | i prototipi delle animazioni |

## Se ti serve vedere un componente

Fai girare l'app. Se serve una vista catalogo dei componenti, si costruisce un generatore che
li renda dal codice reale: un'anteprima aggiornata a mano torna falsa al primo cambiamento, e
la prova è questa cartella.

## Chi le mantiene

**Nessuno, per decisione.** Sono storiche. Se una di queste va aggiornata, prima si chiede se
serve davvero l'anteprima o se serve aprire l'app.
