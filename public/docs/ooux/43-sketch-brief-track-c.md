---
title: "OOUX Track C — Fase 5 — Sketch Brief · Tenant, Member"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi esegue Fase 6 (Atomic Bridge) su Member/Tenant
---

# Sketch Brief — Track C

> Due decisioni prese da Federico prima di questo brief: "Aggiungi Member" è aggiunta
> diretta (non invito), il tetto membri è per piano (2/5/illimitati). Specificare la prima ha
> subito rivelato un gap che nessuna fase precedente aveva notato: la RPC vuole uno
> `user_id` già esistente, non un'email libera — serve un lookup che oggi non esiste da
> nessuna parte nel codice. Il metodo funziona: decidere in astratto è a costo zero,
> specificare il comportamento reale fa emergere cosa manca davvero.

## 1. Lista Globale — Member ("Dipendenti")

**Posizione:** sezione "Dipendenti" del modale Impostazioni — non un URL a sé.
**Ruoli con accesso:** chiunque apra Impostazioni (nessun gating nel codice — Fase 4, resta
⚠️ aperto, questo brief non lo risolve).

### Card di lista

Attributi visibili in lista (in ordine di priorità visiva):
1. Nome + avatar — identitario
2. Ruolo (Admin/Operator) — badge **neutro descrittivo**, non uno StatusPill: essere Admin
   non è "meglio" di essere Operator, sono ruoli diversi non un giudizio di successo/fallimento
   (stesso principio già applicato a `Lot.type` in Track B)
3. Badge "Tu" per l'utente corrente — sostituisce qualunque controllo di stato sulla propria riga
4. Email — metadata secondario

CTA sulla card: **nessuna**, per decisione già presa (Rimuovi/Modifica ruolo fuori MVP). La
riga "Tu" porta a "Account" (self-view) per modificare il proprio profilo — è un link
contestuale, non una CTA della card.

### Filtri e sort

Nessuno — tetto ≤5 righe non li giustifica (confermato Fase 1).

### Comportamenti lista

- **Header sezione**: "Dipendenti · [n] / [tetto] posti usati" — il tetto ora legge
  `tenants.plan` (2 su Starter, 5 su Team, "illimitati" su Business — quando illimitato, il
  contatore mostra solo "[n] account", non un rapporto su un tetto che non esiste).
- **Empty state**: non applicabile — c'è sempre almeno il founder dal momento in cui il
  Tenant esiste.
- **CTA globale "Aggiungi Member"** — header, sempre visibile. Comportamento **ora reso
  davvero condizionale** (prima era un redirect incondizionato):
  - Righe attuali < tetto del piano → apre il form "Aggiungi Member" (sezione 2)
  - Righe attuali == tetto del piano → naviga a "Piano" (comportamento esistente, invariato)
  - Piano illimitato (Business) → sempre il primo ramo, mai il secondo

---

## 2. NUOVO — Form "Aggiungi Member"

Non esisteva prima come superficie funzionante — il bottone reindirizzava sempre, senza mai
aprire nulla. Va specificato da zero.

**Contenitore:** pannello inline dentro la sezione Dipendenti (preferenza, non vincolo) —
coerente con lo stile attuale di SettingsModal (sezioni inline, non sheet annidati dentro un
modale già aperto). Il pattern Sheet di Track B (Marketplace Account) resta un'alternativa
valida se chi implementa preferisce isolare il form.

### Contenuto

1. **Email** — campo di ricerca. `add_member_to_tenant()` richiede uno `user_id` di un
   utente Supabase già esistente (`auth.users`), non accetta email libera: questo campo deve
   fare un lookup (nuovo, non esiste oggi — nessun `getUserByEmail` in nessuna parte del
   codice, verificato) e mostrare se l'email corrisponde a un account MAAT esistente prima di
   permettere il submit.
2. **Ruolo** — select Admin/Operator, default Operator (coerente col default della RPC).

### CTA

| CTA | Posizione | Ruolo | Stato oggetto richiesto |
|---|---|---|---|
| Aggiungi Member (submit) | Footer form | ⚠️ non ristretto (eredita nota Fase 4) | Email verificata esistente + righe < tetto |

### Comportamenti

- **Email non trovata**: messaggio esplicito ("Nessun account MAAT con questa email") — non
  un errore generico. Non offrire un invito come fallback: quella è la strada non scelta in
  questo giro.
