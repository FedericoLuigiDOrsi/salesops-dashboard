---
title: "OOUX Track C — Round 1 — Object Map · Home, Onboarding, Impostazioni, Auth"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi esegue Fase 1+ su Member/Tenant
---

# Track C — Round 1 — la cornice, verificata contro il codice

> L'handoff (§5) aveva un'ipotesi mai confermata: «Track C potrebbe produrre due soli oggetti
> nuovi (Member e Tenant)». Verificato ora contro schema e codice reale, non contro il conteggio
> dei componenti per cartella. **L'ipotesi regge**, con una sorpresa: Impostazioni non è un'area
> mai modellata come diceva l'handoff originale — ha già un'interfaccia completa.

## 0. La scoperta di questo giro: Impostazioni esiste già, ricca

`SettingsModal.tsx` (540 righe) è **già costruito**: 8 sezioni (Generale, Account, **Dipendenti**,
Piano e fatturazione, Metodi di pagamento, Notifiche, Privacy, Lingua), aperto come modale
(`openSettings`) da `AppShell`, non da una rotta `/impostazioni` (che infatti non esiste — Fase 3
di Marketplace Account l'aveva già verificato per un altro motivo). La sezione "Dipendenti" mostra
già una lista membri con nome, email, ruolo, stato (Attivo/Invitato), su dati **mock** (`TEAM`),
non ancora collegata a `members`.

Stesso profilo di Offer e Supplier in Track B: non si parte da zero, si riconcilia.

---

## 1. Member

| 🟡 Attributi core | 🔵 Metadata | 🩷 Nested | 🟢 CTA | ⚪ Stati |
|---|---|---|---|---|
| `user_id` (→ auth) · nome/email (via join, non su `members`) | `role` {admin, operator} | Tenant (N:1) | Aggiungi dipendente · (Rimuovi — non verificato se esiste) | Attivo · Invitato (solo UI, non su schema — vedi nota) |

**Canonico** (`members`): `id · tenant_id · user_id · role {admin,operator} · created_at`,
`unique(tenant_id, user_id)`.

**Mechanics**: un Member nasce per due vie verificate — (a) il **primo** Member di un Tenant
nasce automaticamente durante il provisioning (`POST /api/provision` → BFF
`/api/tenants/provision`), ruolo implicitamente `admin` essendo il fondatore; (b) membri
successivi via "Aggiungi dipendente" in Impostazioni → Dipendenti, **gated dal piano**
("5/5 posti usati", CTA porta a "Piano e fatturazione" se pieno). Il secondo percorso è UI reale
ma su dati mock, non verificato se scrive davvero su `members`.

⚠️ **`role` nello schema ha solo 2 valori** (`admin`, `operator`) — combacia con quanto assunto
in tutte le fasi precedenti ("Admin e Operator pari capacità sul catalogo"). **Nessun campo
`status` (Attivo/Invitato) esiste sul canonico**: è uno stato che la UI mostra ma che non ha
ancora una colonna — stesso pattern di "misure predisposte ma non esposte" già visto altrove,
solo al contrario (qui la UI ha uno stato che il canonico non prevede affatto, non un campo
inutilizzato).

---

## 2. Tenant

| 🟡 Attributi core | 🔵 Metadata | 🩷 Nested | 🟢 CTA | ⚪ Stati |
|---|---|---|---|---|
| `name` · `slug` | `plan` {starter,pro,enterprise} · `brand_config` (jsonb) | Member (1:N) | (Nessuna CTA diretta "crea tenant" — sempre automatico) | `status` {trial, active, suspended} |

**Canonico** (`tenants`): `id · slug · name · plan · status · brand_config · created_at ·
updated_at · deleted_at` (soft-delete, ADR 004).

**Mechanics**: creato **automaticamente** dal sistema al primo accesso post-registrazione
(`/api/provision`), mai da una CTA utente diretta — `slug` generato da nome+user_id (evita
collisioni), `plan` parte presumibilmente da `starter` (default schema), `status` da `trial`
(default schema). Il Seller non "crea" mai un Tenant nel senso OOUX classico: lo attiva
implicitamente registrandosi.

⚠️ **`brand_config` non ha nessuna UI verificata** in questo giro — esiste nello schema (REQ-8.1)
ma non è stato trovato un punto dove il Seller lo modifica. Potrebbe vivere nella sezione
"Generale" di Impostazioni (non ancora ispezionata riga per riga) — segnalato, non verificato.

---

## Relationship Map

```
Tenant ──1:N──► Member          (un tenant, N dipendenti — max secondo il piano)
Member ──N:1──► Tenant          (un membro appartiene a un solo tenant, unique(tenant_id,user_id))

Tutti gli oggetti di Track A/B ──N:1──► Tenant (tenant_id, RLS ovunque)
                                  già noto, non rimappato qui
```

Nessuna relazione diretta Member↔oggetti di prodotto (Catalog Entry, Listing, ecc.) oltre
l'isolamento per tenant già garantito da RLS — un Member non "possiede" capi, il Tenant sì.

---

## 3. Home / Dashboard — ipotesi CONFERMATA

**Nessun oggetto proprio.** 11 widget reali trovati (`AzioniWidget`, `EntrateWidget`,
`InventarioFermoWidget`, `LogisticaWidget`, `NoteWidget`, `NotificheWidget`, `OfferteWidget`,
`PanoramicaWidget`, `TargetSettimanaleWidget`, `TempoOperativoWidget`, `TopPerformerWidget`,
`VenditeWidget`) + `WidgetShell` (contenitore) + `registry` (config) — **ognuno aggrega un
oggetto già modellato altrove**: Offerte→Offer, Vendite→Sale, Logistica→Shipment, Entrate→
Accounting Entry, Inventario Fermo→Catalog Entry. `NoteWidget` è l'eccezione plausibile (note
libere del Seller, non legate a un oggetto di dominio) — da verificare se procede oltre Round 1.

