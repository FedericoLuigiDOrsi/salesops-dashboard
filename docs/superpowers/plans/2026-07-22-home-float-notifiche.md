# Float da Home + Redesign Notifiche — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere offerta, vendita e notifiche apribili come float da qualsiasi schermata (a partire dalla Home) tramite un unico store globale, senza saltare di pagina.

**Architecture:** Un context `OverlaysProvider` (mirror di `settings-store`) montato in `layout.tsx`; un `OverlayHost` in `AppShell` monta i tre float una volta sola; ogni sezione li accende via `useOverlays()`. Lo stato delle offerte (accettata/rifiutata/controfferta) vive nello store, keyed sull'id base, così Home/float/pagina restano allineati.

**Tech Stack:** Next.js (app router), React 19, TypeScript, TailwindCSS, shadcn/ui (Dialog, Sheet), lucide-react, vitest.

## Global Constraints

- Import sempre via alias `@/…`.
- **Niente hex hardcoded**: usare i token/classi esistenti (`text-muted-foreground`, `var(--chart-2)`, `bg-accent-soft`, ecc.). Lezione audit 22/07: `NotificheWidget` aveva reintrodotto hex.
- Stati offerta = `OfferStatus` = `"pending" | "accepted" | "rejected" | "counter"` (da `types/maat.ts`), non inventare nuovi valori.
- Chiave dello stato offerte = **id base** dell'offerta (es. `off-1`), mai l'id notifica (`n-off-1`).
- Gate per ogni task che tocca codice: `pnpm exec tsc --noEmit` pulito + `pnpm build` exit 0. Task con test: `pnpm test` verde.
- Commit a fine di ogni task (staging **esplicito** dei soli file del task — repo con sessioni parallele, mai `git add -A`).
- Worktree isolato già attivo: `/Users/federicoluigidorsi/Documents/GitHub/salesops-home-float-wt` (branch `feat/home-float-notifiche`).

---

### Task 1: Fondamenta — tipi opzionali + helper mapping + store

**Files:**
- Modify: `types/maat.ts` (Offer/Sale: +`photoUrl?`, +`listingUrl?`)
- Modify: `lib/notifications-mock.ts` (esporta helper `offerToNotification`)
- Create: `lib/overlays-store.tsx`
- Test: `lib/notifications-mock.test.ts`

**Interfaces:**
- Produces:
  - `offerToNotification(offer: Offer, override?: { status: OfferStatus; counterCents?: number }): OfferNotification` — mappa un `Offer` (id base) in `OfferNotification` **preservando l'id base come `id`**, applicando l'override se presente.
  - `useOverlays()` → `{ active, openOffer(offerId), openSale(sku), openNotifications(), close(), offerStatus, resolveOffer(offerId, status, counterCents?) }`
  - `<OverlaysProvider>` component.
  - `ActiveOverlay` type (union offer/sale/notifications/null).

- [ ] **Step 1 — Verifica ambiente test**

Run: `pnpm test -- --run` (deve trovare i test vitest esistenti verdi). Annota se `jsdom`/`@testing-library/react` è configurato (serve solo se poi si testa il provider; il test di questo task è su funzione pura, non lo richiede).

- [ ] **Step 2 — Tipi opzionali**

In `types/maat.ts`, dentro `interface Offer` e `interface Sale`, aggiungi in fondo:
```ts
  photoUrl?: string | null;   // placeholder oggi; immagine reale in futuro
  listingUrl?: string | null; // URL annuncio sul marketplace
```

- [ ] **Step 3 — Test fallito per l'helper**

Create `lib/notifications-mock.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { offerToNotification } from "@/lib/notifications-mock";
import type { Offer } from "@/types/maat";

const base: Offer = {
  id: "off-1",
  itemLabel: "Burberry · Trench",
  sku: "B-088",
  marketplace: "grailed",
  offerCents: 19000,
  listPriceCents: 24000,
  time: "1 h",
  status: "pending",
};

describe("offerToNotification", () => {
  it("preserva l'id base (non n-off-1) e i campi", () => {
    const n = offerToNotification(base);
    expect(n.id).toBe("off-1");
    expect(n.type).toBe("offerta");
    expect(n.offerCents).toBe(19000);
    expect(n.status).toBe("pending");
  });

  it("applica l'override di stato e controfferta", () => {
    const n = offerToNotification(base, { status: "counter", counterCents: 21000 });
    expect(n.status).toBe("counter");
    expect(n.counterCents).toBe(21000);
  });
});
```

