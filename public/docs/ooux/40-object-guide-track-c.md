---
title: "OOUX Track C — Fase 2 — Object Guide · Tenant, Member"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi esegue Fase 3 (Navigation Flow) su Member/Tenant
---

# Object Guide — Track C

## Tenant

**Alias da deprecare:** nessuno — il concetto non ha mai un nome proprio in nessuna UI
(sempre implicito: "il tuo negozio", "il team"). Non c'è un sinonimo sbagliato da correggere,
c'è un'assenza da colmare se in futuro serve nominarlo davanti a un utente.

**Definizione:**
Tenant è il confine di isolamento di un singolo negozio su MAAT — tutto ciò che un Seller
possiede (catalogo, listing, vendite, spedizioni, team) vive dentro esattamente un Tenant, mai
condiviso con nessun altro. Si distingue da Member perché Tenant è il **contenitore**
(l'azienda, l'abbonamento, i dati), Member è **chi ci accede**: un Tenant esiste anche con un
solo Member (il founder), un Member non esiste mai senza un Tenant.

**Esempi:**
- Il negozio di Federico — `slug: dorsi-a3f9c21b` (generato da nome+user_id), `plan: starter`,
  `status: trial` finché non completa l'attivazione.
- Un secondo Seller che si registra domani — nuovo Tenant, isolato dal primo per costruzione
  (RLS), zero dati condivisi anche se entrambi vendono capi vintage.
- Un Tenant con `status: suspended` — esiste ancora nel DB (soft-delete via `deleted_at`
  separato da `status`), ma l'accesso è bloccato: caso limite da non confondere con
  "cancellato".

**Tipi:**
Nessun sottotipo rilevante — oggetto omogeneo. `plan` e `status` sono attributi del ciclo di
vita/livello di servizio, non famiglie di Tenant con comportamento strutturalmente diverso
(un Tenant `enterprise` e uno `starter` sono lo stesso oggetto con limiti diversi, non due
oggetti).

**Note per il team dev:**
- `plan` {starter, pro, enterprise} e `status` {trial, active, suspended} sono **due assi
  indipendenti** — non collassarli in un solo concetto "livello del Tenant". `plan` è cosa ha
  comprato, `status` è se può usarlo adesso.
- Nessuna CTA utente crea un Tenant. Non scrivere mai, in nessun brief successivo, "l'utente
  crea un Tenant" — lo attiva implicitamente registrandosi. La CTA reale, se esiste, sarà
  sempre sul suo `plan` ("Passa a Business"), mai sulla sua esistenza.
- La UI mock del piano (`PLANS` in SettingsModal) usa i nomi **Starter/Team/Business** — non
  combaciano con l'enum canonico `starter/pro/enterprise` (solo "Starter" coincide, per caso).
  Non usare i nomi UI come se fossero i valori dell'enum in nessuna spec tecnica.

---

## Member

**Alias da deprecare:** nessuno da eliminare nel senso stretto — ma **due registri da tenere
separati consapevolmente**: "Member" nel glossario dev/Figma/codice, "Dipendente" nella UI
italiana rivolta al Seller (sezione "Dipendenti" di Impostazioni). Non sono in conflitto,
sono la stessa cosa vista da due pubblici diversi — non forzare l'uno sull'altro. Attenzione
particolare: "Dipendente" è tecnicamente impreciso per il founder stesso (primo Member, che è
il proprietario, non un dipendente) — la UI infatti non lo chiama mai così, gli mette solo il
badge "Tu". Se in futuro la sezione si allarga, vale la pena chiedersi se "Dipendenti" resti il
nome giusto o se "Team"/"Collaboratori" descriva meglio anche il founder.

**Definizione:**
Member è una persona con accesso a un Tenant specifico su MAAT, con un ruolo che determina cosa
può fare. Si distingue da un generico "utente Supabase" (`auth.users`) perché un utente esiste
a livello di piattaforma anche prima di avere un Tenant; Member è il legame **fra** quell'utente
e **un** Tenant — un utente senza Member non ha ancora (o non ha più) accesso a nessun negozio.

**Esempi:**
- Federico stesso, primo Member del proprio Tenant, `role: admin`, creato automaticamente alla
  registrazione — non ha mai compilato un form "aggiungi membro" per sé stesso.
