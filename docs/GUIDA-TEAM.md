# MAAT — Guida al lavoro sulle interfacce (per il team)

> Documento di onboarding per chiunque lavori sulle interfacce di MAAT.
> Spiega **cosa abbiamo costruito**, **cosa funziona**, **come si lavora sulla repo** e — soprattutto —
> **il metodo di lavoro**: prima si progettano gli elementi e le schermate in **HTML**, poi si
> collegano al prototipo **Next.js**.
>
> Per lo stato di dettaglio e il backlog operativo vedi [`HANDOFF.md`](../HANDOFF.md).
> Ultimo aggiornamento: 2026-07-18 · Owner: Federico D'Orsi

---

## 1. Cosa stiamo costruendo

**MAAT** è un SaaS B2B per il resale di abbigliamento vintage: automatizza il ciclo di vita del capo
(foto → catalogazione AI → pricing → pubblicazione multi-marketplace → contabilità).

Questo repo (`salesops-dashboard`) è la **web app desktop/backoffice** — il pannello dove il venditore
gestisce inventario, schede capo, notifiche. È un **prototipo funzionante e condivisibile**: serve al team
per vedere a colpo d'occhio quali schermate esistono, quali funzionano e quali mancano, e come base di
codice reale su cui costruire l'MVP.

- **Live:** <https://salesops-dashboard-mu-six.vercel.app>
- **Repo:** <https://github.com/FedericoLuigiDOrsi/salesops-dashboard>

> C'è anche un **filone mobile parallelo** (app nativa Expo/React Native) in
> `~/Documents/GitHub/maat-photo-to-catalog` — non è questo repo. Qui si lavora sul **web**.

---

## 2. La storia dello sviluppo interfacce (come siamo arrivati qui)

Serve per capire *perché* le cose stanno dove stanno.

1. **Analisi requisiti (BBA/WBA, metodo MBSE).** Prima di disegnare, i due sottosistemi documentati
   (Catalog Management e Photo-to-Catalog) sono passati da un'analisi black-box/white-box → requisiti,
   stati, funzioni. Vive in `dedalo-os/projects/maat/technical/`.
2. **OOUX / ORCA → schermate.** Dai requisiti si è derivato l'**object map** (Catalog Entry, Photo,
   Notification) e la mappa delle schermate (lista, dettaglio, review, cattura foto, inbox).
3. **Design system "MP076".** È nato il linguaggio visivo: palette (near-black `#001F3F` + fluo
   `#DBE64C`), font Geist + JetBrains Mono, token di spazio/forma/motion, e i componenti (atomi →
   molecole → pattern → organismi). Vive come **libreria di card HTML** in
   `dedalo-os/projects/maat/technical/ooux/maat-ds/` (i file `@dsCard`).
4. **Stitch → accantonato.** Un primo tentativo con Google Stitch è stato abbandonato (output stale,
   palette divergente). Non usarlo come riferimento.
5. **v0 + Next.js = questo repo.** Si è partiti da un template v0 ("SalesOps Dashboard") e lo si è
   **riskinnato** con i token MP076, trasformandolo nella web app MAAT.
6. **5 fasi di build (già fatte).** Vetrina → Onboarding → Review/aggiungi articolo → Inventario+scheda
   → Notifiche+Home+Impostazioni. Dettaglio in [`HANDOFF.md §5`](../HANDOFF.md).

**Lezione appresa (importante):** in passato il lavoro si era sparpagliato tra repo diversi, cartelle
`~/Downloads` e branch mai mergiati. **Da qui in avanti si lavora sempre dal repo** (vedi §6).

---

## 3. Cosa funziona oggi (verificato in produzione)

Tutto quanto sotto è live, build pulita, zero errori console:

