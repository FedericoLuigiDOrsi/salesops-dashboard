---
title: "OOUX Fase 4 — CTA Matrix · Marketplace Account"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi scrive il Sketch Brief (Fase 5) per la sezione "Gestisci marketplace"
---

# Fase 4 — CTA Matrix · Marketplace Account

> Un solo oggetto, tre CTA, una sola view (Fase 3). Mono-ruolo Seller, nessuna restrizione RLS
> (Fase 2) — a differenza di Contabilità, non c'è un ramo "solo Admin" da gestire qui.

## Matrice principale

| CTA | Oggetto | Ruolo | View | Priorità | Effetto |
|---|---|---|---|---|---|
| Collega Marketplace Account | Marketplace Account | Seller | "Gestisci marketplace", riga senza account | Primaria | Avvia flusso esterno (meccanismo non specificato nel canonico) → crea la riga, `status` iniziale secondo l'esito del flusso |
| Scollega Marketplace Account ⚠️ | Marketplace Account | Seller | "Gestisci marketplace", riga `active` | Secondaria | `status: active → inactive` (o eliminazione riga — non specificato quale dei due, vedi nota). Richiede conferma: interrompe la pubblicazione su quel marketplace |
| Ricollega Marketplace Account | Marketplace Account | Seller | "Gestisci marketplace", riga `error`/`inactive` | Primaria (contestuale) | Ripete il flusso di collegamento, stesso esito possibile di "Collega" |

**Non aggiunta**, perché non ha un oggetto/meccanismo verificato a cui appoggiarsi: una CTA per
"vedere quali Listing sono rimasti orfani quando l'account è andato in errore". La domanda resta
aperta (Fase 3) ma non è pronta per diventare una CTA finché non è chiaro se esiste un modo per
interrogare quella relazione — oggi non c'è FK, quindi nemmeno la query è ovvia.

---

## CTA per oggetto (view design reference)

### Marketplace Account

**Lista "Gestisci marketplace"** (unica view, 5 righe fisse)
- `Collega Marketplace Account` — Seller — Primaria — visibile solo sulle righe senza account
  (`status` nullo/assente per quel marketplace)
- `Scollega Marketplace Account` ⚠️ — Seller — Secondaria — visibile solo su `active`, richiede
  conferma esplicita
- `Ricollega Marketplace Account` — Seller — Primaria (contestuale) — visibile solo su `error`
  o `inactive`

**Card/Detail**: non applicabile — Fase 3 ha già escluso un Detail separato per questo oggetto,
le CTA vivono tutte inline sulla riga.

---

## Flussi scatenati da CTA

### Flusso: Collegare un marketplace
Trigger: `Collega Marketplace Account` su una riga senza account
Steps: "Gestisci marketplace" → CTA → flusso esterno (OAuth/credenziali, non specificato) →
ritorno alla lista con la riga aggiornata
Oggetti coinvolti: Marketplace Account (creato)
Transizioni di stato: nessuno stato pregresso (riga non esisteva) → `active` o `error` a seconda
dell'esito del flusso esterno

### Flusso: Scollegare un marketplace già attivo
Trigger: `Scollega Marketplace Account` ⚠️ su una riga `active`
Steps: conferma → esecuzione
Oggetti coinvolti: Marketplace Account
Transizioni di stato: `active → inactive` (proposta — vedi nota sotto, non è certo se sia
questo o una cancellazione della riga)
⚠️ **Non specificato dal canonico**: la tabella ha `status` con `inactive` come valore valido,
il che suggerisce che scollegare aggiorni lo stato piuttosto che cancellare la riga (altrimenti
`inactive` non servirebbe). Trattato come ipotesi ragionevole, non come fatto verificato — da
confermare quando si implementa il flusso di scollegamento reale.

### Flusso: Un account smette di funzionare (di sistema, non CTA utente)
Non generato da nessuna CTA in questa matrice — la transizione `active → error` è presumibilmente
di sistema (credenziali rifiutate dalla piattaforma esterna), quindi esclusa per regola (CTA di
sistema non entrano nella matrice). Resta il gap già segnalato in Fase 3: nessuna propagazione
verificata verso i Listing coinvolti.

---

## Sintesi per priorità

**CTA primarie MVP** (devono esserci nel Day 1):
- Collega Marketplace Account — senza, nessuna pubblicazione è possibile per nessun tenant nuovo
- Ricollega Marketplace Account — senza, un account in errore resta bloccato per sempre

**CTA secondarie** (Phase 2):
- Scollega Marketplace Account — utile ma non bloccante: un tenant può semplicemente non
  pubblicare più lì, senza bisogno di "spegnere" esplicitamente l'account

**CTA da validare** (non certe — richiedono decisione, non solo design):
- Il comportamento esatto di "Scollega" (aggiorna stato vs cancella riga) ⚠️
- Se serve un modo per vedere/gestire i Listing lasciati "orfani" da un account in errore — non
  è ancora una CTA, potrebbe non servirlo mai se il gap si risolve altrove (es. propagazione
  automatica lato backend, non UI)

---

## Prossimo step → Fase 5

Input per Sketch Brief: **Marketplace Account** — una sola view da progettare, "Gestisci
marketplace" dentro Pubblicazione. Non un Detail: una lista compatta di 5 righe con CTA inline.
Priorità: subito dopo aver chiuso eventuali altre view pendenti di Track B, dato che sblocca
concretamente la pubblicazione per ogni tenant che non ha ancora collegato nulla.
