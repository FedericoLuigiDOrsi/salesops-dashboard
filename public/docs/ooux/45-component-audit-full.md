---
title: "OOUX — Audit componenti · apps/web/components/maat/"
date: 2026-09-02
status: draft — in attesa di validazione Federico
owner: Federico D'Orsi
audience: chiunque verifichi la copertura del metodo OOUX su MAAT
---

# Audit componenti — verifica checklist §7 dell'handoff

> Verifica il secondo item ancora aperto in `HANDOFF-2026-09-02-completamento-ooux.md` §7:
> «Ogni componente in `apps/web/components/maat/` è riconducibile a un oggetto o è dichiarato
> trasversale». **80 componenti** (`.tsx`, esclusi i `.test.ts`), ognuno classificato per
> lettura reale del codice (import di tipi/dati), non per nome della cartella.

## Esito

**77/80 riconducibili** a un oggetto OOUX già mappato (Track A/B/C) o dichiarati
legittimamente trasversali (chrome applicativo, atomi UI generici, utility cross-oggetto).
**3/80 sono un gap reale**: implicano concetti di prodotto — Note, Target settimanale, Tempo
operativo — che nessun Round 1, di nessuna track, ha mai mappato. Non sono trasversali (non
sono chrome/utility) e non tracciano a nessun oggetto esistente. Stesso trattamento già dato a
Publish Strategy in Track B: **trovati, nominati, non costruiti in questo giro** — non uno
zero silenzioso.

---

## Root — `components/maat/*.tsx` (30)