| Area | Route | Cosa fa |
|---|---|---|
| **Home** | `/` | Dashboard: StatTiles (Totale/Bozze/Confermati/Locali), coda "Azioni richieste", notifiche recenti |
| **Inventario** | `/capi` | 3 preset operazione (Lavorazione / Catalogo / Ricerca) × 3 viste (Tabella / Card / Kanban) |
| **Scheda capo** | `/capi/[id]` | Dettaglio con foto, 10 attributi, ciclo di vita. Si apre **in overlay** sopra la lista (URL condivisibile, refresh-safe) |
| **Review** | `/capi/[id]/review` | ⚠️ schermata cardine, **bloccata su 2 decisioni** (vedi HANDOFF §6) |
| **Notifiche** | `/notifiche` | Inbox con badge live, "segna tutte lette", raggruppamento per giorno |
| **Impostazioni** | `/impostazioni` | Tab Profilo + Tab Brand tenant |
| **Onboarding mobile** | `/mobile/maat-shell.html` | Prototipo HTML mobile con illustrazioni SVG animate |

I dati sono **mock** (`lib/maat-mock.ts`, `lib/tenant-mock.ts`) — non c'è ancora backend/auth.

---

## 4. Il metodo di lavoro: **prima HTML, poi Next.js** ⭐

Questo è il cuore di come lavoriamo. Ogni nuovo elemento o schermata nasce in **due fasi**.

### Perché HTML-first
- **Velocità:** un file `.html` si apre nel browser e si itera senza build, senza dipendenze, senza React.
- **Revisione facile:** chiunque nel team apre il file e vede il risultato — anche chi non tocca React.
- **Design prima del codice:** si decide l'estetica e l'interazione quando costare cambiare idea è ~zero.
- **Contratto condiviso:** l'HTML usa gli stessi **token MP076** del React, quindi il porting è meccanico.

### Fase 1 — Progetta l'elemento/schermata in HTML
1. Crea un `.html` **autonomo** (tutto inline: `<style>` + markup). Modello di riferimento:
   `public/mobile/maat-shell.html` — copia il suo blocco `:root` di token MP076 in testa al file.
2. Usa **solo le variabili token** per colori/spazi/forme/motion (`var(--fluo)`, `var(--ink)`,
   `var(--r-card)`, `var(--ease)`…). Mai valori hardcoded: è ciò che tiene tutto coerente.
3. Rendi tutto accessibile: `aria-*`, focus visibile (`--focus-ring`), e rispetta
   `@media (prefers-reduced-motion: reduce)` per le animazioni.
