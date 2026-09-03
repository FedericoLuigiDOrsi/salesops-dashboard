---
title: "OOUX Fase 2 — Object Guide · Listing e Shipment"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi scrive copy, componenti o schema per Pubblicazione e Logistica
---

# Fase 2 — Object Guide · i due oggetti keystone di Track B

> Glossario operativo per **Listing** e **Shipment**, i due oggetti con più relazioni e più CTA
> individuati in [`09-mcsfd-aree-operative.md`](09-mcsfd-aree-operative.md). Non è una spec
> tecnica: è l'allineamento su nome e significato, perché finiscono nell'interfaccia e nel copy
> (handoff §4, Blocco 4 o3 della coda design: farli male costa mesi di copy da riscrivere).

---

## Listing

**Alias da deprecare:** nessuno in conflitto. Il copy italiano già live (`LiveTab.tsx`,
`StrategySheet.tsx`) usa **"annuncio"** per questo stesso oggetto ("annuncio pubblicato",
"ritirare dall'annuncio", "annunci invenduti") — non è un alias da eliminare, è la traduzione
d'interfaccia corretta. **Regola per questa fase**: `Listing` è il nome canonico in codice/schema
(coerente con la tabella `listings` e con `Sale`/`Offer`/`Shipment`), **"annuncio"** è la sua resa
in copy italiano. Non introdurre un terzo nome.

**Definizione:**
Un Listing è la presenza pubblicata di un Catalog Entry su **un singolo marketplace**, con il suo
prezzo, stato e URL propri. Si distingue dal Catalog Entry perché un capo confermato non ha ancora
nessun Listing (non è ancora in vendita da nessuna parte); si distingue da un secondo Listing dello
stesso capo perché ognuno vive e muore indipendentemente — prezzo diverso, stato diverso, uno può
essere venduto (e quindi ritirato altrove) mentre un altro è ancora in bozza di pubblicazione.

**Esempi:**
- Un trench Burberry pubblicato su Vinted a 89€ e su Depop a 95€: **due Listing**, stesso Catalog
  Entry, prezzi diversi, `external_url` diversi
- Un capo confermato in catalogo ma non ancora pubblicato da nessuna parte: **zero Listing** — non
  è uno stato del Listing, è l'assenza del Listing
- Un capo pubblicato su Vinted con `per_listing_status = 'error'` (es. la piattaforma ha rifiutato
  l'annuncio): è comunque un Listing, solo in uno stato che richiede l'attenzione del Seller

**Tipi:**
Nessun sottotipo rilevante — oggetto omogeneo. `marketplace` è un attributo (5 valori: Vinted,
Depop, Grailed, Vestiaire, eBay), non una famiglia di Listing con comportamenti diversi.

**Note per il team dev:**
- La CTA che lo crea ("Pubblica su [marketplace]") è **per singolo marketplace**, non "pubblica
  ovunque": un batch-publish esiste già come interfaccia (`onPublish(ids, platforms)` in
  `ToPublishTab`) ma resta comunque N Listing distinti creati in un colpo solo, non un oggetto
  "pubblicazione multipla"
- `per_listing_status = 'error'` senza un percorso di retry visibile è uno stato senza uscita per
  il Seller — vincolante per Fase 5 (Sketch Brief), non solo una nota tecnica
- Dipende da un `Marketplace Account` attivo per quel tenant+marketplace (deciso 02/09: la
  schermata per collegarlo è in scope). La CTA "Pubblica" va **disabilitata con motivo visibile**,
  non nascosta, quando manca l'account — altrimenti il Seller non capisce perché non può pubblicare

---

## Shipment

**Alias da deprecare:** nessuno — `Shipment` è già il nome usato in codice
(`types/maat.ts`, `LogisticsCard`, `LogisticsView`) e regge come nome canonico.

**Definizione:**
Shipment è **lo stato di consegna corrente** di una Sale, nel percorso dal pagamento alla consegna
al cliente finale. Si distingue dalla Sale perché la Sale è l'evento "questo capo è stato venduto",
mentre lo Shipment è tutto quello che succede *dopo*: imballo, corriere, tracking, consegna. È
**derivato**, non una riga a sé: il canonico (`fulfillments`) registra ogni passaggio come evento
separato nel tempo, e "lo stato" che il Seller vede è l'ultimo evento registrato per quella
vendita — non un campo che si sovrascrive.

