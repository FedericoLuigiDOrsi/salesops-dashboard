"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, LayoutGrid, Table2, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatTile } from "@/components/maat/StatTile";
import { SegmentedFilter } from "@/components/maat/SegmentedFilter";
import { CatalogCard } from "@/components/maat/CatalogCard";
import { CatalogTable } from "@/components/maat/CatalogTable";
import { CatalogKanban } from "@/components/maat/CatalogKanban";
import { EmptyState } from "@/components/maat/EmptyState";
import { ConfirmedFloatingCard } from "@/components/maat/ConfirmedFloatingCard";
import { mockCatalogEntries } from "@/lib/maat-mock";
import { catalogCounts } from "@/lib/catalog-stats";
import {
  OPERATION_PRESETS,
  DEFAULT_PRESET,
  getPreset,
  type PresetValue,
  type ViewMode,
} from "@/lib/catalog-presets";

const PRESET_OPTIONS = OPERATION_PRESETS.map((p) => ({ value: p.value, label: p.label }));

const VIEW_OPTIONS: { value: ViewMode; label: string; icon: typeof Table2 }[] = [
  { value: "table", label: "Tabella", icon: Table2 },
  { value: "card", label: "Card", icon: LayoutGrid },
  { value: "kanban", label: "Kanban", icon: Columns3 },
];

function ConfirmedFloatingCardSlot() {
  const router = useRouter();
  const confirmedId = useSearchParams().get("confirmed");
  if (!confirmedId) return null;
  return <ConfirmedFloatingCard id={confirmedId} onDismiss={() => router.replace("/capi")} />;
}

export default function CapiListPage() {
  const [presetValue, setPresetValue] = useState<PresetValue>(DEFAULT_PRESET);
  const [view, setView] = useState<ViewMode>(getPreset(DEFAULT_PRESET).view);
  const [query, setQuery] = useState("");

  const preset = getPreset(presetValue);

  // Cambiando preset la vista torna al default dell'operazione; poi è sovrascrivibile.
  function selectPreset(value: PresetValue) {
    setPresetValue(value);
    setView(getPreset(value).view);
  }

  const counts = catalogCounts();

  const filteredEntries = useMemo(() => {
    const scoped =
      preset.statuses === null
        ? mockCatalogEntries
        : mockCatalogEntries.filter((e) => preset.statuses!.includes(e.status));
    const sorted = [...scoped].sort((a, b) =>
      preset.sort === "createdAtAsc"
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt)
    );
    const q = query.trim().toLowerCase();
    if (q.length === 0) return sorted;
    return sorted.filter(
      (entry) =>
        entry.attributes.brand.toLowerCase().includes(q) ||
        entry.attributes.tipoCapo.toLowerCase().includes(q) ||
        (entry.sku ?? "").toLowerCase().includes(q)
    );
  }, [preset, query]);

  const isEmpty = filteredEntries.length === 0;
  const isGlobalEmpty = mockCatalogEntries.length === 0;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Catalogo
          </p>
          <h1 className="text-[28px] font-bold tracking-tight">Capi</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cerca brand, tipo, SKU"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-56 rounded-full pl-9"
            />
          </div>
          <Button asChild>
            <a href="/capi/nuovo/foto/fronte">
              <Plus />
              Crea capo
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile number={counts.totale} label="Totale" />
        <StatTile number={counts.bozze} label="Bozze" attention={counts.bozze > 0} />
        <StatTile number={counts.confermati} label="Confermati" />
        <StatTile number={counts.locali} label="Locali" />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <SegmentedFilter options={PRESET_OPTIONS} active={presetValue} onChange={selectPreset} />
        <div className="inline-flex gap-0.5 rounded-full bg-foreground/[.05] p-[3px]">
          {VIEW_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                view === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2 text-[13px] text-muted-foreground">{preset.hint}</p>

      <div className="mt-5">
        {isGlobalEmpty ? (
          <EmptyState title="Nessun capo ancora" subtitle="Scatta il primo capo per iniziare a catalogare." />
        ) : isEmpty ? (
          <EmptyState
            title={`Nessun capo in "${preset.label}"`}
            subtitle="Cambia operazione o cerca qualcos'altro."
          />
        ) : view === "table" ? (
          <CatalogTable entries={filteredEntries} />
        ) : view === "kanban" ? (
          <CatalogKanban entries={filteredEntries} statuses={preset.statuses ?? undefined} />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6">
            {filteredEntries.map((entry) => (
              <CatalogCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        <ConfirmedFloatingCardSlot />
      </Suspense>
    </div>
  );
}
