# MAAT — SalesOps Dashboard · Handoff di sviluppo

> **Regola d'oro di questo progetto: si lavora SEMPRE dal repo, mai più solo in locale.**
> Ogni sessione parte da `git pull` e finisce con `git push`. Niente lavoro che resta
> su una macchina sola, niente file stranded in `~/Downloads` o nel vault.
> Questo documento è la fonte di verità per riprendere lo sviluppo: tienilo aggiornato
> a fine di ogni sessione.

Ultimo aggiornamento: 2026-07-20 · Owner: Federico D'Orsi

> 👥 **Onboarding team e metodo di lavoro (HTML-first → Next.js):** [`docs/GUIDA-TEAM.md`](docs/GUIDA-TEAM.md).
> Questo file è invece la vista "stato + backlog" per riprendere lo sviluppo.

---

## 1. Cos'è, in una frase

Prototipo funzionante (non mockup statico) della web app desktop/backoffice di **MAAT**
— il SaaS B2B per il resale di abbigliamento vintage. Serve al team come **prototipo
cliccabile condivisibile** per capire quali schermate sono fatte e quali no, e come base
di codice reale su cui costruire l'MVP.

- **Live (produzione):** <https://salesops-dashboard-mu-six.vercel.app>
- **Repo:** <https://github.com/FedericoLuigiDOrsi/salesops-dashboard>  ⚠️ *vedi §7 punto 1 — repo personale, da spostare in org DedaloTeam*
- **Deploy:** ⚠️ **auto-deploy da Git NON scatta al momento** (verificato 2026-07-17: il commit
  `6a72fda` pushato su `main` non ha prodotto alcun deploy dopo 9h; il repo risulta "connected" ma
  il webhook non triggera). Finché non è sistemato (vedi §7 punto 1) **il deploy va fatto a mano**:
  `vercel --prod` dalla root del repo. La live gira quindi su un deploy potenzialmente più vecchio
  di `main`.

---

## 2. Stack & requisiti locali

