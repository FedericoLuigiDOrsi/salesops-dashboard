"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Layers } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/maat/EmptyState";
import { cn, formatEUR } from "@/lib/utils";
import { getDraftCount } from "@/lib/publishing-mock";
import type { InventoryItem } from "@/lib/inventory-mock";
import { CATEGORY_OPTIONS } from "@/lib/inventory-filters";
import type { PlatformKey } from "@/lib/inventory-columns";
import { PlatformChips } from "@/components/maat/publishing/PlatformChips";

interface ToPublishTabProps {
  items: InventoryItem[];
  allItems: InventoryItem[];
  defaultPlatforms: PlatformKey[];
  onPublish: (ids: string[], platforms: PlatformKey[]) => void;
}

export function ToPublishTab({ items, allItems, defaultPlatforms, onPublish }: ToPublishTabProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [barPlatforms, setBarPlatforms] = useState<PlatformKey[]>(defaultPlatforms);

  const draftCount = useMemo(() => getDraftCount(allItems), [allItems]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (needle && !`${item.brand} ${item.tipoCapo} ${item.sku}`.toLowerCase().includes(needle)) return false;
      if (category !== "all" && item.category !== category) return false;
      return true;
    });
  }, [items, search, category]);

  const filteredIds = useMemo(() => new Set(filtered.map((i) => i.id)), [filtered]);
  const allSelectedOnPage = filtered.length > 0 && filtered.every((i) => selected.has(i.id));

  function toggleRow(id: string) {
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
        filteredIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...filteredIds]);
    });
  }

  function togglePlatform(key: PlatformKey) {
    setBarPlatforms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  function handlePublish() {
    if (selected.size === 0 || barPlatforms.length === 0) return;
    onPublish(Array.from(selected), barPlatforms);
    setSelected(new Set());
  }

  return (
    <div className="flex flex-col gap-4">
      {draftCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{draftCount}</span>{" "}
            {draftCount === 1 ? "capo in bozza non ancora pronto" : "capi in bozza non ancora pronti"} per la pubblicazione.
          </span>
          <Button asChild variant="outline" size="sm">
            <Link href="/inventario?status=to_be_reviewed">Completali in Inventario</Link>
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per brand, tipo o SKU…"
          aria-label="Cerca"
          className="w-full max-w-xs rounded-full border border-border bg-card px-3 py-1.5 text-sm outline-none focus:border-primary sm:w-auto"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger size="sm" className="w-40" aria-label="Categoria">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le categorie</SelectItem>
            {CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{filtered.length} capi</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            icon={<Layers className="size-5" />}
            title="Nessun capo da pubblicare"
            subtitle="I capi a catalogo mai listati su nessuna piattaforma compariranno qui."
          />
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
                <TableHead>Categoria</TableHead>
                <TableHead>Taglia</TableHead>
                <TableHead>Prezzo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className={cn(selected.has(item.id) && "bg-accent-soft/40")}>
                  <TableCell>
                    <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleRow(item.id)} aria-label={`Seleziona ${item.brand}`} />
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
                    <span className="text-sm text-muted-foreground">{item.category}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{item.size}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{formatEUR(item.priceCents)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-20 flex justify-center px-4">
          <div className="flex flex-wrap items-center gap-3 rounded-full border border-border bg-foreground px-5 py-3 text-text-on-dark shadow-e2">
            <span className="text-sm font-semibold">{selected.size} capi selezionati</span>
            <div className="h-5 w-px bg-white/20" />
            <PlatformChips selected={barPlatforms} onToggle={togglePlatform} />
            <Button size="sm" onClick={handlePublish} disabled={barPlatforms.length === 0} className="gap-1.5">
              <Layers className="size-3.5" /> Avvia pubblicazione
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
