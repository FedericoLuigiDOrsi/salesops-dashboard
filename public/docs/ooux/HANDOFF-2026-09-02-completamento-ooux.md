---
title: "Handoff — portare tutti gli elementi MAAT attraverso OOUX"
date: 2026-09-02
status: da-eseguire
owner: Federico D'Orsi
audience: chi esegue le fasi ORCA (sessione Claude, Marco, Federico)
---

# Handoff — completare OOUX su tutto MAAT

> **A chi prende in mano questo documento.** Non serve leggere la conversazione da cui nasce.
> Qui c'è lo stato reale delle fasi, cosa manca, in che ordine, e il context packet da passare
> a ogni fase. Le regole della pipeline stanno nella skill `orca-pipeline`: questo documento
> non le ripete, dice **cosa applicarle a**.

## 1. Perché esiste questo handoff

Il metodo OOUX è passato su **una sola capability su sei**. Photo-to-Catalog ha attraversato tutte
e sei le fasi e ha prodotto il design system che oggi governa l'app. Tutto il resto è stato
costruito senza: Contabilità, Logistica e Pubblicazione hanno solo un Round 1 di tre settimane fa,
e Home, Onboarding, Impostazioni e Auth non hanno nemmeno quello.

Il conto: **44 componenti su 75** vivono in aree che il metodo non ha mai modellato. Non è un
problema estetico. Pubblicazione, per dirne una, non ha un oggetto proprio: il suo file di dati
esporta sei funzioni e zero tipi, quindi la schermata è una vista filtrata del capo, mentre il
canonico dice che un capo su tre marketplace ha **tre annunci** con prezzi e stati indipendenti.

## 2. Stato reale delle fasi

Letto dai file, non dai piani.

