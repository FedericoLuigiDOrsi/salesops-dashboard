"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Globe as GlobeIcon, Package, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SegmentedFilter } from "@/components/maat/SegmentedFilter";
import { EmptyState } from "@/components/maat/EmptyState";
import { Button } from "@/components/ui/button";
import { LogisticsCard } from "@/components/maat/logistics/LogisticsCard";
import { LogisticsCompactRow } from "@/components/maat/logistics/LogisticsCompactRow";
import { LogisticsTrackingCard } from "@/components/maat/logistics/LogisticsTrackingCard";
import { LogisticsHero } from "@/components/maat/logistics/LogisticsHero";
import { ShippingLabelDialog, ShippingLabel } from "@/components/maat/logistics/ShippingLabelDialog";
import { ShipmentDetail } from "@/components/maat/logistics/ShipmentDetail";
import { eventsForShipment } from "@/lib/listings-mock";
import { shipments as initialShipments } from "@/lib/logistics-mock";
import { MARKETPLACE_LABELS, SHIPMENT_STATUS_LABELS, type Marketplace, type Shipment, type ShipmentStatus } from "@/types/maat";

const COLUMNS: { key: ShipmentStatus; label: string; accent: string; hot: string }[] = [
  { key: "da_fare", label: "PACCHI DA FARE", accent: "#DBE64C", hot: "rgba(219,230,76,.20)" },
  { key: "fatti", label: "PACCHI FATTI", accent: "#1E488F", hot: "rgba(30,72,143,.15)" },
  { key: "spediti", label: "SPEDITI", accent: "#5B6670", hot: "rgba(91,102,112,.17)" },
  { key: "consegnati", label: "CONSEGNATI", accent: "#00804C", hot: "rgba(0,128,76,.15)" },
];

// "Prepari i pacchi": solo le due colonne del processo fisico di imballo,
// spediti/consegnati non c'entrano con quel flusso.
const PREP_COLUMNS = COLUMNS.filter((c) => c.key === "da_fare" || c.key === "fatti");

/**
 * Board: le quattro colonne diventano due sezioni. "Da fare"/"fatti" restano
 * distinti nei dati (servono a "Prepari i pacchi") ma in board sono un solo
 * gruppo "in attesa di spedizione" — chi guarda la board non deve sapere se
 * l'etichetta è già stampata, solo se il pacco è partito o no. Stesso per
 * "spediti"/"consegnati": un solo gruppo "Spediti", dove la card mostra
 * l'avanzamento invece che la colonna.
 */
const BOARD_GROUPS: { key: "in_attesa" | "spediti"; label: string; statuses: ShipmentStatus[]; dropStatus: ShipmentStatus; accent: string; hot: string }[] = [
  { key: "in_attesa", label: "IN ATTESA DI SPEDIZIONE", statuses: ["da_fare", "fatti"], dropStatus: "da_fare", accent: "#DBE64C", hot: "rgba(219,230,76,.20)" },
  { key: "spediti", label: "SPEDITI", statuses: ["spediti", "consegnati"], dropStatus: "spediti", accent: "#5B6670", hot: "rgba(91,102,112,.17)" },
];

const PLATFORM_CHIPS: { key: "all" | Marketplace; label: string }[] = [
  { key: "all", label: "Tutte" },
  ...(Object.keys(MARKETPLACE_LABELS) as Marketplace[]).map((m) => ({ key: m, label: MARKETPLACE_LABELS[m] })),
];

type SortOrder = "urgency" | "recent";
type ViewMode = "board" | "prep";

