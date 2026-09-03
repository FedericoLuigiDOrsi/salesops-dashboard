---
title: "MAAT — Confini frontend↔backend: contratti e porte d'accesso"
date: 2026-09-02
status: draft
owner: Federico D'Orsi
audience: team MAAT (Federico, Marco, Matteo, Checco, Giorgio), primariamente Databros (Checco, Giorgio)
---

# MAAT — Confini frontend↔backend

> Non è `10-audit-plug-and-play.md` (priorità e rischio di ogni confine, in ordine di lavoro) né
> `08-contratti-dati.md` (vocabolario e schema dei dati). Questo documento fotografa, per ogni
> confine tra un frontend (`apps/web`, `apps/mobile`, `apps/extension-vinted`) e il resto del
> sistema, tre cose: **come si chiama davvero** (protocollo, path, porta), **con che autorizzazione**
> e **cosa scambia**. Serve perché nessun documento esistente elenca in un posto solo tutti gli
> accessi reali: `10` §2 ha una topologia compatta di 5 righe, utile per il rischio ma non per
> rispondere "questo endpoint esiste? con che auth? chi lo chiama oggi?".
>
> Metodo: audit read-only del codice su `main` al 2026-09-02, citazioni file:linea. Dove un fatto è
> dedotto dalla lettura statica e non osservato a runtime, è segnalato esplicitamente (§11).
> Aggiornare quando cambia lo stato reale nel codice, non a ogni commit.

## 1. Mappa d'insieme

```
apps/web ──rewrite /api/bff/*──▶ services/backend ("maat-app", BFF Next.js) ──▶ Postgres (RLS)
   │                                        │
   ├──fetch diretto──▶ /api/provision       ├──REST proprio /api/tenants/provision
   │   (proxy, stesso PROVISION_SECRET)     │
   ├──Supabase client (anon+JWT, RLS)──────▶ Postgres (letture)
   │
   └──pg diretto (ruolo bff_writer)────────▶ Postgres (RLS via claim iniettato)

apps/mobile ──Bearer JWT──▶ services/worker/src/server.ts (Express legacy, Railway)
                                    │
apps/extension-vinted ──Vinted diretto (sessione venditore)
        └──URL configurabile a mano (maat_backend_url)──▶ ??? (vedi §7)

services/worker/src/consumer.ts ──RPC only──▶ Postgres (ruolo n8n_worker)
        └──HTTP──▶ Gemini + services/cv (FastAPI, :8000)

services/worker/src/server.ts ──HTTP──▶ Gemini + services/cv (stesso adapter)
```

Postgres/Supabase è l'unica fonte di verità comune. Nessun frontend legge o scrive `services/cv`
direttamente: lo vede solo attraverso il risultato che `services/worker` scrive su `items`.

## 2. `apps/web` → backend: i quattro percorsi reali

| # | Percorso | Meccanismo | Auth | File |
|---|---|---|---|---|
| 1 | Letture | `supabase.from(...)` (mai `supabase.rpc()`, nessuna trovata in `apps/web`) | anon key + sessione JWT, RLS | `lib/inventory-data.ts:58-66`, `lib/review-data.ts:78-86` |
| 2 | Scritture item/foto | `lib/bff.ts` → rewrite `/api/bff/*` → `services/backend` | cookie di sessione, same-origin | `lib/bff.ts:51-79` |
| 3 | Provisioning tenant | `fetch` server-to-server diretto (non passa dal rewrite) | `Bearer PROVISION_SECRET` condiviso con `services/backend` | `app/api/provision/route.ts` |
| 4 | Conferma item | `pg` diretto, ruolo `bff_writer`, claim tenant iniettato per-transazione | sessione → `tenant_id`/`role` passati come claim | `lib/db/bff-writer.ts:64-76` |

