# MAAT — Component Spec (tutti gli elementi)

> Spec di sviluppo per **ogni** componente MAAT/Photo-to-Catalog. Consuma i token semantici di [`design-tokens.json`](design-tokens.json) (vedi [`DESIGN.md`](DESIGN.md)). Ogni componente cita l'**oggetto OOUX** che serve ([`OBJECTS.md`](OBJECTS.md)) e mostra la sua anteprima nelle card `@dsCard` (`*.html`).
> Regola trasversale: dati misurabili in `--mono`; accento `--accent` solo su azione/attenzione; mai `#000`/Inter/serif. Stati interazione standard: default · hover · active(-1px) · focus(`--focus-ring`) · disabled.

Indice: **Atomi** (Button, StatusBadge, Input, Select, Search, SegmentedFilter, Chip, Avatar, Icon, Toggle) · **Molecole** (PhotoSlot, AttributeField, CatalogCard, NotificationRow, ConfirmGateButton, StatTile, EmptyState) · **Pattern** (Banner, Toast, Accordion, Progress, Sequence, Modal, Skeleton) · **Organismi** (AppShell, CatalogList, CatalogEntryDetail, ReviewForm/ManualFill, PhotoCaptureFlow, NotificationInbox, PhotoGrid).

---

## ATOMI

### Button
- **Serve**: tutte le CTA. **Props**: `variant: primary|ghost|danger`, `disabled`, `icon?`, `children`.
- **Varianti**: `primary` (fill `--accent`, testo `--on-accent`) · `ghost` (outline `--text-primary`) · `danger` (testo `--danger`, hover fill rosso).
- **Stati**: hover (primary→`--accent-press`; ghost→fill near-black), active `translateY(1px)`, `disabled` (fill grigio `#E7E8DF`, testo `--text-tertiary`, no pointer).
- **Forma**: `--r-pill`, padding 11/20, weight 600 → altezze reali 32/36/40px (`h-8`/`h-9`/`h-10`). **A11y**: focus ring; disabled = `aria-disabled`. Sui target di tocco vale `DESIGN.md` §11: su web la scala compatta è **voluta** e rispetta WCAG AA; i ≥44px valgono su `apps/mobile`.
- **Do/Don't**: una sola primary per vista · niente fluo su azioni secondarie · testo bianco MAI su fluo.

### StatusBadge
- **Serve**: `Catalog Entry.status` + stato Photo rejected. **Props**: `status: bozza|confermato|locale|rejected`, `label`.
- **Varianti**: bozza (bg `--accent`, testo near-black) · confermato (bg verde 12%, testo `--success`) · locale (bg steel 14%, testo `--text-secondary`) · rejected (bg rosso 12%, testo `--danger`).
- **Anatomia**: pill mono uppercase + dot `currentColor`. **A11y**: lo stato è veicolato da label testuale, non solo colore.
- **Do/Don't**: sempre con label leggibile · niente badge senza testo.

### Input
- **Props**: `label`, `value`, `placeholder`, `error?`, `helper?`. **Anatomia**: label sopra · field · helper sotto.
- **Stati**: focus (border `--accent` + `--focus-ring`) · error (border `--danger`, helper rosso) · disabled.
- **Do/Don't**: label sopra (mai floating) · errore inline sotto.

### Select (Dropdown)
- **Serve**: editing attributi enum (Fit, Genere, Stagionalità, Rarità…). **Props**: `label`, `value`, `options[]`, `onChange`.
- **Anatomia**: control (valore + chevron) → lista opzioni; opzione selezionata = bg `--accent`/testo near-black.
- **A11y**: navigabile da tastiera, `role=listbox`. **Do/Don't**: usa per enum a valori noti, non per testo libero.

### Search
- **Serve**: Lista capi (cerca brand/tipo/SKU). **Props**: `placeholder`, `value`, `onChange`.
- **Anatomia**: pill con glifo lente + input trasparente; focus-within → ring `--accent`.

