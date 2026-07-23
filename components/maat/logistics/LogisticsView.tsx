"use client";

import { useMemo, useRef, useState } from "react";
import { Globe as GlobeIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SegmentedFilter } from "@/components/maat/SegmentedFilter";
import { LogisticsCard } from "@/components/maat/logistics/LogisticsCard";
import { LogisticsHero } from "@/components/maat/logistics/LogisticsHero";
import { ShippingLabelDialog } from "@/components/maat/logistics/ShippingLabelDialog";
import { shipments as initialShipments } from "@/lib/logistics-mock";
import { MARKETPLACE_LABELS, SHIPMENT_STATUS_LABELS, type Marketplace, type Shipment, type ShipmentStatus } from "@/types/maat";

const COLUMNS: { key: ShipmentStatus; label: string; accent: string; hot: string }[] = [
  { key: "da_fare", label: "PACCHI DA FARE", accent: "#DBE64C", hot: "rgba(219,230,76,.20)" },
  { key: "fatti", label: "PACCHI FATTI", accent: "#1E488F", hot: "rgba(30,72,143,.15)" },
  { key: "spediti", label: "SPEDITI", accent: "#5B6670", hot: "rgba(91,102,112,.17)" },
  { key: "consegnati", label: "CONSEGNATI", accent: "#00804C", hot: "rgba(0,128,76,.15)" },
];

const PLATFORM_CHIPS: { key: "all" | Marketplace; label: string }[] = [
  { key: "all", label: "Tutte" },
  ...(Object.keys(MARKETPLACE_LABELS) as Marketplace[]).map((m) => ({ key: m, label: MARKETPLACE_LABELS[m] })),
];

type SortOrder = "urgency" | "recent";

export function LogisticsView() {
  const [shipmentList, setShipmentList] = useState<Shipment[]>(initialShipments);
  const [platform, setPlatform] = useState<"all" | Marketplace>("all");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("urgency");
  const [heroOpen, setHeroOpen] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ShipmentStatus | null>(null);
  const [labelShipment, setLabelShipment] = useState<Shipment | null>(null);
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
    <div className="flex flex-col gap-4 p-4 sm:p-6 md:h-dvh">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">Logistica</p>
          <h1 className="text-[26px] font-bold tracking-tight">Board spedizioni</h1>
          <p className="mt-0.5 max-w-xl text-[13px] text-muted-foreground">
            Tutti i pacchi in un unico flusso, ordinati per urgenza — le vendite più vecchie in cima. Trascina una card
            per aggiornarne lo stato.
          </p>
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

      {heroOpen && <LogisticsHero stats={stats} onClose={() => setHeroOpen(false)} />}

      <div className="grid min-h-0 flex-1 auto-cols-[minmax(282px,1fr)] grid-flow-col gap-3.5 overflow-x-auto">
        {COLUMNS.map((col) => {
          const cards = filtered.filter((s) => s.status === col.key).sort(sortFn);
          const hot = dragOverCol === col.key;
          return (
            <div key={col.key} className="flex min-h-0 flex-col rounded-[14px] bg-muted p-2.5">
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
                className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto rounded-[10px] p-[3px] transition-[box-shadow,background]"
              >
                {cards.map((s) => (
                  <LogisticsCard
                    key={s.id}
                    shipment={s}
                    dragging={draggingId === s.id}
                    onDragStart={handleDragStart}
                    onDragEnd={() => setDraggingId(null)}
                    onOpenLabel={setLabelShipment}
                  />
                ))}
                {cards.length === 0 && (
                  <div className="flex min-h-[60px] flex-1 items-center justify-center font-mono text-[11px] text-muted-foreground/60">
                    Nessun pacco
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ShippingLabelDialog
        shipment={labelShipment}
        onOpenChange={(open) => {
          if (!open) setLabelShipment(null);
        }}
      />
    </div>
  );
}
