"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { Check, LayoutGrid, PackagePlus, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/maat/EmptyState";
import { ExtensionAlert } from "@/components/maat/ExtensionAlert";
import { WidgetShell } from "@/components/maat/widgets/WidgetShell";
import { HOME_WIDGETS, getWidget } from "@/components/maat/widgets/registry";
import { Panoramica } from "@/components/maat/home/Panoramica";
import { HomeLayoutProvider, useHomeLayout, type WidgetKey } from "@/lib/home-layout-store";
import { WIDGET_CATALOG } from "@/lib/widget-catalog";
import { clampModuleDims, isResizable, mobileSize, type ModuleDims, type WidgetSizes } from "@/lib/widget-sizes";
import { useBelowLg } from "@/hooks/use-below-lg";

const GRID_COLS = 6;
const GRID_GAP_PX = 16; // gap-4

/**
 * Misura la larghezza reale di una colonna della griglia e la propone come
 * altezza di riga — moduli davvero quadrati (1×1 = un quadrato vero, non un
 * rettangolo) qualunque sia la larghezza dello schermo, dato che ora la
 * griglia occupa tutta la larghezza disponibile invece di un max-width fisso.
 */
function useSquareRowUnit(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [unit, setUnit] = useState(160);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const colWidth = (el.clientWidth - GRID_GAP_PX * (GRID_COLS - 1)) / GRID_COLS;
      if (colWidth > 0) setUnit(Math.round(colWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);
  return unit;
}

/**
 * Maniglia di resize in edit mode: si trascina dall'angolo in basso a destra,
 * l'angolo in alto a sinistra del widget resta fermo (crescere/rimpicciolire
 * cambia solo quanti moduli il widget occupa a destra e in basso, mai la sua
 * posizione di partenza in griglia).
 */
function ResizeHandle({
  dims,
  sizes,
  widgetRef,
  rowUnitPx,
  onChange,
}: {
  dims: ModuleDims;
  sizes: WidgetSizes;
  widgetRef: React.RefObject<HTMLDivElement | null>;
  rowUnitPx: number;
  onChange: (dims: ModuleDims) => void;
}) {
  function handlePointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const colUnitPx = rect.width / dims.w;
    let last = dims;

    function handleMove(ev: PointerEvent) {
      const nextW = Math.round(dims.w + (ev.clientX - startX) / colUnitPx);
      const nextH = Math.round(dims.h + (ev.clientY - startY) / (rowUnitPx + GRID_GAP_PX));
      const next = clampModuleDims({ w: nextW, h: nextH }, sizes);
      if (next.w !== last.w || next.h !== last.h) {
        last = next;
        onChange(next);
      }
    }
    function handleUp() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  return (
    <button
      type="button"
      aria-label="Ridimensiona widget"
      onPointerDown={handlePointerDown}
      className="absolute -bottom-2 -right-2 z-10 flex size-7 cursor-nwse-resize touch-none items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground"
    >
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
        <path d="M9.5 1.5 1.5 9.5M9.5 5.5 5.5 9.5M9.5 9.5v0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/** Widget trascinabile della bento grid: shell + componente dalla registry. */
function SortableWidget({
  widgetKey,
  editing,
  rowUnitPx,
}: {
  widgetKey: WidgetKey;
  editing: boolean;
  rowUnitPx: number;
}) {
  const def = getWidget(widgetKey);
  const { removeWidget, widgetSizes, setWidgetSize } = useHomeLayout();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widgetKey,
    disabled: !editing,
  });
  const nodeRef = useRef<HTMLDivElement | null>(null);
  function setRefs(node: HTMLDivElement | null) {
    nodeRef.current = node;
    setNodeRef(node);
  }

  const { sizes } = WIDGET_CATALOG[widgetKey];
  const belowLg = useBelowLg();
  const dims = widgetSizes[widgetKey] ?? sizes.default;
  const size = belowLg ? mobileSize(sizes) : dims;

  return (
    <div
      ref={setRefs}
      style={{
        // Solo il widget afferrato riceve la transform (segue il puntatore).
        // Applicarla anche agli altri per "anticipare" il riordino li fa
        // scivolare nel posto sbagliato appena la griglia è densa e a moduli
        // di dimensioni diverse: l'accavallamento fantasma durante il drag.
        // L'ordine reale cambia solo al rilascio (handleDragEnd).
        //
        // Solo traslazione, MAI lo scaleX/scaleY che dnd-kit calcola per
        // l'anteprima di riordino (CSS.Transform.toString li includerebbe):
        // in una griglia densa a moduli diversi quel fattore è quasi sempre
        // sbagliato e schiaccia/stira il widget trascinato in modo visibile.
        transform: isDragging && transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition: isDragging ? undefined : transition ?? "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        // Larghezza/altezza in moduli per i widget ridimensionabili: l'angolo
        // in alto a sinistra resta il punto di ancoraggio nella griglia,
        // crescere occupa sempre e solo colonne/righe verso destra e in basso.
        ...({ "--w": dims.w, "--h": dims.h } as React.CSSProperties),
      }}
      className={cn(
        "col-span-1 row-span-1 lg:[grid-column:span_var(--w)] lg:[grid-row:span_var(--h)]",
        editing && "cursor-grab touch-none active:cursor-grabbing",
        isDragging && "z-10"
      )}
      {...(editing ? attributes : {})}
      {...(editing ? listeners : {})}
    >
      <motion.div
        layout={!isDragging}
        animate={{ scale: isDragging ? 1.035 : 1 }}
        transition={{ layout: { type: "spring", stiffness: 500, damping: 40 }, default: { type: "spring", stiffness: 350, damping: 25 } }}
        style={{ boxShadow: isDragging ? "0 20px 40px -15px rgba(0,0,0,0.25)" : "none" }}
        className="relative h-full rounded-xl"
      >
        {editing && isResizable(sizes) ? (
          <ResizeHandle
            dims={dims}
            sizes={sizes}
            widgetRef={nodeRef}
            rowUnitPx={rowUnitPx}
            onChange={(next) => setWidgetSize(widgetKey, next)}
          />
        ) : null}
        <WidgetShell
          editing={editing}
          onRemove={() => removeWidget(widgetKey)}
          removeLabel={`Rimuovi widget ${def.title}`}
          bleed={def.bleed}
        >
          <def.component size={size} />
        </WidgetShell>
      </motion.div>
    </div>
  );
}

/** Erede dello "Spazio disponibile" del mockup: tile per aggiungere widget dal catalogo. */
function AddWidgetTile() {
  const { layout, addWidget } = useHomeLayout();
  const available = HOME_WIDGETS.filter((w) => !layout.includes(w.key));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Plus className="size-5" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[.12em]">Aggiungi widget</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-2">
        {available.length === 0 ? (
          <p className="px-2 py-3 text-center text-[13px] text-muted-foreground">
            Tutti i widget sono già in pagina.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {available.map((w) => (
              <button
                key={w.key}
                type="button"
                onClick={() => addWidget(w.key)}
                className="flex items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-foreground/[.04]"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                  <w.icon className="size-4 text-muted-foreground" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold">{w.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{w.description}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function HomeDashboardInner() {
  const { layout, setLayout } = useHomeLayout();
  const [editing, setEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const rowUnitPx = useSquareRowUnit(gridRef);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = layout.indexOf(active.id as WidgetKey);
    const to = layout.indexOf(over.id as WidgetKey);
    if (from < 0 || to < 0) return;
    setLayout(arrayMove(layout, from, to));
  }

  function handleRefresh() {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 500);
  }

  return (
    <div className="relative w-full px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Ciao, Federico</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon-sm" aria-label="Aggiorna" onClick={handleRefresh}>
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          </Button>
          <Button
            variant={editing ? "default" : "outline"}
            size="sm"
            onClick={() => setEditing((v) => !v)}
            aria-pressed={editing}
          >
            {editing ? (
              <>
                <Check /> Fine
              </>
            ) : (
              <>
                <LayoutGrid /> Modifica layout
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/contabilita">
              <PackagePlus /> Registra carico
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/capi/nuovo">
              <Plus /> Crea capo
            </Link>
          </Button>
        </div>
      </div>

      <ExtensionAlert />

      <div className="mt-3 rounded-xl border border-border bg-card p-3">
        <Panoramica spread />
      </div>

      {layout.length === 0 && !editing ? (
        <EmptyState
          tone="first-run"
          icon={<LayoutGrid className="size-5" />}
          title="La tua dashboard è vuota"
          subtitle="Aggiungi i widget che vuoi vedere: metriche, offerte, vendite e altro."
          action={
            <Button size="sm" onClick={() => setEditing(true)}>
              <Plus /> Aggiungi widget
            </Button>
          }
        />
      ) : (
        <DndContext id="home-widgets" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={layout} strategy={rectSortingStrategy}>
            <div
              ref={gridRef}
              style={{ "--row-unit": `${rowUnitPx}px` } as React.CSSProperties}
              className="mt-3 grid grid-flow-dense grid-cols-1 gap-4 lg:grid-cols-6 lg:[grid-auto-rows:minmax(var(--row-unit),auto)]"
            >
              {layout.map((key) => (
                <SortableWidget key={key} widgetKey={key} editing={editing} rowUnitPx={rowUnitPx} />
              ))}
              {editing ? <AddWidgetTile /> : null}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

export function HomeDashboard() {
  return (
    <HomeLayoutProvider>
      <HomeDashboardInner />
    </HomeLayoutProvider>
  );
}