4. **Dove salvarlo:**
   - Schermata/flusso mobile completo → `public/mobile/` (viene servito e linkabile dall'app).
   - Nuovo atomo/molecola di design system → tienilo allineato alla libreria canonica in
     `dedalo-os/.../maat-ds/` (i file `@dsCard`).
5. Verifica in browser (desktop + 375px mobile), console pulita. Poi **commit + push** (§6).

### Fase 2 — Collega l'HTML al prototipo Next.js
Quando l'HTML è validato, lo si porta in React come componente/route:
1. Traduci il markup in un componente in `components/maat/` (o una route in `app/`).
2. **Traduci i token** dai nomi HTML ai nomi React/Tailwind (vedi tabella §4.1). I valori esadecimali
   sono identici: cambia solo il nome della variabile.
3. Riusa i primitivi shadcn già presenti (`components/ui/`: Button, Sheet, Tabs, Dialog, Badge…) invece
   di reimplementare.
4. Cabla i dati mock (`lib/*-mock.ts`) e lo stato (`lib/maat-store.tsx`, `lib/notifications-store.tsx`).
5. `pnpm build` deve passare (è il nostro type-check/lint gate). Verifica visiva della route. Poi push.

> **Regola anti-divergenza:** l'HTML resta la fonte del *design*; il React è l'*implementazione*. Se
> cambi l'estetica di un elemento, aggiorna prima l'HTML, poi riporta la modifica in React — non solo
> in un lato.

### 4.1 — Il ponte dei token: HTML ↔ React (design system MP076)

Stessa palette, due nomenclature. Definizioni canoniche:
`public/mobile/*.html` (blocco `:root`) e `app/globals.css` (`:root` + `@theme inline`).

| Ruolo | HTML (`--nome`) | React / Tailwind (`--nome`) | Valore MP076 |
|---|---|---|---|
| Canvas / sfondo | `--bg` | `--background` | `#F6F7ED` |
| Testo primario (near-black) | `--ink` | `--foreground` | `#001F3F` |
| Superficie card | `--surface` | `--card` | `#FFFFFF` |
| **Accento fluo** (azione) | `--fluo` | `--primary` · `--ring` | `#DBE64C` |
| Testo secondario | `--ink-2` | `--muted-foreground` | `#5B6670` |
| Superficie sunken | `--surface-sunken` | `--secondary` · `--muted` | `#ECEDE3` |
| Successo / Confermato | `--green` · `--status-confermato` | `--success` | `#00804C` |
| Errore / Rifiutato | `--red` | `--destructive` · `--danger` | `#E5484D` |
| Bordo / hairline | `--hairline` | `--border` · `--input` | `rgba(0,31,63,.10)` |
| Sidebar scura | `--surface-dark` | `--sidebar` | `#001F3F` |
| Font testo / mono | `--font` / `--mono` | `--font-sans` / `--font-mono` | Geist / JetBrains Mono |

> **Non inventare valori nuovi.** Se serve un colore/spazio che non esiste, aggiungilo **prima** al
> contratto token (in entrambi i mondi), poi usalo.

---

## 5. La mappa: quale HTML ↔ quale React

Per capire cosa è già "in Fase 2" e cosa è ancora "solo HTML":

| Elemento / schermata | HTML (Fase 1) | React (Fase 2) | Stato |
|---|---|---|---|
| App shell / navigazione | `public/mobile/maat-shell-account.html` (**v2**, nav Capi→Inventario + Pubblicazione) | `components/maat/AppShell.tsx` | ✅ entrambi (rail collassabile + tabbar/FAB mobile) |
| Catalog card | `public/mobile/maat-catalog-card.html` | `components/maat/CatalogCard.tsx` | ✅ entrambi |
| Cattura foto | `public/mobile/acquisizione-foto-v2b.html` | `components/maat/PhotoCaptureFlow.tsx` | 🟡 React parziale |
| Aggiungi articolo / Review | `public/mobile/maat-p2c-flow.html` | `components/maat/ReviewForm.tsx` | 🟡 bloccato (HANDOFF §6) |
| Onboarding | `public/mobile/maat-onboarding-flow.html` | — | 🔵 solo HTML |
| Inventario capi (Tabella/Card/Kanban) | — | `CatalogTable` · `CatalogCard` · `CatalogKanban` | ✅ solo React |
| Scheda capo (dettaglio + overlay) | — | `CatalogEntryDetail` · `EntrySheet` | ✅ solo React |
| Notifiche | — | `NotificationInbox` · `NotificationRow` | ✅ solo React |
| Home dashboard | — | `HomeDashboard` · `StatTile` | ✅ solo React |
| Impostazioni | `public/mobile/maat-shell-account.html` (pannello `#settings`) | `components/maat/SettingsModal.tsx` | ✅ entrambi (modal, non più route) |
| Auth (login + registrazione) | `public/mobile/maat-auth.html` | `app/login` · `app/registrazione` (+ `AuthLayout`) | ✅ entrambi (UI mock, no OAuth) |
| Onboarding interattivo | `public/mobile/maat-onboarding-interattivo.html` | `app/onboarding` (+ `OnboardingFlow`) | ✅ entrambi (UI mock; billing/plan fuori scope) |
| Contabilità + Fornitori/Carico + Storico carichi | `maat-shell-account.html` v2 (`#contabilita`) | `app/contabilita` (+ `AccountingView`, `RegistraCaricoDialog` esteso nome/prezzo/data) | ✅ entrambi (mock, `recharts`) |
| Logistica | `maat-shell-account.html` v2 (`#logistica`) | `app/logistica` (+ `LogisticsView`) | ✅ entrambi (mock) |
| Inventario unificato (capi + listing + automazioni) | `maat-shell-account.html` v2 (`#inventario` + `#autoDrawer`) | `app/inventario` (+ `InventoryView` v2, `AutomazioniDrawer`) | ✅ entrambi (mock; sostituisce sia `/capi` sia la vecchia `InventoryView` listing) |
| Pubblicazione | `maat-shell-account.html` v2 (`#pubblicazione`) | `app/pubblicazione` (+ `PublishingView`) | ✅ entrambi (stub placeholder in entrambi) |
| Home v2 (panoramica configurabile + offerte/vendite) | `maat-shell-account.html` v2 (`#home`) | `app/page.tsx` (+ `HomeDashboard`, `home-mock`) | ✅ entrambi (mock) |
| Notifiche v2 (offerte/controfferta/anteprima) | `maat-shell-account.html` v2 (`#notifiche` + `#offPop`/`#artPreview`/`#actModal`) | `app/notifiche` (+ `NotificationInbox`, `notifications/OfferPopup`·`ArticlePreview`·`ActivityModal`) | ✅ entrambi (mock) |
| Settings · Metodi di pagamento | `maat-shell-account.html` v2 (`#settings` pane pagamento) | `SettingsModal` (pane `pagamento`) | ✅ entrambi (form carta mock, no PSP) |

Libreria completa degli atomi/molecole/pattern (in HTML `@dsCard`): `dedalo-os/.../maat-ds/`.

---

## 6. Come lavorare sulla repo

### Setup
```bash
git clone https://github.com/FedericoLuigiDOrsi/salesops-dashboard.git
cd salesops-dashboard
pnpm install          # usa pnpm (c'è pnpm-lock.yaml — non npm/yarn)
pnpm dev              # http://localhost:3000
pnpm build            # gate: deve passare prima di ogni push
```
Requisiti: Node 22.x, pnpm.

### Regola d'oro: **sempre dal repo, mai solo in locale**
Il lavoro che non è pushato **non esiste**. Ogni sessione:
1. **Inizio:** `git pull`. La verità è su `origin/main`, non sulla tua copia.
2. **Durante:** per modifiche grosse/rischiose lavora su branch `feat/<area>/<cosa>`; per fix piccoli e
   sicuri, direttamente su `main` va bene. Se tocchi un HTML mobile, modificalo in `public/mobile/` —
   **mai** in `~/Downloads`.
3. **Prima di committare:** `pnpm build` verde + verifica visiva in browser delle route toccate.
4. **Fine:** `git add` mirato (mai `git add -A` alla cieca) → `git commit` → **`git push`**.
5. Aggiorna [`HANDOFF.md`](../HANDOFF.md) (stato/backlog) se hai chiuso o aperto qualcosa.

### Convenzione commit
```
feat(<area>): <cosa aggiunta>     es. feat(capi): editor con lock
fix(<area>): <cosa corretta>
docs: <cosa documentata>
```

### Deploy ⚠️
- **Stato attuale:** l'auto-deploy da push **non scatta** (verificato 2026-07-18). Finché non è
  riparato (serve il dashboard Vercel — vedi HANDOFF §7), il deploy va lanciato a mano:
  ```bash
  vercel --prod
  ```
- Dopo il deploy, controlla che <https://salesops-dashboard-mu-six.vercel.app> sia verde.

---

## 7. Prossimi passi & backlog

Backlog prioritizzato completo in [`HANDOFF.md §6`](../HANDOFF.md). In sintesi:

- 🔴 **Sbloccare S-10 (Review scheda):** 2 decisioni aperte (contratto attributi 10 vs 12; dove vive il
  blocco "prezzo suggerito").
- 🟡 **Tier 1:** rifinire flusso P2C (misure ArUco lato web mancano, processing, esito).
- 🟠 **Tier 2-4:** editor con lock, gestione offerte/resi, accounting, gestione bozze… (nessun prototipo).
- 🔵 **Backlog ALTA:** login/auth (la app parte "dopo il login" ma il login non esiste), timeline
  auto-delist, connessioni marketplace, repricing, batch multi-select, magazzino+QR, bundle.

Stato per-schermata: tracker `~/Downloads/maat-ui-tracker.html` — **da portare nel repo** (oggi è locale).

---

## 8. Riferimenti

- **Handoff operativo (stato + backlog):** [`HANDOFF.md`](../HANDOFF.md)
- **Design system MP076 (libreria elementi HTML `@dsCard`):** `dedalo-os/projects/maat/technical/ooux/maat-ds/`
- **Token React:** `app/globals.css` · **Token HTML:** blocco `:root` in `public/mobile/*.html`
- **Componenti MAAT:** `components/maat/` · **Primitivi shadcn:** `components/ui/`
- **Stato & dati mock:** `lib/`
- **App mobile nativa (filone parallelo):** `~/Documents/GitHub/maat-photo-to-catalog`
- **Live:** <https://salesops-dashboard-mu-six.vercel.app>