| Cosa | Versione / nota |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + shadcn/ui + Tailwind |
| Linguaggio | TypeScript |
| Package manager | **pnpm** (c'è `pnpm-lock.yaml` — non usare npm/yarn) |
| Node | 22.x |
| Date | `date-fns` (già installato) |

Nessun test runner: la verifica è `pnpm build` (type-check/lint gate) + verifica visiva in browser.

### Setup da zero
```bash
git clone https://github.com/FedericoLuigiDOrsi/salesops-dashboard.git
cd salesops-dashboard
pnpm install
pnpm dev            # http://localhost:3000
pnpm build          # gate prima di ogni push
```

---

## 3. Architettura — approccio ibrido (IMPORTANTE)

Il prodotto vive su **due binari dentro questo unico repo**, serviti da **un solo deploy**:

1. **App React reale** (`app/`, `components/maat/`, `lib/`) — Capi, scheda prodotto, Notifiche,
   Home, Inventario, Contabilità, Logistica, Impostazioni (modal). È il codice più avanzato del progetto.
2. **Prototipi HTML mobile** (`public/mobile/`) — Onboarding, flusso "aggiungi articolo/cattura foto"
   e lo Shell+Account originale di Marco, serviti come static da `/mobile/*.html` (non più linkati
   dall'AppShell — restano come sorgente di design/riferimento, non come route dell'app).

> **Fonte di verità degli HTML = `public/mobile/` (versionato).** I file sciolti in
> `~/Downloads/*.html` sono **archivio storico**: non modificarli lì, non ripartire da lì.

### I 3 filoni di build MAAT (per non confondersi)
| Filone | Dove | Chi | Ruolo |
|---|---|---|---|
| **Desktop (questo repo)** | `salesops-dashboard` | Federico + Marco | Backoffice web / prototipo condivisibile |
| Mobile (Expo/RN) | `~/Documents/GitHub/maat-photo-to-catalog` | Matteo Palomba | App nativa venditore + backend reale + CV misure |
| Design system (spec) | `dedalo-os/projects/maat/technical/ooux/maat-ds` | Federico | Token MP076 + spec componenti (`@dsCard` HTML) |

Regola design system (`maat-design-system.md` v2.0, "dual"): gli **atomi** (Button, StatusBadge…)
devono restare identici tra mobile e web; gli **organismi** possono divergere
(PhotoCaptureFlow = mobile; CatalogTable/Kanban = desktop).

---

## 4. Mappa del codice

### Route (`app/`)
```
/                         app/page.tsx            Home dashboard (StatTiles, coda azioni, notifiche recenti)
/inventario               app/inventario/page.tsx **Inventario unificato** (v2): catalogo capi + stato listing per piattaforma in una vista. Toolbar ricerca, seg Tutti/Bozze/A catalogo/Venduti (conteggi live), filtri Categoria/Taglia/Prezzo/Piattaforma, viste Tabella/Griglia, drawer Automazioni
/pubblicazione            app/pubblicazione/page.tsx  Pubblicazione multipiattaforma — **stub placeholder** ("in lavorazione", come nel mockup)
/notifiche                app/notifiche/page.tsx  Inbox (badge live, "segna tutte lette", raggruppo per giorno)
/contabilita              app/contabilita/page.tsx  KPI settimana, andamento 8 settimane (recharts), distribuzione piattaforma/categoria, cassa/settlement, transazioni, Fornitori, **Storico carichi** + dialog carico esteso (nome/prezzo/data)
/logistica                app/logistica/page.tsx  Spedizioni raggruppate per piattaforma (corriere/tracking/stato/consegna)
/capi                     app/capi/*              ⚠️ **DEPRECATA** (v2): fuori dal nav, superata da /inventario. File non rimossi (catalog list/kanban/detail-overlay/review + flusso Crea capo /capi/nuovo/foto/[label] ancora on-disk e raggiungibili via URL)
/login                    app/login/page.tsx       Login — scelta metodo social-first + form email, validazione zod  [UI mock, pre-login → fuori dall'AppShell]
/registrazione            app/registrazione/page.tsx  Registrazione — social-first + form email (hint password live + conferma)  [UI mock] → submit success punta a /onboarding?step=browser
/onboarding               app/onboarding/page.tsx  Tour prodotto (welcome→bozza) + continuazione post-signup (browser→canali→fatto via ?step=)  [UI mock, fuori dall'AppShell]
/mobile/*.html            public/mobile/           Prototipi HTML (onboarding, cattura foto, shell v2, auth)
```
Impostazioni non è più una route: è il **modal** `SettingsModal` (8 pannelli), aperto dal bottone account
nell'AppShell (rail desktop o app-bar mobile). `app/impostazioni/` e `SettingsView.tsx` rimossi. Nav v2:
Home · Inventario · Pubblicazione · Notifiche · Contabilità · Logistica (Capi fuori). FAB Crea capo → `/capi/nuovo/foto/fronte`.

### Componenti (`components/maat/`)
AppShell · CatalogCard · CatalogEntryDetail · CatalogKanban · CatalogTable · EntrySheet ·
ReviewForm · AttributeField · PhotoCaptureFlow · PhotoGrid · PhotoSlot · NotificationInbox ·
NotificationRow · HomeDashboard · SettingsModal · StatTile · StatusBadge · SegmentedFilter ·
Sequence · ConfirmGateButton · EmptyState · AuthLayout · SocialButtons · PasswordInput ·
onboarding/OnboardingFlow · accounting/AccountingView · accounting/RegistraCaricoDialog ·
logistics/LogisticsView · inventory/InventoryView (v2 unificato) · inventory/AutomazioniDrawer ·
publishing/PublishingView

### Stato & dati (`lib/`)
`maat-store.tsx` · `notifications-store.tsx` (context, badge live) · `settings-store.tsx` (context: modal
Impostazioni + profilo/ruolo + brand, condiviso rail/app-bar/SettingsModal) · `catalog-presets.ts` (i 3
preset-operazione, usati solo da /capi deprecata) · `catalog-stats.ts` · `maat-mock.ts` · `tenant-mock.ts` ·
`accounting-mock.ts` · `logistics-mock.ts` · `suppliers-mock.ts` (+`loadHistory`) · `inventory-mock.ts`
(v2: `InventoryItem` unificato capo+listing) · `measures.ts` (ArUco).
Tipi in `types/maat.ts` (`Lot` esteso: `name`/`executedAt`/`pricePaidCents`).

---

## 5. Cosa è FATTO (le 5 fasi già shippate, commit su `main`)

- [x] **Fase 0** — Vetrina: HTML mobile in `public/mobile/` + link "Anteprima mobile" nell'AppShell.
- [x] **Fase 1** — Onboarding: illustrazioni SVG animate (no PNG pesanti), piattaforme WIP grigie non selezionabili.
- [x] **Fase 2** — Review/aggiungi articolo: flusso verticale a scroll unico, 10 attributi, blocco
      prezzo acquisto/consigliato/margine con ricalcolo live, confidence senza % (solo dot + legenda).
- [x] **Fase 3** — Inventario + scheda: fix lookup per `id`, preset-operazione, overlay scheda via
      Intercepting + Parallel Routes.
- [x] **Fase 4** — Notifiche (store condiviso + badge) · Home reale · Profilo/Brand tenant.
- [x] **Fase 5** — Auth UI (login + registrazione, flusso **combo social-first**): route `/login` e `/registrazione`
      fuori dall'`AppShell` (isolamento via prefissi in `AppShell.tsx`), validazione `zod` + hint password live
      (8/speciale/maiuscola) + conferma password, submit mock → `/`. Social Google/Apple = **placeholder** (manca OAuth).
      Sorgente design: `public/mobile/maat-auth.html`. Deriva dal batch HTML di Marco 20/07.
- [x] **Fase 6** — Onboarding interattivo (`app/onboarding`, componente `OnboardingFlow`): tour prodotto welcome→
      piattaforme→demo AI→camera(shoot animato)→bozza, poi continuazione post-signup browser→canali→fatto
      (raggiunta solo via `?step=browser` dopo una registrazione reale — niente pannelli register/login duplicati,
      tutti i CTA "prosegui/salta" del tour portano a `/registrazione` vera). **Fuori scope** (per design, coerente
      con la review): piano+pagamento (richiede PSP, mai stato nel port), loghi piattaforma reali (badge iniziali al
      posto dei PNG), progress-dots decorativi. `restart()` del prototipo → sostituito con uscita reale a `/`.
      Sorgente design: `public/mobile/maat-onboarding-interattivo.html`. Deriva dal batch HTML di Marco 20/07.
- [x] **Fase 7** — Shell + Account: `AppShell` ricostruito — rail desktop collassabile (216↔64px, persistito
      `localStorage`) + bottom-tab-bar/FAB mobile (Capi/Crea capo/Notifiche); voce "Impostazioni" diventata
      **modal** (`SettingsModal`, 8 pannelli: Generale con Brand/tono/estetica, Account con toggle ruolo
      Admin/Operator **cosmetico**, Dipendenti, Piano e fatturazione, Notifiche/Privacy/Lingua placeholder,
      Tutorial→riapre `/onboarding`). 3 domini nuovi: **Contabilità** (KPI settimana, categoria top, andamento
      8 settimane in `recharts`, distribuzione piattaforma/categoria, cassa/settlement, tabella transazioni +
      export CSV reale, sezione Fornitori con dialog "Registra carico" al pezzo/all'ingrosso), **Logistica**
      (spedizioni per piattaforma), **Inventario** (stato listing per piattaforma + fulfillment, sui capi
      `available` esistenti). Tipi/mock **informati dal target Supabase reale** (schema minimo: `AccountingEntry`,
      `Lot`, `Shipment`, `Supplier` — vedi `Reference/research/maat/maat-airtable-database-fields.md` nel vault,
      cluster C11/C12), non ancora collegati a un DB (resta mock locale, coerente col resto del prototipo).
      **Fuori scope**: role-gate reale (resta cosmetico, nessuna route protetta), entità `suppliers`/`carichi`
      come tabelle vere (restano stato locale in `AccountingView`). Sorgente design:
      `public/mobile/maat-shell-account.html`. Deriva dal batch HTML di Marco 20/07.
- [x] **Fase 8** — Shell **v2** (ri-architettura, da mockup aggiornato `maat-shell-account.html` v2, build multi-agent):
      **Nav/IA**: "Capi" esce dal menu, **Inventario** diventa la destinazione primaria, +**Pubblicazione**;
      tabbar mobile Inventario/FAB/Notifiche. **Inventario unificato** (`app/inventario` + `inventory/`): fonde
      catalogo capi + stato listing per piattaforma — toolbar ricerca, seg stato Tutti/Bozze/A catalogo/Venduti
      (conteggi live), filtri Categoria/Taglia/Prezzo/Piattaforma, viste Tabella/Griglia, pill piattaforma per
      stato, **drawer Automazioni** (auto-delist · repricing · auto-relist · pubblicazione multipiattaforma, con
      switch/chip/stepper/select, stato locale). **Contabilità** +Storico carichi + dialog carico esteso
      (nome/prezzo/data). **Pubblicazione** = stub placeholder. `/capi` **deprecata** (fuori dal nav, file non
      rimossi). **Fuori scope v2, rimandati**: Home ridisegnata (panoramica configurabile + offerte/vendite),
      Notifiche rifatte (vendite/offerte + controfferta + anteprima articolo), Settings Metodi di pagamento.
      Sorgente design: `public/mobile/maat-shell-account.html` (v2). Deriva dal batch HTML di Marco 20/07.

Piano originale completo: era in `~/.claude/plans/jaunty-stirring-raven.md` (locale — se serve
storicizzarlo, va copiato qui in `docs/`).

---

## 6. Cosa MANCA — backlog prioritizzato

Fonte: tracker schermate `~/Downloads/maat-ui-tracker.html` (23 schermate S-00→S-22 + backlog).
⚠️ **Il tracker stesso è "solo in locale"** — vedi §7 punto 4, va portato nel repo.

### ✅ 2 decisioni chiuse (20/07) — S-10 sbloccata (Review scheda)
1. **Gate di conferma:** DECISO — gate composito **AND** (3 foto `validated` + campi obbligatori OK). Sostituisce il
   conflitto tra `10 — UIUX Screens.md` (solo campi) e CTA-matrix/MCSFD (solo foto). Propagato nei doc OOUX 20/07.
2. **Contratto attributi:** DECISO — S-10 si disegna sul contratto **v2, 10 attributi** (`ATTRIBUTE_ORDER` del
   codice) + misure derivate per categoria via ArUco, non i 12 del vecchio `02-object-guide.md`.

### 🔴 Ancora aperto
1. **Blocco "prezzo suggerito"** (REQ-213/214): dove vive il suggerimento AI → accetta/modifica. Senza casa.

### 🟡 Tier 1 — flusso P2C core (in `dev`/`review`, da rifinire)
- S-08 misure ArUco: esiste in mobile, **manca la versione web**.
- S-07 caricamento foto, S-09 processing, S-11 esito: rifinire.
- S-12 catalogo lista / S-13 dettaglio+timeline: valorizzare in demo.

### 🟠 Tier 2-4 — non iniziati (nessun prototipo, `todo`)
Editor con lock (S-14) · gestione offerte (S-18) · resi & conformity (S-19) ·
gestione bozze (S-15) · elimina & recupera (S-16) · account tenant (S-03) ·
settings pubblicazione (S-04) · stato degradato (S-22).

Accounting/escrow (S-20), listing & fulfillment (S-17) e logistics (S-21): 🟢 **UI FATTA 2026-07-20** —
`/contabilita`, `/inventario`, `/logistica` (mock locale, dati statici informati dallo schema Supabase
target — vedi Fase 7 in §5); manca il backend reale (`accounting_entries`/`shipments`/`listings` veri).

### 🔵 Backlog ALTA (gap di prodotto emersi in review, senza schermata)
Login/Auth (S-26): 🟢 **UI FATTA 2026-07-20** — route `/login` + `/registrazione` (mock, social-first); manca il backend Supabase/OAuth · timeline auto-delist
"venduto→rimosso" (S-23, la killer feature) · connessioni marketplace OAuth (S-24) · repricing/ribasso
multi-select (S-24r) · sessione batch multi-select (S-25 — l'ICP fa decine di capi/giorno) · magazzino
fisico + QR (S-25m) · ordini/bundle multi-capo (S-27) · analytics/KPI (S-26a, MEDIA).

---

## 7. Decisioni aperte (owner: Federico)

1. **Riparare l'auto-deploy Git → Vercel** (🔴 priorità). Il repo è "connected" ma i push non
   triggerano deploy (verificato 2026-07-17). Da controllare nel dashboard Vercel:
   Project → Settings → Git (auto-deploy attivo? branch `main`?) e l'installazione della GitHub App
   sul repo. Finché non scatta, ogni "vetrina" al team richiede `vercel --prod` a mano.
2. **Spostare il repo in org `DedaloTeam`** (oggi è su account personale `FedericoLuigiDOrsi`).
   Senza questo, il team non collabora davvero: vanno invitati collaboratori uno a uno.
   (Nota: cambiare owner del repo spesso richiede di ri-collegare l'integrazione Vercel — buon
   momento per sistemare anche il punto 1.)
2. **Progetto Vercel** è sotto scope personale `federicoluigidorsis-projects` → invitare il team
   o spostarlo su un team Vercel.
3. **Pointer in dedalo-os:** `dedalo-os/projects/maat/README.md` non menziona questo repo né il link
   live (parla ancora solo della landing WebGL). Va aggiunto un rimando (il codice prodotto NON entra
   in dedalo-os per policy — solo il pointer).
4. **Portare il tracker schermate nel repo:** `~/Downloads/maat-ui-tracker.html` è l'unico posto dove
   vive lo stato per-schermata, ma è locale + localStorage. Va committato (es. `public/tracker.html`
   o `docs/`) così è condiviso e non si perde.
5. **Piattaforme WIP onboarding:** default attuale = Vinted+Depop attive, Vestiaire/Catawiki/eBay grigie
   "Presto". Da confermare.

---

## 8. Protocollo di lavoro — "sempre con la repo, mai più solo in locale"

**A inizio sessione**
1. `git pull` sul repo. Non fidarti di copie locali: la verità è su `origin/main`.
2. Apri questo `HANDOFF.md` e il tracker: decidi UNA cosa da chiudere.

**Durante**
3. Lavora su un branch se il cambiamento è grosso/rischioso: `feat/<area>/<cosa>`.
   Per fix piccoli e sicuri, direttamente su `main` va bene (questo repo auto-deploya main).
4. Se tocchi un HTML mobile, modificalo in `public/mobile/` — **mai** in `~/Downloads`.
5. Prima di committare: `pnpm build` deve passare. Verifica visiva in browser delle route toccate.

**A fine sessione (non negoziabile)**
6. `git add` mirato (mai `git add -A` alla cieca) → `git commit` → **`git push`**.
   Nessun lavoro resta solo sulla macchina. Se non è pushato, non esiste.
7. Aggiorna la sezione §5/§6 di questo file e (se lo portiamo nel repo) il tracker.
8. **Deploy:** finché l'auto-deploy non è riparato (§7 punto 1), lancia `vercel --prod` a mano dopo
   il push, poi controlla che <https://salesops-dashboard-mu-six.vercel.app> sia verde. Una volta
   sistemato, basterà il push e questo passo diventa solo "verifica che il deploy sia verde".

**Convenzione commit**
```
feat(<area>): <cosa aggiunta>      es. feat(capi): editor con lock
fix(<area>): <cosa corretta>
docs: <cosa documentata>
```

---

## 9. Link rapidi

- Live: <https://salesops-dashboard-mu-six.vercel.app>
- Repo: <https://github.com/FedericoLuigiDOrsi/salesops-dashboard>
- Design system (spec + token MP076): `dedalo-os/projects/maat/technical/ooux/maat-ds/`
- App mobile nativa (filone parallelo): `~/Documents/GitHub/maat-photo-to-catalog`
- Tracker schermate: `~/Downloads/maat-ui-tracker.html` *(da portare nel repo — §7.4)*