```
ORCA Pipeline — MAAT

TRACK A · Photo-to-Catalog                      docs/technical/ooux/00-07
✅ Round 1  Object Map          3 oggetti (Catalog Entry · Photo · Notification)
✅ Fase 1   MCSFD               01-mcsfd.md
✅ Fase 2   Object Guide        02-object-guide.md
✅ Fase 3   Navigation Flow     03-nav-flow.md
✅ Fase 4   CTA Matrix          04-cta-matrix.md
✅ Fase 5   Sketch Brief        05-sketch-brief.md
✅ Fase 6   Atomic Bridge       06-atomic-bridge.md → design system MP076
✅ Gate zero  Contratto allineato  Addendum in 00, 02/09 — vedi §3

TRACK B · Aree operative                        docs/technical/ooux/08
✅ Round 1  Object Map          11 oggetti, 3 aree (Contabilità · Logistica · Pubblicazione)
✅ TRACK B CHIUSA (02/09) — ogni oggetto reale ha raggiunto la sua risoluzione corretta

Oggetti con Round1→Fase6 COMPLETI (6/9 oggetti reali):
  ✅ Listing              09-15  · gate zero + 6 fasi, PR #48-#59
  ✅ Shipment              09-15  · gate zero + 6 fasi, PR #48-#59
  ✅ Marketplace Account   16-21  · 6 fasi, PR #61-#66
  ✅ Lot ("Carico")        09,22-27 · 6 fasi. `items.lot_id` per flusso bulk (non allocazione
    costi, resta manuale). `type` badge neutro, non StatusPill (enum descrittivo)
  ✅ Accounting Entry      16,22-24,28-29 · 6 fasi. `sellerCostsCents` = rename di
    `shippingCostCents` esistente (non un campo nuovo), reso editabile. Admin-only RLS
  ✅ Offer                 30-35 · Accetta/Rifiuta/Controfferta già costruite. Sezione
    "Offerte" in ListingDetail (34) + `OfferStatusBadge` istanza di `StatusPill` (35,
    valutativo come Marketplace Account, a differenza di Lot.type)

Oggetti chiusi senza Fase 4-6 (conclusione OOUX legittima, non un buco):
  ✅ Supplier   08,30,36-37 · nessuna CTA diretta propria — l'unica azione (fuzzy-match sul
    ramo "nuovo fornitore" di Registra Carico) è già dentro la pipeline di Lot. Round1→Fase3
    fatte, Fase 4-6 avrebbero formalizzato CTA inesistenti solo per il formato
  ✅ Sale       09,30 · nessuna CTA diretta (creata sempre dal sistema via webhook) — resta
    un punto di validazione non verificato (vendita per item già venduto/mai pubblicato),
    non un oggetto da disegnare

Deciso fuori MVP (non bloccato — escluso deliberatamente):
  ⏸ Publish Strategy — le 8 colonne per le 3 regole automatiche non si costruiscono ora.
    `StrategySheet` va marcata "in arrivo" in UI, non lasciata configurabile a vuoto (16 §3).
    Unico oggetto Round 1 il cui lavoro resta genuinamente sospeso, per scelta

TRACK C · CHIUSA (02/09) — 2 oggetti reali, Round1→Fase6 completo su entrambi
✅ Round 1  Object Map          38 · 2 oggetti (Member · Tenant), 3 aree confermate senza
                                 oggetti propri (Home/Onboarding/Auth)
✅ Fase 1   MCSFD               39 · relazione unica Tenant→Member. Gap trovato: "Aggiungi
                                 dipendente" e la RPC `add_member_to_tenant()` esistono
                                 entrambi, scollegati. "Invitato" non ha dato dietro. Addendum:
                                 tetto membri diverge fra RPC (fisso 5) e UI piano (2/5/illim.)
✅ Fase 2   Object Guide        40 · Tenant/Member. Nessun Tenant "creato" da CTA — sempre
                                 automatico. "Dipendente" (UI) e "Member" (dev) restano
                                 registri separati, non sinonimi in conflitto.
✅ Fase 3   Navigation Flow     41 · 4 sezioni SettingsModal riconciliate (Generale→
                                 brand_config, Account→self-Member, Dipendenti→lista Member,
                                 Piano→Tenant.plan). Unico flusso cross-object già interrotto
                                 in due punti (Member non cablato, upgrade piano senza backend)
✅ Fase 4   CTA Matrix          42 · 4 CTA reali (Aggiungi Member, Cambia piano, Modifica
                                 identità negozio, Modifica profilo). Rimuovi/Modifica ruolo
                                 Member fuori MVP (deciso 02/09). ⚠️ nessun role-gating nel
                                 codice su nessuna delle 4 CTA — da costruire, non assumere
✅ Fase 5   Sketch Brief        43 · 5 view/componenti. Decisioni 02/09: Aggiungi Member =
                                 aggiunta diretta (no invito), tetto membri per piano. Gap
                                 nuovo: serve un lookup email→utente che oggi non esiste in
                                 nessuna parte del codice — la RPC vuole uno user_id, non
                                 un'email libera.
✅ Fase 6   Atomic Bridge       44 · nuova molecola MemberLookupField (Popover+Command mai
                                 assemblati prima nel codebase), nessun remap. Rischio di
                                 sicurezza trovato specificando il contratto: endpoint di
                                 lookup email→utente deve essere match esatto, rate-limited,
                                 mai fuzzy — altrimenti enumera utenti. TRACK C CHIUSA.

→ Track B è chiusa su tutto ciò che poteva procedere. Non restano oggetti Round 1 in stato
  "da fare" — solo Publish Strategy in pausa deliberata. Prossima azione possibile: partire su
  Track C (Round 1 mai fatto), riaprire Publish Strategy se emerge un bisogno reale,
  implementazione tecnica di quanto già speccato (Listing/Shipment/Marketplace Account già in
  codice, PR #67 e #71), o marcare `StrategySheet` "in arrivo" (implementazione diretta, non
  una fase pipeline).

  Questioni aperte non bloccanti (non fermano nulla, ma da tenere presenti quando si tocca
  l'oggetto): Shipment — 4 stati UI vs 5 stage canonici, mai mappati (10-16); delisting
  automatico alla vendita, mai verificato come implementato (11); drag&drop board Logistica,
  avanti-solo o libero (14-15); Listing — riconciliare col modello ChannelDots/PlatformPills
  (11, 15 Layer 1); storico eventi Shipment Detail, 5 stage canonici o 4 UI (14); Marketplace
  Account → Listing, nessuna propagazione dello stato `error` (18-21); Offer scadute — riga
  non interattiva o esclusa dalla lista (34); sezione Fornitori — perimetro esatto
  dell'Admin-only non verificato (37).
```

