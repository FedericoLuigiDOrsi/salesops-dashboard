"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEUR } from "@/lib/utils";
import { AGING_ITEMS } from "@/lib/home-widgets-mock";
import { actionQueue } from "@/lib/catalog-stats";
import { evaluateConfirmGate } from "@/lib/confirm-gate";
import { ATTRIBUTE_LABELS } from "@/lib/review-types";
import { ActionControls } from "@/components/maat/ActionControls";
import { useMarketplaceActions } from "@/lib/marketplace-actions-store";
import { isLingering } from "@/lib/marketplace-actions";
import { mockCatalogEntries } from "@/lib/maat-mock";

const THRESHOLDS = [30, 45, 60, 90] as const;
type Section = "pubblicato" | "lavorazione";

/**
 * Bozze aperte da troppo, ordinate dalla più vecchia. Pronte → Conferma; non pronte → cosa manca.
 *
 * La spec originale chiedeva di riusare `ConfirmGateButton`, ma quel componente mostra SEMPRE un bottone
 * anche quando il gate non è superato (enabled=false). Qui serve invece nascondere il bottone e mostrare solo
 * il testo "Mancano: ...". Riusiamo la logica di `evaluateConfirmGate` ma con markup proprio per questo behavior.
 *
 * ⚠️ Debito dichiarato: "Conferma capo" qui aggiunge l'id a `confirmedIds`, uno `useState` locale a
 * questo componente — non chiama `confirmEntry()` di `lib/maat-store`. Quel meccanismo esiste ed è quello
 * reale (aggiorna lo status del capo, lo stesso che legge `CatalogEntryDetail`/`ReviewForm`), ma il suo
 * Provider — `MaatEntryProvider` — è montato solo in `app/demo/capi/[id]/layout.tsx`, non a livello Home.
 * Risultato: un capo "confermato" da qui sparisce dal widget ma resta `to_be_reviewed` ovunque altro
 * nella sessione, e ricompare dopo un reload — diversamente dal Ritira (azione reale, condivisa via
 * `useMarketplaceActions`, visibile anche in SaleDetail). Per renderlo reale servirebbe montare
 * `MaatEntryProvider` (o un meccanismo equivalente, condiviso) a livello Home, non dentro il singolo `[id]`.
 */
