# MAAT — Float da Home + Redesign Notifiche

Data: 2026-07-22
Branch: `feat/home-float-notifiche`
Stato: design approvato in brainstorming, in attesa review spec

## Problema

Oggi in Home i widget Offerte/Vendite/Notifiche non aprono nulla: rimandano tutti a `/notifiche`. I due float che servono a lavorare un'offerta o una vendita (`OfferPopup`, `ArticlePreview`) esistono già ma sono montati **solo** dentro la pagina `/notifiche`. Chi lavora dalla Home deve saltare di pagina per ogni azione, perdendo il contesto.

In più i dati sono frammentati su tre sorgenti separate con stati locali indipendenti:
- `lib/activity-mock` (`offers`/`sales`) → widget Home
- `lib/notifications-mock` (`notificationsV2`) → pagina `/notifiche`
- `lib/notifications-store` (badge/unreadCount)

Risolvere un'offerta in un punto non si riflette negli altri.

## Cosa vuole Federico (3 interazioni)

1. **Offerta cliccabile in Home** → il float offerta si apre anche in homepage, per lavorare direttamente dalla Home. Deve contenere: link annuncio + foto articolo.
2. **Vendita cliccabile in Home** → float in sovraimpressione: collegati a Vinted + stampa etichetta, oppure vai all'overview logistica (tutti i pacchi da fare).
3. **Pagina Notifiche riorganizzata** (tiene la sezione intera per lavorare a tutte le notifiche) + da qualsiasi sezione le notifiche si aprono come **float richiudibile**, senza cambiare pagina.

## Decisioni prese (brainstorming)

- **Architettura → "telecomando unico"**: un solo store globale monta i float; ogni sezione li accende via hook. NON si fondono le sorgenti dati mock.
- **NB → aggiunte in stile minimo ora**: link annuncio + foto (offerta) e link logistica (vendita) si aggiungono adesso mantenendo il layout attuale dei float. Il redesign profondo di info/gerarchia degli organismi resta per dopo.
- **Widget Offerte → click apre il float, ✓/✗ restano** come scorciatoia (ora scrivono sullo stato condiviso).
- **Campanella/voce Notifiche → apre il float** sopra la sezione corrente; dentro un bottone porta alla pagina piena. La pagina `/notifiche` resta.
- **Pagina `/notifiche` → riorganizzazione moderata**, non stravolgimento.
- **Foto/URL → placeholder** (prototipo mock): nessun dato reale, campi opzionali predisposti per il futuro.

## Architettura — il telecomando

Mirror esatto del pattern `settings-store` già in uso (`SettingsProvider` in `layout.tsx` → `SettingsModal` montato in `AppShell`, aperto ovunque via `useSettings().open()`).

### `lib/overlays-store.tsx` (nuovo)

Context provider che governa (a) quale float è aperto e (b) lo stato condiviso delle offerte.

```ts
type ActiveOverlay =
  | { kind: "offer"; offerId: string }   // id base dell'offerta, es. "off-1"
  | { kind: "sale"; sku: string }
  | { kind: "notifications" }
  | null;

interface OverlaysContextValue {
  active: ActiveOverlay;
  openOffer: (offerId: string) => void;
  openSale: (sku: string) => void;
  openNotifications: () => void;
  close: () => void;
  // stato condiviso offerte, keyed sull'id BASE dell'offerta
  offerStatus: Record<string, { status: OfferStatus; counterCents?: number }>;
  resolveOffer: (offerId: string, status: OfferStatus, counterCents?: number) => void;
}
```

`OverlaysProvider` va montato in `app/layout.tsx` dentro `NotificationsProvider`, avvolgendo `AppShell` (accanto/dentro `SettingsProvider`).

### `components/maat/OverlayHost.tsx` (nuovo)

Legge `useOverlays()`, risolve offerta/vendita dai mock condivisi, e monta **una sola volta** i tre float:
- `<OfferPopup>` — quando `active.kind === "offer"`
- `<ArticlePreview>` — quando `active.kind === "sale"`
- `<NotificationsPanel>` — quando `active.kind === "notifications"`

Montato in `AppShell`, accanto a `<SettingsModal />`. È l'unico punto che monta questi float in tutta l'app.

### Mapping id — punto delicato

