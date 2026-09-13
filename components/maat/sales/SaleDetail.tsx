"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Truck, Undo2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MarketplaceBadge } from "@/components/maat/MarketplaceBadge";
import { DelistOutcomeBadge } from "@/components/maat/DelistOutcomeBadge";
import { EmptyState } from "@/components/maat/EmptyState";
import { ComingSoonNote } from "@/components/maat/ComingSoonNote";
import { formatEUR } from "@/lib/utils";
import { sales } from "@/lib/activity-mock";
import { sceneForSale, type DelistRow } from "@/lib/sale-detail-mock";
import { MARKETPLACE_LABELS } from "@/types/maat";

/**
 * Il ritiro alla vendita: cosa è successo agli altri annunci quando il capo si
 * è venduto da una parte.
 *
 * Brief: docs/technical/ooux/46-sketch-brief-ritiro-alla-vendita.md
 *
 * Sostituisce `ArticlePreview`, che era già questa vista con un altro nome:
 * leggeva `sales`, mostrava il prezzo di vendita e una sezione «Piattaforme»
 * con UNA riga etichettata «venduto qui». Le altre righe mancavano non per
 * scelta ma perché il port da mockup aveva perso il dato — il commento di quel
 * file lo dichiarava. Il mockup originale (`ARTICLES`) era multi-piattaforma.
 *
 * Questa view NON fa avvenire il ritiro: lo rende osservabile. Finché la regola
 * non gira — nel canonico `delist_confirm` viene instradato ma il ramo che lo
 * applica è ancora `null` — mostrerà annunci ancora online, ed è esattamente
 * l'informazione che oggi non ha nessuno.
 */

/**
 * `Sale.time` mescola due formati: durate («12 min», «3 h») e avverbi («ieri»).
 * Appendere «fa» a entrambi produce «ieri fa». Il campo è testo già localizzato
 * nel mock, quindi non si può normalizzare a monte senza toccare dati condivisi:
 * qui si aggiunge «fa» solo dove c'è una durata.
 */
function quando(time: string) {
  return /\d/.test(time) ? `${time} fa` : time;
}

function OutcomeRow({ row, onDelist }: { row: DelistRow; onDelist: (m: DelistRow["marketplace"]) => void }) {
  const name = MARKETPLACE_LABELS[row.marketplace];
  // `error` è azionabile quanto gli altri due: un ritiro fallito lascia
  // l'annuncio online, quindi la riga descrive un problema e senza CTA sarebbe
  // un vicolo cieco. Il brief elenca la CTA «sulle righe ancora online» — una
  // riga in errore lo è, solo con un motivo noto.
  const azionabile =
    row.outcome === "still_online" || row.outcome === "manual_required" || row.outcome === "error";

  return (
    <div className="rounded-xl border border-border px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <MarketplaceBadge marketplace={row.marketplace} />
          <DelistOutcomeBadge outcome={row.outcome} />
        </div>
        {/* La CTA appartiene a Listing, non a Sale: è `Ritira Listing`, già
            speccata nella CTA matrix (doc 12). Qui non se ne inventa una nuova. */}
        {azionabile ? (
          <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => onDelist(row.marketplace)}>
            <Undo2 className="size-3.5" /> Ritira
          </Button>
        ) : null}
      </div>
      {row.detail ? (
        <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{row.detail}</p>
      ) : row.outcome === "still_online" ? (
        <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
          Il capo è venduto ma su {name}{" "}
          l&apos;annuncio è ancora pubblicato.
        </p>
      ) : null}
    </div>
  );
}

