# MAAT Design System — spec concettuale + riferimento implementazione reale

Due cose in una cartella: (1) il pacchetto pronto per il sync verso **Claude Design** (tool
Anthropic) — ogni card `.html` ha un marker `<!-- @dsCard group="…" name="…" -->` in prima
riga; (2) da qui sotto, il riferimento sull'implementazione reale (`apps/web/components/maat/`),
consolidato il 01/08/2026 (era diviso su 4 copie divergenti — `packages/design-system/`,
`apps/web/`, questa cartella, un orfano in `apps/web/styles/`; ora questa è l'unica spec,
il codice vivo è `apps/web/`).

## Struttura
```
maat-ds/
├── DESIGN.md         ← design system canonico (la costituzione)
├── COMPONENTS.md      ← spec di ogni atomo/molecola/pattern/organismo, incl. Addendum v2
├── OBJECTS.md          ← modello dati OOUX (Catalog Entry, Photo, Notification), v2 con 10 attributi
├── design-tokens.json← token machine-readable (primitive + semantic)
├── styles.css        ← render closure (@import fonts+tokens+components) — ciò che Claude Design dà ai design
├── tokens.css        ← IL CONTRATTO (CSS variables MP076) — single source of truth
├── components.css    ← classi componente (.btn, .badge, .slot, .ccard, …)
├── fonts.css         ← Geist + JetBrains Mono (Google Fonts)
├── _storico-2026-07/  ← le 8 anteprime CONGELATE il 02/09 (vedi il suo README)
│                        duplicavano componenti vivi e alcune mostravano roba cancellata
├── 50-acquisizione-foto-v2b.html    ← board da cui è nato PhotoCaptureMobile
├── 51-onboarding-schermate.html    ← board da cui è nato OnboardingFlow
├── onboarding-export.html          ← export onboarding animato (PR #44 dedalo-os)
├── _anim-proto-demo.html           ← prototipo animazioni onboarding
├── _anim-export.html               ← export delle animazioni
└── _anim-demo.css                  ← CSS delle animazioni onboarding
```

> I quattro file di animazione arrivano da `dedalo-os` (PR #44, 22/07), portati qui col merge
> OOUX del 03/08. Fino a quel giorno esistevano solo lì.

> ⚠️ **Le anteprime rimaste sono cinque, e sono tutte SORGENTI, non specchi.** Mostrano da dove è
> nato un pezzo di design, come i mockup di Marco in `apps/web/public/mobile/`. Le otto che
> duplicavano un componente vivo sono state congelate in `_storico-2026-07/` il 02/09: erano una
> seconda fonte di verità sull'aspetto, e avevano già smesso di dire il vero (`30-pattern.html`
> mostra sette elementi, cinque dei quali non esistono nell'app).
>
> **Per vedere un componente, fai girare l'app.** Se un giorno serve una vista catalogo, si
> costruisce un generatore che la ricavi dal codice: un'anteprima aggiornata a mano torna falsa
> al primo cambiamento.

## Sync — caricamento MANUALE @dsCard (dal TUO terminale)
⚠️ La skill `/design-sync` è pensata per repo **React** (con `package.json`/`dist`/Storybook): su questo pacchetto HTML il suo converter NON parte. Si carica **manualmente** via lo strumento DesignSync, che costruisce le voci del Design System dai marker `@dsCard`. Serve un terminale interattivo (l'app non si autentica).

Da un Claude Code in terminale, dentro questa cartella, dai questa istruzione:
> Non usare la skill /design-sync (è per repo React; questo è un design system HTML scritto a mano).
> Carica manualmente in Claude Design via lo strumento DesignSync:
> 1. `/design-login` (account F). 2. `DesignSync list_projects` (verifica che "MAAT" non esista).
> 3. `DesignSync create_project` name "MAAT — Photo to Catalog"; salva il projectId in `.design-sync/config.json`.
> 4. `DesignSync finalize_plan`: projectId, localDir = questa cartella, writes = ["*.html","*.css","DESIGN.md","design-tokens.json","README.md"], deletes = [].
>    *(dal 02/09 `*.html` raccoglie le cinque sorgenti: le otto storiche stanno in una sottocartella e restano fuori, com'è voluto.)*
> 5. `DesignSync write_files` tutti i file via localPath. Le card `*.html` hanno `@dsCard` in prima riga → diventano voci; `styles.css` fornisce lo stile ai design.
> 6. Apri https://claude.ai/design → Design systems → MAAT.

## Poi: creare le schermate
In Claude Design, template **Prototype**, selettore **Design system → MAAT**, prompt = i brief della Fase 5 (`../05-sketch-brief.md`). Una schermata alla volta, dal Dettaglio capo.

## Iterare
Cambi un componente → ri-`/design-sync` (incrementale, un componente alla volta).

---

## Riferimento implementazione reale

Sezione fusa da `packages/design-system/README.md` il 01/08/2026 (quel pacchetto conteneva
uno snapshot React del prototipo, ormai indietro rispetto a `apps/web/components/maat/` su
ogni file — vedi `MIGRATION.md` §5. Contenuto non duplicato altrove, spostato qui).

### Divergenza token naming — MP076 semantico vs shadcn reale

`design-tokens.json` usa nomi semantici MP076 (`--accent`, `--surface-dark` ecc.), mentre il
CSS reale shippato in `apps/web/app/globals.css` usa la convenzione shadcn (`--primary`,
`--sidebar` ecc.). Tabella di corrispondenza:

| MP076 semantico | shadcn / `globals.css` reale | Valore |
|---|---|---|
| `--accent` (fluo, azione) | `--primary` | `#DBE64C` |
| `--on-accent` | `--primary-foreground` | `#001F3F` |
| `--bg` | `--background` | `#F6F7ED` |
| `--surface` | `--card` | `#FFFFFF` |
| `--text-primary` | `--foreground` | `#001F3F` |
| `--text-secondary` | `--muted-foreground` | `#5B6670` |
| `--surface-dark` (sidebar) | `--sidebar` | `#001F3F` |
| `--status-bozza/-confermato/-locale` | `--status-bozza/-confermato/-locale` | invariati |

⚠️ **Trap nota**: lo shadcn `--accent` generico (hover/highlight, usato da ~40 componenti
shadcn) **non è** il fluo MP076. Nel prototipo il fluo è mappato su `--primary`, non su
`--accent` shadcn — altrimenti il fluo "sbrodola" su ogni dropdown/select hover. Se riusi
shadcn altrove, mantieni questa distinzione.

### Modello attributi — cosa è cambiato rispetto alla spec ORCA originale

La spec originale (`05-sketch-brief.md`) prevedeva 12 attributi fissi e 4 misure fisse
(larghezza/lunghezza/manica/vita). Il prototipo reale, per richiesta esplicita di Federico
(2026-07-07), usa **10 attributi** (brand, tipo di capo, colore, taglia, materiale, genere,
condizioni, difetti, stile, stagionalità — tolti periodo/fit/rarità, aggiunto condizioni) e
**misure per categoria**, non fisse, derivate da `tipo di capo` (vedi `apps/web/lib/measures.ts`),
calcolate via foto reference con marker ArUco, mai editabili a mano. Dettaglio completo in
`OBJECTS.md` sopra.

### Stack di riferimento del prototipo

Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui · Geist (pacchetto `geist`, non
`next/font/google`) · JetBrains Mono via `next/font/google` · lucide-react per le icone.