- [ ] **Step 4 — Run test, verifica FAIL**

Run: `pnpm test -- --run lib/notifications-mock.test.ts`
Expected: FAIL (`offerToNotification` non esportata).

- [ ] **Step 5 — Implementa l'helper (+ estendi OfferNotification)**

Prima estendi l'interfaccia `OfferNotification` in `lib/notifications-mock.ts` con `photoUrl?: string | null;` e `listingUrl?: string | null;` (servono al popup). Poi aggiungi l'helper (riusa la logica già presente in `offers.map`):
```ts
export function offerToNotification(
  offer: Offer,
  override?: { status: OfferStatus; counterCents?: number }
): OfferNotification {
  return {
    id: offer.id, // id BASE, non `n-${offer.id}`
    type: "offerta",
    unread: false,
    itemLabel: offer.itemLabel,
    marketplace: offer.marketplace,
    sku: offer.sku,
    time: offer.time,
    offerCents: offer.offerCents,
    listPriceCents: offer.listPriceCents,
    status: override?.status ?? offer.status,
    counterCents: override?.counterCents ?? offer.counterCents,
  };
}
```
Aggiungi l'import di `Offer` al blocco import types se manca.

- [ ] **Step 6 — Run test, verifica PASS**

Run: `pnpm test -- --run lib/notifications-mock.test.ts`
Expected: PASS (2 test).

- [ ] **Step 7 — Implementa lo store**

Create `lib/overlays-store.tsx`:
```tsx
"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { OfferStatus } from "@/types/maat";

export type ActiveOverlay =
  | { kind: "offer"; offerId: string }
  | { kind: "sale"; sku: string }
  | { kind: "notifications" }
  | null;

type OfferStatusMap = Record<string, { status: OfferStatus; counterCents?: number }>;

interface OverlaysContextValue {
  active: ActiveOverlay;
  openOffer: (offerId: string) => void;
  openSale: (sku: string) => void;
  openNotifications: () => void;
  close: () => void;
  offerStatus: OfferStatusMap;
  resolveOffer: (offerId: string, status: OfferStatus, counterCents?: number) => void;
}

const OverlaysContext = createContext<OverlaysContextValue | null>(null);

export function OverlaysProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveOverlay>(null);
  const [offerStatus, setOfferStatus] = useState<OfferStatusMap>({});

  const value = useMemo<OverlaysContextValue>(
    () => ({
      active,
      openOffer: (offerId) => setActive({ kind: "offer", offerId }),
      openSale: (sku) => setActive({ kind: "sale", sku }),
      openNotifications: () => setActive({ kind: "notifications" }),
      close: () => setActive(null),
      offerStatus,
      resolveOffer: (offerId, status, counterCents) =>
        setOfferStatus((prev) => ({ ...prev, [offerId]: { status, counterCents } })),
    }),
    [active, offerStatus]
  );

  return <OverlaysContext.Provider value={value}>{children}</OverlaysContext.Provider>;
}

export function useOverlays() {
  const ctx = useContext(OverlaysContext);
  if (!ctx) throw new Error("useOverlays must be used within an OverlaysProvider");
  return ctx;
}
```

- [ ] **Step 8 — Gate + commit**

Run: `pnpm exec tsc --noEmit` (pulito).
```bash
git add types/maat.ts lib/notifications-mock.ts lib/notifications-mock.test.ts lib/overlays-store.tsx
git commit -m "feat(overlays): store telecomando + helper offerToNotification + tipi foto/URL"
```

---

### Task 2: OverlayHost + provider wiring + mount (rami offerta/vendita)

**Files:**
- Create: `components/maat/OverlayHost.tsx`
- Modify: `app/layout.tsx` (wrap con `OverlaysProvider`)
- Modify: `components/maat/AppShell.tsx` (monta `<OverlayHost />`)

