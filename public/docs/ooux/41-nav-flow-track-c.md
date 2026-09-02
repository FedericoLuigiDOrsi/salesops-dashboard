---
title: "OOUX Track C — Fase 3 — Navigation Flow · Tenant, Member"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi esegue Fase 4 (CTA Matrix) su Member/Tenant
---

# Navigation Flow — Track C

## Entry Point

**Impostazioni** (il modale `SettingsModal`, aperto da `openSettings(section)` in `AppShell`)
— unico entry point per entrambi gli oggetti. Non ci sono liste globali o pagine dedicate:
Tenant e Member non hanno mai avuto abbastanza contenuto proprio per uscire da un modale a
sezioni, esattamente come concluso per Marketplace Account in Track B. La differenza da lì:
qui il modale ha **4 sezioni rilevanti** (non una sola), perché due oggetti diversi vivono
fianco a fianco nello stesso contenitore.

---

## Grafo di navigazione

```
Impostazioni (modale)
├── Generale                     → form Tenant.brand_config (probabile)
├── Account                      → self-view del proprio Member (profilo + ruolo)
├── Dipendenti                   → lista Member del Tenant (0-5 righe)
│   └── "Aggiungi dipendente" ──► Piano   (se 5/5 pieno — cross-object flow, vedi sotto)
└── Piano                        → le 3 card di Tenant.plan, CTA upgrade
```

Nessun livello di profondità oltre 1 (tutto dentro il modale, nessuna sotto-navigazione a
scomparsa) — coerente col vincolo "mobile-first" anche se qui il rischio di path profondi
non si pone.

---

## View inventory

### Tenant

- **Lista globale**: non esiste — un Seller ha esattamente un Tenant, non c'è una collezione
  da elencare. Nessuna view di questo tipo va progettata.
- **Card**: non esiste — Tenant non appare mai annidato dentro un altro oggetto in nessuna UI
  trovata.
- **"Detail" distribuito su due sezioni** (non un'unica Detail View — la differenza dal
  pattern standard è intenzionale, coerente con "non ha mai una CTA di creazione ed è sempre
  implicito"):
  - **Generale** — form su `TenantBrand` (`nomeNegozio`, `tono`, `estetica`, `bio`), quasi
    certamente la UI reale di `brand_config` (jsonb) anche se il match campo-per-campo non è
    stato verificato in questa fase — solo strutturale/di posizione. Oggi puramente locale
    (`useState`), nessuna scrittura verso Supabase.
  - **Piano** — 3 card (`Starter`/`Team`/`Business`), la corrente marcata (`current: true`),
    CTA "Passa a [piano]" su ciascuna non-corrente. Rappresenta `Tenant.plan`, ma con naming
    non allineato all'enum canonico (Fase 2 l'ha già segnalato, non ridecidere qui).
  - `Tenant.status` {trial, active, suspended} — **nessuna UI trovata** in questo giro. O è
    mostrato altrove (badge non ancora localizzato, es. nell'header di AppShell) o non ha
    ancora una rappresentazione visiva. Segnalato, non risolto.
- **Empty state**: non applicabile — un Tenant esiste sempre nel momento in cui il Seller
  accede a Impostazioni (nessun caso "nessun Tenant" da progettare).

### Member

- **Lista globale ("Dipendenti")**: righe = Member del Tenant corrente (mock oggi, ≤5 per il
  tetto MCSFD). Attributi visibili: nome, email, ruolo, badge "Tu" (per l'utente corrente),
  stato Attivo/Invitato (**"Invitato" senza dato dietro — Fase 1/2 già segnalato**). Nessun
  sort/filter — confermato in Fase 1, lista a tetto fisso non ne ha bisogno.
- **Self-view ("Account")**: unica per il Member corrente, non riusa la Card della lista
  Dipendenti — contenuto diverso (avatar upload, campi editabili nome/email, switch ruolo
  demo) e scopo diverso (modificare sé stessi, non amministrare altri). Da trattare come view
  a parte, non come "il proprio elemento della lista" — non condividono componente oggi nel
  codice e non c'è ragione OOUX per forzarli a condividerlo.
- **Card (nella lista Dipendenti)**: nome, email, ruolo, stato — stessa struttura per ogni
  riga eccetto quella dell'utente corrente (badge "Tu" invece del controllo stato).
- **Empty state**: non applicabile per lo stesso motivo di Tenant — un Tenant ha sempre
  almeno un Member (il founder) dal momento della sua esistenza. L'unico "quasi-empty" è la
  lista Dipendenti con un solo membro (solo il founder, "Tu"), che non è uno stato vuoto ma
  lo stato iniziale normale.

---

## Flussi cross-object

### Aggiungere un dipendente quando i posti sono pieni

Job: "Quando il Seller vuole aggiungere un collaboratore ma il Tenant ha già raggiunto il
tetto membri del piano corrente..."

Path: **Dipendenti** → CTA "Aggiungi dipendente" → **Piano** (naviga via `goto("piano")`,
già cablato nel codice) → CTA "Passa a [piano superiore]" (**non cablata a nessuna azione
reale di upgrade — fuori scope di questa fase, la stessa UI mock già vista in "Piano"**)

Transizioni di stato: nessuna oggi — sia l'aggiunta del Member sia l'upgrade del piano sono
CTA UI-only, non azioni reali (Fase 1: `add_member_to_tenant()` esiste ma non è chiamata;
l'upgrade piano non ha nessuna funzione backend trovata in questo Round).

> **Addendum 02/09 — verificato in Fase 4, il redirect NON è condizionale.** Il bottone
> "Aggiungi dipendente" chiama `onClick={() => goto("piano")}` senza nessun controllo sul
> numero di membri attuali — va sempre a Piano, anche se il Tenant avesse posti liberi. Il
> job story sopra ("quando ha già raggiunto il tetto") descrive l'intento del prodotto, non
> il comportamento reale: oggi il bottone si comporta *come se* fosse sempre pieno, perché il
> mock (`TEAM`, "5/5 posti usati") lo è sempre di suo — non perché esista una logica che lo
> verifica. Non è un flusso condizionale rotto in due punti come scritto sopra: è un flusso
> che non è mai stato reso condizionale, punto. Rilevante per Fase 5: se "Aggiungi dipendente"
> deve funzionare quando ci sono davvero posti liberi, serve costruire il ramo "posti
> disponibili" da zero, non solo correggere quello esistente.

⚠️ Nota per Fase 4: questo è l'unico flusso cross-object reale nell'intera area Track C, ed è
**già interrotto in due punti diversi** (Member non collegato alla RPC, upgrade piano senza
backend). Non è un flusso da disegnare da zero — è un flusso già navigabile (il click porta
dove deve) ma senza nessuna delle due azioni che promette di poter fare.

---

## Prossimo step → Fase 4

CTA Matrix su Tenant e Member. Le CTA candidate sono poche e già visibili nel codice —
"Aggiungi dipendente" (Dipendenti), "Passa a [piano]" ×2 (Piano), "Cambia foto"/salvataggio
campi (Account, Generale — verificare se esiste una CTA "Salva" esplicita o se il salvataggio
è implicito/inline, non ancora verificato). Decisione aperta da portare in Fase 4: le CTA
"Rimuovi dipendente" e "Modifica ruolo" vanno aggiunte come CTA MVP (richiedono costruire
backend che oggi non esiste) o dichiarate esplicitamente fuori MVP, come già fatto per
Publish Strategy in Track B?
