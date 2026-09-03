# Step 7 — Handoff Packet · MAAT / Photo-to-Catalog
**Sessione:** 2026-06-27-p2c · **Skill:** mbse-to-ooux v1.2.0 · **Destinazione:** orca-pipeline → Stitch

> Input canonico della ORCA Pipeline (Fase 1+). Object Map prodotto da mbse-to-ooux. Non modificare: è l'artefatto di Round 1.

---

## ⚠️ Addendum contratto — leggere prima delle tabelle (2026-09-02)

**Il Round 1 sotto è il verbale del 27/06 e resta intatto.** Ma il contratto è cambiato durante
l'implementazione, e chi apre questo file per alimentare una fase ORCA deve usare i valori di
questa sezione, non quelli delle tabelle originali.

La regola «non modificare» protegge il verbale, non i suoi lettori: cancellare la tabella
originale avrebbe distrutto il record di cosa produsse `mbse-to-ooux`, tenerla senza avviso
avrebbe fatto ereditare l'errore a ogni fase a valle. Quindi entrambe le cose, in quest'ordine.

**Arbitro: il codice**, non un documento. Ogni riga qui sotto è verificata alla fonte citata.

| Cosa | Round 1 (27/06) | Contratto vivo | Fonte |
|---|---|---|---|
| **Attributi AI** | 12 | **10** | `apps/web/types/maat.ts` → `CatalogEntryAttributes` |
| **Misure** | set fisso: larghezza · lunghezza · manica · vita | **derivate dalla categoria del capo**, 4 categorie, calcolate dalla foto ArUco, sola lettura | `apps/web/lib/measures.ts` |
| **Stati Catalog Entry** | 3 valori persistiti | **4** | `types/maat.ts` → `CatalogEntryStatus` |
| **Label foto** | 6 | **8** | `types/maat.ts` → `PhotoLabel` |
| **Gate Confirm** | 3 foto validate | **3 foto validate AND 4 attributi obbligatori** | trigger `items_status_guard`, `_sql/28` |

### I 10 attributi, esatti

`brand` · `tipoCapo` · `colore` · `taglia` · `materiale` · `genere` · `condizioni` · `difetti` ·
`stile` · `stagionalita`

Rispetto al Round 1: **tolti** `periodo`, `fit`, `rarità`; **aggiunto** `condizioni`. Decisione di
Federico del 07/07. Stringa vuota `""` significa campo mancante, non attributo assente.

### I 4 obbligatori del gate, e i 6 che non lo sono

Bloccanti: **`brand` · `tipoCapo` · `taglia` · `condizioni`**. Gli altri sei migliorano la scheda
ma il canonico accetta l'item senza. La fonte di verità è il trigger, non questo documento: se
l'insieme cambia si cambia **prima** la migrazione e poi la UI, mai il contrario.

Questo scioglie anche il caso `stagionalita`, che il codice marcava a bassa confidenza e insieme
pretendeva come obbligatorio.

### Le 4 categorie di misura

`top` · `bottom` · `gonna` · `abito`, derivate da `tipoCapo` con keyword match e fallback `top`.
Nessun campo dedicato in interfaccia, per scelta esplicita. Le misure **non sono editabili a mano**:
arrivano dal calcolo sulla foto reference con marker ArUco.

### I 4 stati, e perché non sono 3

`local_draft` → `to_be_reviewed` → `available` → `sold`. Il Round 1 non prevedeva `sold` perché il
post-vendita era fuori scope MVP; il tipo reale ce l'ha. Attenzione: questi sono i 4 stati **web**,
e il canonico ne ha **undici** che vi collassano sopra, sei dei quali finiscono su `sold`. Il
mapping vive in `apps/web/lib/lifecycle.ts` e il buco che apre è tracciato in
[`../11-disallineamenti-attivi.md`](../11-disallineamenti-attivi.md).

### Le 8 label foto

`fronte` · `retro` · `brand` · `taglia` · `materiale` · `difetti` · `extra` · `aruco`.
Rispetto al Round 1 sono arrivate `difetti` e `aruco`: quest'ultima era già prevista come
`photo_type`, ma è anche una label a sé nell'enum reale.

### Cosa dell'addendum NON tocca il Round 1

Restano validi e non sono stati rivisti: la Relationship Map, l'inventario CTA, le schermate
suggerite, il mono-ruolo Seller e la scelta di trattare Draft e Local Draft come stati e non come
oggetti. Se una fase a valle trova che anche uno di questi non regge, si aggiunge una riga qui,
non si riscrive la tabella.

---

## Object Map MVP

### 1. Catalog Entry *(oggetto primario — spina dorsale)*

| 🟡 Core attributes | 🔵 Metadata | 🩷 Nested objects | 🟢 CTAs (Seller) | ⚪ States |
|---|---|---|---|---|
| brand · genere · colore · taglia · materiale · periodo · tipo capo · fit · stile · rarità · stagionalità · difetti | SKU · larghezza · lunghezza · manica · vita · account_id · created_at | Photo · Notification | Crea capo · Conferma capo · Modifica campo · Elimina capo | Acquisition → Processing → Review → Review–Manual Fill → Draft → Local Draft → Confirmed |