**Interfaces:**
- Consumes: `useOverlays`, `offerToNotification`, `offers`/`sales` (activity-mock), `OfferPopup`, `ArticlePreview`.
- Produces: `<OverlayHost />` — unico punto di montaggio dei float. In questo task gestisce solo `kind: "offer"` e `kind: "sale"`; il ramo `notifications` arriva in Task 5.

- [ ] **Step 1 — Crea OverlayHost (offer + sale)**

Create `components/maat/OverlayHost.tsx`:
```tsx
"use client";

import { useOverlays } from "@/lib/overlays-store";
import { offers } from "@/lib/activity-mock";
import { offerToNotification } from "@/lib/notifications-mock";
import { OfferPopup } from "@/components/maat/notifications/OfferPopup";
import { ArticlePreview } from "@/components/maat/notifications/ArticlePreview";

export function OverlayHost() {
  const { active, close, offerStatus, resolveOffer } = useOverlays();

  const offerId = active?.kind === "offer" ? active.offerId : null;
  const baseOffer = offerId ? offers.find((o) => o.id === offerId) ?? null : null;
  const activeOffer = baseOffer ? offerToNotification(baseOffer, offerStatus[baseOffer.id]) : null;

  const saleSku = active?.kind === "sale" ? active.sku : null;

  return (
    <>
      <OfferPopup
        offer={activeOffer}
        open={active?.kind === "offer"}
        onOpenChange={(open) => !open && close()}
        onResolve={(id, status, counterCents) => resolveOffer(id, status, counterCents)}
      />
      <ArticlePreview sku={saleSku} open={active?.kind === "sale"} onOpenChange={(open) => !open && close()} />
    </>
  );
}
```

- [ ] **Step 2 — Provider in layout**

In `app/layout.tsx`: importa `OverlaysProvider` e avvolgi `AppShell` dentro `SettingsProvider`:
```tsx
import { OverlaysProvider } from '@/lib/overlays-store'
// ...
<NotificationsProvider>
  <SettingsProvider>
    <OverlaysProvider>
      <AppShell>{children}</AppShell>
    </OverlaysProvider>
  </SettingsProvider>
</NotificationsProvider>
```

- [ ] **Step 3 — Monta OverlayHost in AppShell**

In `components/maat/AppShell.tsx`, importa `OverlayHost` e mettilo accanto a `<SettingsModal />` (fine del componente, prima della chiusura del `<div className="flex min-h-dvh">`):
```tsx
      <SettingsModal />
      <OverlayHost />
```

- [ ] **Step 4 — Gate + commit**

Run: `pnpm exec tsc --noEmit` (pulito) e `pnpm build` (exit 0). Niente ancora apre i float: si verifica solo che compili e monti.
```bash
git add components/maat/OverlayHost.tsx app/layout.tsx components/maat/AppShell.tsx
git commit -m "feat(overlays): OverlayHost + provider in layout + mount in AppShell"
```

---

### Task 3: Feature 1 — Offerta (popup foto+link, widget click + ✓/✗ via store)

**Files:**
- Modify: `components/maat/notifications/OfferPopup.tsx`
- Modify: `components/maat/widgets/OfferteWidget.tsx`

**Interfaces:**
- Consumes: `useOverlays`, `offerToNotification`, `ExternalLink`/`Shirt` da lucide.

- [ ] **Step 1 — OfferPopup: foto placeholder nell'header**

In `OfferPopup.tsx`, sostituisci il box icona `Tag` nell'header con un box foto placeholder (mantiene misura/allineamento). Importa `Shirt` da lucide. Il box:
```tsx
<span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-foreground/[.06] text-muted-foreground">
  {offer.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={offer.photoUrl} alt={offer.itemLabel} className="size-full object-cover" />
  ) : (
    <Shirt className="size-5" />
  )}
</span>
```
(Nota: `OfferNotification` deve esporre `photoUrl`/`listingUrl` — vengono da `Offer` via `offerToNotification`; aggiungili al mapping in `notifications-mock.ts` e al tipo `OfferNotification` se non presenti.)

- [ ] **Step 2 — OfferPopup: link annuncio**