### SegmentedFilter
- **Serve**: filtro `Catalog Entry.status` (Tutti/Bozze/A catalogo/Venduti) e ogni altra scelta esclusiva breve: vista, densità, ordinamento, Tabella/Griglia. **Props**: `options[]`, `active`, `onChange`, `className?`.
- **Option**: `{ value, label, count?, icon? }`. `count` = badge numerico a destra (lo usa solo il filtro di stato); `icon` = nodo a sinistra dell'etichetta (lo usa il toggle Tabella/Griglia).
- **Anatomia**: track grigio + segmenti pill; attivo = fill near-black, testo `--text-on-dark`, con indicatore che **scorre** sotto la voce attiva (misurato a runtime, ri-misurato su cambio opzioni e resize).
- **Do/Don't**: 2–5 opzioni esclusive · oltre → usa Select.
- **Nota (03/08)**: fino a questa data ne esistevano **tre** implementazioni — questa, `StatusSegment` e `ViewToggle`, entrambe locali a `InventoryToolbar`. Erano il disallineamento #6 del registro. Quelle conformi alla spec erano le locali (pill near-black), quindi la fusione è andata in quella direzione: `SegmentedFilter` ha assorbito indicatore, contatori e icone, e le altre due sono state eliminate. **Non reintrodurne una locale**: se serve una variante, si aggiunge una prop qui.

