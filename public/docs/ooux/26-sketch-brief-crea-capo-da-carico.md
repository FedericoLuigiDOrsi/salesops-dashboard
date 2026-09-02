---
title: "OOUX Fase 5 — Sketch Brief · Crea capo (da Carico)"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi implementa l'estensione del form esistente
---

# Fase 5 — Sketch Brief · Crea capo (da Carico)

> Seconda e ultima view di questa fase su Lot. **Non è un brief nuovo**: è un'estensione del
> flusso di creazione capo già esistente, con un contesto (`lot_id`) e un comportamento di loop
> in più.

## Correzione rispetto all'assunzione di Fase 3/4

Fase 3/4 avevano detto "stessa pipeline AI di Track A", riferendosi implicitamente al brief
originale `05-sketch-brief.md` (wizard mobile a fotogramma singolo, `/capi/:id/foto/:label`).
**Verificato nel codice**: quel wizard è mobile-only per scelta esplicita — il commento in
`NuovoCapoForm.tsx` cita una decisione precedente (HANDOFF 01/08 §8): *"non riscrivere il wizard
sul web"*. Sul web l'ingresso reale è `/capi/nuovo` → `NuovoCapoForm`, un **form di upload foto**
(min 3, consigliate 5, drag&drop o file picker), non uno scatto guidato slot per slot.

Questo non contraddice la decisione di Federico ("stessa pipeline AI") — la pipeline AI
(draft → processing → review) resta la stessa. Cambia solo *quale* interfaccia di cattura si
estende: `NuovoCapoForm` (web reale), non il wizard mobile (che resta valido solo su mobile,
fuori scope qui perché Track B è web-first).

---

## Estensione — Flow View: Crea capo (da Carico)

**Montaggio:** stessa route `/capi/nuovo`, con un parametro di contesto in più (`?lot_id=<id>`
o equivalente) quando si arriva da "Registra Carico" o da "Crea capo (da Carico)" sul Detail
Carico. Nessuna nuova route.
**Ruoli:** Seller (invariato).

### Cosa cambia rispetto al form esistente

- **Header contestuale**: quando `lot_id` è presente, il form mostra un'indicazione del Carico
  di destinazione (es. "Aggiungendo a: CAR-0142 — Fornitore X"), così l'utente non perde di
  vista in quale lotto sta effettivamente inserendo.
- **Creazione item**: `createItem` (già esistente, chiamata dal form) riceve `lot_id` in più nel
  payload — l'unica modifica strutturale, un campo aggiuntivo su una chiamata che già esiste.
- **Tutto il resto del form è invariato**: stesso minimo 3 foto, stessa validazione, stesso
  comportamento di upload e retry.

### Comportamento nuovo: il loop

Dopo il submit, oggi il form fa `router.push('/review/${id}')` e finisce lì. **Con `lot_id`
presente**, dopo che l'utente ha completato la Review di quel capo (non prima — l'AI deve ancora
girare e l'utente deve ancora confermare i campi), la view di destinazione aggiunge una
domanda: **"Aggiungi un altro capo a questo Carico?"**

| Risposta | Effetto |
|---|---|
| Sì | Torna a `/capi/nuovo?lot_id=<stesso id>` — stesso form, stesso contesto |
| No | Torna al Detail Carico (Fase 5 precedente, `25`), che ora mostra il capo appena aggiunto nella lista "Capi collegati" |

⚠️ **Non specificato in questa fase**: se la domanda "un altro?" appare come parte della view di
Review (Track A, fuori scope diretto di questo brief) o come uno step intermedio a sé. È una
decisione di implementazione per Fase 6, non di navigazione — la Fase 3 aveva già disegnato il
loop concettualmente (23), qui si conferma solo che il punto di innesto è dopo la Review
completata, non dopo il solo upload foto.

### CTA

| CTA | Posizione | Ruolo | Stato oggetto richiesto |
|---|---|---|---|
| Crea capo (da Carico) | Header form (contestuale) | Seller | `lot_id` presente nel contesto — altrimenti è il "Crea capo" ordinario, invariato |
| Aggiungi un altro (loop) | Dopo Review completata | Seller | Sempre, quando `lot_id` è presente |
| Fatto per ora | Dopo Review completata | Seller | Sempre, quando `lot_id` è presente — esce dal loop |

### Comportamenti

- **Zero capi aggiunti e si esce**: possibile (l'utente registra il Carico, poi dice "No" alla
  prima proposta di aggiungere capi) — non un errore, il Carico resta valido con 0 capi
  collegati, riprendibile più tardi dal Detail Carico.
- **Interruzione a metà loop** (chiude il browser, naviga via): nessuno stato di "loop in corso"
  da salvare — ogni capo è già stato creato e confermato singolarmente prima di proseguire, non
  c'è una transazione bulk da recuperare. Riprendere significa semplicemente tornare al Detail
  Carico e premere di nuovo "Crea capo (da Carico)".

---

## Input per Fase 6 — spec-to-modular-ui

**Oggetto di questo brief:** nessun oggetto nuovo — estende `Catalog Entry` (Track A) con
`lot_id` nel payload di creazione, e introduce un comportamento di loop dopo Review.

**View inventory di questo brief:** 0 nuove view — 1 estensione di `NuovoCapoForm` (header
contestuale) + 1 nuovo passaggio di loop dopo Review (posizione esatta da definire in Fase 6).

**Nessun nuovo token** — riusa componenti esistenti (`NuovoCapoForm`, badge/testo per il
contesto Carico).

**Stack tech:** invariato.
**Design anchor:** MP076, `maat-ds/DESIGN.md`.

**Fase 5 su Lot è ora completa** (Detail Carico, `25` + questa estensione). Resta Accounting
Entry: nessun brief scritto ancora per "Modifica costi" (Fase 4 lo aveva lasciato come singola
CTA inline, forse non abbastanza per giustificare un brief a sé — da confermare quando si arriva
a quella parte).