**Note orca-pipeline:**
- Oggetto entry-point dell'app (lista + dettaglio).
- Tutti i campi 🟡 sono editabili manualmente anche se generati dall'AI.
- `Local Draft` = stato device-local (rete assente), si promuove automaticamente a `Draft` al sync.
- `Confirmed` genera SKU sequenziale (B-10) e promuove a status `available` (B-11).

### 2. Photo *(nested in Catalog Entry)*

| 🟡 Core attributes | 🔵 Metadata | 🩷 Nested objects | 🟢 CTAs (Seller) | ⚪ States |
|---|---|---|---|---|
| label · url | quality_score · quality_flags · photo_type · created_at | *(post-MVP: Catalog Entry)* | Scatta foto · Riprendi foto | captured → processing → validated · rejected |

**Note orca-pipeline:**
- `label`: fronte · retro · brand · taglia · materiale · extra (enum fisso MVP).
- `photo_type`: standard \| aruco. ArUco Reference Photo è un sottotipo, non un oggetto separato.
- `quality_flags`: array di advisory CV (es. `["blurry", "reflection"]`), read-only per il venditore.
- Upload Slot = affordance UI only (placeholder per label mancante), non persiste nel modello dati.
- Back-ref 🩷 Photo→Entry attiva solo con schermata editing dedicata (stile Photoroom) — **post-MVP**.

### 3. Notification *(inbox persistente)*

| 🟡 Core attributes | 🔵 Metadata | 🩷 Nested objects | 🟢 CTAs (Seller) | ⚪ States |
|---|---|---|---|---|
| tipo · messaggio | timestamp · letta | Catalog Entry | Segna letta · Naviga al capo · Elimina | non letta → letta |

**Note orca-pipeline:**
- `tipo`: `draft_ready` \| `local_save`.
- "Naviga al capo" = tap sulla notifica → apre Catalog Entry correlata (deep link).
- Notifiche persistenti (inbox), non one-shot.

---

## Relationship Map

```
Catalog Entry ──(1:N)──► Photo
Catalog Entry ──(1:N)──► Notification
Notification  ──(N:1)──► Catalog Entry   [tap → navigazione]

Post-MVP:
Photo ──(N:1)──► Catalog Entry   [back-ref, solo con schermata editing]
```

---

## CTA Inventory (10 CTA · 1 ruolo · MVP)

| # | CTA | Oggetto target | Ruolo |
|---|---|---|---|
| 1 | Crea capo | Catalog Entry | Seller |
| 2 | Conferma capo | Catalog Entry | Seller |
| 3 | Modifica campo | Catalog Entry | Seller |
| 4 | Elimina capo | Catalog Entry | Seller |
| 5 | Scatta foto | Photo | Seller |
| 6 | Riprendi foto | Photo | Seller |
| 7 | Segna letta | Notification | Seller |
| 8 | Naviga al capo | Notification → Catalog Entry | Seller |
| 9 | Elimina notifica | Notification | Seller |

*CTA sistema escluse dal modello OOUX (nessuna interazione utente diretta): lettura ArUco, sync automatico Local Draft, invio push Expo.*

---

## Schermate suggerite per orca-pipeline

| Schermata | Oggetto primario | Oggetti nested/correlati |
|---|---|---|
| **Lista capi** (Catalog view) | Catalog Entry (card list) | — |
| **Dettaglio capo** | Catalog Entry | Photo (griglia) · Notification badge |
| **Acquisizione foto** | Photo (per label) | Catalog Entry (contesto) · UI slot placeholder |
| **Review / modifica campi** | Catalog Entry (form) | Photo (thumbnail) |
| **Inbox notifiche** | Notification (lista) | Catalog Entry (preview card) |

---

## Decisioni di scope prese in sessione

| Decisione | Scelta | Post-MVP |
|---|---|---|
| Ruoli | MVP mono-ruolo (Seller) | Admin/Operatore differenziati |
| Catalog Field | Schema fisso (12 campi AI) — **oggi 10, vedi Addendum** | Campi custom configurabili |
| Photo editing | Nessuna schermata dedicata | Layer stile Photoroom + back-ref Photo→Entry |
| Multi-account | Filtro su `account_id` in Catalog Entry | — |
| Draft/Local Draft | Stati di Catalog Entry, non oggetti separati | — |

---

## Fonte BBA/WBA

- `technical/maat-bba-photo-to-catalog.md` — v3.1
- `technical/photo-to-catalog-wba.html` — v0.5.0 (stack non lockato, gate 4.7 aperto)

**Attenzione orca-pipeline:** la WBA (Step 6) è sospesa — lo stack tecnico (Pugh matrix) non è ancora lockato. Il modello OOUX è indipendente dallo stack e può procedere verso Stitch. Sincronizzare con il team tecnico prima della fase di codifica.