**Esempi:**
- Una vendita di ieri su Vinted, ancora da imballare: Shipment in stato "Da fare", zero eventi
  `fulfillments` registrati finora (o il primo, `packing`, se l'imballo è già iniziato)
- Un pacco affidato al corriere tre giorni fa, tracking attivo: Shipment "Spediti", con almeno un
  evento `shipped` nel suo log
- Un pacco che risulta consegnato secondo il corriere ma il Seller non l'ha ancora chiuso in MAAT:
  caso limite che oggi il modello a 4 colonne (Da fare/Fatti/Spediti/Consegnati) non distingue
  chiaramente da "in transito" — vedi nota sotto

**Tipi:**
Nessun sottotipo per lo Shipment in sé. Varia per **stage**, che è uno stato nel tempo, non una
famiglia di oggetti — un singolo Shipment attraversa tutti gli stage applicabili, non nasce già
tipizzato.

**Note per il team dev:**
- ⚠️ **I due elenchi di stati non coincidono, e non è solo terminologia.** L'UI (`ShipmentStatus`)
  ha 4 valori: `da_fare · fatti · spediti · consegnati`. Il canonico (`fulfillments.stage`) ne ha
  5: `packing · shipped · in_transit · delivered · completed`. Il commento nel codice UI spiega
  che `da_fare`/`fatti` precedono "la spedizione vera e propria" — cioè sono fasi di preparazione
  interna che potrebbero non corrispondere a **nessun** evento `fulfillments` ancora registrato.
  Non è una mappatura 1:1 che manca solo di essere scritta: **potrebbe non esistere un modo
  univoco di derivare "Fatti" da un log eventi che comincia da `packing`**. Questa è una domanda
  aperta per Fase 3 (Navigation Flow) o Fase 6, non risolta qui: come si distingue "Da fare" da
  "Fatti" se il canonico non ha un evento per nessuno dei due?
- "Segna spedito" e azioni simili **scrivono un nuovo evento**, non aggiornano un campo status.
  Qualunque componente che tratti `shipment.status` come editabile-e-basta sta assumendo la
  mechanics sbagliata (vedi Fase 1, §0.1)
- `hoursAgo` nel tipo UI attuale è relativo alla creazione ("da quando la vendita è entrata in
  pipeline"), non all'ultimo evento di stage — due orologi diversi che si confondono facilmente
  in un componente che mostra "aggiornato N ore fa"

---

## Convenzioni di naming

| Termine da evitare | Termine canonico | Motivo |
|---|---|---|
| "Pubblicazione" per indicare il Listing stesso | **Listing** (copy: "annuncio") | "Pubblicazione" è il nome dell'area/schermata (S-04), non dell'oggetto — confonderli fa dire "crea una pubblicazione" invece di "pubblica un annuncio" |
| "Spedizione" come sinonimo intercambiabile di Shipment | **Shipment** in codice, "spedizione" ok solo come copy italiano dell'istanza singola | Va bene in una frase ("la spedizione è in corso"), ma il nome del tipo/oggetto resta Shipment — non introdurre `Spedizione` come identificatore |
| "Status" generico per lo stato di Shipment | **Stage** (canonico) vs **Status** (UI, i 4 valori aggregati) | Sono due enum diversi (5 vs 4 valori) che si somigliano nel nome — vedi nota sopra. Non trattarli come sinonimi in nessun documento successivo |

---

## Prossimo step → Fase 3

Input per Navigation Flow: le relazioni prioritarie da Fase 1 restano `Catalog Entry → Listing` e
`Sale → Shipment`, con Listing e Shipment come punti di ingresso/destinazione. La domanda aperta
sulla mappatura dei 4 stati UI di Shipment contro i 5 stage canonici (nota sopra) andrebbe
chiarita prima o durante la Fase 3, perché la Navigation Flow di una board Kanban a 4 colonne
dipende da come quelle colonne si popolano.
