---
title: "OOUX Fase 2 — Object Guide · Offer"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi tocca OfferPopup, OfferteWidget o la riconciliazione di stato
---

# Fase 2 — Object Guide · Offer

> A differenza degli altri oggetti Track B fatti finora, Offer non parte da zero: ha già
> mechanics, view e CTA reali (`OfferPopup`, `OfferteWidget`). Questa fase allinea nome e
> vocabolario, non li inventa.

## Offer

**Alias da deprecare:** nessuno — "Offerta" è già il copy in uso ovunque (`OfferteWidget`,
"Offerta ricevuta" nel popup). Nome canonico in codice resta `Offer`, coerente col resto di
Track B (Listing/"annuncio", Lot/"Carico").

**Definizione:**
Un'Offer è una proposta di prezzo che un acquirente fa su **un Listing specifico**, su
marketplace che supportano la trattativa (non tutti — verificare per-marketplace in fase
successiva). Si distingue da una Sale perché l'Offer è ancora **aperta a negoziazione**: può
essere accettata (diventa presumibilmente una Sale, relazione non ancora mappata), rifiutata, o
il Seller può rispondere con una propria controfferta. Si distingue dal Listing perché
un Listing può ricevere più Offer nel tempo (anche in sequenza dopo un rifiuto), mentre l'Offer
è sempre su un singolo Listing.

**Esempi:**
- Un compratore offre 65€ su un annuncio a 89€ (Vinted): Offer `pending`, il Seller vede
  "-27%" come differenza nel popup
- Il Seller risponde con una controfferta a 75€: Offer passa a `countered` (canonico) — la UI
  oggi scrive `counter`, disallineamento da correggere (vedi Note dev)
- Un'offerta mai risposta entro `expires_at`: dovrebbe scadere (`expired`, canonico, REQ-616) —
  oggi la UI non ha un modo di mostrare questo stato

**Tipi:**
Nessun sottotipo rilevante — oggetto omogeneo. `marketplace` è un attributo ereditato dal
Listing collegato, non una variante di Offer.

**Note per il team dev:**
- **Riconciliazione di stato, non invenzione**: `OfferStatus` (UI) va portato da 4 a 5 valori
  (aggiungere `expired`) e `counter` va rinominato `countered` per combaciare col canonico.
  Stesso pattern già fatto per `AccountingEntryStatus` (secondo giro Fase 1).
- **CTA già reali, da formalizzare non da progettare**: `Rifiuta` (distruttiva, un click, nessuna
  conferma oggi), `Controfferta` (apre input inline, poi `Invia controfferta` / `Annulla`),
  `Accetta`. Copy esatto verificato in `OfferPopup.tsx`.
- **`expired` senza gestione**: se il backend applica davvero l'auto-reject a scadenza
  (REQ-616, non verificato se implementato — stesso dubbio del delisting automatico, primo giro
  Fase 1), la UI deve almeno riflettere l'esito, non solo prevenirlo lato server.
- **Relazione verso Sale non mappata**: cosa succede quando un'Offer `accepted` diventa
  effettivamente una vendita? Non è nel Round 1 né in nessun giro precedente — probabile che sia
  implicito (l'acquirente compra dopo l'accettazione, la Sale arriva via webhook indipendente),
  ma non verificato. Segnalato, non assunto.

---

## Convenzioni di naming

| Termine da evitare | Termine canonico | Motivo |
|---|---|---|
| `counter` (nel codice, `OfferStatus`) | `countered` | Allinea al canonico (`offers.status`), stesso lavoro già fatto per Accounting Entry |
| "Rispondi all'offerta" come nome di CTA generica | Tre CTA distinte: `Accetta Offer` · `Rifiuta Offer` · `Controfferta Offer` | Sono tre azioni diverse con tre effetti diversi, non una "risposta" generica — il test verbo+oggetto le separa correttamente |

---

## Prossimo step → Fase 3

Input per Navigation Flow: **Offer** ha già i suoi entry point reali (`OfferPopup` aperto da
notifiche/Home tramite `overlays-store`, `OfferteWidget` come lista aggregata in Home). Fase 3
deve solo **confermare** questa struttura esistente, non progettarla da zero — verificare se
serve un entry point aggiuntivo (es. da dentro il Listing Detail già costruito, Fase 5 di
Listing) per vedere le offerte di quel singolo annuncio, oggi non presente.