## 3. Gate zero — chiuso il 02/09

**Il Round 1 di Track A era indietro rispetto al codice.** Andava chiuso prima di ogni altra fase,
perché la regola della pipeline è «non inventare oggetti o relazioni non presenti nel Round 1»: se
il Round 1 mente, tutto il lavoro a valle eredita l'errore in buona fede.

### Come è stato chiuso, e perché non riscrivendolo

Questo handoff prescriveva di «allineare `00` al contratto v2». Sbagliato: quel file dichiara in
testa **«Non modificare: è l'artefatto di Round 1»**, ed è una regola giusta, perché quel documento
è il verbale di cosa produsse `mbse-to-ooux` il 27/06.

Riscriverlo avrebbe distrutto il record; lasciarlo intatto senza avviso avrebbe fatto ereditare
l'errore. Quindi **entrambe le cose**: la tabella originale resta, e sopra c'è un addendum che
dichiara il contratto vivo con la fonte nel codice per ogni riga. Chi alimenta una fase legge
l'addendum, chi cerca il verbale lo trova sotto.

### Le divergenze trovate, che erano più di una

Cercavo gli attributi. Verificando riga per riga contro il codice ne sono uscite **cinque**:

| | Round 1 (27/06) | Contratto vivo | Fonte |
|---|---|---|---|
| Attributi | 12 | **10** | `types/maat.ts` |
| Misure | set fisso a 4 campi | **derivate dalla categoria**, 4 categorie, sola lettura | `lib/measures.ts` |
| Stati | 3 persistiti | **4** (arriva `sold`) | `types/maat.ts` |
| Label foto | 6 | **8** (arrivano `difetti` e `aruco`) | `types/maat.ts` |
| Gate Confirm | 3 foto validate | **3 foto AND 4 attributi** | trigger `_sql/28` |

Le prime due erano quelle che cercavo. Le altre tre sono venute fuori solo perché ho confrontato
ogni campo del Round 1 con il tipo corrispondente, invece di verificare la sola voce che sapevo
essere sbagliata. **Vale come metodo per Track B**: quando si sospetta che un documento sia stale,
non si controlla il punto sospetto, si controlla tutto.

## 4. Track B — le tre aree operative

Round 1 è fatto e verificato contro il codice. Gli undici oggetti e le relazioni stanno in
[`08-object-map-aree-operative.md`](08-object-map-aree-operative.md).

### Context packet da passare alle fasi

```
progetto:   MAAT — SaaS B2B multi-tenant per il resale di abbigliamento vintage.
            Feature-verbo: un capo venduto sparisce subito dagli altri marketplace.

oggetti:    Contabilità → Accounting Entry (primario) · Sale · Supplier · Lot
                          (Settlement escluso: aggregato, non oggetto — deciso 02/09)
            Logistica   → Shipment (primario)
                          (Return/Dispute escluso: fuori MVP — deciso 02/09)
            Pubblicazione → Listing (primario atteso) · Offer · Marketplace Account ·
                            Publish Strategy

relazioni:  Catalog Entry ─1:N─► Listing ─1:N─► Offer
                          │         └─N:1─► Marketplace Account
                          └─1:1─► Sale ─1:1─► Shipment ─0:1─► Return/Dispute [fuori MVP, 02/09]
                                    └─1:N─► Accounting Entry ◄─┘
            Lot ─1:N─► Catalog Entry · Supplier ─1:N─► Lot
            Publish Strategy ─config─► Listing (per marketplace)

fase_prev:  08-object-map-aree-operative.md

scope:      tre relazioni prioritarie, in quest'ordine
            1. Catalog Entry → Listing   — edge keystone, oggi NON esiste
            2. Sale → Shipment          — Return escluso, fuori MVP per decisione 02/09
            3. Lot → Catalog Entry       — ripartizione costi, tocca il pricing

vincoli:    Next.js 16 · React 19 · Tailwind v4 · shadcn/ui · Supabase/Postgres con RLS
            per tenant. Un solo ruolo umano interattivo: il Seller (Admin e Operator hanno
            le stesse capacità sul catalogo). Web-first, responsive a mobile.
            Design system MP076 già lockato: non si rinegozia in queste fasi.
            La pubblicazione su Vinted è browser-only per vincolo permanente della
            piattaforma: qualunque CTA di pubblicazione passa dall'estensione, non da un'API.
```

