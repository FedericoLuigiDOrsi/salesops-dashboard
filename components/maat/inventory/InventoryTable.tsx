"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants, useReducedMotion } from "framer-motion";
import { ArrowUp, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/maat/StatusBadge";
import { ChannelDots } from "@/components/maat/inventory/ChannelDots";
import {
  RowCheckbox,
  RowHoverActions,
  RowActionButton,
  SortHeaderCell,
  TABLE_CARD_CLASS,
} from "@/components/maat/table/TableChrome";
import { formatEUR } from "@/lib/utils";
import type { InventoryItem, InventoryStatus } from "@/lib/inventory-mock";
import { COLUMN_DEFS, type ColumnKey, type PlatformKey } from "@/lib/inventory-columns";
import { useInventoryColumns } from "@/lib/inventory-columns-store";
import { itemHref } from "@/lib/inventory-nav";
import { EmptyState } from "@/components/maat/EmptyState";

// Larghezza fissa per colonna (px) o flessibile per "capo" (spec design handoff).
// "sku" non è nello spec ma resta configurabile: eredita la larghezza di "stato".
const COLUMN_WIDTH: Record<ColumnKey, string> = {
  capo: "minmax(220px,1.5fr)",
  stato: "132px",
  sku: "132px",
  categoria: "118px",
  taglia: "84px",
  piattaforme: "112px",
  prezzo: "92px",
};

const COLUMN_ALIGN: Partial<Record<ColumnKey, "right">> = { prezzo: "right" };

// Il design handoff chiama questa colonna "Canali" (ChannelDots); altrove nell'app
// (ColumnManager, vista Griglia) resta "Piattaforme" — override solo di visualizzazione.
const COLUMN_LABEL: Partial<Record<ColumnKey, string>> = { piattaforme: "Canali" };

function columnLabel(key: ColumnKey) {
  return COLUMN_LABEL[key] ?? COLUMN_DEFS[key].label;
}

// Rank per sort colonna Stato: confermato < bozza < venduto (spec design handoff).
// "local_draft" non è nel prototipo: trattato come stadio precedente.
const STATUS_RANK: Record<InventoryStatus, number> = {
  local_draft: 0,
  available: 1,
  to_be_reviewed: 2,
  sold: 3,
};

function publishedCount(item: InventoryItem) {
  return Object.values(item.platforms).filter((s) => s === "active" || s === "sold").length;
}

function compareItems(a: InventoryItem, b: InventoryItem, key: ColumnKey): number {
  switch (key) {
    case "capo":
      return a.brand.localeCompare(b.brand);
    case "stato":
      return STATUS_RANK[a.status] - STATUS_RANK[b.status];
    case "sku":
      return a.sku.localeCompare(b.sku);
    case "categoria":
      return a.category.localeCompare(b.category);
    case "taglia":
      return a.size.localeCompare(b.size);
    case "piattaforme":
      return publishedCount(a) - publishedCount(b);
    case "prezzo":
      return a.priceCents - b.priceCents;
  }
}

/** Stato "venduto" usa una pill scura dedicata (spec), gli altri stati riusano StatusBadge di sistema. */
function StatoCell({ status }: { status: InventoryStatus }) {
  if (status === "sold") {
    return (
      <span
        className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-[5px] font-mono text-[11px] font-semibold uppercase tracking-wide"
        style={{ background: "var(--foreground)", color: "var(--text-on-dark)" }}
      >
        <span className="size-1.5 rounded-full bg-current" />
        Venduto
      </span>
    );
  }
  return <StatusBadge status={status} className="text-[11px]" />;
}

function HeaderRow({
  orderedColumns,
  gridTemplateColumns,
  allSelected,
  onToggleSelectAll,
  sortKey,
  sortDir,
  onSort,
}: {
  orderedColumns: ColumnKey[];
  gridTemplateColumns: string;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  sortKey: ColumnKey | null;
  sortDir: 1 | -1;
  onSort: (key: ColumnKey) => void;
}) {
  return (
    <div className="grid items-center gap-x-3 bg-secondary py-2.5 pl-4 pr-5" style={{ gridTemplateColumns }}>
      <RowCheckbox checked={allSelected} onChange={onToggleSelectAll} ariaLabel="Seleziona tutti" />
      {orderedColumns.map((key) => (
        <SortHeaderCell
          key={key}
          label={columnLabel(key)}
          align={COLUMN_ALIGN[key]}
          active={sortKey === key}
          dir={sortDir}
          onClick={() => onSort(key)}
        />
      ))}
    </div>
  );
}

function ColumnCell({
  columnKey,
  item,
  onToggleChannel,
}: {
  columnKey: ColumnKey;
  item: InventoryItem;
  onToggleChannel: (id: string, platform: PlatformKey) => void;
}): ReactNode {
  switch (columnKey) {
    case "capo":
      return (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-secondary">
            {item.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.photoUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="font-mono text-[7px] uppercase text-muted-foreground/50">Foto</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold tracking-[-.01em] text-foreground">{item.brand}</div>
            <div className="truncate text-xs text-muted-foreground">{item.tipoCapo}</div>
          </div>
        </div>
      );
    case "stato":
      return <StatoCell status={item.status} />;
    case "sku":
      return <span className="truncate font-mono text-[13px] text-muted-foreground">{item.sku}</span>;
    case "categoria":
      return <span className="truncate text-[13px] text-muted-foreground">{item.category}</span>;
    case "taglia":
      return <span className="font-mono text-[13px] text-foreground">{item.size}</span>;
    case "piattaforme":
      return (
        <ChannelDots
          platforms={item.platforms}
          itemStatus={item.status}
          onToggle={(platform) => onToggleChannel(item.id, platform)}
        />
      );
    case "prezzo":
      return <span className="font-mono text-[14px] font-medium text-foreground">{formatEUR(item.priceCents)}</span>;
  }
}

function Row({
  item,
  orderedColumns,
  gridTemplateColumns,
  selected,
  hovered,
  variants,
  onToggleSelect,
  onHoverChange,
  onOpen,
  onDeleteOne,
  onToggleChannel,
}: {
  item: InventoryItem;
  orderedColumns: ColumnKey[];
  gridTemplateColumns: string;
  selected: boolean;
  hovered: boolean;
  variants: Variants;
  onToggleSelect: (id: string) => void;
  onHoverChange: (id: string | null) => void;
  onOpen: (item: InventoryItem) => void;
  onDeleteOne: (id: string) => void;
  onToggleChannel: (id: string, platform: PlatformKey) => void;
}) {
  return (
    // Tutta la riga e' cliccabile: checkbox, ChannelDots e azioni hover fermano la propagazione.
    <motion.div
      variants={variants}
      role="link"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(item);
      }}
      className="relative grid cursor-pointer items-center gap-x-3 border-t border-border py-[9px] pl-4 pr-5"
      style={{ gridTemplateColumns, ...(selected ? { boxShadow: "inset 3px 0 0 var(--primary)" } : {}) }}
      onMouseEnter={() => onHoverChange(item.id)}
      onMouseLeave={() => onHoverChange(null)}
    >
      <RowCheckbox
        checked={selected}
        onChange={() => onToggleSelect(item.id)}
        ariaLabel={`Seleziona ${item.brand} ${item.tipoCapo}`}
      />

      {orderedColumns.map((key) => (
        <div key={key} className={COLUMN_ALIGN[key] === "right" ? "text-right" : undefined}>
          <ColumnCell columnKey={key} item={item} onToggleChannel={onToggleChannel} />
        </div>
      ))}

      {hovered && (
        <RowHoverActions>
          <RowActionButton icon={Pencil} label="Apri" onClick={() => onOpen(item)} />
          <RowActionButton icon={Trash2} label="Elimina" tone="destructive" onClick={() => onDeleteOne(item.id)} />
        </RowHoverActions>
      )}
    </motion.div>
  );
}