Aggiungi, sotto la griglia Offerta/Prezzo/Diff (prima del blocco controfferta/footer), un bottone outline:
```tsx
<Button variant="outline" className="w-full justify-center gap-1.5" asChild>
  <a href={offer.listingUrl ?? "#"} target="_blank" rel="noopener noreferrer">
    <ExternalLink className="size-3.5" /> Vai all&apos;annuncio
  </a>
</Button>
```
Importa `ExternalLink` da lucide e `Button` è già importato.

- [ ] **Step 3 — OfferteWidget: click apre float, ✓/✗ via store**

In `OfferteWidget.tsx`:
- Importa `useOverlays`.
- Sostituisci lo stato locale `offers`/`resolveOffer` con lettura da `useOverlays()`: mantieni la lista da `initialOffers` per il render, ma lo **stato** (accettata/rifiutata) si legge da `offerStatus[o.id]` e le azioni chiamano `resolveOffer(o.id, ...)`.
- La riga (il contenitore `div` con label+sku+prezzo) diventa cliccabile → `onClick={() => openOffer(o.id)}`. Rendila un `<button>` o aggiungi `role`/tabIndex; mantieni i due bottoni ✓/✗ come figli con `onClick` che fa `e.stopPropagation()` prima di `resolveOffer`.
- Lo stato risolto mostrato usa `offerStatus[o.id]?.status`.

Snippet chiave (struttura riga):
```tsx
const { openOffer, offerStatus, resolveOffer } = useOverlays();
// ...
const status = offerStatus[o.id]?.status ?? o.status;
const resolved = status !== "pending";
// contenitore riga:
<div
  role="button"
  tabIndex={0}
  onClick={() => openOffer(o.id)}
  onKeyDown={(e) => { if (e.key === "Enter") openOffer(o.id); }}
  className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-foreground/[.03]"
>
  {/* ...label/sku/prezzo... */}
  {resolved ? (/* badge come oggi, da `status` */) : (
    <div className="flex shrink-0 items-center gap-1">
      <button type="button" onClick={(e) => { e.stopPropagation(); resolveOffer(o.id, "accepted"); notify(...); }} ...>
        <Check .../>
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); resolveOffer(o.id, "rejected"); notify(...); }} ...>
        <X .../>
      </button>
    </div>
  )}
</div>
```
Mantieni il toast `useLocalToast` esistente.

- [ ] **Step 4 — Gate + verifica live**

Run: `pnpm exec tsc --noEmit` + `pnpm build`. Poi dev server (Task 7 workflow) e verifica: in Home, click su una riga offerta apre il popup con box foto + "Vai all'annuncio"; ✓/✗ risolvono senza aprire il popup; lo stato resta coerente riaprendo.

- [ ] **Step 5 — Commit**
```bash
git add components/maat/notifications/OfferPopup.tsx components/maat/widgets/OfferteWidget.tsx lib/notifications-mock.ts types/maat.ts
git commit -m "feat(home): offerta cliccabile apre float con foto+link annuncio, ✓/✗ via store"
```

---

### Task 4: Feature 2 — Vendita (popup link logistica, widget click)

**Files:**
- Modify: `components/maat/notifications/ArticlePreview.tsx`
- Modify: `components/maat/widgets/VenditeWidget.tsx`

- [ ] **Step 1 — ArticlePreview: bottone "Vai alla logistica"**

In `ArticlePreview.tsx`, nel blocco Spedizione, sotto "Stampa etichetta", aggiungi un secondo bottone outline che porta all'overview pacchi. Importa `Truck` da lucide, `Link` da next e `useOverlays` per chiudere:
```tsx
<Button variant="outline" className="w-full justify-center gap-1.5" asChild>
  <Link href="/logistica" onClick={() => onOpenChange(false)}>
    <Truck className="size-4" /> Vai alla logistica
  </Link>
</Button>
```
Inoltre cambia "Vai all'annuncio": `href={sale.listingUrl ?? "#"}` (oggi `href="#"`).

- [ ] **Step 2 — VenditeWidget: righe cliccabili**

