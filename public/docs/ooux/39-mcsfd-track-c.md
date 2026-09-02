---
title: "OOUX Track C — Fase 1 — MCSFD · Tenant → Member"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi esegue Fase 2 (Object Guide) su Member/Tenant
---

# Track C — Fase 1 — MCSFD

> Una sola relazione: Round 1 (`38`) ha confermato che Home/Onboarding/Auth non generano
> edge propri. Qui il lavoro non è "quanti campi mancano" (pochi) — è **la Mechanics**: il
> percorso di creazione di un Member è diviso in due metà, una reale e automatica, l'altra
> disegnata in UI ma scollegata dal backend che esiste già per servirla.

### Tenant → Member

| Dimensione | Analisi |
|------------|---------|
| **Mechanics** | **Due percorsi, non uno.** (1) **Primo Member (founder)** — sempre automatico: `provision_tenant()` (funzione Postgres, security definer) crea Tenant+Member in una transazione, `role='admin'` hardcoded, scatenata da `/registrazione` → `/api/provision` (idempotente). Nessuna CTA utente. (2) **Member successivi** — *disegnati* come CTA-driven ("Aggiungi dipendente" in Impostazioni→Dipendenti), e il backend è pronto (`add_member_to_tenant(tenant_id, user_id, role='operator')`, con validazione limite e ruolo) — **ma zero caller nel codice**: il bottone oggi porta a `goto("piano")` (upsell), non chiama la RPC. La UI e il backend esistono, non sono cablati insieme. |
| **Cardinality** | Tenant → Member: **1-many, minimo 1** (il founder, creato insieme al Tenant — non esiste un Tenant senza almeno un Member). Tetto **5**, hardcoded in `add_member_to_tenant()` (REQ-504), non parametrico sul piano nonostante `plan` abbia 3 livelli (starter/pro/enterprise) — ⚠️ divergenza, vedi sotto. Member → Tenant: **esattamente 1** (FK NOT NULL + `UNIQUE(tenant_id, user_id)`). |
| **Sorting** | Nessuna in UI (mock `TEAM`, ordine di inserimento array, riga "Tu" sempre prima). Con un tetto di 5 righe, una lista ordinabile è complessità non necessaria — **non serve un sort atom qui**, a differenza di ogni altro oggetto Track A/B. |
| **Filtering** | Nessuna, per lo stesso motivo — 5 righe max non giustificano filtri. Non aggiungere criteri di filtro non richiesti da nessun job reale. |
| **Dependencies** | (a) Member non può esistere senza Tenant — ovvio, FK. (b) La CTA "Aggiungi dipendente" dipende da `count(members) < 5` — oggi solo mostrato in UI ("5/5 posti usati"), enforcement reale vive nella RPC scollegata. (c) ⚠️ **La più delicata**: RLS legge `auth.jwt() → app_metadata.tenant_id/role`, **non** la riga `members` a runtime — sincronizzati una tantum al provisioning via `updateUserById`. Oggi non esiste nessuna CTA che cambia `members.role` o rimuove un Member dopo la creazione, quindi il rischio di desync è dormiente — ma **qualunque futura CTA "Modifica ruolo"/"Rimuovi dipendente" deve aggiornare `app_metadata` insieme alla riga `members`, non la riga da sola**, o la RLS e la UI divergono permanentemente. Vincolo per Fase 4, non per ora. (d) Lo stato "Invitato" mostrato in UI non ha alcun percorso di scrittura: `add_member_to_tenant()` inserisce il Member già attivo, non esiste un concetto di invito pendente nel canonico. |

**Requisiti di dato emersi:**
- [ ] **Concetto di invito** — non esiste. Se "Invitato" deve diventare reale, serve o (a) una tabella `member_invitations` (email, tenant_id, role, invited_by, expires_at, status) separata dal Member vero e proprio, o (b) uno stato nullable su `members` stesso (`invited_at`/`accepted_at`). Le due strade cambiano il modello di dati in modo diverso — non deciso qui, è una domanda per Fase 4/Federico, non un dettaglio implementativo.
- [ ] **Wiring "Aggiungi dipendente" → `add_member_to_tenant()`** — non un campo dati, ma il gap più concreto: bottone e funzione esistono, non si parlano.
- [ ] **Funzioni "Modifica ruolo" / "Rimuovi dipendente"** — non esistono nel canonico (grep vuoto). Se Fase 4 le vuole come CTA reali, vanno costruite (e devono rispettare la Dependency (c) sopra). Se non sono MVP, Fase 4 lo dichiara esplicitamente invece di lasciarle implicite.

