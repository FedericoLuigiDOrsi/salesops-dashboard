---
title: "OOUX Fase 2 — Object Guide · Supplier"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi estende RegistraCaricoDialog con l'autocomplete deciso il 02/09
---

# Fase 2 — Object Guide · Supplier

> Come Offer, Supplier non parte da zero: ha già una lista reale in `AccountingView` (sezione
> "Fornitori"). Questa fase allinea il vocabolario e registra un vincolo di prodotto emerso
> leggendo il codice: la privacy dei nomi fornitore.

## Supplier

**Alias da deprecare:** nessuno — "Fornitore" è già il copy in uso (sezione "Fornitori" in
Contabilità). Nome canonico in codice resta `Supplier`.

**Definizione:**
Un Supplier è la controparte da cui il Seller acquista un Lot — una persona o un'attività da cui
arriva un carico di capi. Si distingue dal Lot perché il Supplier è **ricorrente** (lo stesso
fornitore genera più Lot nel tempo), mentre ogni Lot è un evento di acquisto singolo. Non ha
relazioni dirette con Catalog Entry o con la vendita: la sua unica relazione è verso Lot.

**Esempi:**
- Un privato che vende occasionalmente ("Vintage Roma"): un Supplier con pochi Lot, magari uno
  solo
- Un grossista ricorrente: un Supplier con `loadsCount` alto, ricompare a ogni "Registra Carico"
  tramite il `Select` di fornitori noti
- Un fornitore mai visto prima: nasce al momento della registrazione del primo Lot, non prima

**Tipi:**
Nessun sottotipo rilevante — oggetto omogeneo.

**Note per il team dev:**
- **Privacy, non solo dato**: la UI dichiara esplicitamente ("I nomi dei tuoi fornitori restano
  privati: MAAT non ha accesso alla tua lista fornitori") che i nomi Supplier sono un dato
  **sensibile per il tenant**, non solo tenant-isolato per RLS come il resto. Qualunque
  estensione (autocomplete incluso) deve restare client-side/tenant-scoped — nessuna
  aggregazione cross-tenant, nessun invio a servizi esterni per il matching fuzzy deciso il
  02/09. Il confronto va fatto sui dati già caricati per quel tenant, non su una chiamata a un
  servizio terzo di normalizzazione nomi.
- **Lista globale già reale**: la sezione "Fornitori" (`AccountingView`) mostra nome, iniziali
  come avatar, `loadsCount`, data ultimo carico, e una cifra (`supplierFigure` — presumibilmente
  totale speso, da confermare). Non è un gap da colmare, è un punto di partenza per Fase 3.
- **Autocomplete deciso il 02/09**: è un potenziamento del `Select` già esistente in
  `RegistraCaricoDialog` (correzione Fase 1, `30`), non un componente da zero. Il fuzzy-match
  serve solo per il ramo "nuovo fornitore", contro l'elenco già caricato in memoria per quel
  tenant.

---

## Convenzioni di naming

| Termine da evitare | Termine canonico | Motivo |
|---|---|---|
| "Cliente"/"Partner" per Supplier | Supplier ("Fornitore" in copy) | Ambiguità con altri ruoli commerciali — Supplier è specificamente chi vende AL Seller, non chi compra da lui |

---

## Prossimo step → Fase 3

Input per Navigation Flow: **Supplier** ha già il suo entry point reale (sezione "Fornitori" in
Contabilità, Admin-only come il resto di quell'area — da confermare, non ancora verificato se
questa sezione specifica eredita la stessa restrizione RLS o è meno protetta). Fase 3 conferma
la struttura esistente e valuta se serve un Detail per singolo fornitore (oggi la riga mostra
solo un riepilogo, nessun tap-through verificato).