- Un secondo collaboratore che Federico aggiunge in futuro con `role: operator` — stesso
  Tenant, permessi minori (da definire in Fase 4, oggi solo "pari capacità sul catalogo" per
  quanto verificato nelle fasi Track B).
- Un invito "in sospeso" mostrato dalla UI mock con badge "Invitato" — caso limite importante:
  **non è ancora un Member reale**. Finché non esiste un flusso di invito nel canonico, questo
  esempio descrive un'intenzione di prodotto, non uno stato che il sistema sa rappresentare oggi.

**Tipi:**
- **Admin** — il founder è sempre admin per costruzione (hardcoded in `provision_tenant()`).
  Permessi esatti oltre "non è operator" non ancora specificati — verificare in Fase 4 se
  esistono azioni admin-only su questi due oggetti (a differenza di Accounting Entry in
  Track B, che è admin-only per RLS).
- **Operator** — ruolo di default per membri aggiunti dopo il founder (`add_member_to_tenant`,
  default `role='operator'`). Nessuna evidenza nel codice di permessi ridotti rispetto ad
  admin su oggetti di prodotto (catalogo, listing, ecc.) — da confermare, non da assumere
  identici solo perché non sono stati trovati controlli che li distinguano.

**Note per il team dev:**
- **RLS legge `app_metadata` nel JWT, non la riga `members` a runtime.** Qualunque futura CTA
  che cambia `role` o rimuove un Member deve sincronizzare `app_metadata` nella stessa
  operazione (come già fa `provision_tenant()`+`updateUserById` per il founder) — altrimenti
  l'accesso reale e i dati mostrati in UI divergono silenziosamente, senza errore visibile.
- **"Invitato" oggi è solo copy.** Non esiste nel canonico nessuna tabella o colonna di invito.
  Non descriverlo in nessun brief come se fosse "quasi pronto" — è un concetto di prodotto non
  ancora modellato, allo stesso livello di uno stato completamente nuovo da progettare.
- **Il tetto di membri è in conflitto aperto**: `add_member_to_tenant()` applica 5 per
  chiunque; la UI mock del piano promette 2 (Starter) / 5 (Team) / illimitati (Business). Non
  è un dettaglio — è una regola di business che il codice e il prodotto raccontano in modo
  diverso. Fase 4 decide, questo documento la segnala e basta.
- **"Aggiungi dipendente" e `add_member_to_tenant()` esistono entrambi, scollegati.** Chi
  lavora su questa CTA in futuro non sta costruendo da zero — sta collegando due pezzi già
  pronti (e risolvendo la divergenza sul tetto prima di farlo).

---

## Convenzioni di naming

| Termine da evitare | Termine canonico | Motivo |
|---|---|---|
| "Tenant" nel copy utente-facing | (nessun nome proprio ancora — resta implicito: "il tuo negozio"/"il team") | Nessuna UI oggi nomina il Tenant direttamente: non inventare un termine finché non serve |
| "Account" per indicare un Member nel glossario dev | Member | "Account" è ambiguo con `marketplace_accounts` (Track B) — stesso identificatore per due oggetti diversi nel dominio |
| "Piano Team" come se fosse un valore dell'enum `plan` | `plan: pro` (probabile mapping, da confermare) | I nomi UI (Starter/Team/Business) e l'enum canonico (starter/pro/enterprise) non coincidono — mai usarli come sinonimi in una spec tecnica |
| "Utente" da solo, senza specificare se auth.users o Member | Member (quando si parla di accesso a un Tenant specifico) · "utente Supabase" (quando si parla di autenticazione pura) | Un utente autenticato non ha automaticamente un Member — sono legati ma distinti |

## Prossimo step → Fase 3

Navigation Flow per Tenant e Member. Entry point atteso: **Impostazioni → Dipendenti**
(SettingsModal, sezione già esistente) — non serve inventare un nuovo entry point, la
Fase 3 riconcilia la view esistente contro la relazione Tenant→Member appena definita, come
già fatto per Offer/Supplier in Track B. Punto da chiarire in quella fase: la sezione "Generale"
e "Piano" di SettingsModal (non ancora ispezionate riga per riga) potrebbero essere le view
reali per gli attributi di Tenant (`name`, `brand_config`, `plan`) — verificarlo prima di
assumere che Tenant non abbia nessuna view propria.