**Conclusione OOUX valida**: Home non ha un Round 1 proprio da fare — è già coperta dagli oggetti
di Track A/B. Nessuna fase ulteriore necessaria per quest'area come tale.

---

## 4. Onboarding — ipotesi CONFERMATA

**Nessun oggetto proprio.** `OnboardingFlow.tsx` è una sequenza di step (già mappata in Track A,
`03-nav-flow.md`, per il flusso di primo utilizzo) su stati impliciti di Tenant (`status: trial →
active`?, non verificato) e Member (creazione del primo admin via provisioning). Non genera un
oggetto nuovo — orchestra la creazione di Tenant+Member già descritta sopra.

---

## 5. Auth — ipotesi CONFERMATA, con una mechanics degna di nota

**Nessun oggetto di prodotto** — `/login`, `/registrazione` sono infrastruttura (autenticazione
Supabase), fuori dal dominio OOUX come già ipotizzato. **Ma** `/api/provision` è la mechanics
reale con cui Tenant e Member nascono, e questa fase l'ha resa esplicita e verificata invece di
lasciarla come ipotesi: senza questo endpoint, gli oggetti Track C non avrebbero un punto di
creazione documentato.

---

## Decisioni di scope da confermare (non prese qui)

1. **`NoteWidget`**: oggetto di dominio (Note) o solo un campo libero senza identità propria?
   Non deciso — impatta se Home genera davvero zero oggetti nuovi o uno.
2. **Stato "Invitato" di Member**: la UI lo mostra, lo schema no. Si aggiunge una colonna, o resta
   uno stato derivato (es. da un invito pendente in un'altra tabella non ancora trovata)?
3. **`brand_config`**: dove si modifica? Non verificato in questo giro.

## Prossimo step → Fase 1 (MCSFD)

**Member ↔ Tenant** è l'unica relazione reale di questo Round 1 che richiede MCSFD — Home,
Onboarding, Auth non generano relazioni nuove da analizzare. Oggetto keystone per Fase 2 (Object
Guide): probabilmente entrambi insieme, dato che sono solo due e strettamente legati (stesso
pattern già usato per Listing+Shipment in Track B).