function SelectionBar({
  selectedCount,
  onBulkPublish,
  onBulkDelete,
  onClear,
}: {
  selectedCount: number;
  onBulkPublish: () => void;
  onBulkDelete: () => void;
  onClear: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="flex animate-bar-in items-center gap-2 border-b border-border px-5 py-2.5"
      style={{ background: "var(--tint-bozza)" }}
    >
      <span className="font-mono text-[13px] font-bold text-foreground">{selectedCount} selezionati</span>
      <Button size="sm" className="ml-4 gap-1.5" onClick={onBulkPublish}>
        <ArrowUp className="size-3.5" /> Pubblica
      </Button>
      <Button size="sm" variant="ghost">
        Modifica prezzo
      </Button>
      <Button size="sm" variant="destructive" onClick={onBulkDelete}>
        Elimina
      </Button>
      <button
        type="button"
        onClick={onClear}
        aria-label="Deseleziona tutto"
        className="ml-auto flex size-8 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-foreground/10"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

interface InventoryTableProps {
  items: InventoryItem[];
  onPublish: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
  onToggleChannel: (id: string, platform: PlatformKey) => void;
}

export function InventoryTable({ items, onPublish, onDelete, onToggleChannel }: InventoryTableProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const listVariants: Variants = useMemo(
    () => ({ hidden: {}, show: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.04 } } }),
    [shouldReduceMotion]
  );
  const rowVariants: Variants = useMemo(
    () => ({
      hidden: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
      show: {
        opacity: 1,
        y: 0,
        transition: shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 28 },
      },
    }),
    [shouldReduceMotion]
  );
  const { visibleColumns } = useInventoryColumns();
  const orderedColumns = useMemo<ColumnKey[]>(() => ["capo", ...visibleColumns], [visibleColumns]);
  const gridTemplateColumns = useMemo(
    () => ["40px", ...orderedColumns.map((key) => COLUMN_WIDTH[key])].join(" "),
    [orderedColumns]
  );
  const [sortKey, setSortKey] = useState<ColumnKey | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Se la colonna ordinata viene nascosta da ColumnManager, l'ordinamento non ha
  // più senso. Derivato in render invece che azzerato in un effect: così non c'è
  // il frame intermedio in cui la tabella è ancora ordinata su una colonna che
  // non esiste più, e riattivando la colonna l'ordinamento torna com'era.
  const effectiveSortKey = sortKey && orderedColumns.includes(sortKey) ? sortKey : null;

  const sortedItems = useMemo(() => {
    if (!effectiveSortKey) return items;
    return [...items].sort((a, b) => compareItems(a, b, effectiveSortKey) * sortDir);
  }, [items, effectiveSortKey, sortDir]);

  const allSelected = sortedItems.length > 0 && selectedIds.size === sortedItems.length;

  function handleSort(key: ColumnKey) {
    if (effectiveSortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === sortedItems.length ? new Set() : new Set(sortedItems.map((i) => i.id))));
  }

  // I pre-catalogo aprono la Review (meta' operatore del loop P2C), gli altri il dettaglio.
  function handleOpen(item: InventoryItem) {
    router.push(itemHref(item));
  }

  function handleDeleteOne(id: string) {
    onDelete([id]);
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function handleBulkPublish() {
    onPublish([...selectedIds]);
    setSelectedIds(new Set());
  }

  function handleBulkDelete() {
    onDelete([...selectedIds]);
    setSelectedIds(new Set());
  }

  return (
    <div className={TABLE_CARD_CLASS}>
      <SelectionBar
        selectedCount={selectedIds.size}
        onBulkPublish={handleBulkPublish}
        onBulkDelete={handleBulkDelete}
        onClear={() => setSelectedIds(new Set())}
      />

      <HeaderRow
        orderedColumns={orderedColumns}
        gridTemplateColumns={gridTemplateColumns}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        sortKey={effectiveSortKey}
        sortDir={sortDir}
        onSort={handleSort}
      />

      {sortedItems.length === 0 ? (
        <EmptyState tone="no-match" title="Nessun capo con questi filtri" subtitle="Cambia i filtri o azzerali dalla barra qui sopra." />
      ) : (
        <motion.div variants={listVariants} initial="hidden" animate="show">
          {sortedItems.map((item) => (
            <Row
              key={item.id}
              item={item}
              orderedColumns={orderedColumns}
              gridTemplateColumns={gridTemplateColumns}
              selected={selectedIds.has(item.id)}
              hovered={hoveredRowId === item.id}
              variants={rowVariants}
              onToggleSelect={toggleSelected}
              onHoverChange={setHoveredRowId}
              onOpen={handleOpen}
              onDeleteOne={handleDeleteOne}
              onToggleChannel={onToggleChannel}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