**Correzione a un'assunzione precedente**: il percorso 4 (`confirmItemAsBff`) non è "in attesa di
setup Databros". È già agganciato: `lib/actions/review.ts:41` lo chiama dentro `confirmDraft`. Il
commento in `bff-writer.ts:18` ("finché questi non ci sono, questo modulo NON va importato da
confirmDraft") è **stale**, non riflette lo stato reale del codice. Confermato anche da
`apps/web/CLAUDE.md:35` e `HANDOFF.md:66-67,107`, e già tracciato come secondo BFF parallelo in
`11-disallineamenti-attivi.md` #2 e in `10` §3.2 (ADR ancora da fare, non un blocco tecnico).

Perché il rewrite (percorso 2) esiste invece di una `fetch` diretta a `services/backend`: i cookie
di sessione Supabase sono `SameSite=Lax`, quindi una richiesta cross-origin non li porterebbe. Il
rewrite mantiene il browser same-origin; Next inoltra la richiesta server-side coi cookie inclusi
(`lib/bff.ts:1-14`, commento originale).

Configurazione del rewrite: `apps/web/next.config.mjs:17-30`, env `BFF_URL` (default
`http://localhost:3000`, vedi §8). Nessuna `route.ts` locale sotto `/api/bff/` in `apps/web`: è
puro rewrite, risolto a runtime da Next.

## 3. Contratto per ogni chiamata

### 3.1 Via rewrite `/api/bff/*` → `services/backend`

| Metodo | Path chiamato dal browser | Richiesta | Risposta | Sorgente |
|---|---|---|---|---|
| POST | `/api/bff/items` | `{}` (body vuoto) | `{item:{id,...}}` | `lib/bff.ts:51-62` → `services/backend/app/api/items/route.ts:45-80` |
| POST | `/api/bff/photos` | multipart: `file`, `item_id`, `role`, `position` | `{ok:true,key,photo}` (201) o 422/404/500 | `lib/bff.ts:64-79` → `services/backend/app/api/photos/route.ts:17-103` |

`lib/bff.ts` non espone altre funzioni di rete (file letto per intero, 115 righe): `createItem` e
`uploadPhoto` sono le uniche due.

### 3.2 Route propria di `apps/web`

| Metodo | Path | Auth | Cosa fa |
|---|---|---|---|
| POST | `/api/provision` | sessione | Se manca `tenant_id` in `app_metadata`, proxy a `services/backend`'s `/api/tenants/provision` con `Bearer PROVISION_SECRET` (vedi §2 punto 3) |

### 3.3 Letture Supabase dirette

| Tabella | Colonne/join | Sorgente |
|---|---|---|
| `items`+`listings`+`photos` | `id, catalog_ref, brand, category, size, title, status, purchase_price_cents, attributes, listings(marketplace,per_listing_status,price_cents), photos(storage_path,role,position)` | `lib/inventory-data.ts:58-66` |
| `items`+`photos`+`ai_extractions` | `id, catalog_ref, status, brand, category, size, condition, color, material, era, attributes, photos(...), ai_extractions(raw_output,confidence,status,created_at)` | `lib/review-data.ts:78-86` |

### 3.4 Scrittura diretta `bff_writer`

| Funzione | Cosa scrive | Sorgente |
|---|---|---|
| `confirmItemAsBff(itemId,{tenant_id,role})` | `UPDATE items SET status='confirmed' WHERE id=$1`, RLS-scoped via claim iniettato | `lib/db/bff-writer.ts:64-76`, chiamata da `lib/actions/review.ts:41` |

## 4. `services/backend` — endpoint REST completi

Package `maat-app` (Next.js separato, deploy Vercel). Owner: Databros.

| Metodo | Path | Auth | Note |
|---|---|---|---|
| POST | `/api/items` | sessione (cookie inoltrato dal rewrite) | Crea item `draft`. L'insert fa scattare il trigger `items_new_draft_outbox` (§5) |
| GET/PATCH | `/api/items/[id]` | sessione | |
| POST | `/api/items/[id]/confirm` | sessione | Percorso REST del confirm, alternativo al `bff_writer` diretto (§2 punto 4, §3.4) |
| POST | `/api/photos` | sessione | Upload, `lib/storage.ts`: magic-byte, re-encode/strip EXIF, put su R2, signed URL |
| GET | `/api/photos/url` | sessione | |
| POST | `/api/tenants/provision` | `Bearer PROVISION_SECRET` | Chiamata da `apps/web`'s `/api/provision` (§3.2). Usa `service_role` per `supabase.rpc('provision_tenant',...)` + `auth.admin.updateUserById` (RLS legge il tenant dal JWT, non dalle righe) — gestisce anche il retry idempotente su `slug_already_exists` (`route.ts:47-66`) |
| POST | `/api/dev/login` | — | Dev-only |

`services/backend/app/api/publishing/publishingApp.ts` e `publishingPanel.ts` **esistono ma non
hanno nessuna `route.ts` che li monti**. Nessun frontend può raggiungerli su Vercel oggi: l'unico
punto che li istanzia è `test/publishing.test.ts`, che apre un `http.Server` proprio per il test,
fuori da Next. Vedi §7 per l'impatto su `apps/extension-vinted`.

## 5. `services/worker` — due runtime distinti

`services/worker` non è un solo processo: sono due entry point che condividono codice ma girano
separati, con deploy diversi (o assenti).

### 5.1 `src/consumer.ts` — il consumer P2C

Parla **solo** a Postgres, e solo tramite 3 RPC `SECURITY DEFINER` (nessun grant diretto su
tabelle, `services/backend/_sql/21_n8n_worker.sql:41-142`):

- `worker_next_draft(p_vt)` — legge da `pgmq` coda `q_new_draft`
- `worker_write_extraction(...)` — 13 argomenti (dalla migration 31)
- `worker_ack_draft(msg_id)`

Ruolo `n8n_worker`, connessione via Supavisor pooler (porta 6543, vedi §8). Oltre a Postgres, chiama
in HTTP diretto Gemini e `services/cv` (`src/consumer.ts:19-21,82-89`) — quindi non è vero che
"parla solo a Postgres" in senso assoluto: lo è nel suo rapporto col resto della piattaforma MAAT
(non chiama mai `apps/web` o `services/backend`).

Il trigger che lo alimenta: `services/backend/_sql/09_pgmq_outbox.sql:43-47`,
`AFTER INSERT ON items ... WHEN (NEW.status='draft')` → `notify_new_draft()` → `pgmq.send`. È
il collegamento end-to-end reale tra la creazione item da `apps/web` (via `services/backend`'s
`POST /api/items`, §4) e la pipeline AI: insert → coda → `consumer.ts` (ovunque giri) → Gemini + CV
→ `worker_write_extraction` → `apps/web` legge il risultato via lettura diretta Supabase (§3.3).

**Gap trovato, non presente in `07`-`12`**: `services/worker/railway.json:7` deploya
`node src/server.ts` (§5.2), non `consumer.ts`. Non risulta nessun deploy (Railway, cron, processo
persistente) per `consumer.ts` nel repo. `07-stato-implementazione.md:44` dice che il loop è
"sbloccato 01/08, verificato end-to-end su un item reale" ma non dice dove gira in continuo.
**Da chiedere a Databros/Matteo**: `consumer.ts` gira in produzione da qualche parte, o l'unica
prova è stata un `npm run consumer --once` manuale?

### 5.2 `src/server.ts` — Express legacy (Railway)

Ascolta su `PORT` (default 3000). Espone 14 endpoint propri (`src/api/app.ts`): `GET /health`,
`GET /me`, `POST /processing`, `POST/GET /drafts`, `GET /catalog`, `GET/PATCH /items/:id`,
`POST /items/:id/confirm`, `DELETE /drafts/:id`, `POST/DELETE /drafts/:id/photos`,
`POST /drafts/:id/reprocess`, `POST/DELETE /drafts/:id/aruco`, `POST /drafts/:id/remeasure`.

Auth: Bearer JWT, `devVerifier` (HS256, `JWT_SECRET`) o `supabaseVerifier` se sono settate
`SUPABASE_URL`/`SUPABASE_ANON_KEY` (`src/server.ts:33-41`). DB via un pool `pg` proprio
(`src/db/pool.ts`), separato da quello di `services/backend`, ruoli `authenticated`/`service_role`
via `SET LOCAL ROLE` (non lo stesso pattern Supavisor-claim di `bff-writer.ts`, ma stessa intenzione
di RLS-scoping).

**È questo che chiama `apps/mobile`**, non `services/backend`: `apps/mobile/.env.example:4`,
`EXPO_PUBLIC_API_BASE=http://<ip-mac>:3000`; `apps/mobile/src/api.ts:4,16,29` usa quella base con
Bearer dalla sessione Supabase. Path (`/processing`, `/drafts`) e modello foto (7 slot tipizzati
contro l'enum `role` di `services/backend`) sono diversi, coerente con `08-contratti-dati.md` §4.

Monta anche una copia di `publishingRouter` (`src/server.ts:99`, vedi §7).

## 6. `services/cv`

FastAPI, `GET /health`, `POST /measure`, `POST /measure_overlay`, girato con
`uvicorn service:app --host 0.0.0.0 --port 8000` in locale (`CLAUDE.md:26`), deployato come
HuggingFace Space (`mpalomba/maat-cv`, `MIGRATION.md:16`).

Chiamato **solo** da `services/worker` (entrambi i runtime, §5.1 e §5.2, stesso adapter
`src/adapters/cvMeasurePort.ts:29-64`): download foto ArUco da R2, `POST multipart` a
`${CV_SERVICE_URL}/measure`, `Bearer CV_SERVICE_TOKEN` opzionale per lo Space privato. Nessun
riferimento a `CV_SERVICE_URL` o al servizio in `apps/web`/`services/backend` (grep sull'intero
repo): il frontend non lo vede mai direttamente, solo il risultato scritto da `services/worker` in
`items.attributes`/`items.measurements`.

Stub reale ma parziale: il servizio risponde, ma `landmarks.py`'s `measure_points_advanced`/
`measure_pants_points` sono dichiarati stub (`services/cv/CLAUDE.md:15-19`) — senza, capi
top/bottom hanno solo misure approssimate, non il set completo da cuciture.

## 7. `apps/extension-vinted` — due host, uno dei due non canonico

Due backend completamente separati, come dichiarato in `apps/extension-vinted/CLAUDE.md:3-8`
(PUBLISHER vs SENSORE, "comando e stato vivono sempre in MAAT, non qui"):

1. **Vinted stessa**, chiamata diretta dai content script iniettati su `*.vinted.<tld>`, sessione
   del venditore (`credentials:'include'`, nessuna credenziale MAAT coinvolta):
   `POST /api/v2/photos` (`src/content/publisher.js:44`), delete/hide draft (`:133-136`),
   gestione offerte (`:160-172`), risposte conversazione (`:197,222,235`).
2. **Un URL backend MAAT configurabile a mano**: `maat_backend_url` + `maat_token`, salvati in
   `chrome.storage.local` dalla options page (`src/options/options.js:19-25`, campi testo, nessun
   default hardcoded). `src/background/service-worker.js:34-50` chiama, contro quell'URL,
   `GET /queue?marketplace=vinted`, `POST /outcome`, e (in base a cosa espone `publishingApp.ts`)
   `POST /observe`, `GET/POST /offers*`, `GET/POST /threads*`, `GET/POST /like-outreach*`,
   `POST /vinted-items/*`.

**Il problema**: quale deploy dovrebbe essere `maat_backend_url` non è mai stato deciso
operativamente. `services/backend/RICHIESTA-2026-08-02-blocco-6-schema-e-port.md:264-266`
("Decisione 2") mette la superficie HTTP publishing in `services/backend` come destinazione
concettuale, ma lì il router **non ha nessuna route che lo monti** (§4). L'unico deploy dove
`publishingRouter` è davvero raggiungibile oggi è `services/worker/src/server.ts` (§5.2, Railway).
Le due copie del codice (`services/backend/app/api/publishing/publishingApp.ts` e
`services/worker/src/api/publishingApp.ts`) sono quasi identiche riga per riga: l'unica differenza
trovata è l'import di `PhotoSigner`/`PhotoUploader` (`adapters/photoStoragePort.ts` nel worker
contro `adapters/supabaseStorage.ts` nel backend). Esattamente la duplicazione descritta in
`RICHIESTA-2026-08-02-blocco-6-schema-e-port.md` Parte 4/5, la cui soluzione proposta (copia
`services/backend` canonica, driver del worker spostato in un processo long-lived) **non risulta
applicata su `main`**: entrambe le copie esistono ancora, `server.ts:99` monta ancora la sua.

**Da verificare direttamente**: cosa c'è oggi, di fatto, nel campo `maat_backend_url` configurato
nell'estensione installata. Se punta al deploy Railway di `server.ts`, funziona ma non è il
percorso che "Decisione 2" designa come canonico.

## 8. Le porte di accesso

| Servizio | Variabile | Tipo | Consumata da |
|---|---|---|---|
| Supabase Postgres | `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | connessione pubblica + chiave anon | `apps/web`, `services/backend` (letture RLS) |
| Supabase Postgres (bff_writer) | `BFF_WRITER_DATABASE_URL` | `postgresql://bff_writer:<pwd>@<project>.pooler.supabase.com:6543/postgres`, Supavisor **transaction mode, porta 6543** | `apps/web/lib/db/bff-writer.ts:24` |
| Supabase Postgres (n8n_worker) | `WORKER_DATABASE_URL` (documentata solo in commento, non in `.env.example`, vedi sotto) | stesso pooler, porta 6543, ruolo `n8n_worker` | `services/worker/src/consumer.ts:5-14` |
| Supabase Auth (service role) | `SUPABASE_SERVICE_ROLE` | segreto "ASSOLUTO" (commento in `.env.example`), solo server | `services/backend` (provisioning, DR) |
| BFF rewrite | `BFF_URL` | origine di `services/backend`, default `http://localhost:3000` | `apps/web/next.config.mjs:17` |
| Provisioning | `PROVISION_SECRET` | bearer condiviso, deve combaciare fra `apps/web` e `services/backend` | entrambi |
| R2 (storage foto) | `R2_ENDPOINT`/`R2_BUCKET`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` | connessione + chiavi | `services/backend/lib/storage.ts` (read/write pieno); `apps/web/lib/storage.ts` solo signed-URL, commento esplicito "l'upload vive nel BFF, qui NON serve" |
| CV service | `CV_SERVICE_URL` + `CV_SERVICE_TOKEN` | HTTP, porta `:8000` in locale / HF Space in produzione | `services/worker` (entrambi i runtime) |
| Worker legacy Express | `PORT` (default 3000), `JWT_SECRET` | porta HTTP + segreto dev | `services/worker/src/server.ts` |
| Mobile | `EXPO_PUBLIC_API_BASE` | punta a `services/worker/src/server.ts`, non a `services/backend` | `apps/mobile/src/api.ts` |
| Extension | `maat_backend_url` + `maat_token` | configurabile a mano, nessun default | `apps/extension-vinted` (vedi §7) |

**Collisione locale nota**: `services/backend` e `apps/web` hanno entrambi default `:3000` — in
sviluppo locale `apps/web` va avviato su un'altra porta (`pnpm dev --port 3001`).

**`.env.example` stale**: `services/worker/.env.example` documenta solo il vecchio flusso locale
con Postgres Docker (`postgres://maat:maat@localhost:5544/maat_p2c`) e non dichiara
`WORKER_DATABASE_URL`, `CV_SERVICE_URL`, `CV_SERVICE_TOKEN`, che il codice reale usa. Chi controlla
"che env serve" leggendo solo `.env.example` viene fuorviato.

## 9. Cosa diverge dai documenti esistenti

- **`10-audit-plug-and-play.md` §2** (topologia) non ha la freccia `apps/web`'s `lib/bff.ts` +
  rewrite: la sua topologia mostra `apps/web ──REST──▶ services/backend` come un unico arco,
  che in realtà passa per un rewrite Next, non una REST call diretta dal browser. La sezione era
  scritta l'01/08, prima che il terzo percorso fosse formalizzato in `11` (che infatti dice "da
  02/08 sono tre, non due").
- **`07-stato-implementazione.md`** dichiara "50 migrazioni". Sul `main` attuale:
  `services/backend/supabase/migrations/` ne ha **36 applicate**, `_sql/` **43** in staging —
  coerente con `12-data-model.md:14` ("43 file SQL", datato 03/08, generato dalle migrazioni). Il
  numero 50 è precedente alla rimozione di 13 migrazioni vinted il 03/08 (commit `e53eb03`/
  `e460fe4`, documentata in `RICHIESTA-2026-08-03-blocco-6-decisioni-consolidate.md`). `07` va
  aggiornato a 36/43, non 50.
- **`lib/db/bff-writer.ts:18`** ha un commento stale ("non ancora importato da confirmDraft") che
  contraddice `lib/actions/review.ts:41` (vedi §2). Vale la pena correggerlo nel codice, non solo
  qui, perché chi legge solo quel file si costruisce un'idea sbagliata dello stato del quarto
  percorso.
- Nessun documento `07`-`12` enumera la superficie REST di `services/worker/src/server.ts` (14
  endpoint) né il gap di deploy di `consumer.ts` (§5.1): entrambi trattati solo genericamente come
  "Express legacy del worker".

## 10. Domande aperte per Databros

Fotografia, non prescrizione: sono decisioni del team, non imposte da qui.

1. **Dove gira `consumer.ts` in produzione**, se gira da qualche parte, dato che Railway deploya
   `server.ts` e non risulta nessun altro deploy configurato (§5.1).
2. **Quale deploy deve essere il valore canonico di `maat_backend_url`** nell'estensione: il
   `publishingApp.ts` di `services/backend` (destinazione concettuale di "Decisione 2", ma senza
   `route.ts` che lo monti oggi) o quello di `services/worker/src/server.ts` (raggiungibile
   davvero, ma non quello designato)? (§7)
3. **Consolidamento delle due copie di `publishingApp.ts`**: risulta ancora fatto per metà rispetto
   al piano descritto in `RICHIESTA-2026-08-02-blocco-6-schema-e-port.md` — è ancora la direzione
   giusta o è cambiata?
4. **Verifica live del comportamento su richiesta non autenticata a `/api/bff/*`**: il middleware di
   `apps/web` (`proxy.ts`, redirect 307 a `/login`, nessuna eccezione per `/api/*`) e quello di
   `services/backend` (401 JSON pulito, con eccezione esplicita per `/api/tenants/provision` e
   `/api/dev/login`) sembrano avere comportamenti diversi sullo stesso confine. Se confermato, un
   `fetch` non autenticato da `apps/web` riceverebbe una pagina HTML 200 (la redirect seguita dal
   browser) invece di un 401, e il ramo "sessione scaduta" di `lib/bff.ts`'s `humanMessage()`
   risulterebbe morto per questo percorso. **Non verificato a runtime** (§11), va confermato con
   una richiesta reale prima di trattarlo come bug.
5. **`services/worker/.env.example` va aggiornato** con le variabili che il codice reale usa
   (§8), o resta intenzionalmente solo la guida al flusso locale Docker?

## 11. Cosa non è stato verificato in questo giro

- Nessuna richiesta HTTP reale è stata fatta contro un deploy vivo: tutto quanto sopra viene da
  lettura statica del codice su `main`. Il punto §10.4 in particolare è un'ipotesi da un confronto
  di due file di middleware, non un'osservazione diretta.
- Non è stato controllato cosa c'è oggi, di fatto, nel campo `maat_backend_url` configurato
  sull'estensione installata (§7).
- Non è stato verificato se `BFF_WRITER_DATABASE_URL` sia popolata in un ambiente reale oltre al
  test locale (`apps/web/test-bff-writer.mjs` esiste come smoke test, ma non è stato eseguito qui).
- Non è stata aperta la dashboard Vercel/Railway per confermare quali variabili sono impostate in
  produzione: tutto quanto in §8 viene dai file `.env.example` e dai commenti nel codice.

In caso di conflitto fra questo documento e il codice, vince il codice.
