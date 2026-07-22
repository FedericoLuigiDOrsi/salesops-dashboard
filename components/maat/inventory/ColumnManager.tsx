"use client";

import { useState } from "react";
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, ChevronDown, Columns3, GripVertical, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { COLUMN_DEFS, type ColumnKey } from "@/lib/inventory-columns";
import { useInventoryColumns } from "@/lib/inventory-columns-store";

/** Riga trascinabile della lista "Visibili". */
function SortableColumnRow({ column, onHide }: { column: ColumnKey; onHide: (k: ColumnKey) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]",
        isDragging ? "bg-background shadow-sm" : "hover:bg-foreground/[.03]"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground/50 active:cursor-grabbing"
        aria-label={`Trascina ${COLUMN_DEFS[column].label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      <span className="flex-1">{COLUMN_DEFS[column].label}</span>
      <button
        type="button"
        onClick={() => onHide(column)}
        className="text-muted-foreground/60 hover:text-foreground"
        aria-label={`Nascondi ${COLUMN_DEFS[column].label}`}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function ColumnManager() {
  const {
    activePreset,
    presets,
    visibleColumns,
    hiddenColumns,
    setActivePreset,
    reorderVisible,
    showColumn,
    hideColumn,
    savePreset,
    renamePreset,
    deletePreset,
  } = useInventoryColumns();

  const [savingName, setSavingName] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = visibleColumns.indexOf(active.id as ColumnKey);
    const to = visibleColumns.indexOf(over.id as ColumnKey);
    if (from < 0 || to < 0) return;
    reorderVisible(arrayMove(visibleColumns, from, to));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-[13px] font-semibold text-foreground transition-[box-shadow,border-color] duration-200 hover:border-border-strong hover:shadow-e1 data-[state=open]:border-primary data-[state=open]:ring-[3px] data-[state=open]:ring-primary/45 [&>svg:last-child]:text-muted-foreground [&>svg:last-child]:transition-transform [&>svg:last-child]:duration-200 data-[state=open]:[&>svg:last-child]:rotate-180"
        >
          <Columns3 className="size-4" />
          <span>
            Colonne · <span className="font-mono">{activePreset.name}</span>
          </span>
          <ChevronDown className="size-[15px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[420px] p-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Visibili */}
          <div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">Visibili</p>
            {/* Capo: pinnata, fuori dal drag */}
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] opacity-70">
              <Lock className="size-3 text-muted-foreground/50" />
              <span className="flex-1">{COLUMN_DEFS.capo.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground/50">fissa</span>
            </div>
            <DndContext
              id="inventory-columns"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={visibleColumns} strategy={verticalListSortingStrategy}>
                {visibleColumns.map((col) => (
                  <SortableColumnRow key={col} column={col} onHide={hideColumn} />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Nascoste */}
          <div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">Nascoste</p>
            {hiddenColumns.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground/50">Tutte visibili</p>
            ) : (
              hiddenColumns.map((col) => (
                <div key={col} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-foreground/[.03]">
                  <span className="flex-1 text-muted-foreground">{COLUMN_DEFS[col].label}</span>
                  <button
                    type="button"
                    onClick={() => showColumn(col)}
                    className="text-muted-foreground/60 hover:text-foreground"
                    aria-label={`Mostra ${COLUMN_DEFS[col].label}`}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Barra preset */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Select value={activePreset.id} onValueChange={setActivePreset}>
            <SelectTrigger size="sm" className="w-36" aria-label="Preset colonne">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {savingName === null ? (
            <Button variant="ghost" size="sm" onClick={() => setSavingName("")}>
              Salva come…
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                value={savingName}
                onChange={(e) => setSavingName(e.target.value)}
                placeholder="Nome preset"
                className="h-8 w-32"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && savingName.trim()) {
                    savePreset(savingName);
                    setSavingName(null);
                  }
                  if (e.key === "Escape") setSavingName(null);
                }}
              />
              <Button
                size="sm"
                className="h-8 px-2"
                disabled={!savingName.trim()}
                onClick={() => {
                  savePreset(savingName);
                  setSavingName(null);
                }}
                aria-label="Conferma salvataggio preset"
              >
                <Check className="size-3.5" />
              </Button>
            </div>
          )}

          {!activePreset.builtIn && savingName === null && (
            <div className="ml-auto flex items-center gap-1">
              {renaming ? (
                <div className="flex items-center gap-1">
                  <Input
                    autoFocus
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                    className="h-8 w-28"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && renameName.trim()) {
                        renamePreset(activePreset.id, renameName);
                        setRenaming(false);
                      }
                      if (e.key === "Escape") setRenaming(false);
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-8 px-2"
                    disabled={!renameName.trim()}
                    onClick={() => {
                      renamePreset(activePreset.id, renameName);
                      setRenaming(false);
                    }}
                    aria-label="Conferma rinomina preset"
                  >
                    <Check className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => {
                      setRenameName(activePreset.name);
                      setRenaming(true);
                    }}
                    aria-label="Rinomina preset"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-destructive hover:text-destructive"
                    onClick={() => deletePreset(activePreset.id)}
                    aria-label="Elimina preset"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
