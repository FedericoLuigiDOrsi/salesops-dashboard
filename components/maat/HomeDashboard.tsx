"use client";

import { useState } from "react";
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
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Check, LayoutGrid, PackagePlus, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/maat/EmptyState";
import { WidgetShell } from "@/components/maat/widgets/WidgetShell";
import { HOME_WIDGETS, getWidget } from "@/components/maat/widgets/registry";
import { HomeLayoutProvider, useHomeLayout, type WidgetKey } from "@/lib/home-layout-store";
import { WIDGET_TIER_GRID_CLASS } from "@/lib/tiers";

/** Widget trascinabile della bento grid: shell + componente dalla registry. */
function SortableWidget({ widgetKey, editing }: { widgetKey: WidgetKey; editing: boolean }) {
  const def = getWidget(widgetKey);
  const { removeWidget } = useHomeLayout();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widgetKey,
    disabled: !editing,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      className={cn(
        WIDGET_TIER_GRID_CLASS[def.tier],
        editing && "cursor-grab touch-none active:cursor-grabbing",
        isDragging && "z-10"
      )}
      {...attributes}
      {...listeners}
    >
      <motion.div
        animate={{ scale: isDragging ? 1.035 : 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        style={{ boxShadow: isDragging ? "0 20px 40px -15px rgba(0,0,0,0.25)" : "none" }}
        className="h-full rounded-xl"
      >
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
            <Link href="/capi/nuovo/foto/fronte">
              <Plus /> Crea capo
            </Link>
          </Button>
        </div>
      </div>

      {layout.length === 0 && !editing ? (
        <EmptyState
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
            <div className="mt-6 grid grid-flow-dense grid-cols-1 gap-6 lg:grid-cols-4 lg:[grid-auto-rows:minmax(180px,auto)]">
              {layout.map((key) => (
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
