"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Plus, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatEUR } from "@/lib/utils";
import { MARKETPLACE_LABELS, type Marketplace } from "@/types/maat";
import { inventoryItems, type InventoryItem, type InventoryStatus, type PlatformListingState } from "@/lib/inventory-mock";
import { AutomazioniDrawer } from "@/components/maat/inventory/AutomazioniDrawer";

type PlatformKey = Extract<Marketplace, "vinted" | "grailed" | "depop">;
const PLATFORM_KEYS: PlatformKey[] = ["vinted", "grailed", "depop"];

type ViewMode = "table" | "grid";
type StatusFilter = "all" | InventoryStatus;
type PriceBand = "all" | "lt50" | "50-100" | "100-200" | "gt200";
type PlatformFilter = "all" | PlatformKey;

const CATEGORY_OPTIONS = ["Capospalla", "Giacche", "Pantaloni", "Camicie", "Maglieria", "Scarpe", "Accessori"] as const;
const SIZE_OPTIONS = ["S", "M", "L", "XL", "W32", "42", "Unica"] as const;

const PRICE_OPTIONS: { value: PriceBand; label: string }[] = [
  { value: "all", label: "Tutti" },
  { value: "lt50", label: "< 50 €" },
  { value: "50-100", label: "50–100 €" },
  { value: "100-200", label: "100–200 €" },
  { value: "gt200", label: "> 200 €" },
];

const STATUS_SEGMENTS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tutti" },
  { value: "bozza", label: "Bozze" },
  { value: "catalogo", label: "A catalogo" },
  { value: "venduto", label: "Venduti" },
];

const STATUS_LABEL: Record<InventoryStatus, string> = {
  bozza: "Bozza",
  catalogo: "A catalogo",
  venduto: "Venduto",
};

const STATUS_CLASS: Record<InventoryStatus, string> = {
  bozza: "border-transparent bg-primary/20 text-[#7a7000]",
  catalogo: "border-transparent bg-[color-mix(in_oklab,var(--chart-2)_16%,transparent)] text-[var(--chart-2)]",
  venduto: "border-transparent bg-muted text-muted-foreground",
};

const PLATFORM_STATE_CLASS: Record<NonNullable<PlatformListingState>, string> = {
  active: "bg-[color-mix(in_oklab,var(--chart-2)_16%,transparent)] text-[var(--chart-2)]",
  pending: "bg-primary/20 text-[#7a7000]",
  delisted: "bg-muted text-muted-foreground",
  sold: "bg-foreground text-background",
};

function matchesPrice(cents: number, band: PriceBand) {
  const eur = cents / 100;
  switch (band) {
    case "lt50":
      return eur < 50;
    case "50-100":
      return eur >= 50 && eur <= 100;
    case "100-200":
      return eur > 100 && eur <= 200;
    case "gt200":
      return eur > 200;
    default:
      return true;
  }
}

function matchesBase(
  item: InventoryItem,
  filters: { search: string; category: string; size: string; price: PriceBand; platform: PlatformFilter }
) {
  const { search, category, size, price, platform } = filters;
  if (search) {
    const needle = search.trim().toLowerCase();
    const haystack = `${item.brand} ${item.tipoCapo} ${item.sku}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  if (category !== "all" && item.category !== category) return false;
  if (size !== "all" && item.size !== size) return false;
  if (!matchesPrice(item.priceCents, price)) return false;
  if (platform !== "all" && item.platforms[platform] === null) return false;
  return true;
}

function PlatformPills({ platforms }: { platforms: InventoryItem["platforms"] }) {
  const listed = PLATFORM_KEYS.filter((key) => platforms[key] !== null);
  if (listed.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {listed.map((key) => {
        const state = platforms[key];
        if (!state) return null;
        return (
          <span
            key={key}
            title={`${MARKETPLACE_LABELS[key]} · ${state}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold",
              PLATFORM_STATE_CLASS[state]
            )}
          >
            {MARKETPLACE_LABELS[key][0]}
          </span>
        );
      })}
    </div>
  );
}

export function InventoryView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [view, setView] = useState<ViewMode>("table");
  const [category, setCategory] = useState("all");
  const [size, setSize] = useState("all");
  const [price, setPrice] = useState<PriceBand>("all");
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [automazioniOpen, setAutomazioniOpen] = useState(false);

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

      {/* toolbar: ricerca + segmented stato/vista */}
      <div className="flex flex-col gap-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per brand, tipo o SKU…"
              aria-label="Cerca"
              className="pl-8"
            />
          </div>

          <div className="ml-auto inline-flex flex-wrap rounded-md border border-border p-0.5">
            {STATUS_SEGMENTS.map((s) => (
              <button
                key={s.value}
                type="button"
                aria-pressed={statusFilter === s.value}
                onClick={() => setStatusFilter(s.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                  statusFilter === s.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0 text-[11px] font-mono",
                    statusFilter === s.value ? "bg-primary-foreground/20" : "bg-muted"
                  )}
                >
                  {statusCounts[s.value]}
                </span>
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-md border border-border p-0.5">
            <button
              type="button"
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="size-3.5" /> Tabella
            </button>
            <button
              type="button"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-3.5" /> Griglia
            </button>
          </div>
        </div>

        {/* riga filtri */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Categoria
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger size="sm" className="w-36" aria-label="Categoria">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Taglia
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger size="sm" className="w-24" aria-label="Taglia">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                {SIZE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Prezzo
            <Select value={price} onValueChange={(v) => setPrice(v as PriceBand)}>
              <SelectTrigger size="sm" className="w-28" aria-label="Prezzo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICE_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Piattaforma
            <Select value={platform} onValueChange={(v) => setPlatform(v as PlatformFilter)}>
              <SelectTrigger size="sm" className="w-28" aria-label="Piattaforma">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                {PLATFORM_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {MARKETPLACE_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Azzera
            </Button>
          )}

          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} capi</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nessun capo corrisponde ai filtri selezionati.
        </div>
      ) : view === "table" ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capo</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Taglia</TableHead>
                <TableHead>Prezzo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Piattaforme</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.brand}</div>
                    <div className="text-xs text-muted-foreground">{item.tipoCapo}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.sku}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.size}</TableCell>
                  <TableCell className="font-mono text-sm">{formatEUR(item.priceCents)}</TableCell>
                  <TableCell>
                    <Badge className={cn("text-[11px]", STATUS_CLASS[item.status])}>{STATUS_LABEL[item.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <PlatformPills platforms={item.platforms} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{item.brand}</div>
                  <div className="truncate text-xs text-muted-foreground">{item.tipoCapo}</div>
                </div>
                <Badge className={cn("shrink-0 text-[11px]", STATUS_CLASS[item.status])}>{STATUS_LABEL[item.status]}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {item.category} · {item.size}
                </span>
                <span className="font-mono text-sm font-semibold text-foreground">{formatEUR(item.priceCents)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 border-t border-border pt-2">
                <span className="font-mono text-[11px] text-muted-foreground">{item.sku}</span>
                <PlatformPills platforms={item.platforms} />
              </div>
            </div>
          ))}
        </div>
      )}

      <AutomazioniDrawer open={automazioniOpen} onOpenChange={setAutomazioniOpen} />
    </div>
  );
}