In `VenditeWidget.tsx`: importa `useOverlays`; la riga vendita `div` diventa cliccabile → `onClick={() => openSale(s.sku)}` con `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter), classi `cursor-pointer`. Nessun'altra modifica.

- [ ] **Step 3 — Gate + verifica live**

Run: `pnpm exec tsc --noEmit` + `pnpm build`. Live: in Home, click su una vendita apre il popup; presente "Stampa etichetta" **e** "Vai alla logistica" (naviga a /logistica e chiude il float).

- [ ] **Step 4 — Commit**
```bash
git add components/maat/notifications/ArticlePreview.tsx components/maat/widgets/VenditeWidget.tsx
git commit -m "feat(home): vendita cliccabile apre float con link logistica"
```

---

### Task 5: Feature 3a — inbox estratta + NotificationsPanel + campanella/voci → float

**Files:**
- Create: `components/maat/notifications/NotificationInboxContent.tsx`
- Create: `components/maat/notifications/NotificationsPanel.tsx`
- Modify: `components/maat/OverlayHost.tsx` (ramo notifications)
- Modify: `components/maat/AppShell.tsx` (voci Notifiche → `openNotifications`)
- Modify: `components/maat/widgets/NotificheWidget.tsx` (righe/"Vedi tutte" → `openNotifications`)

**Interfaces:**
- Produces: `<NotificationInboxContent />` (segmented + gruppi + righe, righe → telecomando), `<NotificationsPanel open onOpenChange />`.

- [ ] **Step 1 — Estrai NotificationInboxContent**

Sposta il corpo di `NotificationInbox` (dal segmented in giù: filtro, gruppi, righe, `ActivityModal`) in `components/maat/notifications/NotificationInboxContent.tsx`. Le righe usano il telecomando:
- `SaleNotificationRow ... onOpen={() => openSale(n.sku!)}`
- `OfferNotificationRow ... onOpen={() => openOffer(n.id.replace(/^n-/, ""))}`
Rimuovi da qui lo stato `activeOfferId`/`previewSku` e i `<OfferPopup>`/`<ArticlePreview>` locali (ora globali via OverlayHost). Mantieni `ActivityModal` (decisione Federico) col suo stato `activityOpen` locale e le sue `offerItems` (derivate applicando `offerStatus` alle offerte). `useOverlays` fornisce `openOffer/openSale/offerStatus`.

- [ ] **Step 2 — NotificationsPanel (Sheet)**

Create `components/maat/notifications/NotificationsPanel.tsx`:
```tsx
"use client";