`OfferteWidget` usa `Offer` (id base `off-1`); `OfferPopup`/pagina usano `OfferNotification` (id `n-off-1`). Per evitare stati sfasati, **la chiave dello stato offerte è sempre l'id base** (`off-1`).
- `OverlayHost`, aperto con `offerId` base, costruisce l'`OfferNotification` da passare al popup usando l'**id base** come `id` e applicando l'override da `offerStatus`. Helper `offerToNotification(offer, override?)`.
- Il callback `onResolve` del popup riceve quindi l'id base → `resolveOffer(baseId, ...)` coerente col widget.
- La pagina `/notifiche`, dove le righe hanno id `n-off-1`, deriva il base con `id.replace(/^n-/, "")` prima di chiamare `openOffer`/leggere lo stato.

## Feature 1 — Offerta da Home

**`components/maat/widgets/OfferteWidget.tsx`**
- La riga dell'offerta diventa cliccabile → `openOffer(o.id)`.
- I bottoni ✓/✗ restano visibili come scorciatoia; ora chiamano `resolveOffer(o.id, "accepted"|"rejected")` sullo store invece dello stato locale. Il toast locale resta.
- Lo stato mostrato (Accettata/Rifiutata) si legge da `offerStatus` → coerente col float e con la pagina.
- I bottoni ✓/✗ fermano la propagazione del click per non aprire anche il float.

**`components/maat/notifications/OfferPopup.tsx`** (aggiunte minime, layout attuale)
- **Foto articolo**: box quadrato placeholder nell'header, accanto al titolo (icona indumento, `bg-foreground/[.06]`), al posto dell'attuale icona `Tag`. Non modifica la griglia prezzi. Se in futuro `offer.photoUrl` è valorizzato, mostra l'immagine; altrimenti placeholder.
- **Link annuncio**: bottone outline "Vai all'annuncio" (icona `ExternalLink`), `href = offer.listingUrl ?? "#"`, `target="_blank"` — stesso trattamento già usato in `ArticlePreview`.
- Nessun'altra modifica alla gerarchia (controfferta, Rifiuta/Controfferta/Accetta restano).

## Feature 2 — Vendita da Home

**`components/maat/widgets/VenditeWidget.tsx`**
- Le righe diventano cliccabili → `openSale(s.sku)`.

