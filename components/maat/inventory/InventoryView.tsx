"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEUR } from "@/lib/utils";
import { inventoryItems, type InventoryItem } from "@/lib/inventory-mock";
import { itemHref } from "@/lib/inventory-nav";
import type { PlatformKey } from "@/lib/inventory-columns";
import { PlatformPills } from "@/components/maat/inventory/PlatformPills";
import { InventoryTable } from "@/components/maat/inventory/InventoryTable";
import { InventoryToolbar } from "@/components/maat/inventory/InventoryToolbar";
import { StatusBadge } from "@/components/maat/StatusBadge";
import { EmptyState } from "@/components/maat/EmptyState";
import { InventoryEmpty } from "@/components/maat/inventory/InventoryEmpty";
import {
  matchesBase,
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

export function InventoryView({
  items: serverItems = inventoryItems,
  loadError = false,
}: { items?: InventoryItem[]; demo?: boolean; loadError?: boolean } = {}) {
  // `serverItems` arriva dal Server Component (dati canonici, o mock in fallback) a ogni
  // richiesta. Lo stato locale serve alle mutazioni ottimistiche (pubblica / elimina /
  // canali): va risincronizzato quando il server rifornisce, altrimenti la lista resta
  // congelata al primo render.
  // Aggiustato durante il render invece che in un effect: React riavvia subito il
  // render con il valore nuovo, senza il commit intermedio in cui la lista mostra
  // ancora i dati vecchi (https://react.dev/reference/react/useState#storing-information-from-previous-renders).
  const [items, setItems] = useState<InventoryItem[]>(serverItems);
  const [lastServerItems, setLastServerItems] = useState(serverItems);
  if (serverItems !== lastServerItems) {
    setLastServerItems(serverItems);
    setItems(serverItems);
  }

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [view, setView] = useState<ViewMode>("table");
  const [category, setCategory] = useState("all");
  const [size, setSize] = useState("all");
  const [price, setPrice] = useState<PriceBand>("all");
  const [platform, setPlatform] = useState<PlatformFilter>("all");

  const baseFilters = { search, category, size, price, platform };

  const baseMatched = useMemo(
    () => items.filter((item) => matchesBase(item, baseFilters)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, search, category, size, price, platform]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: baseMatched.length,
      local_draft: 0,
      to_be_reviewed: 0,
      available: 0,
      sold: 0,
    };
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

  function publishItems(ids: string[]) {
    const idSet = new Set(ids);
    setItems((prev) =>
      prev.map((item) =>
        idSet.has(item.id)
          ? { ...item, status: "available", platforms: { vinted: "active", grailed: "active", depop: "active" } }
          : item
      )
    );
  }

  function deleteItems(ids: string[]) {
    const idSet = new Set(ids);
    setItems((prev) => prev.filter((item) => !idSet.has(item.id)));
  }

  function toggleChannel(id: string, platform: PlatformKey) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const current = item.platforms[platform];
        const published = current === "active" || current === "sold";
        return { ...item, platforms: { ...item.platforms, [platform]: published ? null : "active" } };
      })
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[28px] font-bold tracking-tight">Inventario</h1>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden gap-1.5 md:inline-flex">
            <Link href="/capi/nuovo">
              <Plus className="size-3.5" /> Crea capo
            </Link>
          </Button>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<AlertTriangle className="size-5" />}
            title="Non riusciamo a leggere il catalogo"
            subtitle="La sessione è valida ma la lettura è fallita. Riprova fra poco; se continua, è un problema nostro e non un catalogo vuoto."
          />
        </div>
      ) : items.length === 0 ? (
        <InventoryEmpty />
      ) : (
        <>
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
        onReset={resetFilters}
      />

      {view === "table" ? (
        <InventoryTable
          items={filtered}
          onPublish={publishItems}
          onDelete={deleteItems}
          onToggleChannel={toggleChannel}
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState
            tone="no-match"
            title="Nessun capo con questi filtri"
            subtitle={`Ne hai ${items.length} in tutto. Azzera i filtri per rivederli.`}
            action={
              <Button variant="ghost" size="sm" className="mt-1" onClick={resetFilters}>
                Azzera i filtri
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={itemHref(item)}
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
                  <StatusBadge status={item.status} className="text-[11px]" />
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
        </>
      )}
    </div>
  );
}
