// components/maat/publishing/RepublishSheet.tsx
"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEUR } from "@/lib/utils";
import type { InventoryItem } from "@/lib/inventory-mock";
import type { PlatformKey } from "@/lib/inventory-columns";
import { PlatformChips } from "@/components/maat/publishing/PlatformChips";

interface RepublishSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  onConfirm: (ids: string[], platforms: PlatformKey[], priceCents: number | null) => void;
}

export function RepublishSheet({ open, onOpenChange, items, onConfirm }: RepublishSheetProps) {
  const isSingle = items.length === 1;
  const [priceInput, setPriceInput] = useState("");
  const [platforms, setPlatforms] = useState<PlatformKey[]>([]);

  useEffect(() => {
    if (!open) return;
    setPriceInput(isSingle ? (items[0].priceCents / 100).toFixed(2) : "");
    const listed = new Set<PlatformKey>();
    for (const item of items) {
      (Object.keys(item.platforms) as PlatformKey[]).forEach((key) => {
        if (item.platforms[key] !== null) listed.add(key);
      });
    }
    setPlatforms(Array.from(listed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function togglePlatform(key: PlatformKey) {
    setPlatforms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  function handleConfirm() {
    if (platforms.length === 0) return;
    const parsed = priceInput.trim() ? Math.round(parseFloat(priceInput.replace(",", ".")) * 100) : null;
    onConfirm(
      items.map((i) => i.id),
      platforms,
      isSingle && Number.isFinite(parsed) ? parsed : null
    );
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="gap-1.5 border-b border-border">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Pubblicazione · Ripubblica
          </p>
          <SheetTitle className="text-xl">
            {isSingle ? items[0].brand : `${items.length} capi selezionati`}
          </SheetTitle>
          <SheetDescription>
            {isSingle
              ? `${items[0].tipoCapo} · ${formatEUR(items[0].priceCents)}`
              : "Il prezzo si aggiorna solo se lo modifichi; le piattaforme si applicano a tutti i capi selezionati."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 p-4">
          {isSingle && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="republish-price">Prezzo</Label>
              <Input
                id="republish-price"
                inputMode="decimal"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="0,00"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Piattaforme target</Label>
            <PlatformChips selected={platforms} onToggle={togglePlatform} />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={platforms.length === 0}>
            Ripubblica
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