**`components/maat/notifications/ArticlePreview.tsx`** (aggiunta minima)
- Nuovo bottone **"Vai alla logistica"** (icona `Truck`, variant outline) → `Link href="/logistica"`, che chiude il float. Collocato vicino a "Stampa etichetta" nel blocco Spedizione (l'overview di tutti i pacchi).
- "Vai all'annuncio" resta; `href` diventa `sale.listingUrl ?? "#"`.
- Vinted/piattaforma + Stampa etichetta invariati.

## Feature 3 — Notifiche

### Estrazione contenuto inbox — `components/maat/notifications/NotificationInboxContent.tsx` (nuovo)

Il corpo attuale di `NotificationInbox` (segmented Tutte/Vendite/Offerte/Spedizioni + gruppi + righe) viene estratto in un componente riusabile, consumato da:
- la pagina piena `/notifiche` (con l'header pagina)
- il float `NotificationsPanel`

Le righe chiamano il telecomando: offerta → `openOffer(baseId)`, vendita → `openSale(sku)`. Nessuno stato popup locale.

### Float — `components/maat/notifications/NotificationsPanel.tsx` (nuovo)

`Sheet` (shadcn, `side="right"`) richiudibile con X / click fuori / Esc. Contiene:
- Header "Notifiche" + bottone "Apri sezione" (`Link href="/notifiche"`, chiude il panel).
- `<NotificationInboxContent />`.

Aperto da `active.kind === "notifications"`. Su mobile valutare `side="bottom"` o Drawer in fase di verifica live.

### Trigger campanella — `components/maat/AppShell.tsx`

- Voce nav "Notifiche" (sidebar desktop) e campanella (header mobile) e voce Notifiche (bottom nav mobile): da `Link href="/notifiche"` diventano `button onClick={openNotifications}`. Il badge `unreadCount` resta sulla voce.
- La pagina piena `/notifiche` resta raggiungibile dal bottone "Apri sezione" nel float e via URL diretto.
- Monta `<OverlayHost />` accanto a `<SettingsModal />`.

**`components/maat/widgets/NotificheWidget.tsx`**
- Le righe e il "Vedi tutte" aprono il float (`openNotifications`) invece di navigare a `/notifiche`. La Home è "un'altra sezione": comportamento coerente col resto.

### Pagina `/notifiche` — riorganizzazione moderata

`NotificationInbox` diventa un wrapper sottile: header pagina + `<NotificationInboxContent />`. Migliorie moderate (senza stravolgere):
- Rimozione dei popup locali duplicati (`OfferPopup`/`ArticlePreview` ora sono globali via OverlayHost).
- Gerarchia header/segmented più pulita; segmented eventualmente sticky.
- `ActivityModal` ("Visualizza tutte"): **tenuto invariato** (decisione Federico 22/07) — si rivaluta guardando il risultato finale sul prototipo.

Il redesign profondo (nuova IA/gerarchia) resta fuori scope, coerente col NB.

## Data model — `types/maat.ts`

Campi opzionali aggiunti a `Offer` e `Sale` (mock a `undefined`, UI mostra placeholder):
```ts
photoUrl?: string | null;
listingUrl?: string | null;
```
Nessun altro cambiamento ai mock. Nessuna fusione delle sorgenti (fuori scope per scelta).

## Comportamenti / edge case

- ✓/✗ nel widget Offerte non devono aprire il float (stop propagation).
- Riaprire un'offerta già risolta: il float mostra lo stato da `offerStatus` (badge/stato coerente).
- Float notifiche aperto mentre si è già su `/notifiche`: consentito (innocuo); il bottone "Apri sezione" naviga comunque.
- Chiusura float: X / Esc / click fuori (gratis da Dialog/Sheet). `close()` azzera `active`.
- Un solo float alla volta: `active` è singolo. Aprire un float mentre un altro è aperto sostituisce.
- Vendita senza spedizione: "Vai alla logistica" resta comunque (overview generale); il blocco spedizione mostra già il fallback esistente.

## Testing

Il repo usa **vitest**. Test unitari:
- `overlays-store`: `openOffer/openSale/openNotifications/close` impostano/azzerano `active`; `resolveOffer` aggiorna `offerStatus`.
- `offerToNotification`: applica correttamente l'override (status/counter) e preserva l'id base.

Interazioni UI (click widget → float, campanella → panel, link logistica, foto/link placeholder) verificate **live nel browser** end-to-end, coerente con la pratica del repo (dnd/eventi sintetici non affidabili in automazione).

## Fuori scope (NB + scelte)

- Redesign profondo di info/gerarchia dei float (offerta/vendita) e della pagina notifiche.
- Foto e URL annuncio reali (restano placeholder; campi predisposti).
- Fusione delle sorgenti dati mock (`activity-mock` + `notifications-mock`).

## Idea futura — non implementata ora

Federico, in review: il pattern riga-compatta + tap→float costruito qui potrebbe *sostituire* le tile bento su mobile (oggi il bento collassa a colonna singola mantenendo le tile piene) invece di limitarsi ad impilarle. Coerente col redesign profondo già rimandato. Non cambia nulla dello scope di questa build — bento resta invariato: si appunta per quando si riprende il redesign mobile.

## File

**Nuovi**
- `lib/overlays-store.tsx`
- `components/maat/OverlayHost.tsx`
- `components/maat/notifications/NotificationsPanel.tsx`
- `components/maat/notifications/NotificationInboxContent.tsx`
- `lib/overlays-store.test.ts` (+ eventuale test helper mapping)

**Modificati**
- `app/layout.tsx` — monta `OverlaysProvider`
- `components/maat/AppShell.tsx` — `OverlayHost` + campanella/voci → `openNotifications`
- `components/maat/widgets/OfferteWidget.tsx` — click → `openOffer`, ✓/✗ → `resolveOffer`
- `components/maat/widgets/VenditeWidget.tsx` — righe → `openSale`
- `components/maat/widgets/NotificheWidget.tsx` — righe/"Vedi tutte" → `openNotifications`
- `components/maat/notifications/OfferPopup.tsx` — foto + link annuncio
- `components/maat/notifications/ArticlePreview.tsx` — link logistica
- `components/maat/NotificationInbox.tsx` — wrapper su content estratto, redesign moderato
- `app/notifiche/page.tsx` — usa content
- `lib/notifications-mock.ts` — helper `offerToNotification`
- `types/maat.ts` — `photoUrl?`/`listingUrl?` opzionali su `Offer`/`Sale`

## Sequenza di build (per il piano)

1. Fondamenta: `overlays-store` + tipi opzionali + helper `offerToNotification` (+ test store).
2. `OverlayHost` + provider in `layout` + mount in `AppShell`.
3. Feature 1: `OfferPopup` (foto+link) + `OfferteWidget` (click + ✓/✗ via store).
4. Feature 2: `ArticlePreview` (link logistica) + `VenditeWidget` (click).
5. Feature 3a: `NotificationInboxContent` estratto + `NotificationsPanel` + campanella/voci → float + `NotificheWidget` → float.
6. Feature 3b: pagina `/notifiche` wrapper + riorganizzazione moderata + rimozione popup locali.
7. Verifica live end-to-end (desktop + mobile).