- **Tetto raggiunto durante la compilazione** (race condition — un altro Admin ha appena
  aggiunto l'ultimo posto): la RPC lo gestisce già (`max_members_reached`) — mostrare
  l'errore e chiudere il form, non un caso da progettare ex novo, solo da non ignorare.
- **Successo**: nuova riga compare nella lista Dipendenti, form si chiude.

---

## 3. Detail — Tenant, sezione "Piano"

**Ruoli con accesso:** chiunque apra Impostazioni (stesso ⚠️ aperto).

### Contenuto (gerarchia informativa)

**Corpo principale**
- 3 card piano (Starter / Team / Business — nomi UI, il mapping ai valori canonici
  `starter/pro/enterprise` è implementazione, non design)
- Ogni card: nome, prezzo, lista feature — **il tetto membri ora è testo esplicito in ogni
  card** ("2 account" / "5 account" / "Account illimitati" — già così nel codice, diventa
  finalmente vero invece che solo promesso)
- Card corrente: badge "Attuale", CTA disabilitata "Piano attuale"

### CTA

| CTA | Posizione | Ruolo | Stato oggetto richiesto |
|---|---|---|---|
| Cambia piano Tenant | Card non corrente | ⚠️ non ristretto | Piano diverso da quello attuale |

### Comportamenti

- Nessun backend per l'upgrade reale esiste oggi (Fase 4) — questo brief non lo costruisce,
  resta un gap per oltre Fase 6.
- **Downgrade non offerto**: nel mock, "Passa a" appare solo verso piani superiori. Non è
  chiaro se sia intenzionale (niente self-service downgrade, richiede contatto) o un caso non
  contemplato — segnalato, non deciso qui.

---

## 4. Detail — Tenant, sezione "Generale"

**Ruoli con accesso:** chiunque apra Impostazioni.

### Contenuto

- Nome negozio (input testo)
- Tono di voce (select, 4 valori: diretto/caldo/professionale/streetwise)
- Estetica foto (select)
- Bio negozio (textarea)

### CTA

Nessuna esplicita — auto-save su ogni campo (comportamento già presente in UI, confermato).

### Comportamenti

- Oggi lo stato vive solo in `useState` locale, si perde al reload. Non è un problema di
  design da risolvere in questo brief — è persistenza mancante (Fase 6/dev): la UI esiste
  già, il pattern di interazione (auto-save on change) resta invariato quando si collega a
  Supabase, cambia solo cosa succede sotto (scrittura remota invece che locale).

---

## 5. Detail — Member (self), sezione "Account"

**Ruoli con accesso:** il Member corrente, sul proprio profilo soltanto.

### Contenuto

- Avatar (upload)
- Nome (input)
- Email (input)
- Ruolo — **mostrato, sola lettura**. Lo switch "Admin/Operator" esistente va reso un badge
  statico, non uno switch cliccabile: uno switch invita al click e oggi non farebbe nulla di
  reale (Federico ha deciso Modifica ruolo fuori MVP) — lasciarlo interattivo promette
  un'azione che non esiste. Cambio minimo: stesso componente visivo di ruolo usato nella
  lista Dipendenti, non un controllo.

### CTA

| CTA | Posizione | Ruolo | Stato oggetto richiesto |
|---|---|---|---|
| Modifica profilo Member | — (auto-save) | Il Member stesso | — |

### Comportamenti

Stesso schema di "Generale": auto-save locale esistente, manca solo la persistenza reale.

---

## Input per Fase 6 — spec-to-modular-ui

**Oggetti keystone:** Tenant (`plan`, `brand_config`), Member (`role`, relazione a Tenant)

**View inventory completo:** 5 — Lista Dipendenti, Form Aggiungi Member (nuovo), Detail Piano,
Detail Generale, Detail Account (self)

**Attributi enum → token candidati:**
- `Member.role` = {admin, operator} → badge **descrittivo neutro**, non StatusPill (nessuna
  connotazione valutativa — stesso principio di `Lot.type` in Track B, diverso da
  `MarketplaceAccount.status`/`OfferStatus` che sono StatusPill)
- `Tenant.plan` = {starter, pro, enterprise} → non un badge nella UI attuale (le card piano
  già lo rappresentano per intero), ma se serve un badge compatto altrove (es. header
  Impostazioni) è un candidato token neutro, stessa famiglia del badge ruolo

**Stack tech:** Next.js 16 · React 19 · Tailwind v4 · shadcn/ui — invariato

**Design anchor:** `maat-ds/DESIGN.md` (locked, stesso ground-truth verificato a inizio Track B)
