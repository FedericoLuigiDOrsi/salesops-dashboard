# MAAT — Oggetti del dominio (OOUX)

> Il modello OOUX che i componenti servono. MAAT/Photo-to-Catalog = tool web-first per il **Seller** resale vintage che cataloga capi da foto via AI. Mono-ruolo (MVP).
> **v2 (2026-07-07)**: sezione aggiornata rispetto al prototipo reale (`salesops-dashboard`) — attributi 12→10, misure da set fisso a categoria derivata. Vedi `types/maat.ts` e `lib/measures.ts` in questo pacchetto per il contratto esatto.

## 3 oggetti

### 1. Catalog Entry *(primario — "Capo" nell'UI)*
Il record di un capo in lavorazione, **pre-pubblicazione** (editabile, senza prezzo). Al Confirm genera SKU e diventa Inventory Item del sistema vendita (fuori scope).
- **Attributi AI (10, editabili)**: brand · tipo di capo · colore · taglia · materiale · genere · condizioni · difetti · stile · stagionalità.
  - Stringa vuota `""` = campo mancante (stato "Mancante" in Review/Detail, evidenza rossa).
  - ⚠️ Cambiati rispetto alla spec ORCA originale (Fase 5-6): rimossi `periodo`, `fit`, `rarità`; aggiunto `condizioni`. Decisione Federico, 2026-07-07.
- **Misure — NON più un set fisso.** Dipendono dalla **categoria** del capo, derivata internamente da `tipo di capo` (nessun campo dedicato in UI — vedi `lib/measures.ts`):
  | Categoria | Campi |
  |---|---|
  | Top | spalle · lunghezza totale · lunghezza manica · larghezza manica · larghezza torace · larghezza vita |
  | Bottom | larghezza vita · larghezza fianchi · lunghezza totale · cavallo · larghezza coscia · larghezza caviglia |
  | Gonna | larghezza vita · larghezza fianchi · lunghezza totale |
  | Abito | larghezza spalle · larghezza torace · larghezza vita · larghezza fianchi · lunghezza manica |

  Calcolate automaticamente dalla foto reference con marker **ArUco** — mai editabili a mano, sola lettura in Review/Detail. Categoria = keyword match su `tipo di capo` (free text), fallback `top` per outerwear/nomi brand-specific senza keyword (es. "Beaufort", "Retro-X").
- **Metadata**: SKU (solo se confermato, sequenziale atomico) · account_id · created_at.
- **`status` persistito** (filtro Lista capi): `local_draft` (Locale, offline) → `to_be_reviewed` (Bozza, richiede azione) → `available` (Confermato).
  - ⚠️ Distinto dagli **stati FSM di sessione** (Acquisition/Processing/Review/Manual Fill), transienti, non righe di catalogo.
- **CTA (Seller)**: Crea capo · Conferma capo (gate: 3 foto obbligatorie validated, **indipendente** dal completamento testuale) · Modifica campo · Elimina capo (cascade notifiche).
- **Nested**: Photo (1:N) · Notification (1:N).

### 2. Photo *(nested in Catalog Entry, slot-driven)*
Una immagine legata a uno **slot etichettato**. Non è galleria libera.
- **Attributi**: label `{fronte, retro, brand, taglia, materiale, extra}` (fronte/retro/brand **obbligatorie**) · url · photo_type `{standard, aruco}` (aruco = reference calibrazione, nascosta, alimenta il calcolo misure) · quality_score · quality_flags (array advisory CV, read-only) · created_at.
- **Stati (pipeline CV)**: captured → processing → validated | rejected.
- **CTA**: Scatta foto (slot vuoto) · Riprendi foto (slot rejected).

### 3. Notification *(inbox persistente)*
Deep-link a un capo.
- **Attributi**: tipo `{draft_ready, local_save}` · messaggio · timestamp · letta.
- **Stati**: non letta → letta.
- **CTA**: Naviga al capo (deep-link, +letta) · Segna letta · Elimina notifica.
- **Ref**: Catalog Entry (N:1). Se la Entry è stata eliminata → dead-link state ("Questo capo non è più disponibile"), non naviga.

## Relazioni
```
Catalog Entry ─1:N─► Photo
Catalog Entry ─1:N─► Notification
Notification  ─N:1─► Catalog Entry   (tap → navigazione)
```

## Schermate (organismi) e oggetto primario
| Schermata | Route | Oggetto | Componente organismo |
|---|---|---|---|
| Lista capi | `/capi` | Catalog Entry (collezione) | CatalogList — viste Card / Tabella (default) / Kanban |
| Dettaglio capo | `/capi/:id` | Catalog Entry | CatalogEntryDetail |
| Review / Manual Fill | `/capi/:id/review` | Catalog Entry (to_be_reviewed) | ReviewForm |
| Acquisizione foto | `/capi/:id/foto/:label` | Photo | PhotoCaptureFlow |
| Inbox notifiche | `/notifiche` | Notification (collezione) | NotificationInbox |

## Scope MVP
Mono-ruolo Seller · schema 10 campi + misure per categoria · no editor foto dedicato (post-MVP: layer Photoroom + back-ref Photo→Entry) · multi-account via filtro `account_id`.
