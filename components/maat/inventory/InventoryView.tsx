"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatEUR } from "@/lib/utils";
import { inventoryItems, type InventoryItem } from "@/lib/inventory-mock";
import { AutomazioniDrawer } from "@/components/maat/inventory/AutomazioniDrawer";
import { COLUMN_DEFS, type ColumnKey } from "@/lib/inventory-columns";
import { PlatformPills } from "@/components/maat/inventory/PlatformPills";
import { useInventoryColumns } from "@/lib/inventory-columns-store";
import { InventoryToolbar } from "@/components/maat/inventory/InventoryToolbar";
import {
  matchesBase,
  STATUS_CLASS,
  STATUS_LABEL,
  type PlatformFilter,
  type PriceBand,
  type StatusFilter,
  type ViewMode,
} from "@/lib/inventory-filters";

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-0.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground/55">{children}</div>
  );
}

export function InventoryView() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [view, setView] = useState<ViewMode>("table");
  const [category, setCategory] = useState("all");
  const [size, setSize] = useState("all");
  const [price, setPrice] = useState<PriceBand>("all");
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [automazioniOpen, setAutomazioniOpen] = useState(false);
  const { visibleColumns } = useInventoryColumns();

  const baseFilters = { search, category, size, price, platform };

  const baseMatched = useMemo(
    () => inventoryItems.filter((item) => matchesBase(item, baseFilters)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, category, size, price, platform]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = { all: baseMatched.length, bozza: 0, catalogo: 0, venduto: 0 };
    for (const item of baseMatched) counts[item.status] += 1;
    return counts;
  }, [baseMatched]);

  const filtered = useMemo(
    () => baseMatched.filter((item) => statusFilter === "all" || item.status === statusFilter),
    [baseMatched, statusFilter]
  );

  function resetFilters() {
    setSearch("");
    setCategory("all");
    setSize("all");
    setPrice("all");
    setPlatform("all");
  }

  const hasActiveFilters = search !== "" || category !== "all" || size !== "all" || price !== "all" || platform !== "all";

  const renderCell: Record<ColumnKey, (item: InventoryItem) => ReactNode> = {
    capo: (item) => (
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
          {item.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.photoUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="font-mono text-[7px] uppercase text-muted-foreground/50">Foto</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate font-medium">{item.brand}</div>
          <div className="truncate text-xs text-muted-foreground">{item.tipoCapo}</div>
        </div>
      </div>
    ),
    stato: (item) => (
      <Badge className={cn("text-[11px]", STATUS_CLASS[item.status])}>{STATUS_LABEL[item.status]}</Badge>
    ),
    sku: (item) => <span className="font-mono text-xs text-muted-foreground">{item.sku}</span>,
    categoria: (item) => <span className="text-sm text-muted-foreground">{item.category}</span>,
    taglia: (item) => <span className="text-sm text-muted-foreground">{item.size}</span>,
    prezzo: (item) => <span className="font-mono text-sm">{formatEUR(item.priceCents)}</span>,
    piattaforme: (item) => <PlatformPills platforms={item.platforms} />,
  };

  const orderedColumns: ColumnKey[] = ["capo", ...visibleColumns];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Inventario · Capi · Listing &amp; stock
          </p>
          <h1 className="text-[28px] font-bold tracking-tight">Inventario</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Catalogo capi e stato di pubblicazione uniti in un&apos;unica vista. Filtra, cambia visualizzazione o aggiungi un nuovo
            capo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => setAutomazioniOpen(true)}>
            <Zap className="size-3.5" /> Automazioni
          </Button>
          <Button asChild className="hidden gap-1.5 md:inline-flex">
            <Link href="/capi/nuovo/foto/fronte">
              <Plus className="size-3.5" /> Crea capo
            </Link>
          </Button>
        </div>
      </div>

      <InventoryToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusCounts={statusCounts}
        view={view}
        onViewChange={setView}
        category={category}
        onCategoryChange={setCategory}
        size={size}
        onSizeChange={setSize}
        price={price}
        onPriceChange={setPrice}
        platform={platform}
        onPlatformChange={setPlatform}
        resultCount={filtered.length}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nessun capo corrisponde ai filtri selezionati.
        </div>
      ) : view === "table" ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                {orderedColumns.map((col) => (
                  <TableHead key={col}>{COLUMN_DEFS[col].label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow
                  key={item.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/capi/${item.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(`/capi/${item.id}`);
                  }}
                  className="cursor-pointer hover:bg-muted/40"
                >
                  {orderedColumns.map((col) => (
                    <TableCell key={col}>{renderCell[col](item)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={`/capi/${item.id}`}
              className="flex overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/25"
            >
              {/* foto laterale a piena altezza */}
              <div className="flex w-[110px] shrink-0 items-center justify-center border-r border-border bg-background">
                {item.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photoUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-center font-mono text-[9px] uppercase tracking-wide text-muted-foreground/50">
                    Foto
                    <br />
                    fronte
                  </span>
                )}
              </div>

              {/* campi in griglia label/valore a due colonne */}
              <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-2 p-4">
                <div className="col-span-2">
                  <FieldLabel>Capo</FieldLabel>
                  <div className="truncate text-[15px] font-semibold">
                    {item.brand} — {item.tipoCapo}
                  </div>
                </div>
                <div>
                  <FieldLabel>SKU</FieldLabel>
                  <div className="font-mono text-xs text-muted-foreground">{item.sku}</div>
                </div>
                <div>
                  <FieldLabel>Stato</FieldLabel>
                  <Badge className={cn("text-[11px]", STATUS_CLASS[item.status])}>{STATUS_LABEL[item.status]}</Badge>
                </div>
                <div>
                  <FieldLabel>Categoria</FieldLabel>
                  <div className="text-sm text-muted-foreground">{item.category}</div>
                </div>
                <div>
                  <FieldLabel>Taglia</FieldLabel>
                  <div className="text-sm text-muted-foreground">{item.size}</div>
                </div>
                <div>
                  <FieldLabel>Prezzo</FieldLabel>
                  <div className="font-mono text-sm font-semibold">{formatEUR(item.priceCents)}</div>
                </div>
                <div>
                  <FieldLabel>Piattaforme</FieldLabel>
                  <PlatformPills platforms={item.platforms} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <AutomazioniDrawer open={automazioniOpen} onOpenChange={setAutomazioniOpen} />
    </div>
  );
}