interface SaleDetailProps {
  sku: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleDetail({ sku, open, onOpenChange }: SaleDetailProps) {
  // Stato locale: nessuno store possiede le scene di vendita, e inventarne uno
  // globale per un prototipo su dati dichiarati mock sarebbe più impalcatura
  // che valore. Il ritiro qui dà riscontro, non persiste.
  const [ritirati, setRitirati] = useState<string[]>([]);

  const sale = sku ? sales.find((s) => s.sku === sku) : undefined;
  const scene = sku ? sceneForSale(sku) : null;

  if (!sale) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Vendita non trovata</SheetTitle>
            <SheetDescription>Nessun dettaglio disponibile per questo capo.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const rows = (scene?.rows ?? []).map((r) =>
    ritirati.includes(r.marketplace) ? { ...r, outcome: "delisted" as const, detail: null } : r
  );
  const altrove = rows.filter((r) => r.outcome !== "sold_here");
  const tuttoRitirato = altrove.length > 0 && altrove.every((r) => r.outcome === "delisted");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Assente quando la vendita non è collegata a nessun annuncio:
                `sales.listing_id` è nullable nel canonico. Non si indovina. */}
            {scene?.soldOn ? <MarketplaceBadge marketplace={scene.soldOn} /> : null}
          </div>
          <SheetTitle className="text-[22px] leading-tight">{sale.itemLabel}</SheetTitle>
          <SheetDescription className="font-mono text-xs">{sale.sku}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          {/* 1 · Il ritiro altrove — la ragione della view, quindi per prima */}
          <section>
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
              Il ritiro altrove
            </h3>

            {scene === null ? (
              <EmptyState
                tone="idle"
                title="Nessun dato sul ritiro"
                subtitle="Per questa vendita non risulta nessun annuncio da ritirare, né la conferma che sia stato fatto."
                className="items-start text-left"
              />
            ) : altrove.length === 0 ? (
              <EmptyState
                tone="idle"
                title="Non c'era altro da ritirare"
                subtitle={`Il capo era pubblicato solo su ${scene.soldOn ? MARKETPLACE_LABELS[scene.soldOn] : "un marketplace"}.`}
                className="items-start text-left"
              />
            ) : (
              <>
                {/* La nota sta qui e non sotto il titolo di sezione: quando
                    non c'è niente da ritirare, o non c'è nessun dato, la
                    riserva sull'automatismo non riguarda il lettore. */}
                <ComingSoonNote className="mt-2">
                  Il ritiro automatico non è ancora attivo: quando un capo si vende, gli
                  altri annunci restano online finché non li ritiri tu. Questa lista serve
                  a non dimenticarne nessuno.
                </ComingSoonNote>
                {/* L'esito buono si dice in una riga, invece di far contare
                    quattro badge verdi al lettore. */}
                {tuttoRitirato ? (
                  <p className="mt-2 text-[13px] text-muted-foreground">
                    Ritirato ovunque. Non resta niente da fare.
                  </p>
                ) : null}
                <div className="mt-3 flex flex-col gap-2">
                  {rows.map((r) => (
                    <OutcomeRow
                      key={r.marketplace}
                      row={r}
                      onDelist={(m) => setRitirati((prev) => [...prev, m])}
                    />
                  ))}
                </div>
              </>
            )}

            {scene && scene.soldOn === null ? (
              <p className="mt-3 text-[13px] leading-snug text-muted-foreground">
                Questa vendita non è collegata a nessun annuncio, quindi non si sa su quale
                marketplace sia avvenuta. Nessuna riga qui sopra può dirsi «venduto qui».
              </p>
            ) : null}
          </section>

          {/* 2 · La vendita */}
          <section>
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
              La vendita
            </h3>
            <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums">{formatEUR(sale.priceCents)}</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{quando(sale.time)}</p>
            {sale.listingUrl ? (
              <a
                href={sale.listingUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4 decoration-border hover:decoration-foreground"
              >
                Apri l&apos;annuncio che ha venduto
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </section>

          {/* 3 · Spedizione — un rimando, non una copia.
                 ArticlePreview ripeteva qui destinatario, corriere, tracking,
                 stato e «stampa etichetta». Il destinatario in particolare NON
                 doveva esserci: ShipmentDetail mostra la città e lascia nome e
                 indirizzo sull'etichetta, perché sono PII. Due trattamenti
                 opposti dello stesso dato, e quello più esposto stava nel
                 componente raggiungibile con un click da un widget. */}
          <section>
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
              Spedizione
            </h3>
            <Button variant="ghost" className="mt-1.5 w-full justify-start gap-1.5 px-0 hover:bg-transparent" asChild>
              <Link href="/logistica" onClick={() => onOpenChange(false)}>
                <Truck className="size-3.5" /> Vedi la spedizione in Logistica
              </Link>
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