| Componente | Riconducibile a | Come verificato |
|---|---|---|
| AppShell | Trasversale | Nav/shell applicativo, monta `SettingsModal` globalmente |
| ArticleMediaTrack | Photo | Importa `Photo, PhotoLabel` da `types/maat` |
| AttributeCluster | Catalog Entry | Campi attributo del form Review |
| AttributeField | Catalog Entry | Campo singolo del form Review |
| AuthLayout | Trasversale (infra Auth) | Layout, nessun dato di dominio |
| CatalogEntryDetail | Catalog Entry | Diretto dal nome + uso |
| ConfermatoScreen | Catalog Entry | Schermata conferma wizard Track A |
| ConfirmGateButton | Catalog Entry | Gate conferma foto+campi (AND) |
| ElaborazioneScreen | Catalog Entry | Schermata processing wizard Track A |
| EmptyState | Trasversale | Componente generico riusato da più liste |
| EntryDialog | Catalog Entry | Wrappa `CatalogEntryDetail` in un Dialog |
| HomeDashboard | Trasversale | Aggregatore Home — nessun oggetto proprio (Round 1 Track C) |
| ListingStatusBadge | Listing | Badge tipizzato su `per_listing_status` |
| MarketplaceAccountStatusBadge | Marketplace Account | Badge tipizzato su `MarketplaceAccount.status` |
| MarketplaceBadge | Trasversale (utility cross-oggetto) | Tipizzato su `Marketplace` (5 valori), riusato da Listing/Shipment/Offer — la piattaforma non è un oggetto OOUX a sé in questo progetto |
| NotificationInbox | Notification | Diretto dal nome + uso |
| NotificationRow | Notification | Riga singola della inbox |
| OverlayHost | Trasversale | Host di modali/sheet globali |
| PasswordInput | Trasversale (infra Auth) | Campo password generico |
| PhotoCaptureFlow | Photo | Diretto dal nome + uso |
| PhotoGrid | Photo | Diretto dal nome + uso |
| PhotoSlot | Photo | Diretto dal nome + uso |
| PriceMarginCard | Catalog Entry | Props `purchasePriceCents`/`suggestedSalePriceCents` — campi Catalog Entry |
| ReviewForm | Catalog Entry | Il form Review stesso |
| SegmentedFilter | Trasversale | Confermato condiviso da `11-disallineamenti-attivi.md` §2 (ex #6) |
| Sequence | Trasversale | Stepper generico (`SequenceStep`/`SequenceProps`), nessun tipo di dominio |
| SettingsModal | Tenant · Member | Track C, Fase 3 (`41`) |
| SocialButtons | Trasversale (infra Auth) | Bottoni OAuth generici |
| StatusBadge | Catalog Entry | Confermato in `21-atomic-bridge-marketplace-account.md`: badge di stato Catalog Entry, "in produzione da mesi" |
| StatusPill | Trasversale (primitivo condiviso) | Generico su `T extends string` — nato apposta per essere cross-oggetto (Fase 6 Marketplace Account) |

## `accounting/` (2)

| Componente | Riconducibile a |
|---|---|
| AccountingView | Accounting Entry · Lot |
| RegistraCaricoDialog | Lot |

## `inventory/` (7)

| Componente | Riconducibile a |
|---|---|
| ChannelDots | Listing (implementazione divergente, Fase 3 doc `11` addendum) |
| ColumnManager | Trasversale | Config colonne tabella, generico (Popover+Command) |
| InventoryEmpty | Catalog Entry |
| InventoryTable | Catalog Entry |
| InventoryToolbar | Catalog Entry |
| InventoryView | Catalog Entry |
| PlatformPills | Listing (stessa implementazione divergente di ChannelDots) |

## `logistics/` (7)

Tutti e 7 → **Shipment**: FulfillmentEventRow, LogisticsCard, LogisticsGlobe, LogisticsHero,
LogisticsView, ShipmentDetail, ShippingLabelDialog.

## `notifications/` (5)

| Componente | Riconducibile a |
|---|---|
| ActivityModal | Notification (dettaglio) → dati reali da `sales`/`OfferNotification` |
| ArticlePreview | Sale (preview del capo venduto dentro una notifica di vendita) |
| NotificationInboxContent | Notification |
| NotificationsPanel | Notification |
| OfferPopup | Offer |

## `onboarding/` (1)

| Componente | Riconducibile a |
|---|---|
| OnboardingFlow | Tenant · Member (Track C: orchestra il provisioning, nessun oggetto proprio) |

## `photo/` (3)

Tutti e 3 → **Photo/Catalog Entry**: NuovoCapoForm (Catalog Entry, entry web reale — Fase 5
Lot, doc `26`), PhotoCaptureMobile (Photo), PhotoHandoffDesktop (Photo).

## `publishing/` (9)

| Componente | Riconducibile a |
|---|---|
| BulkPricePreviewDialog | Listing |
| ListingDetail | Listing |
| LiveTab | Listing |
| MarketplaceAccountList | Marketplace Account |
| PlatformChips | Listing (implementazione canonica, distinta da ChannelDots/PlatformPills — Fase 3 doc `11`) |
| PublishingView | Listing |
| RepublishSheet | Listing |
| StrategySheet | Publish Strategy (fuori MVP, ma il componente esiste ed è riconducibile) |
| ToPublishTab | Listing |

## `review/` (1)

ReviewPanel → **Catalog Entry**.

## `table/` (1)

TableChrome → **Trasversale** (shell tabella generica).

## `widgets/` (14)

| Componente | Riconducibile a |
|---|---|
| AzioniWidget | Trasversale — lista "prossime azioni" derivata (`lib/next-actions`), aggrega CTA di più oggetti, non un oggetto a sé |
| EntrateWidget | Accounting Entry |
| InventarioFermoWidget | Catalog Entry |
| LogisticaWidget | Shipment |
| **NoteWidget** | ⚠️ **Nessun oggetto — gap, vedi sotto** |
| NotificheWidget | Notification |
| OfferteWidget | Offer |
| PanoramicaWidget | Trasversale — meta-widget di gestione Home (pin/nascondi/riordina altri widget, drag-and-drop) |
| **TargetSettimanaleWidget** | ⚠️ **Nessun oggetto — gap, vedi sotto** |
| **TempoOperativoWidget** | ⚠️ **Nessun oggetto — gap, vedi sotto** |
| TopPerformerWidget | Sale · Catalog Entry (analytics derivata, ranking per categoria/capo — 100% mock, `TOP_PERFORMERS`) |
| VenditeWidget | Sale |
| WidgetShell | Trasversale — contenitore widget |
| registry | Trasversale — config/registro dei widget |

---

## I tre gap reali

### NoteWidget
Già segnalato in Track C Round 1 (`38`, §3) come "eccezione plausibile, non decisa". Verificato
ora: nessuna tabella `notes` in nessuna migrazione SQL letta in tutta la sessione. Se il
Seller può scrivere note libere non legate a un capo/vendita specifico, è un oggetto **Note**
mai passato da nessun Round 1.

### TargetSettimanaleWidget
Legge `weeklyKpi` (`lib/accounting-mock`) e `DEFAULT_WEEKLY_TARGET_CENTS`
(`lib/home-widgets-mock`), persiste via `usePersistentState` — un hook locale (verosimilmente
`localStorage`-based, non verificato riga per riga), **non Supabase**. Il concetto "obiettivo
settimanale" non ha nessuna tabella canonica. Stesso pattern già visto per `brand_config`/
`TenantBrand` in Track C: UI reale, persistenza reale ma locale, nessun backing canonico.

### TempoOperativoWidget
Nessun import di dominio (solo hook React). Molto probabilmente un timer/cronometro
client-side puro (tempo speso a lavorare in sessione). Zero riferimento a "tempo operativo" o
simile in nessuna migrazione SQL. Se questo dato deve sopravvivere al reload o essere
confrontato nel tempo, serve un oggetto mai mappato.

**Nessuno dei tre è stato costruito in questo audit** — verificarli con Round 1 è lavoro
nuovo, non una correzione. Segnalati, non risolti, per lo stesso principio già applicato a
Publish Strategy.
