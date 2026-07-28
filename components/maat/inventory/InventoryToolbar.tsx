"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { LayoutGrid, List, Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MARKETPLACE_LABELS } from "@/types/maat";
import { PLATFORM_KEYS } from "@/lib/inventory-columns";
import { ColumnManager } from "@/components/maat/inventory/ColumnManager";
import {
  CATEGORY_OPTIONS,
  PRICE_OPTIONS,
  SIZE_OPTIONS,
  STATUS_SEGMENTS,
  type PlatformFilter,
  type PriceBand,
  type StatusFilter,
  type ViewMode,
} from "@/lib/inventory-filters";

interface InventoryToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  statusCounts: Record<StatusFilter, number>;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  size: string;
  onSizeChange: (v: string) => void;
  price: PriceBand;
  onPriceChange: (v: PriceBand) => void;
  platform: PlatformFilter;
  onPlatformChange: (v: PlatformFilter) => void;
  resultCount: number;
  hasActiveFilters: boolean;
  onReset: () => void;
}

const OVERLINE = "font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-muted-foreground";

/** Segmento di stato con indicatore pill che scorre dietro alla voce attiva. */
function StatusSegment({
  active,
  counts,
  onChange,
}: {
  active: StatusFilter;
  counts: Record<StatusFilter, number>;
  onChange: (v: StatusFilter) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<{ left: number; width: number } | null>(null);

  // misura la voce attiva e riposiziona l'indicatore; ri-misura su cambio stato,
  // conteggi (la larghezza del badge cambia) e resize della track.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const el = track.querySelector<HTMLElement>('[data-active="true"]');
      if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [active, counts]);

  return (
    <div
      ref={trackRef}
      className="relative inline-flex items-center gap-0.5 rounded-full bg-secondary p-1"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-0 rounded-full bg-foreground shadow-[0_2px_8px_rgba(0,31,63,.20)] transition-[transform,width] duration-[380ms] ease-[cubic-bezier(.22,1,.36,1)]"
        style={ind ? { width: ind.width, transform: `translateX(${ind.left}px)` } : { width: 0, opacity: 0 }}
      />
      {STATUS_SEGMENTS.map((s) => {
        const on = active === s.value;
        return (
          <button
            key={s.value}
            type="button"
            aria-pressed={on}
            data-active={on}
            onClick={() => onChange(s.value)}
            className={cn(
              "relative z-10 inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition-colors duration-200",
              on ? "font-bold text-text-on-dark" : "font-medium text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
            <span
              className={cn(
                "inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 font-mono text-xs font-semibold tabular-nums transition-colors duration-200",
                on ? "bg-[rgba(246,247,237,.20)] text-text-on-dark" : "bg-card text-muted-foreground"
              )}
            >
              {counts[s.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Toggle Tabella / Griglia sulla stessa pill-track. */
function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const items: { value: ViewMode; label: string; Icon: typeof List }[] = [
    { value: "table", label: "Tabella", Icon: List },
    { value: "grid", label: "Griglia", Icon: LayoutGrid },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-secondary p-1">
      {items.map(({ value, label, Icon }) => {
        const on = view === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] transition-colors duration-200",
              on ? "bg-foreground font-semibold text-text-on-dark" : "font-medium text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-[17px]" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Select attributo: overline mono + trigger a slot con dropdown animato (shadcn/Radix). */
function AttributeSelect({
  label,
  value,
  defaultValue,
  options,
  onChange,
}: {
  label: string;
  value: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const isDefault = value === defaultValue;
  return (
    <div className="flex items-center gap-2.5">
      <span className={OVERLINE}>{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-label={label}
          className={cn(
            "min-w-[116px] gap-2 rounded-[10px] bg-card px-3 font-mono text-[13px] text-foreground shadow-none",
            "[&>svg:last-child]:opacity-100 [&>svg:last-child]:transition-transform [&>svg:last-child]:duration-200",
            "data-[state=open]:border-primary data-[state=open]:ring-[3px] data-[state=open]:ring-primary/45 data-[state=open]:[&>svg:last-child]:rotate-180",
            isDefault ? "border-border" : "border-[rgba(0,31,63,.28)]"
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl shadow-e2">
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <SelectItem
                key={o.value}
                value={o.value}
                className={cn(
                  "rounded-lg font-mono text-[13px]",
                  selected &&
                    "bg-primary font-semibold text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                )}
              >
                {o.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export function InventoryToolbar(props: InventoryToolbarProps) {
  const {
    search,
    onSearchChange,
    statusFilter,
    onStatusChange,
    statusCounts,
    view,
    onViewChange,
    category,
    onCategoryChange,
    size,
    onSizeChange,
    price,
    onPriceChange,
    platform,
    onPlatformChange,
    resultCount,
    hasActiveFilters,
    onReset,
  } = props;

  const categoryOpts = [
    { value: "all", label: "Tutte" },
    ...CATEGORY_OPTIONS.map((c) => ({ value: c, label: c })),
  ];
  const sizeOpts = [{ value: "all", label: "Tutte" }, ...SIZE_OPTIONS.map((s) => ({ value: s, label: s }))];
  const platformOpts = [
    { value: "all", label: "Tutte" },
    ...PLATFORM_KEYS.map((k) => ({ value: k, label: MARKETPLACE_LABELS[k] })),
  ];

  const priceLabel = PRICE_OPTIONS.find((p) => p.value === price)?.label ?? "";
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (search.trim()) chips.push({ key: "q", label: `“${search.trim()}”`, onRemove: () => onSearchChange("") });
  if (category !== "all") chips.push({ key: "cat", label: `Categoria · ${category}`, onRemove: () => onCategoryChange("all") });
  if (size !== "all") chips.push({ key: "size", label: `Taglia · ${size}`, onRemove: () => onSizeChange("all") });
  if (price !== "all") chips.push({ key: "price", label: `Prezzo · ${priceLabel}`, onRemove: () => onPriceChange("all") });
  if (platform !== "all")
    chips.push({ key: "plat", label: MARKETPLACE_LABELS[platform], onRemove: () => onPlatformChange("all") });

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-e1">
      {/* fascia primaria: ricerca · stato · vista */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
        <div className="group flex w-full items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 transition-[width,box-shadow,border-color] duration-300 ease-[cubic-bezier(.22,1,.36,1)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(219,230,76,.45)] sm:w-[300px] sm:focus-within:w-[440px]">
          <Search className="size-[18px] shrink-0 text-foreground/45" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cerca per brand, tipo o SKU…"
            aria-label="Cerca"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40 [&::-webkit-search-cancel-button]:appearance-none"
          />
        </div>

        <div className="hidden flex-1 sm:block" />

        <StatusSegment active={statusFilter} counts={statusCounts} onChange={onStatusChange} />
        <div className="hidden h-[26px] w-px bg-border sm:block" />
        <ViewToggle view={view} onChange={onViewChange} />
      </div>

      <div className="h-px bg-border" />

      {/* fascia secondaria: filtri attributo · colonne · contatore */}
      <div className="flex flex-wrap items-center gap-x-[18px] gap-y-3 px-5 py-3.5">
        <AttributeSelect label="Categoria" value={category} defaultValue="all" options={categoryOpts} onChange={onCategoryChange} />
        <AttributeSelect label="Taglia" value={size} defaultValue="all" options={sizeOpts} onChange={onSizeChange} />
        <AttributeSelect
          label="Prezzo"
          value={price}
          defaultValue="all"
          options={PRICE_OPTIONS}
          onChange={(v) => onPriceChange(v as PriceBand)}
        />
        <AttributeSelect
          label="Piattaforma"
          value={platform}
          defaultValue="all"
          options={platformOpts}
          onChange={(v) => onPlatformChange(v as PlatformFilter)}
        />

        {view === "table" && <ColumnManager />}

        <div className="flex items-baseline gap-1.5 font-mono tabular-nums sm:ml-auto">
          <span className="inline-block overflow-hidden">
            <span key={resultCount} className="inline-block animate-tick text-[21px] font-semibold text-foreground">
              {resultCount}
            </span>
          </span>
          <span className="text-[13px] text-muted-foreground">capi</span>
        </div>
      </div>

      {/* riga chip filtri attivi */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 px-5 pb-4">
          <span className={OVERLINE}>Filtri attivi</span>
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={c.onRemove}
              className="inline-flex animate-chip-in items-center gap-1.5 rounded-full border border-border bg-card py-1.5 pl-3 pr-2.5 text-[12.5px] font-medium text-foreground transition-colors hover:border-primary hover:bg-accent-soft"
            >
              <span>{c.label}</span>
              <X className="size-3.5 text-muted-foreground" />
            </button>
          ))}
          <button
            type="button"
            onClick={onReset}
            className="px-1 py-1.5 text-[12.5px] font-semibold text-muted-foreground underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
          >
            Azzera tutto
          </button>
        </div>
      )}
    </div>
  );
}
