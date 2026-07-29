"use client";

import { useMemo, useState } from "react";
import { MoreVertical, RotateCcw, Ban, Percent, Euro, Layers } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/maat/EmptyState";
import { cn, formatEUR } from "@/lib/utils";
import { isSoldOutEverywhere } from "@/lib/publishing-mock";
import { buildBulkPricePreview, type BulkPriceMode } from "@/lib/publishing-bulk";
import type { InventoryItem } from "@/lib/inventory-mock";
import { MARKETPLACE_LABELS } from "@/types/maat";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/inventory-columns";
import { PlatformPills } from "@/components/maat/inventory/PlatformPills";
import { RepublishSheet } from "@/components/maat/publishing/RepublishSheet";
import { BulkPricePreviewDialog } from "@/components/maat/publishing/BulkPricePreviewDialog";

interface LiveTabProps {
  items: InventoryItem[];
  onRepublish: (ids: string[], platforms: PlatformKey[], priceCents: number | null) => void;
  onDelist: (ids: string[]) => void;
  onBulkPrice: (ids: string[], mode: BulkPriceMode, signedValue: number) => void;
}

export function LiveTab({ items, onRepublish, onDelist, onBulkPrice }: LiveTabProps) {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | PlatformKey>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [republishTarget, setRepublishTarget] = useState<InventoryItem[] | null>(null);
  const [bulkMode, setBulkMode] = useState<BulkPriceMode>("percent");
  const [bulkValueInput, setBulkValueInput] = useState("-10");
  const [previewOpen, setPreviewOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (needle && !`${item.brand} ${item.tipoCapo} ${item.sku}`.toLowerCase().includes(needle)) return false;
      if (platformFilter !== "all" && item.platforms[platformFilter] === null) return false;
      return true;
    });
  }, [items, search, platformFilter]);

  const selectableIds = useMemo(() => new Set(filtered.filter((i) => !isSoldOutEverywhere(i)).map((i) => i.id)), [filtered]);
  const allSelectedOnPage = selectableIds.size > 0 && Array.from(selectableIds).every((id) => selected.has(id));

  function toggleRow(id: string) {
    if (!selectableIds.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allSelectedOnPage) {
        const next = new Set(prev);
        selectableIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...selectableIds]);
    });
  }

  const selectedItems = items.filter((i) => selected.has(i.id));
  const bulkValue = parseFloat(bulkValueInput.replace(",", "."));
  const canPreview = selectedItems.length > 0 && Number.isFinite(bulkValue) && bulkValue !== 0;

  const previewRows = canPreview
    ? buildBulkPricePreview(selectedItems, bulkMode, bulkValue).map((row) => {
        const item = selectedItems.find((i) => i.id === row.id)!;
        return { ...row, label: `${item.brand} — ${item.tipoCapo}` };
      })
    : [];

  function applyBulkPrice() {
    if (!canPreview) return;
    onBulkPrice(Array.from(selected), bulkMode, bulkValue);
    setSelected(new Set());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per brand, tipo o SKU…"
          aria-label="Cerca"
          className="w-full max-w-xs rounded-full border border-border bg-card px-3 py-1.5 text-sm outline-none focus:border-primary sm:w-auto"
        />
        <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v as "all" | PlatformKey)}>
          <SelectTrigger size="sm" className="w-40" aria-label="Piattaforma">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le piattaforme</SelectItem>
            {PLATFORM_KEYS.map((k) => (
              <SelectItem key={k} value={k}>
                {MARKETPLACE_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{filtered.length} capi</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState icon={<Layers className="size-5" />} title="Nessun capo live" subtitle="I capi con almeno un annuncio pubblicato compariranno qui." />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border pb-16">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allSelectedOnPage} onCheckedChange={toggleAll} aria-label="Seleziona tutti" />
                </TableHead>
                <TableHead>Capo</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Prezzo</TableHead>
                <TableHead>Piattaforme</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const soldOut = isSoldOutEverywhere(item);
                return (
                  <TableRow key={item.id} className={cn(soldOut && "opacity-50", selected.has(item.id) && "bg-accent-soft/40")}>
                    <TableCell>
                      <Checkbox checked={selected.has(item.id)} disabled={soldOut} onCheckedChange={() => toggleRow(item.id)} aria-label={`Seleziona ${item.brand}`} />
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">{item.sku}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{formatEUR(item.priceCents)}</span>
                    </TableCell>
                    <TableCell>
                      <PlatformPills platforms={item.platforms} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={soldOut} aria-label="Azioni">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setRepublishTarget([item])}>
                            <RotateCcw className="size-4" /> Ripubblica
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => onDelist([item.id])}>
                            <Ban className="size-4" /> Ritira
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-20 flex justify-center px-4">
          <div className="flex flex-wrap items-center gap-3 rounded-full border border-border bg-foreground px-5 py-3 text-text-on-dark shadow-e2">
            <span className="text-sm font-semibold">{selected.size} capi selezionati</span>
            <div className="h-5 w-px bg-white/20" />

            <div className="flex items-center gap-1.5 rounded-full bg-white/10 p-1">
              <Button
                type="button"
                size="icon-sm"
                variant={bulkMode === "percent" ? "secondary" : "ghost"}
                className="size-7 rounded-full"
                onClick={() => setBulkMode("percent")}
                aria-label="Percentuale"
              >
                <Percent className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant={bulkMode === "amount" ? "secondary" : "ghost"}
                className="size-7 rounded-full"
                onClick={() => setBulkMode("amount")}
                aria-label="Importo fisso"
              >
                <Euro className="size-3.5" />
              </Button>
            </div>
            <Input
              value={bulkValueInput}
              onChange={(e) => setBulkValueInput(e.target.value)}
              inputMode="decimal"
              className="h-8 w-20 border-white/20 bg-transparent text-text-on-dark"
              aria-label="Variazione prezzo"
            />
            <Button size="sm" variant="secondary" disabled={!canPreview} onClick={() => setPreviewOpen(true)}>
              Anteprima
            </Button>

            <div className="h-5 w-px bg-white/20" />
            <Button size="sm" variant="secondary" onClick={() => setRepublishTarget(selectedItems)}>
              Ripubblica selezionati
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelist(Array.from(selected))}>
              Ritira selezionati
            </Button>
          </div>
        </div>
      )}

      {republishTarget && (
        <RepublishSheet
          open={republishTarget !== null}
          onOpenChange={(open) => {
            if (!open) setRepublishTarget(null);
          }}
          items={republishTarget}
          onConfirm={(ids, platforms, priceCents) => {
            onRepublish(ids, platforms, priceCents);
            setSelected(new Set());
          }}
        />
      )}

      <BulkPricePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        rows={previewRows}
        onConfirm={applyBulkPrice}
      />
    </div>
  );
}
