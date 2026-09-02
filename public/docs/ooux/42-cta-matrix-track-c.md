---
title: "OOUX Track C — Fase 4 — CTA Matrix · Tenant, Member"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi esegue Fase 5 (Sketch Brief) su Member/Tenant
---

# CTA Matrix — Track C

> Deciso da Federico (02/09): "Rimuovi dipendente" e "Modifica ruolo" restano **fuori MVP**,
> stesso trattamento di Publish Strategy in Track B. Non compaiono come righe qui — solo in
> nota, a fine documento.

## Matrice principale

| CTA | Oggetto | Ruolo | View | Priorità | Effetto |
|---|---|---|---|---|---|
| Aggiungi Member | Member | ⚠️ non ristretto nel codice, probabile Admin | Dipendenti | Primaria | Oggi: naviga a Piano, sempre. Se cablata: crea riga Member (`add_member_to_tenant`), bloccata dal conflitto tetto/piano (vedi Fase 1) |
| Cambia piano Tenant | Tenant | ⚠️ non ristretto nel codice, probabile Admin | Piano | Primaria | `plan` → valore superiore. Nessun backend trovato — oggi solo visuale (bottone abilitato, nessuna azione dietro) |
| Modifica identità negozio | Tenant | ⚠️ non ristretto | Generale | Secondaria | Aggiorna `brand_config` (candidato) — oggi solo stato locale, mai persistito |
| Modifica profilo Member | Member (self) | Chiunque, sul proprio | Account | Secondaria | Aggiorna nome/email/avatar del proprio Member — oggi solo stato locale, mai persistito |

Nessuna CTA distruttiva/irreversibile in questo Round — a differenza di quasi ogni altro
oggetto Track A/B, Tenant e Member non hanno oggi nessuna azione che cancella o archivia
qualcosa. Non è un'omissione: è il riflesso diretto della decisione di Federico (Rimuovi
dipendente fuori MVP) più il fatto che Tenant non si elimina mai da UI.

## CTA per oggetto

### Tenant

**Generale**
- Modifica identità negozio — chiunque acceda a Impostazioni (nessun gating) — auto-save,
  nessuna conferma

**Piano**
- Cambia piano Tenant — Primaria — nessuna conferma trovata nel mock (né ci si aspetterebbe
  per un semplice upgrade, ma un downgrade meriterebbe una conferma — nessun downgrade CTA
  esiste oggi, solo upgrade verso l'alto)

### Member

**Dipendenti (lista)**
- Aggiungi Member — Primaria, header — ⚠️ oggi rotta (redirect incondizionato, non crea nulla)

**Account (self-view)**
- Modifica profilo Member — Secondaria — auto-save, nessuna conferma

**Nessuna CTA sulla card di un Member diverso da sé** — coerente con la decisione: senza
"Rimuovi"/"Modifica ruolo", una riga della lista Dipendenti che non è "Tu" non ha nessuna
azione disponibile. È una lista in sola lettura per tutti tranne che per sé stessi. Vale la
pena dirlo esplicitamente in Fase 5: non è un dimenticanza, è l'esito diretto dello scope
di oggi.

## Flussi scatenati da CTA

### Flusso: Aggiungi Member → upgrade piano

Trigger: "Aggiungi Member" su Member (Dipendenti)
Steps: Dipendenti → (redirect incondizionato, vedi addendum Fase 3) → Piano → "Cambia piano
Tenant" (se l'utente prosegue)
Oggetti coinvolti: Member, Tenant
Transizioni di stato: nessuna — entrambe le CTA di questo flusso sono oggi senza effetto reale

## Sintesi per priorità

**CTA primarie MVP** (devono esserci nel Day 1):
- Aggiungi Member — ma richiede prima di risolvere il conflitto tetto RPC (5 fisso) vs UI
  piano (2/5/illimitati), altrimenti si cablerebbe a una regola già nota per essere sbagliata
- Cambia piano Tenant — richiede backend che oggi non esiste in nessuna forma (nessuna
  funzione di upgrade trovata, a differenza di Aggiungi Member che almeno ha la RPC pronta)

**CTA secondarie** (Phase 2):
- Modifica identità negozio (Tenant)
- Modifica profilo Member (self)
— entrambe funzionano già come UX (auto-save locale), manca solo la persistenza reale su
Supabase: più un lavoro di collegamento backend che di design.

**CTA da validare** (non certe — richiedono decisione, non user research):
- ⚠️ Ruolo abilitante per "Aggiungi Member" e "Cambia piano Tenant" — nessun gating nel
  codice. Se l'intento di prodotto è "solo Admin gestisce team e fatturazione" (ragionevole,
  non verificato), va costruito da zero — oggi qualunque Member può cliccarli.

**Esplicitamente fuori MVP** (decisione di Federico, 02/09):
- Rimuovi Member
- Modifica ruolo Member (post-creazione) — lo switch "dimostrativo" in Account resta tale,
  non diventa una CTA reale in questo giro

---

## Prossimo step → Fase 5

Sketch Brief per le 4 view coinvolte (Generale, Account, Dipendenti, Piano) — tutte dentro
SettingsModal, nessuna nuova rotta. Ordine consigliato: **Dipendenti** per primo (è dove vive
il conflitto tetto/piano, il nodo più delicato), poi Piano, poi Generale e Account (le due
meno rischiose, solo persistenza da aggiungere a UI già funzionante).
