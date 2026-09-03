---
title: "OOUX Track C — Fase 6 — Atomic Bridge · Tenant, Member"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi implementa Dipendenti/Piano/Generale/Account in SettingsModal
---

# Atomic Bridge — Track C

> Ultimo oggetto di Track C. Con questo, Round1→Fase6 è completo su tutta l'area. La
> sorpresa di questa fase: specificare il contratto tecnico ha fatto emergere un rischio di
> sicurezza (enumerazione utenti) che nessuna fase precedente aveva notato — nemmeno il
> Sketch Brief, che si era fermato a "serve un lookup email", senza chiedersi chi potrebbe
> abusarne.

## Layer 1 — Ground-truth (riverificato)

`maat-ds/DESIGN.md` — `status: locked`, `locked_date: 2026-09-02`, supersede confermato di
`07-design-anchor-p2c.md`. Stessa fonte usata per tutta Track B, nessuna nuova ambiguità in
questo giro. Nessun remap di componenti esistenti previsto da questa fase.

## Layer 3 — Atomic Design derivato

### Atomi riusati as-is (nessuna modifica)

| Atomo | Sorgente | Uso in questa fase |
|---|---|---|
| `Badge` | `components/ui/badge` | Member.role — stessa classe inline già usata per `Lot.type` (Track B, doc 27): `variant="outline" className="gap-1.5 border-border text-muted-foreground"`. Nessun wrapper — un solo nuovo utilizzo non giustifica un componente dedicato, stessa logica che ha già escluso `Lot.type` da `StatusPill` |
| `Popover` / `Command` | `components/ui/popover`, `components/ui/command` | Base per la nuova molecola di lookup (sotto) — atomi shadcn già nel design system, **mai stati assemblati insieme da nessun componente reale finora** (verificato: unico riferimento a `CommandInput` nel codebase è la sua stessa definizione) |
| `Card`, `Button`, `Input`, `Select`, `Textarea`, `Avatar` | `components/ui/*` | Generale, Account, Piano — riuso diretto, nessuna variante nuova richiesta |

**Deliberatamente NON usato**: `StatusPill`. `role` {admin, operator} non è uno stato
valutativo (nessun ruolo è "meglio" dell'altro) — resta plain Badge, stessa decisione già
presa per `Lot.type`. `StatusPill` stesso non viene toccato: zero remap.

### Molecola nuova: **MemberLookupField**

Non esisteva — combina due atomi già disponibili ma mai stati messi insieme. Serve un nome
canonico per il glossario dev (Object Guide non l'aveva previsto, perché a quel punto la
molecola non era ancora stata specificata).

- `Popover` (contenitore) + `Command`/`CommandInput` (campo di ricerca) + fetch async
  debounced (~300ms) verso il nuovo endpoint di lookup (sotto)
- Stati: `idle` (nessun input) · `searching` (debounce attivo) · `found` (mostra nome/avatar
  dell'utente trovato, pronto per submit) · `not_found` (messaggio esplicito, submit
  disabilitato)
- Non è un componente generico "ricerca utente riusabile ovunque" — è specifico a questo
  flusso (un solo consumo, `AddMemberPanel` sotto). Se in futuro serve altrove, allora vale
  la "regola del tre" per generalizzarla — non prima.

### Organismo nuovo: **AddMemberPanel**

Pannello inline dentro la sezione Dipendenti (Fase 5, preferenza già espressa). Composizione:
`MemberLookupField` + `Select` (ruolo, default Operator) + `Button` (submit) + area
messaggio errore.

### Nessun componente nuovo per Piano

3 card via `Card` generico — nessun "PlanCard" trovato nel codebase (verificato, grep vuoto)
e nessuna complessità (prezzo, nome, lista feature, un bottone) che giustifichi
un'astrazione dedicata a 3 istanze statiche.

---

## Layer 4 — Contratto per il team dev

### Token contract

| Attributo | Valori | Token/componente | Nota |
|---|---|---|---|
| `Member.role` | admin, operator | Nessun token semantico — Badge neutro, stessa classe di `Lot.type` | Deliberatamente omogeneo: non serve differenziare admin/operator visivamente oltre il testo |
| `Tenant.plan` | starter, pro, enterprise | Nessun badge oggi — rappresentato per intero dalle 3 card in "Piano", non da un badge compatto | Se in futuro serve un badge di piano altrove (es. header), è un token da definire allora, non ora |

### Requisiti tecnici che questa fase porta a dev (non solo visivi)

1. **`add_member_to_tenant()` va parametrizzata su `tenants.plan`** (deciso Fase 5) — tabella
   cap: `starter → 2`, `pro → 5`, `enterprise → null` (illimitato). Oggi la funzione ha `5`
   hardcoded per chiunque — cambiare la funzione SQL, non solo la UI.
2. **Nuovo endpoint di lookup email → utente** — non esiste nulla di simile nel codebase
   (verificato). ⚠️ **Vincolo di sicurezza, non opzionale**: deve accettare solo **match
   esatto** dell'email (mai ricerca parziale/fuzzy — un endpoint che risponde a prefissi
   parziali è un enumeratore di utenti), essere **rate-limited**, e restituire il minimo
   indispensabile (nome/avatar per conferma visiva, non altri dati dell'utente). La Fase 4
   ha già segnalato che nessuna CTA di quest'area ha role-gating nel codice — questo
   endpoint eredita lo stesso problema e lo aggrava (un endpoint di ricerca utenti è più
   sensibile di un bottone UI): se il gating Admin-only non viene costruito prima, ALMENO
   questo endpoint specifico deve avere il suo controllo di accesso indipendente.
3. **Persistenza reale per Generale e Account** — oggi `useState` locale (`settings-store.tsx`),
   mai scritto su Supabase. Non è un problema di design (Fase 5 già lo diceva) — qui si
   conferma che non serve nessun nuovo componente per risolverlo, solo collegare `setBrand`/
   `setProfile` a una scrittura reale (`tenants.brand_config`, dati profilo utente).

### Cosa questa fase NON risolve (eredita apertura da fasi precedenti)

- Ruolo abilitante per "Aggiungi Member"/"Cambia piano Tenant" — ⚠️ ancora non specificato
  (Fase 4). Il punto 2 sopra lo rende urgente per l'endpoint di lookup, ma la decisione di
  prodotto (chi può fare cosa) resta aperta.
- Backend per l'upgrade di piano — nessuna funzione trovata in nessun giro di questa
  pipeline. Serve costruirla, non è nello scope di questa fase specificarne i dettagli.

---

## Track C — chiuso

Round 1 (`38`) → Fase 1 (`39`) → Fase 2 (`40`) → Fase 3 (`41`) → Fase 4 (`42`) → Fase 5
(`43`) → Fase 6 (`44`, questo documento). Due oggetti reali (Tenant, Member), tre aree
confermate senza oggetti propri (Home, Onboarding, Auth). Nessun oggetto lasciato a metà: a
differenza di Track B, qui non c'è stato bisogno di chiudere nulla "senza Fase 4-6" — l'area
era piccola abbastanza da percorrerla per intero in un solo giro.
