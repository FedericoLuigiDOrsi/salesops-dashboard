"use client";

import { useRef, useState } from "react";
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
import { WidgetShell } from "@/components/maat/widgets/WidgetShell";
import { HOME_WIDGETS, getWidget } from "@/components/maat/widgets/registry";
import { PanoramicaWidget } from "@/components/maat/widgets/PanoramicaWidget";
import { HomeLayoutProvider, useHomeLayout, type WidgetKey } from "@/lib/home-layout-store";
import { WIDGET_TIER_GRID_CLASS } from "@/lib/tiers";
import { DEFAULT_MODULE_DIMS, clampModuleDims, type ModuleDims } from "@/lib/widget-sizes";

/** Unità di riga della griglia Home: grid-auto-rows (200px) + gap (24px, gap-6). */
const ROW_UNIT_PX = 224;

/**
 * Panoramica è l'unico widget che non segue la griglia a moduli: è sempre la
 * prima fascia, a tutta larghezza, nello spazio dedicato ai widget — scorre
 * con la pagina come gli altri, semplicemente non è mai trascinabile/rimovibile
 * né si affianca a nessun altro modulo.
 */
const BAR_WIDGET_KEY: WidgetKey = "panoramica";

/**
 * Maniglia di resize in edit mode: si trascina dall'angolo in basso a destra,
 * l'angolo in alto a sinistra del widget resta fermo (crescere/rimpicciolire
 * cambia solo quanti moduli il widget occupa a destra e in basso, mai la sua
 * posizione di partenza in griglia).
 */
function ResizeHandle({
  dims,
  widgetRef,
  onChange,
}: {
  dims: ModuleDims;
  widgetRef: React.RefObject<HTMLDivElement | null>;
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
      const nextH = Math.round(dims.h + (ev.clientY - startY) / ROW_UNIT_PX);
      const next = clampModuleDims({ w: nextW, h: nextH });
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
function SortableWidget({ widgetKey, editing }: { widgetKey: WidgetKey; editing: boolean }) {
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

  const dims = def.resizable ? widgetSizes[widgetKey] ?? DEFAULT_MODULE_DIMS : null;

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
        ...(dims ? ({ "--w": dims.w, "--h": dims.h } as React.CSSProperties) : {}),
      }}
      className={cn(
        dims ? "col-span-1 row-span-1 lg:[grid-column:span_var(--w)] lg:[grid-row:span_var(--h)]" : WIDGET_TIER_GRID_CLASS[def.tier],
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
        {editing && dims ? (
          <ResizeHandle dims={dims} widgetRef={nodeRef} onChange={(next) => setWidgetSize(widgetKey, next)} />
        ) : null}
        <WidgetShell
          editing={editing}
          onRemove={() => removeWidget(widgetKey)}
          removeLabel={`Rimuovi widget ${def.title}`}
          bleed={def.bleed}
        >
          <def.component />
        </WidgetShell>
      </motion.div>
    </div>
  );
}

/** Erede dello "Spazio disponibile" del mockup: tile per aggiungere widget dal catalogo. */
function AddWidgetTile() {
  const { layout, addWidget } = useHomeLayout();
  const available = HOME_WIDGETS.filter((w) => w.key !== BAR_WIDGET_KEY && !layout.includes(w.key));

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

  const gridLayout = layout.filter((key) => key !== BAR_WIDGET_KEY);

  return (
    <div className="relative mx-auto max-w-[1400px] px-6 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Dashboard
          </p>
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

      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <PanoramicaWidget spread />
      </div>

      {gridLayout.length === 0 && !editing ? (
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
          <SortableContext items={gridLayout} strategy={rectSortingStrategy}>
            <div className="mt-6 grid grid-flow-dense grid-cols-1 gap-6 lg:grid-cols-6 lg:[grid-auto-rows:minmax(200px,auto)]">
              {gridLayout.map((key) => (
                <SortableWidget key={key} widgetKey={key} editing={editing} />
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