export function LogisticsView() {
  // Il widget Vendite della Home linka /logistica?mode=prep: apre direttamente
  // "Prepari i pacchi" invece della board, senza un secondo click qui.
  const searchParams = useSearchParams();
  const [shipmentList, setShipmentList] = useState<Shipment[]>(initialShipments);
  const [platform, setPlatform] = useState<"all" | Marketplace>("all");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("urgency");
  const [heroOpen, setHeroOpen] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ShipmentStatus | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<"in_attesa" | "spediti" | null>(null);
  const [labelShipment, setLabelShipment] = useState<Shipment | null>(null);
  // Di base si apre "Prepari i pacchi" (il lavoro quotidiano); la Board è
  // un'opzione esplicita, non il default — coerente col fatto che il widget
  // Vendite in Home linka qui senza bisogno di specificare ?mode=prep.
  const [viewMode, setViewMode] = useState<ViewMode>(searchParams.get("mode") === "board" ? "board" : "prep");
  // Stampata almeno una volta: indipendente dalla colonna, decide
  // Stampa↔Ristampa e il colore di "Pacco completato" in modalità "prep".
  const [printedIds, setPrintedIds] = useState<Set<string>>(new Set());
  // Bersaglio per la stampa diretta (senza anteprima): renderizzato fuori
  // schermo, sempre presente nel DOM, la CSS @media print lo rende visibile
  // e nasconde tutto il resto — stesso meccanismo del pannello anteprima.
  const [directPrintTarget, setDirectPrintTarget] = useState<Shipment | null>(null);

  useEffect(() => {
    if (!directPrintTarget) return;
    window.print();
  }, [directPrintTarget]);

  function markPrinted(s: Shipment) {
    setPrintedIds((prev) => (prev.has(s.id) ? prev : new Set(prev).add(s.id)));
  }

  function handleDirectPrint(s: Shipment) {
    markPrinted(s);
    setDirectPrintTarget(s);
  }

  // "Prepari i pacchi": tutti i pacchi fatti passano a spediti in un colpo
  // solo — il caso reale è "ho appena caricato tutto in macchina/dato tutto
  // al corriere", non uno per uno.
  function handleShipAll() {
    setShipmentList((prev) => prev.map((s) => (s.status === "fatti" ? { ...s, status: "spediti" } : s)));
  }

  function resetFilters() {
    setQuery("");
    setPlatform("all");
  }

  // Dettaglio spedizione: mostra gli eventi canonici, che la board riassume in
  // quattro colonne. Diverso da ShippingLabelDialog, che è solo l'etichetta.
  const [detail, setDetail] = useState<Shipment | null>(null);

  function advance(s: Shipment, to: ShipmentStatus) {
    setShipmentList((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: to } : x)));
    setDetail(null);
  }
  // il drop legge l'id da qui, non dallo stato: dragstart→drop può scattare prima
  // che React committi il re-render innescato da setDraggingId.
  const dragIdRef = useRef<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipmentList.filter((s) => {
      if (platform !== "all" && s.marketplace !== platform) return false;
      if (!q) return true;
      return (
        s.itemLabel.toLowerCase().includes(q) ||
        s.sku.toLowerCase().includes(q) ||
        s.recipient.toLowerCase().includes(q) ||
        s.destinationCity.name.toLowerCase().includes(q)
      );
    });
  }, [shipmentList, platform, query]);

  const sortFn = sortOrder === "recent" ? (a: Shipment, b: Shipment) => a.hoursAgo - b.hoursAgo : (a: Shipment, b: Shipment) => b.hoursAgo - a.hoursAgo;

  const stats = COLUMNS.map((col) => ({
    key: col.key,
    label: SHIPMENT_STATUS_LABELS[col.key],
    count: shipmentList.filter((s) => s.status === col.key).length,
    color: col.accent,
  }));

  function handleDragStart(id: string) {
    dragIdRef.current = id;
    setDraggingId(id);
  }

  function handleDrop(status: ShipmentStatus) {
    const id = dragIdRef.current;
    setDragOverCol(null);
    setDraggingId(null);
    dragIdRef.current = null;
    if (!id) return;
    setShipmentList((list) => list.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-8 sm:px-8 md:h-dvh">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-bold tracking-tight">Spedizioni</h1>
          <SegmentedFilter
            options={[
              { value: "prep", label: "Prepari i pacchi" },
              { value: "board", label: "Board" },
            ]}
            active={viewMode}
            onChange={setViewMode}
          />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex w-[236px] items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
            <Search className="size-[15px] shrink-0 text-muted-foreground/60" strokeWidth={1.8} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca capo, SKU, destinatario"
              aria-label="Cerca"
              className="w-full bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10.5px] uppercase tracking-[.1em] text-muted-foreground/70">Ordina</span>
            <SegmentedFilter
              options={[
                { value: "urgency", label: "Urgenza" },
                { value: "recent", label: "Recenti" },
              ]}
              active={sortOrder}
              onChange={setSortOrder}
            />
          </div>
          <button
            type="button"
            onClick={() => setHeroOpen((v) => !v)}
            title="Mostra/nascondi mappa"
            className={cn(
              "flex size-[38px] shrink-0 items-center justify-center rounded-[11px] border transition-colors",
              heroOpen ? "border-transparent bg-surface-dark text-text-on-dark" : "border-border bg-card text-muted-foreground"
            )}
          >
            <GlobeIcon className="size-4" strokeWidth={1.7} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-0.5 font-mono text-[10.5px] uppercase tracking-[.1em] text-muted-foreground/70">
          Piattaforma
        </span>
        {PLATFORM_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setPlatform(chip.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs transition-colors",
              platform === chip.key
                ? "bg-primary font-semibold text-primary-foreground"
                : "border border-border bg-card font-medium text-muted-foreground hover:text-foreground"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Il vuoto della BOARD, che è diverso dal vuoto di una colonna (DESIGN.md §12).
          Quattro colonne tutte vuote non sembrano vuote, sembrano rotte. */}
      {filtered.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-[14px] bg-muted">
          {shipmentList.length === 0 ? (
            <EmptyState
              tone="first-run"
              icon={<Package className="size-5" />}
              title="Nessuna spedizione, per ora"
              subtitle="Quando un capo si vende, la spedizione compare qui e la trascini fra le colonne mentre la lavori: da fare, fatta, spedita, consegnata."
            />
          ) : (
            <EmptyState
              tone="no-match"
              icon={<Package className="size-5" />}
              title="Nessuna spedizione con questi filtri"
              subtitle={`Ne hai ${shipmentList.length} in tutto. Azzera la ricerca o togli il filtro piattaforma.`}
              action={
                <Button variant="ghost" size="sm" className="mt-1" onClick={resetFilters}>
                  Azzera i filtri
                </Button>
              }
            />
          )}
        </div>
      ) : viewMode === "prep" ? (
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-3.5">
          {/* Da fare: 2/3 dello schermo, card grandi — qui serve vedere tutto
              (cercare il capo, controllare destinatario/corriere) prima di
              stampare. */}
          {(() => {
            const col = PREP_COLUMNS[0];
            const cards = filtered.filter((s) => s.status === col.key).sort(sortFn);
            const hot = dragOverCol === col.key;
            return (
              <div className="col-span-2 flex min-h-0 flex-col rounded-[14px] bg-muted p-2.5">
                <div className="flex items-center gap-2 px-1 pb-2.5">
                  <span className="size-[9px] shrink-0 rounded-[3px]" style={{ background: col.accent }} />
                  <span className="font-mono text-[11px] font-semibold tracking-[.08em]">{col.label}</span>
                  <span className="ml-auto font-mono text-xs font-semibold text-muted-foreground">{cards.length}</span>
                </div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverCol !== col.key) setDragOverCol(col.key);
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget === e.target) setDragOverCol((c) => (c === col.key ? null : c));
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(col.key);
                  }}
                  style={{ background: hot ? col.hot : "transparent", boxShadow: hot ? `inset 0 0 0 2px ${col.accent}` : "none" }}
                  className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto rounded-[10px] p-[3px] transition-[box-shadow,background] grid-cols-2 xl:grid-cols-3"
                >
                  {cards.map((s) => (
                    <LogisticsCard
                      key={s.id}
                      shipment={s}
                      dragging={draggingId === s.id}
                      onDragStart={handleDragStart}
                      onDragEnd={() => setDraggingId(null)}
                      onOpenLabel={setLabelShipment}
                      onOpen={setDetail}
                      variant="prep"
                      printed={printedIds.has(s.id)}
                      onPrint={handleDirectPrint}
                      onComplete={(shipment) => advance(shipment, "fatti")}
                    />
                  ))}
                  {cards.length === 0 && (
                    <EmptyState tone="idle" title="Nessun pacco" className="col-span-full min-h-[60px] justify-center" />
                  )}
                </div>
              </div>
            );
          })()}

          {/* Fatti: 1/3, elenco stretto — l'etichetta è già stampata, serve solo
              riconoscere il pacco prima di darlo al corriere. */}
          {(() => {
            const col = PREP_COLUMNS[1];
            const cards = filtered.filter((s) => s.status === col.key).sort(sortFn);
            const hot = dragOverCol === col.key;
            return (
              <div className="col-span-1 flex min-h-0 flex-col rounded-[14px] bg-muted p-2.5">
                <div className="flex items-center gap-2 px-1 pb-2.5">
                  <span className="size-[9px] shrink-0 rounded-[3px]" style={{ background: col.accent }} />
                  <span className="font-mono text-[11px] font-semibold tracking-[.08em]">{col.label}</span>
                  <span className="ml-1 font-mono text-xs font-semibold text-muted-foreground">{cards.length}</span>
                  {cards.length > 0 && (
                    <button
                      type="button"
                      onClick={handleShipAll}
                      className="ml-auto flex h-7 shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 text-[10.5px] font-semibold text-primary-foreground transition-colors hover:bg-accent-pressed"
                    >
                      Ho spedito tutto
                    </button>
                  )}
                </div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverCol !== col.key) setDragOverCol(col.key);
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget === e.target) setDragOverCol((c) => (c === col.key ? null : c));
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(col.key);
                  }}
                  style={{ background: hot ? col.hot : "transparent", boxShadow: hot ? `inset 0 0 0 2px ${col.accent}` : "none" }}
                  className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-[10px] p-[3px] transition-[box-shadow,background]"
                >
                  {cards.map((s) => (
                    <LogisticsCompactRow
                      key={s.id}
                      shipment={s}
                      dragging={draggingId === s.id}
                      onDragStart={handleDragStart}
                      onDragEnd={() => setDraggingId(null)}
                      onOpenLabel={setLabelShipment}
                      onOpen={setDetail}
                    />
                  ))}
                  {cards.length === 0 && (
                    <EmptyState tone="idle" title="Nessun pacco" className="min-h-[60px] flex-1 justify-center" />
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
      <div className={cn("grid min-h-0 flex-1 gap-3.5", heroOpen ? "grid-cols-3" : "grid-cols-2")}>
        <div className="col-span-2 grid min-h-0 grid-cols-2 gap-3.5">
          {BOARD_GROUPS.map((group) => {
            const cards = filtered.filter((s) => group.statuses.includes(s.status)).sort(sortFn);
            const hot = dragOverGroup === group.key;
            return (
              <div key={group.key} className="flex min-h-0 flex-col rounded-[14px] bg-muted p-2.5">
                <div className="flex items-center gap-2 px-1 pb-2.5">
                  <span className="size-[9px] shrink-0 rounded-[3px]" style={{ background: group.accent }} />
                  <span className="font-mono text-[11px] font-semibold tracking-[.08em]">{group.label}</span>
                  <span className="ml-auto font-mono text-xs font-semibold text-muted-foreground">{cards.length}</span>
                </div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverGroup !== group.key) setDragOverGroup(group.key);
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget === e.target) setDragOverGroup((c) => (c === group.key ? null : c));
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverGroup(null);
                    handleDrop(group.dropStatus);
                  }}
                  style={{ background: hot ? group.hot : "transparent", boxShadow: hot ? `inset 0 0 0 2px ${group.accent}` : "none" }}
                  className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto rounded-[10px] p-[3px] transition-[box-shadow,background]"
                >
                  {cards.map((s) =>
                    group.key === "spediti" ? (
                      <LogisticsTrackingCard key={s.id} shipment={s} onOpen={setDetail} />
                    ) : (
                      <LogisticsCard
                        key={s.id}
                        shipment={s}
                        dragging={draggingId === s.id}
                        onDragStart={handleDragStart}
                        onDragEnd={() => setDraggingId(null)}
                        onOpenLabel={setLabelShipment}
                        onOpen={setDetail}
                      />
                    )
                  )}
                  {/* idle: una sezione senza pacchi è uno stato normale, non un
                      problema. Nessuna icona, nessuna azione. */}
                  {cards.length === 0 && (
                    <EmptyState tone="idle" title="Nessun pacco" className="min-h-[60px] flex-1 justify-center" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {heroOpen && <LogisticsHero stats={stats} onClose={() => setHeroOpen(false)} />}
      </div>
      )}

      <ShipmentDetail
        shipment={detail}
        events={detail ? eventsForShipment(detail.id) : []}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        onAdvance={advance}
        onPrintLabel={(s) => {
          // L'etichetta si apre SOPRA il Sheet, non lo sostituisce: sono due
          // finestre diverse sullo stesso oggetto (brief 14).
          setLabelShipment(s);
        }}
      />

      <ShippingLabelDialog
        shipment={labelShipment}
        onOpenChange={(open) => {
          if (!open) setLabelShipment(null);
        }}
        onPrint={markPrinted}
      />

      {/* Bersaglio della stampa diretta (variant "prep", nessuna anteprima):
          fuori schermo qui, ma sempre montato — la @media print lo mostra e
          nasconde il resto della pagina, stesso meccanismo del pannello sopra. */}
      {directPrintTarget && (
        <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0">
          <ShippingLabel shipment={directPrintTarget} />
        </div>
      )}
    </div>
  );
}