---

## Requisiti di dato consolidati

| Campo/concetto | Oggetto | Tipo | Motivo |
|---|---|---|---|
| Stato invito (tabella o colonna, non deciso) | Member | TBD | Dependency (d) — "Invitato" oggi è solo copy, senza dato dietro |
| — | — | — | Nessun altro campo mancante: `role`, `tenant_id`, i vincoli di cardinalità sono già tutti nel canonico |

⚠️ **Divergenza da segnalare, non da risolvere qui**: il tetto di 5 membri è identico per tutti
e 3 i piani (`starter`, `pro`, `enterprise`) nel codice attuale. O è una scelta deliberata
(dimensione team indipendente dal piano, il piano sblocca altro), o è un limite provvisorio mai
parametrizzato. La UI mock dice "Piano Team" nel messaggio di upsell — nome che non corrisponde
a nessuno dei 3 valori enum (`starter/pro/enterprise`). Verificare in Fase 2/3 quando si ispeziona
la sezione "Piano e fatturazione" di SettingsModal.

> **Addendum 02/09 — verificato, la divergenza è più netta del previsto.** La sezione "piano" di
> `SettingsModal.tsx` (`PLANS`, righe 74-89) esiste già: **Starter** (gratis, "2 account"),
> **Team** (29€, "5 account", `current: true`), **Business** (79€, "Account illimitati"). Due
> problemi distinti, non uno:
> 1. **Naming**: `Starter/Team/Business` in UI non corrisponde a `starter/pro/enterprise` nel
>    canonico — tre nomi su tre, zero coincidenze reali (Starter combacia solo per caso).
> 2. **Il vero conflitto con questa fase**: la UI mock **promette esplicitamente** un tetto
>    membri diverso per piano (2 / 5 / illimitati), mentre `add_member_to_tenant()` applica
>    **un solo tetto fisso (5) a prescindere dal piano**. Non è più un'ipotesi — è una
>    divergenza concreta fra due parti del sistema che oggi dicono cose diverse sulla stessa
>    regola di business. Il tetto codificato nel backend userebbe correttamente la logica del
>    piano "Team" (quello marcato `current`) ma sbaglierebbe per chiunque sia su Starter (max 2,
>    non 5) o Business (illimitati, non 5). Decisione per Fase 4, non qui: se il tetto deve
>    davvero variare per piano, `add_member_to_tenant()` va parametrizzato su `tenants.plan`
>    prima che "Aggiungi dipendente" venga collegato — altrimenti si cablerebbe un bottone a
>    una regola già nota per essere sbagliata su 2 piani su 3.

## Decisioni di design emerse

- **Nessun sort/filter atom per la lista Member** — è una lista a tetto fisso (≤5), non una
  collezione scalabile. Prima volta in questo progetto che una relazione 1-many non richiede
  gli atomi di lista standard: vale la pena scriverlo esplicitamente in Fase 5 per non
  aggiungerli per abitudine.
- **Nessun empty state "0 membri"** — impossibile per costruzione: Tenant e primo Member
  nascono nella stessa transazione. Ogni Tenant ha sempre ≥1 Member dal momento in cui esiste.
- **Il founder (primo admin) è forse non rimovibile** — non per una regola esplicita trovata,
  ma perché non esiste alcuna funzione di rimozione, e togliere l'unico admin lascerebbe un
  Tenant senza nessuno che possa gestirlo. Da decidere consapevolmente in Fase 4 (vietarlo per
  design, o è solo un buco non ancora costruito?), non da assumere.

## Prossimo step → Fase 2

Oggetti keystone: **Member e Tenant insieme** — sono solo due, strettamente legati da un'unica
relazione, stesso pattern già usato per Listing+Shipment in Track B. L'Object Guide dovrà
soprattutto fissare il nome operativo di "Invitato" e chiarire, nel glossario, che "Member" e
"utente del team" sono la stessa cosa vista da due angoli (riga DB vs persona) — evitare che il
team dev/design usi "Utente", "Account", "Dipendente", "Member" come sinonimi intercambiabili.