### Oggetti keystone per la Fase 2

Non farla su tutti e undici. I due con più relazioni e più CTA:

1. **Listing** — è l'oggetto che oggi non esiste in UI ed è il centro della catena di destra
2. **Shipment** — è il ponte fra vendita e post-vendita, e da lì dipende la visibilità dei resi

### Tre decisioni che la Fase 1 non può prendere da sola — decise il 02/09

Erano di Federico, e andavano prese **prima** o la Fase 1 si bloccava a metà. Risposte in
[`08-object-map-aree-operative.md`](08-object-map-aree-operative.md#decisioni-prese-da-federico-0209):

| Oggetto canonico | Domanda | Deciso |
|---|---|---|
| `returns_disputes` | Il post-vendita entra nell'MVP? | **No, fuori MVP.** I quattro stati invisibili restano tali per scelta, non per dimenticanza |
| `marketplace_accounts` | Serve una schermata per collegare un account? | **Sì, serve.** Resta in scope per Fase 1 |
| `settlement_ledger` | Il settlement è un oggetto o un aggregato? | **Aggregato.** Resta il numero calcolato che è oggi, non entra nell'object map |

Fase 1 può procedere: nessuna delle tre blocca più nulla.

## 5. Track C — CHIUSA (02/09), Round1→Fase6 su `38`-`44`

L'ipotesi sotto (mai verificata quando questo handoff è nato) **regge**, verificata contro
schema (`01_foundations.sql`) e codice reale, non contro il conteggio dei componenti per
cartella:

| Area | Componenti | Oggetti propri | Esito Round 1 |
|---|---|---|---|
| **Home / Dashboard** | 11 widget + shell + registry | Nessuno | **Confermato** — ogni widget aggrega un oggetto già modellato (Offerte→Offer, Vendite→Sale, Logistica→Shipment, Entrate→Accounting Entry, Inventario Fermo→Catalog Entry). `NoteWidget` è l'unica eccezione plausibile, non decisa |
| **Onboarding** | 1 (`OnboardingFlow`) | Nessuno | **Confermato** — sequenza di stati su Tenant/Member, orchestra `/api/provision`, non genera un oggetto |
| **Impostazioni / Dipendenti** | `SettingsModal.tsx` (540 righe, 8 sezioni) | **Member** · **Tenant** | **Confermato, con sorpresa**: l'area non è mai stata modellata ma **non è vuota** — la sezione "Dipendenti" è già una UI matura (lista, ruoli, stato invito, CTA gated dal piano), su dati mock (`TEAM`), non ancora collegata a `members` |
| **Auth** | — | Nessuno | **Confermato** — infrastruttura, ma `/api/provision` è la mechanics reale con cui Tenant+Member nascono (server-to-server, idempotente, mai una CTA utente diretta) |

Stesso profilo di Offer/Supplier in Track B: qui non si parte da zero, si riconcilia una UI
già costruita contro il canonico. Decisioni di scope aperte (non bloccanti per Fase 1): stato
"Invitato" di Member esiste in UI ma non nello schema; `brand_config` di Tenant non ha una UI
verificata; `NoteWidget` potrebbe essere un oggetto Note a sé.

## 6. Ordine di esecuzione e gate

```
gate zero ──► Track B: 1 → 2 → 3 → 4 → 5 → 6 ──► Track C: Round 1 → 1 → 2 → 3 → 4 → 5 → 6
   §3 ✅          §4 ✅ una fase alla volta, validazione        §5 ✅ chiuso 02/09
                 di Federico fra una e l'altra
```

**Regole non negoziabili in questa esecuzione**

1. **Una fase alla volta**, con validazione esplicita di Federico prima della successiva. Il
   progetto è grande: farne più di una per sessione è il modo di produrre lavoro da rifare.
2. **Fase 6 è quella pericolosa.** Il progetto non è greenfield: ha un design system lockato, 75
   componenti e 16 schermate. La fase applica il suo ground-truth check e il confirmation gate
   prima di toccare qualsiasi artefatto esistente, e non si bypassa delegando in fretta. Il
   precedente: il 2 luglio un remap fatto senza quel controllo ha seguito l'anchor sbagliato.
3. **Non ricostruire Pubblicazione prima della Fase 5.** È la tentazione più forte perché è la
   schermata più visibilmente incompleta, ma finché Listing non è un oggetto con la sua guida e
   il suo brief, ogni ora spesa lì va rifatta.
4. **Il codice arbitra.** Se un oggetto nel Round 1 e il tipo in `types/maat.ts` divergono, non
   si sceglie il più recente per data: si guarda cosa gira. È esattamente così che il Round 1 di
   Track A è diventato stale senza che nessuno se ne accorgesse.

## 7. Definizione di fatto

OOUX è completo su MAAT quando:

- [x] `00-object-map-handoff.md` ha l'addendum col contratto vivo (02/09) e il verbale intatto
- [x] Track B ha raggiunto la sua risoluzione su ogni oggetto reale (02/09): 6/9 oggetti con
      Round1→Fase6 completo, 2/9 (Supplier, Sale) chiusi legittimamente senza Fase 4-6 —
      nessuna CTA diretta propria, non un buco. Solo Publish Strategy resta in pausa
      deliberata (fuori MVP)
- [x] Le tre decisioni di §4 sono prese e scritte, anche se la risposta è «fuori dall'MVP» (02/09)
- [x] Track C ha raggiunto la sua risoluzione su ogni oggetto reale (02/09): 2/2 oggetti
      (Member, Tenant) con Round1→Fase6 completo, 3 aree confermate senza oggetti propri
      (Home, Onboarding, Auth) — nessun oggetto lasciato a metà, a differenza di Track B
- [x] `11-disallineamenti-attivi.md` non ha più la riga attiva — spostata in "Casi risolti"
      (02/09), con i numeri finali reali (non la condizione di chiusura scritta
      originariamente, che assumeva "tutti e 11 con Fase 6" — non verificatasi alla lettera)
- [x] Ogni componente in `apps/web/components/maat/` è riconducibile a un oggetto o è
      dichiarato trasversale — verificato (02/09), audit completo in `45-component-audit-full.md`:
      **77/80**. I restanti 3 (`NoteWidget`, `TargetSettimanaleWidget`, `TempoOperativoWidget`)
      sono un gap residuo esplicito, non un buco silenzioso — implicano oggetti (Note, Target,
      Tempo operativo) mai passati da nessun Round 1, stesso trattamento di Publish Strategy:
      nominati, non costruiti

## 8. Cosa questo handoff non ha verificato

- Le relazioni della mappa in `08` sono marcate **bozza da validare in Fase 1** dal documento
  stesso. Non sono state riconfermate qui.
- Nessuna query sul database. Gli oggetti canonici citati vengono dai file di migrazione, non
  da uno schema introspezionato a runtime.
- L'endpoint di lookup email→utente specificato in Fase 6 di Track C (`44`) non è stato
  costruito — è un contratto per il team dev, non codice verificato in esecuzione.

In caso di conflitto fra questo documento e il codice, **vince il codice**.