import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { NotificationInboxContent } from "@/components/maat/notifications/NotificationInboxContent";

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
          <SheetTitle className="text-[17px]">Notifiche</SheetTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/notifiche" onClick={() => onOpenChange(false)}>
              Apri sezione <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </SheetHeader>
        <div className="px-2 py-2">
          <NotificationInboxContent variant="panel" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```
(`NotificationInboxContent` accetta una prop `variant?: "page" | "panel"` per ridurre padding/margini nel panel; default `"page"`.)

- [ ] **Step 3 — OverlayHost: ramo notifications**

In `OverlayHost.tsx` aggiungi:
```tsx
import { NotificationsPanel } from "@/components/maat/notifications/NotificationsPanel";
// ...nel return:
<NotificationsPanel open={active?.kind === "notifications"} onOpenChange={(open) => !open && close()} />
```

- [ ] **Step 4 — AppShell: voci Notifiche → float**

In `AppShell.tsx`, importa `useOverlays`. Le tre entry Notifiche diventano bottoni che aprono il float invece di navigare:
- Sidebar desktop: la voce nav `Notifiche` (dentro `NAV_ITEMS.map`) — intercetta `href === "/notifiche"` e rendila `<button onClick={openNotifications}>` mantenendo stile/badge (oppure aggiungi un caso speciale nel map).
- Header mobile: la campanella `<Link href="/notifiche">` → `<button onClick={openNotifications}>`.
- Bottom nav mobile: la voce `<Link href="/notifiche">` → `<button onClick={openNotifications}>`.
Il badge `unreadCount` resta. `data-active` sulla voce può restare basato su `pathname`.

- [ ] **Step 5 — NotificheWidget → float**

In `NotificheWidget.tsx`: importa `useOverlays`; le righe (oggi `<Link href="/notifiche">`) e "Vedi tutte" diventano `<button onClick={openNotifications}>`.

- [ ] **Step 6 — Gate + verifica live**

Run: `pnpm exec tsc --noEmit` + `pnpm build`. Live: da Home e da un'altra sezione (es. /inventario), la campanella/voce apre il float laterale richiudibile (X/Esc/click fuori); "Apri sezione" naviga a /notifiche; dentro il float le righe offerta/vendita aprono i rispettivi popup.

- [ ] **Step 7 — Commit**
```bash
git add components/maat/notifications/NotificationInboxContent.tsx components/maat/notifications/NotificationsPanel.tsx components/maat/OverlayHost.tsx components/maat/AppShell.tsx components/maat/widgets/NotificheWidget.tsx
git commit -m "feat(notifiche): float richiudibile da campanella + inbox estratta riusabile"
```

---

### Task 6: Feature 3b — pagina /notifiche wrapper + riorganizzazione moderata

**Files:**
- Modify: `components/maat/NotificationInbox.tsx`
- Modify: `app/notifiche/page.tsx` (se serve — probabilmente invariato, renderizza NotificationInbox)

- [ ] **Step 1 — NotificationInbox come wrapper**

`NotificationInbox.tsx` diventa: header pagina (Inbox/Notifiche + "Visualizza tutte" che apre `ActivityModal`) + `<NotificationInboxContent variant="page" />`. Rimuovi da qui ogni residuo di `OfferPopup`/`ArticlePreview` locali (già spostati). Se `ActivityModal` è nel content (Task 5 step 1), il pulsante "Visualizza tutte" resta nel content o si alza qui — scegli un solo punto, evita duplicati.

- [ ] **Step 2 — Riorganizzazione moderata**

Migliorie contenute (no stravolgimento): segmented `sticky top-0` con sfondo, spaziatura gruppi più coerente, conteggi già presenti. Nessun cambio di IA.

- [ ] **Step 3 — Gate + verifica live**

Run: `pnpm exec tsc --noEmit` + `pnpm build`. Live: `/notifiche` piena funziona come prima (segmented, gruppi, ActivityModal), le righe aprono i float globali, nessun doppione di popup.

- [ ] **Step 4 — Commit**
```bash
git add components/maat/NotificationInbox.tsx app/notifiche/page.tsx
git commit -m "refactor(notifiche): pagina come wrapper del content estratto + riorg. moderata"
```

---

### Task 7: Verifica live end-to-end

**Files:** nessuno (verifica).

- [ ] **Step 1 — Dev server nel worktree**

`preview_start` con config `launch.json` del worktree su **porta dedicata** (la sessione parallela occupa la sua). Se serve, aggiungi una config `home-float` in `.claude/launch.json` con porta libera (es. 3007).

- [ ] **Step 2 — Giro desktop**

Home → click offerta (foto+link+✓/✗), click vendita (stampa+logistica), campanella → float, dentro il float righe → popup, "Apri sezione" → /notifiche. Console e network puliti.

- [ ] **Step 3 — Giro mobile (resize 375)**

Bottom nav Notifiche → float; valutare `side="bottom"` se il pannello destro è scomodo su mobile (fix in `NotificationsPanel` se necessario, poi ri-commit). Home widget → float.

- [ ] **Step 4 — Gate finale + screenshot**

`pnpm exec tsc --noEmit` + `pnpm build` verdi; `pnpm test -- --run` verde. Screenshot dei 3 float per Federico.

---

## Note esecuzione

- `OfferNotification` deve esporre `photoUrl?`/`listingUrl?` per far arrivare i placeholder al popup: aggiungili all'interfaccia in `notifications-mock.ts` e propagali in `offerToNotification` + in `saleNotifications`/`ArticlePreview` (per la vendita si legge da `sale.listingUrl`). Verifica in Task 3/4.
- Se `pnpm test` non ha jsdom/RTL, i test restano sulle funzioni pure (Task 1); store e UI verificati live — coerente con la pratica del repo.
