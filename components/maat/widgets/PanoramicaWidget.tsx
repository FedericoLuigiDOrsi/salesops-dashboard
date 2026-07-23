"use client";

import { useMemo, useState } from "react";
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
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowRight, EyeOff, GripVertical, Pin, Plus, SlidersHorizontal } from "lucide-react";
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
  bozze: "/capi",
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

function HeroTile({ metric }: { metric: HomeMetric }) {
  const spark = sparkPoints(metric.spark, 140, 40);
  return (
    <div className="col-span-2 flex flex-col justify-between rounded-lg border border-border bg-card px-4 py-3.5">
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
    <div className="flex flex-col justify-between rounded-lg border border-border bg-card px-4 py-3.5">
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

function EditRow({
  metric,
  pinned,
  onTogglePin,
  onHide,
}: {
  metric: HomeMetric;
  pinned: boolean;
  onTogglePin: () => void;
  onHide: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: metric.key });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5",
        isDragging && "z-10 opacity-80"
      )}
    >
      <button
        type="button"
        aria-label={`Trascina per riordinare ${metric.label}`}
        className="flex shrink-0 cursor-grab touch-none items-center text-muted-foreground/60 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <span className="font-mono text-lg font-semibold tabular-nums">
          {metric.value}
          {metric.euro ? " €" : ""}
        </span>
        <p className="truncate text-xs text-muted-foreground">{metric.label}</p>
      </div>
      <button
        type="button"
        aria-label={pinned ? `Sblocca ${metric.label} dalla cima` : `Fissa ${metric.label} in cima`}
        aria-pressed={pinned}
        onClick={onTogglePin}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors",
          pinned ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
        )}
      >
        <Pin className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label={`Nascondi ${metric.label}`}
        onClick={onHide}
        className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
      >
        <EyeOff className="size-3.5" />
      </button>
    </div>
  );
}

/** Lista trascinabile di una sezione dell'edit mode ("Fissati in cima" o "Visibili"). */
function SortableRowList({
  metrics,
  pinned,
  onReorder,
  onTogglePin,
  onHide,
}: {
  metrics: HomeMetric[];
  pinned: boolean;
  onReorder: (from: string, to: string) => void;
  onTogglePin: (key: string) => void;
  onHide: (key: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(active.id as string, over.id as string);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={metrics.map((m) => m.key)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {metrics.map((m) => (
            <EditRow
              key={m.key}
              metric={m}
              pinned={pinned}
              onTogglePin={() => onTogglePin(m.key)}
              onHide={() => onHide(m.key)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/** Metriche chiave configurabili: il box "Panoramica" del mockup, come widget. */
export function PanoramicaWidget() {
  const { metrics, pinnedMetrics, setMetrics, setPinnedMetrics } = useHomeLayout();
  const [editMode, setEditMode] = useState(false);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["value"]>("settimana");
  const [draftPinned, setDraftPinned] = useState<string[]>([]);
  const [draftUnpinned, setDraftUnpinned] = useState<string[]>([]);

  const orderedVisible = useMemo(
    () => metrics.map((k) => METRIC_BY_KEY.get(k)).filter((m): m is HomeMetric => !!m),
    [metrics]
  );
  const toDo = orderedVisible.filter((m) => m.kind === "actionable");
  const hero = orderedVisible.find((m) => m.kind === "hero");
  const trend = orderedVisible.filter((m) => m.kind === "trend");

  function enterEdit() {
    setDraftPinned(metrics.filter((k) => pinnedMetrics.includes(k)));
    setDraftUnpinned(metrics.filter((k) => !pinnedMetrics.includes(k)));
    setEditMode(true);
  }
  function cancelEdit() {
    setEditMode(false);
  }
  function saveEdit() {
    setMetrics([...draftPinned, ...draftUnpinned]);
    setPinnedMetrics(draftPinned);
    setEditMode(false);
  }
  function togglePin(key: string) {
    if (draftPinned.includes(key)) {
      setDraftPinned((prev) => prev.filter((k) => k !== key));
      setDraftUnpinned((prev) => [...prev, key]);
    } else {
      setDraftUnpinned((prev) => prev.filter((k) => k !== key));
      setDraftPinned((prev) => [...prev, key]);
    }
  }
  function hide(key: string) {
    setDraftPinned((prev) => prev.filter((k) => k !== key));
    setDraftUnpinned((prev) => prev.filter((k) => k !== key));
  }
  function show(key: string) {
    setDraftUnpinned((prev) => [...prev, key]);
  }
  function reorderPinned(from: string, to: string) {
    setDraftPinned((prev) => arrayMove(prev, prev.indexOf(from), prev.indexOf(to)));
  }
  function reorderUnpinned(from: string, to: string) {
    setDraftUnpinned((prev) => arrayMove(prev, prev.indexOf(from), prev.indexOf(to)));
  }

  const draftPinnedMetrics = draftPinned.map((k) => METRIC_BY_KEY.get(k)).filter((m): m is HomeMetric => !!m);
  const draftUnpinnedMetrics = draftUnpinned.map((k) => METRIC_BY_KEY.get(k)).filter((m): m is HomeMetric => !!m);
  const hiddenMetrics = HOME_METRICS.filter((m) => !draftPinned.includes(m.key) && !draftUnpinned.includes(m.key));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
        <div className="flex flex-col gap-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Trascina per riordinare · fissa in cima con lo spillo · nascondi con l&rsquo;occhio.
          </p>

          {draftPinnedMetrics.length > 0 ? (
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[.12em] text-muted-foreground">
                Fissati in cima
              </p>
              <SortableRowList
                metrics={draftPinnedMetrics}
                pinned
                onReorder={reorderPinned}
                onTogglePin={togglePin}
                onHide={hide}
              />
            </div>
          ) : null}

          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[.12em] text-muted-foreground">Visibili</p>
            <SortableRowList
              metrics={draftUnpinnedMetrics}
              pinned={false}
              onReorder={reorderUnpinned}
              onTogglePin={togglePin}
              onHide={hide}
            />
          </div>

          {hiddenMetrics.length > 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3.5">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[.12em] text-muted-foreground">
                Nascosti · tocca per aggiungere
              </p>
              <div className="flex flex-wrap gap-2">
                {hiddenMetrics.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => show(m.key)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Plus className="size-3" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : orderedVisible.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-muted-foreground">
          Nessuna informazione selezionata. Usa &ldquo;Modifica&rdquo;.
        </p>
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
