"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shipments } from "@/lib/logistics-mock";
import { ShippingLabelDialog } from "@/components/maat/logistics/ShippingLabelDialog";
import type { Shipment } from "@/types/maat";

/** Coda dei pacchi non ancora preparati: stampa l'etichetta senza aprire Logistica. */
export function DaSpedireWidget() {
  const [labelShipment, setLabelShipment] = useState<Shipment | null>(null);
  const [printedIds, setPrintedIds] = useState<Set<string>>(new Set());

  const rows = shipments.filter((s) => s.status === "da_fare").sort((a, b) => b.hoursAgo - a.hoursAgo);

  function markPrinted(s: Shipment) {
    setPrintedIds((prev) => (prev.has(s.id) ? prev : new Set(prev).add(s.id)));
  }

  return (
    <div className="flex h-full flex-col">
      <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-foreground">
        Da spedire
      </p>

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <p className="text-[14px] font-semibold">Nessun pacco da preparare</p>
          <p className="mt-1 text-[12px] text-muted-foreground">I nuovi pacchi da spedire compariranno qui.</p>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {rows.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">{s.itemLabel}</p>
                <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                  {s.sku} · {s.destinationCity.name} · {s.hoursAgo} h fa
                </p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => setLabelShipment(s)}>
                <Printer className="size-3.5" /> {printedIds.has(s.id) ? "Ristampa" : "Stampa etichetta"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ShippingLabelDialog
        shipment={labelShipment}
        onOpenChange={(open) => !open && setLabelShipment(null)}
        onPrint={markPrinted}
      />
    </div>
  );
}
