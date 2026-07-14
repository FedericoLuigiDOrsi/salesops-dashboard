import { CatalogCard } from "@/components/maat/CatalogCard";
import type { CatalogEntry, CatalogEntryStatus } from "@/types/maat";

// Vista kanban per status — estensione confermata con Federico il 2026-07-06,
// non nel brief originale. Colonne sui 3 valori di CatalogEntry.status; il preset
// operazione può restringerle passando `statuses` (fallback: tutte e 3).
const COLUMNS: { status: CatalogEntryStatus; label: string }[] = [
  { status: "local_draft", label: "Locale" },
  { status: "to_be_reviewed", label: "Bozza" },
  { status: "available", label: "Confermato" },
];

interface CatalogKanbanProps {
  entries: CatalogEntry[];
  statuses?: CatalogEntryStatus[];
}

// Classi Tailwind letterali (il JIT non vede le interpolazioni dinamiche).
const GRID_COLS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
};

export function CatalogKanban({ entries, statuses }: CatalogKanbanProps) {
  const columns = statuses ? COLUMNS.filter((c) => statuses.includes(c.status)) : COLUMNS;
  const gridCols = GRID_COLS[columns.length] ?? "sm:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 gap-4 ${gridCols}`}>
      {columns.map((column) => {
        const columnEntries = entries.filter((e) => e.status === column.status);
        return (
          <div key={column.status} className="flex flex-col gap-3 rounded-lg bg-foreground/[.03] p-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[13px] font-semibold">{column.label}</span>
              <span className="font-mono text-xs text-muted-foreground">{columnEntries.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {columnEntries.map((entry) => (
                <CatalogCard key={entry.id} entry={entry} variant="row" />
              ))}
              {columnEntries.length === 0 && (
                <p className="px-1 py-2 text-[12px] text-muted-foreground/70">Nessun capo</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
