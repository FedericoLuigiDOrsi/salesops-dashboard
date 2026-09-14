"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
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
import { CSS } from "@dnd-kit/utilities";
import { ArrowRight, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HOME_METRICS, type HomeMetric } from "@/lib/home-mock";
import { useHomeLayout } from "@/lib/home-layout-store";

const PERIODS = [
  { value: "settimana", label: "Settimana" },
  { value: "mese", label: "Mese" },
  { value: "anno", label: "Anno" },
] as const;

const METRIC_BY_KEY = new Map(HOME_METRICS.map((m) => [m.key, m]));

const ACTIONABLE_HREF: Record<string, string> = {
  bozze: "/inventario?status=to_be_reviewed",
  offerte: "/notifiche",
};

/** Converte una serie di valori grezzi in punti SVG normalizzati (min-max) su un viewBox width×height. */
function sparkPoints(values: number[] | undefined, width: number, height: number) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const coords = values.map((v, i) => [i * step, height - ((v - min) / range) * height] as const);
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} ${width},${height} 0,${height}`;
  return { line, area };
}

function DeltaBadge({ delta, up }: { delta: string; up?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 font-mono text-xs font-semibold",
        up ? "text-success" : "text-muted-foreground"
      )}
    >
      <svg viewBox="0 0 10 10" className={cn("size-2", !up && "rotate-180")} fill="currentColor" aria-hidden="true">
        <path d="M5 1.5 9 8H1z" />
      </svg>
      {delta}
    </span>
  );
}

function ActionableTile({ metric }: { metric: HomeMetric }) {
  return (
    <Link
      href={ACTIONABLE_HREF[metric.key] ?? "/"}
      className="group flex items-center justify-between gap-3 rounded-lg bg-accent-soft px-4 py-3.5 transition-colors hover:bg-accent-soft/70"
    >
      <div>
        <span className="font-mono text-[28px] font-semibold leading-none tabular-nums">{metric.value}</span>
        <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">{metric.label}</p>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold">
        {metric.cta}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/** Variante verticale dell'ActionableTile: stessa sagoma di HeroTile/TrendTile,
 * così nella fascia Panoramica tutti i moduli condividono la stessa riga della
 * griglia e nessuno lascia spazio vuoto sotto agli altri.
 *
 * `as="div"` è la variante usata dentro `SortableMetricTile` in edit mode: la
 * card resta trascinabile invece di navigare, il contenuto è identico. */
function ActionableTileCompact({ metric, as = "link" }: { metric: HomeMetric; as?: "link" | "div" }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-2xl font-semibold leading-none tabular-nums">{metric.value}</span>
        <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">{metric.label}</p>
    </>
  );
  if (as === "div") {
    return (
      <div className="group flex flex-col justify-between rounded-lg bg-accent-soft px-4 py-3">{content}</div>
    );
  }
  return (
    <Link
      href={ACTIONABLE_HREF[metric.key] ?? "/"}
      className="group flex flex-col justify-between rounded-lg bg-accent-soft px-4 py-3 transition-colors hover:bg-accent-soft/70"
    >
      {content}
    </Link>
  );
}

function HeroTile({ metric }: { metric: HomeMetric }) {
  const spark = sparkPoints(metric.spark, 140, 40);
  return (
    <div className="col-span-2 flex flex-col justify-between rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-muted-foreground">{metric.label}</span>
        {metric.delta ? <DeltaBadge delta={metric.delta} up={metric.up} /> : null}
      </div>
      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div>
          <span className="font-mono text-[38px] font-semibold leading-none tracking-tight tabular-nums">
            {metric.value}
            {metric.euro ? <span className="ml-0.5 text-2xl text-muted-foreground">€</span> : null}
          </span>
          {metric.sub ? (
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wide text-text-3">{metric.sub}</p>
          ) : null}
        </div>
        {spark ? (
          <svg
            viewBox="0 0 140 40"
            preserveAspectRatio="none"
            className="h-11 w-[150px] shrink-0 overflow-visible"
            aria-hidden="true"
          >
            <polygon points={spark.area} className="fill-success/10" />
            <polyline
              points={spark.line}
              fill="none"
              className="stroke-success"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </div>
    </div>
  );
}

function TrendTile({ metric }: { metric: HomeMetric }) {
  const spark = sparkPoints(metric.spark, 100, 20);
  return (
    <div className="flex flex-col justify-between rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-2xl font-semibold leading-none tabular-nums">
          {metric.value}
          {metric.euro ? <span className="ml-0.5 text-base text-muted-foreground">€</span> : null}
        </span>
        {metric.delta ? <DeltaBadge delta={metric.delta} up={metric.up} /> : null}
      </div>
      <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">{metric.label}</p>
      {spark ? (
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="mt-2 h-4 w-full overflow-visible" aria-hidden="true">
          <polyline
            points={spark.line}
            fill="none"
            className="stroke-success"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </div>
  );
}

/**
 * Tile trascinabile della barra in edit mode: stesso contenuto (reale, non
 * un placeholder) della tile in sola lettura, più maniglia implicita su
 * tutta la card e una X per rimuoverla. La X ferma la propagazione al
 * pointerdown, non al click, altrimenti dnd-kit la interpreta come inizio
 * di un drag prima che il click scatti.
 */
function SortableMetricTile({ metric, onRemove }: { metric: HomeMetric; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: metric.key });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group/tile relative cursor-grab touch-none select-none active:cursor-grabbing",
        isDragging && "z-10 opacity-60"
      )}
      {...attributes}
      {...listeners}
    >
      {metric.kind === "actionable" ? (
        <ActionableTileCompact metric={metric} as="div" />
      ) : metric.kind === "hero" ? (
        <HeroTile metric={metric} />
      ) : (
        <TrendTile metric={metric} />
      )}
      <button
        type="button"
        aria-label={`Rimuovi ${metric.label} dalla panoramica`}
        onClick={onRemove}
        onPointerDown={(event) => event.stopPropagation()}
        className="absolute -right-1.5 -top-1.5 z-10 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover/tile:opacity-100"
      >
        <X className="size-3" strokeWidth={2.2} />
      </button>
    </div>
  );
}

/**
 * Barra live in edit mode: stessa griglia della vista normale, ma ogni tile è
 * anche una zona di drop (per le card trascinate dal cassetto sotto) e il
 * contenitore stesso è droppable, per accogliere il rilascio su spazio vuoto
 * o quando la barra è vuota.
 */
function EditableBar({ metrics, onRemove }: { metrics: HomeMetric[]; onRemove: (key: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: "panorama-bar" });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg transition-colors",
        isOver && "bg-accent-soft/50",
        metrics.length === 0 && "border border-dashed border-border p-4"
      )}
    >
      {metrics.length === 0 ? (
        <p className="text-center text-[12px] text-muted-foreground">
          Trascina qui una card dalla tendina qui sotto.
        </p>
      ) : (
        <SortableContext items={metrics.map((m) => m.key)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
            {metrics.map((m) => (
              <SortableMetricTile key={m.key} metric={m} onRemove={() => onRemove(m.key)} />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

/**
 * Card del cassetto: non ancora nella barra. Anteprima con un rettangolo
 * scuro al posto del valore reale — qui non c'è un numero da mostrare, solo
 * la sagoma. Le "Azioni" (rimandano a una funzione, es. Bozze da revisionare)
 * hanno bordo + ombra da tasto per farsi riconoscere come interagibili; i
 * "Dati" (solo numeri) restano piatti.
 */
function DrawerCard({ metric }: { metric: HomeMetric }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: metric.key });
  const actionable = metric.kind === "actionable";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }}
      className={cn(
        "flex w-[124px] shrink-0 cursor-grab touch-none select-none flex-col gap-2.5 rounded-lg border p-3 transition-opacity active:cursor-grabbing",
        actionable
          ? "border-border bg-card shadow-[0_1px_2px_rgba(0,31,63,.06),0_2px_6px_rgba(0,31,63,.08)]"
          : "border-dashed border-border/70 bg-transparent",
        isDragging && "opacity-30"
      )}
      {...attributes}
      {...listeners}
    >
      <span aria-hidden className="h-6 w-14 rounded-[4px] bg-foreground/50" />
      <span className="truncate text-[11px] font-medium text-muted-foreground">{metric.label}</span>
    </div>
  );
}

/** Cassetto sotto la barra: solo le metriche non ancora inserite, divise Azioni/Dati. */
function MetricDrawer({ metrics }: { metrics: HomeMetric[] }) {
  if (metrics.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-[12px] text-muted-foreground">
        Tutte le metriche disponibili sono già nella panoramica.
      </div>
    );
  }
  const azioni = metrics.filter((m) => m.kind === "actionable");
  const dati = metrics.filter((m) => m.kind !== "actionable");

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3.5">
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        Trascina una card nella barra qui sopra per aggiungerla.
      </p>
      {azioni.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[.12em] text-muted-foreground">
            Azioni · {azioni.length}
          </p>
          <div className="flex flex-wrap gap-2">
            {azioni.map((m) => (
              <DrawerCard key={m.key} metric={m} />
            ))}
          </div>
        </div>
      )}
      {dati.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[.12em] text-muted-foreground">
            Dati · {dati.length}
          </p>
          <div className="flex flex-wrap gap-2">
            {dati.map((m) => (
              <DrawerCard key={m.key} metric={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Metriche chiave configurabili della Home. Non è un widget: vive fuori dal
 * catalogo e dalla griglia, sempre in cima. Riordino drag-and-drop e scelta
 * delle metriche da mostrare, solo KPI — nessuna azione operativa qui dentro.
 */
export function Panoramica({ spread = false }: { spread?: boolean } = {}) {
  const { metrics, setMetrics } = useHomeLayout();
  const [editMode, setEditMode] = useState(false);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["value"]>("settimana");
  const [draftMetrics, setDraftMetrics] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const orderedVisible = useMemo(
    () => metrics.map((k) => METRIC_BY_KEY.get(k)).filter((m): m is HomeMetric => !!m),
    [metrics]
  );
  // Usati solo dal ramo non-spread (legacy, oggi non montato in nessuna schermata).
  const toDo = orderedVisible.filter((m) => m.kind === "actionable");
  const hero = orderedVisible.find((m) => m.kind === "hero");
  const trend = orderedVisible.filter((m) => m.kind === "trend");

  function enterEdit() {
    setDraftMetrics(metrics);
    setEditMode(true);
  }
  function cancelEdit() {
    setEditMode(false);
  }
  function saveEdit() {
    setMetrics(draftMetrics);
    setEditMode(false);
  }
  function removeFromDraft(key: string) {
    setDraftMetrics((prev) => prev.filter((k) => k !== key));
  }

  // Un solo DndContext copre sia il riordino dentro la barra (sortable-to-
  // sortable) sia l'inserimento dal cassetto (draggable-to-sortable): in
  // entrambi i casi `active` è la card trascinata e `over` è ciò che sta
  // sotto al rilascio, la sola differenza è se `active` è già in draftMetrics.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeKey = String(active.id);
    const overKey = String(over.id);
    if (activeKey === overKey) return;

    setDraftMetrics((prev) => {
      if (prev.includes(activeKey)) {
        if (!prev.includes(overKey)) return prev;
        return arrayMove(prev, prev.indexOf(activeKey), prev.indexOf(overKey));
      }
      const insertAt = prev.includes(overKey) ? prev.indexOf(overKey) : prev.length;
      const next = [...prev];
      next.splice(insertAt, 0, activeKey);
      return next;
    });
  }

  const draftMetricObjs = draftMetrics.map((k) => METRIC_BY_KEY.get(k)).filter((m): m is HomeMetric => !!m);
  const availableMetrics = HOME_METRICS.filter((m) => !draftMetrics.includes(m.key));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
          Panoramica
        </p>
        {editMode ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={cancelEdit}>
              Annulla
            </Button>
            <Button size="sm" onClick={saveEdit}>
              Salva layout
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-md border border-border p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={period === p.value}
                  onClick={() => setPeriod(p.value)}
                  className={cn(
                    "rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors",
                    period === p.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={enterEdit}>
              <SlidersHorizontal className="size-3.5" />
              Modifica
            </Button>
          </div>
        )}
      </div>

      {editMode ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex flex-col gap-3.5">
            <EditableBar metrics={draftMetricObjs} onRemove={removeFromDraft} />
            <MetricDrawer metrics={availableMetrics} />
          </div>
        </DndContext>
      ) : orderedVisible.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-muted-foreground">
          Nessuna informazione selezionata. Usa &ldquo;Modifica&rdquo;.
        </p>
      ) : spread ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
          {orderedVisible.map((m) =>
            m.kind === "actionable" ? (
              <ActionableTileCompact key={m.key} metric={m} />
            ) : m.kind === "hero" ? (
              <HeroTile key={m.key} metric={m} />
            ) : (
              <TrendTile key={m.key} metric={m} />
            )
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {toDo.length > 0 ? (
            <div>
              <div className="mb-2.5 flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
                  Da fare
                </span>
                <span className="rounded-full bg-primary px-2 py-0.5 font-mono text-[11px] font-semibold text-primary-foreground">
                  {toDo.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {toDo.map((m) => (
                  <ActionableTile key={m.key} metric={m} />
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
              Andamento · {PERIODS.find((p) => p.value === period)?.label}
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {hero ? <HeroTile metric={hero} /> : null}
              {trend.map((m) => (
                <TrendTile key={m.key} metric={m} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
