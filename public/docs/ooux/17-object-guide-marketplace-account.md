---
title: "OOUX Fase 2 — Object Guide · Marketplace Account"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi disegna la schermata di collegamento marketplace (non ancora briefata)
---

# Fase 2 — Object Guide · Marketplace Account

> Un solo oggetto in questo giro: è l'unico emerso dal secondo giro MCSFD
> (`16-mcsfd-round2-aree-operative.md`) non bloccato da una decisione di Federico. Accounting
> Entry e Publish Strategy restano fuori, in attesa.

## Marketplace Account

**Alias da deprecare:** nessuno — l'oggetto non ha ancora nessuna rappresentazione UI, quindi
non esiste un nome alternativo già in uso da correggere. **Attenzione al nome da NON usare in
copy**: "Account" da solo, in questo dominio, è ambiguo — MAAT ha già un concetto di account a
livello tenant/Seller (login, membri). Non abbreviare mai a "il tuo account" nella UI: sempre
qualificato con il marketplace ("il tuo account Vinted", non "il tuo account").

**Definizione:**
Un Marketplace Account è il collegamento autorizzato fra il tenant MAAT e **un singolo
marketplace esterno**, che rende possibile pubblicare annunci lì. Si distingue da un Listing
perché non riguarda un capo specifico: è l'infrastruttura che rende un intero marketplace
utilizzabile, non un annuncio su di esso. Un tenant ne ha al più uno per marketplace (5 possibili
in totale), non uno per capo o per Listing.

**Esempi:**
- Il tenant ha collegato Vinted e Depop, entrambi `active`: può pubblicare su entrambi, non su
  Grailed/Vestiaire/eBay finché non li collega
- Un account Vinted `error` (es. credenziali scadute, rifiutate dalla piattaforma): il tenant
  aveva la pubblicazione attiva, ora non può più pubblicare né gestire gli annunci esistenti lì
  finché non lo ricollega
- Un tenant appena creato: zero Marketplace Account. Non è uno stato di errore, è lo stato
  iniziale di ogni tenant nuovo — nessuna pubblicazione è possibile finché non se ne collega
  almeno uno

**Tipi:**
Nessun sottotipo rilevante — oggetto omogeneo. `marketplace` è un attributo (5 valori), non una
famiglia di Marketplace Account con comportamenti diversi tra loro.

**Note per il team dev:**
- **`secret_ref` non è un attributo come gli altri.** Punta a un secret nel vault (pgsodium),
  mai il valore in chiaro nel modello applicativo. Qualunque view/API che espone un Marketplace
  Account deve escludere `secret_ref` dal payload verso il client, o restituire al più un
  booleano "credenziali presenti" — non il riferimento stesso, che comunque non è il segreto ma
  è comunque metadato sensibile da non esporre senza motivo.
- **Verificato, non assunto**: a differenza di Contabilità (Admin-only a livello RLS, secondo
  giro Fase 1), la policy RLS di `marketplace_accounts` non ha restrizione di ruolo — è
  `tenant_isolation` semplice, grant a `authenticated` senza check su `current_app_role()`.
  Marketplace Account segue quindi il "pari capacità sul catalogo" già assunto per Seller
  Admin/Operator, non l'eccezione di Contabilità.
- **Il legame con Listing non è una FK** (Fase 1, secondo giro): `listings` non ha
  `marketplace_account_id`. Qualunque componente che debba sapere "questo Listing ha un account
  attivo dietro?" fa un lookup su `tenant_id`+`marketplace`, non segue un puntatore. Chi
  implementa la Dependency della CTA "Pubblica Listing" deve saperlo prima di scrivere la query.
- **`status='error'` non è distinto da `status='inactive'` nel modello dati** in un modo che
  suggerisca un percorso diverso — entrambi bloccano la pubblicazione. La differenza (scaduto vs
  mai stato attivo) è solo nel messaggio da mostrare, non nel comportamento del sistema. Non
  inventare una gerarchia di severità fra i due che il canonico non ha.

---

## Convenzioni di naming

| Termine da evitare | Termine canonico | Motivo |
|---|---|---|
| "Account" da solo (in copy) | "account [Marketplace]" (es. "account Vinted") sempre qualificato | Ambiguità con l'account tenant/Seller di MAAT stesso |
| "Collegare un marketplace" (come se il marketplace fosse l'oggetto) | "Collegare un Marketplace Account" / "collegare [Marketplace]" | L'oggetto che si crea è l'account, non il marketplace — il marketplace esiste a prescindere |
| "Integrazione" | Marketplace Account | "Integrazione" è termine tecnico generico, non è come il Seller penserebbe l'azione ("ho collegato il mio Vinted") |

---

## Prossimo step → Fase 3

Input per Navigation Flow: **Marketplace Account** — nessuna view esiste oggi (Fase 1, secondo
giro: "nessuna UI verificata per crearlo"). La Fase 3 deve stabilire da zero l'entry point (
probabile: una sezione Impostazioni/Account, non ancora mappata perché appartiene a Track C, non
Track B — da chiarire se questa view anticipa parte di Track C o resta dentro Pubblicazione).
Relazione nota: Marketplace Account → Listing (N:1 implicito, dependency per la CTA "Pubblica").