function InLavorazione({
  confirmedIds,
  setConfirmedIds,
}: {
  confirmedIds: Set<string>;
  setConfirmedIds: (value: Set<string>) => void;
}) {
  const entries = actionQueue(mockCatalogEntries).filter((e) => !confirmedIds.has(e.id));

  if (entries.length === 0) {
    return (
      <div className="flex min-h-20 flex-1 items-center justify-center text-center">
        <p className="text-xs font-semibold text-muted-foreground">Nessuna bozza in lavorazione.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-1 flex-col gap-2 overflow-y-auto">
      {entries.slice(0, 4).map((e) => {
        const { enabled, missingLabels } = evaluateConfirmGate(e, ATTRIBUTE_LABELS);
        const label = [e.attributes.brand, e.attributes.tipoCapo].filter(Boolean).join(" · ") || e.id;
        return (
          <li key={e.id} className="rounded-xl border border-border px-3.5 py-3">
            <p className="truncate text-[13px] font-semibold">{label}</p>
            {enabled ? (
              <Button
                size="sm"
                className="mt-2 w-full"
                onClick={() => setConfirmedIds(new Set(confirmedIds).add(e.id))}
              >
                Conferma capo
              </Button>
            ) : (
              <p className="mt-1.5 text-[11px] text-muted-foreground">Mancano: {missingLabels.join(", ")}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Pubblicato da troppo senza vendere: filtro per soglia, azione Ritira per riga. */
function Pubblicato({
  threshold,
  setThreshold,
}: {
  threshold: number;
  setThreshold: (value: number) => void;
}) {
  const { actionFor, enqueue, now } = useMarketplaceActions();
  const items = useMemo(
    () =>
      AGING_ITEMS.filter((item) => {
        if (item.ageDays <= threshold) return false;
        // Una riga ritirata (azione "done") esce dalla coda dopo i 3 s di lingering,
        // altrimenti resterebbe — e verrebbe contata in "capi"/"costo base fermo" — per sempre.
        const action = actionFor({ type: "listing", id: item.id });
        return action === null || action.state !== "done" || isLingering(action, now);
      }).sort((a, b) => b.baseCostCents - a.baseCostCents),
    [threshold, actionFor, now]
  );
  const totalCostCents = items.reduce((sum, item) => sum + item.baseCostCents, 0);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-end">
        <label className="sr-only" htmlFor="aging-threshold">Soglia inventario fermo</label>
        <select
          id="aging-threshold"
          value={threshold}
          onChange={(event) => setThreshold(Number(event.target.value))}
          className="h-7 rounded-md border border-border bg-background px-2 font-mono text-[9px] font-semibold uppercase tracking-[.06em] outline-none transition-colors focus:border-foreground/30"
        >
          {THRESHOLDS.map((value) => <option key={value} value={value}>&gt; {value} gg</option>)}
        </select>
      </div>

      <div className="mt-3 flex items-end justify-between border-b border-border pb-2.5">
        <p className="font-mono text-[26px] font-semibold leading-none tabular-nums">
          {items.length} <span className="text-lg">capi</span>
          <span className="mt-1 block text-[8px] uppercase tracking-[.1em] text-muted-foreground">oltre la soglia</span>
        </p>
        <p className="text-right font-mono text-lg font-semibold text-destructive tabular-nums">
          {formatEUR(totalCostCents)}
          <span className="mt-1 block text-[8px] uppercase tracking-[.08em] text-muted-foreground">costo base fermo</span>
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-20 flex-1 items-center justify-center text-center">
          <div>
            <p className="text-xs font-semibold">Nessun capo oltre la soglia</p>
            <p className="mt-1 text-[11px] text-muted-foreground">L&rsquo;inventario non presenta aging critico.</p>
          </div>
        </div>
      ) : (
        <ul className="mt-1 flex-1 divide-y divide-border overflow-y-auto">
          {items.slice(0, 3).map((item) => {
            const action = actionFor({ type: "listing", id: item.id });
            return (
              <li key={item.id} className="flex items-center justify-between gap-2 py-2 text-xs">
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{item.label}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground">
                    <span className="rounded-full bg-destructive/[.08] px-1.5 py-0.5 font-semibold uppercase text-destructive">
                      {item.ageDays} gg
                    </span>
                    <span>{formatEUR(item.baseCostCents)}</span>
                  </span>
                </div>
                {action?.state === "done" ? null : action ? (
                  <ActionControls action={action} />
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1.5"
                    onClick={() =>
                      enqueue({ kind: "delist", marketplace: item.marketplace, target: { type: "listing", id: item.id } })
                    }
                  >
                    <Undo2 className="size-3.5" /> Ritira
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {items.length > 3 ? (
        <p className="mt-2 text-right font-mono text-[9px] text-muted-foreground">+{items.length - 3} capi da valutare</p>
      ) : null}
    </div>
  );
}

export function InventarioFermoWidget() {
  const [section, setSection] = useState<Section>("pubblicato");
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [threshold, setThreshold] = useState<number>(45);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-foreground">
          Inventario fermo
        </p>
        <div className="flex items-center gap-1.5">
          <label className="sr-only" htmlFor="inventario-fermo-sezione">Sezione</label>
          <select
            id="inventario-fermo-sezione"
            value={section}
            onChange={(event) => setSection(event.target.value as Section)}
            className="h-7 rounded-md border border-border bg-background px-2 font-mono text-[9px] font-semibold uppercase tracking-[.06em] outline-none transition-colors focus:border-foreground/30"
          >
            <option value="pubblicato">Pubblicato</option>
            <option value="lavorazione">In lavorazione</option>
          </select>
          <Link
            href="/inventario"
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-[color,transform] hover:translate-x-0.5 hover:text-foreground active:translate-y-px"
          >
            Inventario <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {section === "pubblicato" ? (
        <Pubblicato threshold={threshold} setThreshold={setThreshold} />
      ) : (
        <InLavorazione confirmedIds={confirmedIds} setConfirmedIds={setConfirmedIds} />
      )}
    </div>
  );
}
