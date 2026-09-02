---
title: "OOUX Fase 3 — Navigation Flow · Supplier"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chi disegna la Fase 5 se emerge un Detail
---

# Fase 3 — Navigation Flow · Supplier

> Conferma di struttura esistente, come Offer. Una nota di precisione su un punto non
> verificato del tutto: il perimetro esatto dell'Admin-only su questa sezione.

## Entry Point

1. **Contabilità** *(esistente)* — sezione "Fornitori" dentro `AccountingView`, stessa pagina
   di Accounting Entry e Lot. Nessun nuovo entry point.

⚠️ **Precisione sul ruolo, non assunta**: la tabella `suppliers` ha solo `tenant_isolation` a
livello RLS (nessun check `current_app_role()`, verificato in Fase 2 del secondo giro) — a
differenza della vista `v_accounting_transactions`, che è esplicitamente Admin-only. Non è
verificato se la **pagina** `/contabilita` blocchi l'accesso a un Operator per intero (a livello
di route) o solo la query delle Transazioni fallisca/ritorni vuota. La sezione Fornitori
**potrebbe** essere visibile a un Operator anche se Transazioni no. Segnalato, non deciso qui —
non cambia la Fase 3 (l'entry point resta lo stesso), ma chi implementa i permessi deve saperlo.

---

## Grafo di navigazione

```
[Contabilità] ── sezione "Fornitori" ── lista (nome · iniziali · N carichi · ultimo · cifra)
      │
      └── ⚠️ GAP verificato: nessun tap-through — righe senza onClick nel codice reale.
            Oggi non c'è modo di vedere "tutti i carichi di QUESTO fornitore" isolati,
            solo il riepilogo aggregato nella riga
```

---

## View inventory

### Supplier

- **Lista globale** — sezione "Fornitori", esistente. Sort: non verificato se configurabile
  (la tabella Storico carichi ha sort per colonna, Fornitori non è stato controllato con lo
  stesso dettaglio in questo giro).
- **Card (inline)** — riga della lista, esistente: avatar iniziali, nome, `loadsCount` + data
  ultimo carico, cifra (presumibilmente totale speso — nome esatto `supplierFigure` nel codice,
  significato da confermare quando si tocca quel componente).
- **Detail** — non esiste. Non proposto in questo giro: nessuna fase precedente lo richiede, e
  il riepilogo in riga potrebbe già bastare per un seller con pochi fornitori. Se il volume
  cresce, potrebbe servire — non deciso qui, è un'ipotesi per il futuro, non un gap da colmare
  ora.
- **Empty state**: nessun fornitore ancora — non verificato se già gestito (probabile, dato
  quanto è maturo il componente).

---

## Supplier non procede a Fase 4-6 come oggetto a sé

Stesso trattamento di Sale (Fase 2, `30`): nessuna CTA diretta propria. L'unica azione che lo
tocca — il fuzzy-match sul ramo "nuovo fornitore" — è un miglioramento del comportamento di
`Registra Carico`, una CTA di **Lot**, già completa Round1→Fase6 (`27`). Costruire una Fase 4-6
separata per Supplier significherebbe formalizzare CTA che non esistono, solo per riempire il
formato — esattamente l'anti-pattern che la pipeline vieta.

**Supplier chiude qui**: Round 1 (`08`) → Fase 1 3° giro (`30`) → Fase 2 (`36`) → Fase 3 (questo
file). Il lavoro tecnico reale (fuzzy-match) è già tracciato nella pipeline di Lot.