### Chip
- **Props**: `label`, `active?`. Default = outline su surface; `active` = fill `--accent`. Uso: tag attributi (Anni '90, Sportswear).

### Avatar
- **Serve**: account nella sidebar. **Props**: `initials`, `size`. Cerchio fill `--accent`, testo near-black mono. Fallback iniziali (niente foto in MVP).

### Icon
- **Props**: `name`, `size: 20|24`, `color?`. Stile line/outline stroke 1.5px, default `--text-secondary`, `--accent` solo su attivo. Set: Lucide. Mai emoji.

### Toggle
- **Serve**: Impostazioni (post-MVP). **Props**: `checked`, `onChange`, `label`. Track grigio → `--accent` quando on; knob bianco. Focus ring. A11y `role=switch`.

---

## MOLECOLE

### PhotoSlot
- **Serve**: `Photo` (uno slot per `label`). **Props**: `label`, `required`, `state: empty|loading|validated|rejected`, `imageUrl?`, `qualityFlags?`.
- **Stati**: empty (bordo tratteggiato, glifo camera, "Scatta foto", dot fluo se required) · loading (shimmer) · validated (thumb + check `--success`) · rejected (bordo `--danger` + flag quality + CTA Riprendi).
- **Anatomia**: quadrato `--r-slot`, caption label in basso. **Do/Don't**: ordine label fisso (fronte→retro→brand→taglia→materiale→extra) · aruco nascosta · quality_flags read-only.

### AttributeField
- **Serve**: un attributo di `Catalog Entry`. **Props**: `label`, `value`, `editable`, `uncertain?`, `onEdit`.
- **Varianti**: normale · `uncertain` ("da verificare": edge sinistro `--accent` + tag). **Anatomia**: riga label(sx) + valore mono(dx) + affordance edit.
- **Do/Don't**: valore sempre editabile · evidenzia i campi incerti AI in cima.

### CatalogCard
- **Serve**: `Catalog Entry` in lista/preview. **Props**: `imageUrl`, `brand`, `type`, `size`, `status`, `sku?`.
- **Anatomia**: foto (ratio 1:1) + brand+tipo + (taglia | SKU se confermato) mono + StatusBadge. **Stati**: hover (lift + bordo `--accent`).
- **Varianti**: *list* (piena) · *preview-notifica* (compatta, no CTA). **Do/Don't**: SKU mostrato solo se `available`.

### NotificationRow
- **Serve**: `Notification`. **Props**: `type: draft_ready|local_save`, `message`, `preview`, `timestamp`, `unread`.
- **Anatomia**: icona tipo (draft=fluo, local=steel) + testo + preview capo + timestamp mono + dot unread (`--accent`); `unread` → edge sinistro fluo.
- **Interazioni**: tap = naviga al capo (+segna letta); swipe = segna letta / elimina. **Do/Don't**: persistente (inbox), non one-shot.

### ConfirmGateButton
- **Serve**: gate Conferma di `Catalog Entry`. **Props**: `enabled`, `helperText`.
- **Anatomia**: helper sopra (icona warning + testo) + Button primary/disabled. Disabilitato finché 3 foto obbligatorie ≠ validated → helper "Manca la foto obbligatoria: …".

### StatTile
- **Serve**: stat row Lista capi. **Props**: `number`, `label`, `attention?`. Numero mono grande + label; `attention` = edge fluo (es. Bozze).
- **Nota governance**: aggiunto in Fase 6, non presente nel brief originale `05-sketch-brief.md` §D — confermato come estensione valida con Federico il 2026-07-06 (conteggi derivati da `status`, non un attributo nuovo). Vedi nota lì per il dettaglio.

### EmptyState
- **Props**: `icon`, `title`, `body`, `cta`. Composizione (icona in tile + frase + CTA), non "Nessun dato". Varianti: lista vuota (onboarding "Scatta il primo capo") · zero-post-filtro · dead-link ("Capo non più disponibile").

---

## PATTERN

### Banner
- **Props**: `variant: warn|info`, `message`, `icon`. warn = bg fluo 24% (es. "capo a listino") · info = bg steel 12% (es. offline). Inline, non bloccante.

### Toast
- **Props**: `variant: ok|local`, `message`, `sku?`. Pill near-black, testo chiaro; ok=check fluo ("Confermato · SKU B-09"), local=glifo steel. Effimero (azione), auto-dismiss.

### Accordion
- **Serve**: sezione Misure di `Catalog Entry`. **Props**: `title`, `open`, `children`. Header cliccabile + chevron rotante; corpo con righe mono. Misure collassate di default.

### Progress (indeterminate)
- **Serve**: Processing AI. **Props**: `label`, `eta?`. Barra indeterminata fluo + label "Elaborazione AI…" + eta mono.

### Sequence (step dots)
- **Serve**: avanzamento Acquisizione (1/6). **Props**: `steps[]`, `current`. Dot/segmenti: done=`--success`, current=`--accent`, todo=grigio + label "3 / 6 · Brand".

### Modal
- **Serve**: conferma forte (Elimina capo). **Props**: `title`, `body`, `actions[]`. Card overlay `--e2`, titolo + corpo + azioni (ghost Annulla + danger Elimina). A11y: focus-trap, ESC chiude, `role=dialog`. z `--z-modal`.

### Skeleton
- **Props**: `variant: card|line`. Shimmer che ricalca la geometria (card foto + righe). Mai spinner circolare generico.

---

## ORGANISMI (composizione)

### AppShell
- **Serve**: shell app. Sidebar near-black (`--surface-dark`) con wordmark MAAT (dot fluo) + nav (item attivo = pill/edge fluo) + Avatar account in basso; main su `--bg`. Responsive: <768px sidebar→drawer/top-bar. Tab: Capi · Acquisizione · Notifiche(badge) · Impostazioni.

### CatalogList ("Lista capi")
- **Serve**: collezione `Catalog Entry` (entry point). Composto da: top bar (titolo + Search + Button primary "Crea capo") · StatTile×4 · SegmentedFilter(status) · griglia `CatalogCard` (auto-fill, no 3-col rigide) · EmptyState. Sort `created_at` desc.

### CatalogEntryDetail ("Dettaglio capo")
- **Serve**: `Catalog Entry`. Composto da: header (thumb + nome + StatusBadge + SKU mono) · `PhotoGrid` · lista `AttributeField` · Accordion Misure · ConfirmGateButton (sticky). CTA: Conferma · Modifica campo · Elimina (Modal).

### ReviewForm / ManualFill
- **Serve**: `Catalog Entry` in `to_be_reviewed`. Banner "rivedi i campi" + `AttributeField` ordinati per urgenza (mancanti/incerti in cima) + ConfirmGateButton. Gate dipende dalle foto, non dal testo.

### PhotoCaptureFlow ("Acquisizione foto")
- **Serve**: `Photo`. Full-screen: viewfinder + label corrente + `Sequence` (slot) + shutter (Button "Scatta foto") + sotto-sequenza ArUco. Esito → captured→processing→validated|rejected.

### NotificationInbox ("Inbox")
- **Serve**: collezione `Notification`. Lista `NotificationRow` (timestamp desc, unread in evidenza) + filtro opz. unread/tipo + EmptyState. Tap riga → deep-link a CatalogEntryDetail.

### PhotoGrid
- **Serve**: set di `Photo` di una Entry. Griglia di `PhotoSlot` in ordine label fisso. Riusato in Detail e Review. Gate Confirm legge lo stato delle obbligatorie.

---

## Addendum v2 — componenti nati nell'implementazione reale (2026-07-07)

Non presenti nella spec ORCA originale, aggiunti durante lo sviluppo su `salesops-dashboard` e confermati con Federico. Sorgente reale in `components/` di questo pacchetto.

### StatTile
- **Serve**: conteggi in cima a CatalogList (Totale/Bozze/Confermati/Locali). **Props**: `number`, `label`, `attention?`.
- Numero mono grande + label; `attention` = edge sinistro fluo (usato su "Bozze" quando > 0).

### CatalogTable *(nuova vista di CatalogList, non solo griglia card)*
- **Serve**: collezione Catalog Entry in vista tabellare — **vista di default** di `/capi` (scelta esplicita di Federico sul template SalesOps di partenza). Colonne: foto (thumb) · Capo (brand+tipo) · Taglia · Status (StatusBadge) · SKU · Creato.
- Riusa `StatusBadge`. Sort `created_at` desc, invariato dallo spec.

### CatalogKanban *(nuova vista di CatalogList)*
- **Serve**: collezione Catalog Entry raggruppata per `status` in 3 colonne (Locale/Bozza/Confermato), ognuna con `CatalogCard` variante `row`.
- Combinabile con `SegmentedFilter`: se il filtro status è attivo, le colonne non corrispondenti restano vuote (comportamento voluto, non un bug).

### CatalogList — aggiornamento organismo
Il `CatalogList` canonico (sopra) prevede solo griglia card. Nell'implementazione reale ha un **selettore vista** (Card / Tabella / Kanban, stessa famiglia visiva di `SegmentedFilter`) sopra la griglia/tabella/kanban. Tabella è la vista di apertura.

### AttributeField — stato aggiuntivo `missing`
Oltre a `uncertain` (spec originale), il componente reale supporta `missing` (o `value === ""`): edge sinistro rosso (`--danger`), label "Mancante", valore sostituito da placeholder "Da compilare" in corsivo. Usato in ReviewForm per il gruppo "Mancanti" (vedi Dettaglio/Review sotto).

### CatalogEntryDetail / ReviewForm — aggiornamento Misure
La sezione Misure non è più una lista fissa a 4 campi: legge la categoria (Top/Bottom/Gonna/Abito) da `lib/measures.ts` (`getMeasureCategory(tipoCapo)`) e renderizza i campi di quella categoria via `MEASURE_FIELDS[categoria]`. Vedi `OBJECTS.md` §1 per la tabella completa.

### NotificationInbox — dead-link state
Quando `Notification.catalogEntryId` non corrisponde a nessuna Catalog Entry esistente, il tap sulla riga non naviga: mostra un banner dismissibile "Questo capo non è più disponibile." (era il 13°/13 stato mancante del brief originale, chiuso 2026-07-07).

---

## Estensione
Nuovo elemento → token (se serve un valore) in `design-tokens.json` → classe in `components.css` → anteprima `@dsCard` (`*.html`) → riga qui. Mai colore hardcoded nel componente. Naming componenti PascalCase.
