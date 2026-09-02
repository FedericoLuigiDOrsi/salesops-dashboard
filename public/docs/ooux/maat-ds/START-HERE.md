# START HERE — MAAT Design System (contesto completo per Claude Design)

Questa cartella è il **contesto unico** per sviluppare in Claude Design **tutti i componenti** e il design system completo di **MAAT / Photo-to-Catalog** (tool resale vintage: cataloga capi da foto via AI). Web-first, responsive a mobile.

## Cosa caricare / leggere, in ordine

| # | File | Cos'è |
|---|------|-------|
| 1 | [`DESIGN.md`](DESIGN.md) | **La costituzione**: filosofia, architettura token (3 livelli), tipo-scala, spacing, elevazione, motion, iconografia, responsive, a11y, anti-pattern, governance. |
| 2 | [`design-tokens.json`](design-tokens.json) | I **token** machine-readable (primitive + semantic + type + component). La fonte. |
| 3 | [`OBJECTS.md`](OBJECTS.md) | Il **dominio OOUX** (3 oggetti: Catalog Entry, Photo, Notification) che i componenti servono. |
| 4 | [`COMPONENTS.md`](COMPONENTS.md) | La **spec di ogni componente** (atomi→molecole→pattern→organismi): anatomia, varianti, stati, token, props, a11y, do/don't. |
| 5 | `styles.css` (+ `tokens.css`, `components.css`, `fonts.css`) | Il CSS reale: tutti i token come variabili + le classi componente. `styles.css` è la closure di stile. |
| 6 | `*.html` (`@dsCard`) | Le **anteprime** dei componenti già rese (Foundations, Atomi, Molecole, Pattern, Assembly): il look di riferimento. |

## Estetica in una riga
Dashboard high-contrast editoriale: canvas warm-white `#F6F7ED`, struttura near-black `#001F3F`, **un solo accento verde fluo `#DBE64C`** (solo azione, mai glow), font **Geist** (UI) + **JetBrains Mono** (dati). Niente Inter, niente serif, niente `#000`, niente pastello SaaS, niente dark mode.

## Cosa chiedere a Claude Design
> Sviluppa il design system MAAT e **tutti i componenti** descritti in `COMPONENTS.md`, usando i token di `design-tokens.json` e l'estetica di `DESIGN.md`. Implementa ogni componente come parte React riusabile (Button, StatusBadge, PhotoSlot, AttributeField, CatalogCard, NotificationRow, ConfirmGateButton, StatTile, EmptyState, Banner, Toast, Accordion, Progress, Sequence, Modal, Skeleton, Avatar, Icon, Toggle, Input, Select, Search, SegmentedFilter, Chip) e gli organismi (AppShell, CatalogList, CatalogEntryDetail, ReviewForm, PhotoCaptureFlow, NotificationInbox, PhotoGrid). Rispetta varianti, stati e a11y indicati. Le anteprime `*.html` mostrano il look atteso. Niente Inter/serif/`#000`; fluo solo su azione; dati in mono.

## Dopo
Costruiti i componenti, le schermate si compongono dagli organismi seguendo i brief in `../05-sketch-brief.md`. Stack runtime ancora da lockare (gate 4.7) → confermare prima della codifica.
