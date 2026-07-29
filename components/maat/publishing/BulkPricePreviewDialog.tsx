"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatEUR } from "@/lib/utils";
import type { BulkPricePreviewRow } from "@/lib/publishing-bulk";

interface BulkPricePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: (BulkPricePreviewRow & { label: string })[];
  onConfirm: () => void;
}

export function BulkPricePreviewDialog({ open, onOpenChange, rows, onConfirm }: BulkPricePreviewDialogProps) {
  function handleConfirm() {
    onConfirm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conferma variazione prezzo</DialogTitle>
          <DialogDescription>{rows.length} capi interessati. Verifica prima di applicare.</DialogDescription>
        </DialogHeader>

        <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
              <span className="truncate text-muted-foreground">{row.label}</span>
              <span className="flex items-center gap-1.5 font-mono tabular-nums">
                <span className="text-muted-foreground line-through">{formatEUR(row.beforeCents)}</span>
                <span className="font-semibold text-foreground">{formatEUR(row.afterCents)}</span>
              </span>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Applica a {rows.length} capi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
