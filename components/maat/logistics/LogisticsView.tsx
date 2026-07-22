import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, formatEUR } from "@/lib/utils";
import { MARKETPLACE_LABELS, SHIPMENT_STATUS_LABELS, type ShipmentStatus } from "@/types/maat";
import { shipmentsByPlatform } from "@/lib/logistics-mock";

const STATUS_CLASS: Record<ShipmentStatus, string> = {
  shipped: "border-transparent bg-muted text-muted-foreground",
  in_transit: "border-transparent bg-neutral-soft text-muted-foreground",
  out_for_delivery: "border-transparent bg-success-soft text-success",
};

export function LogisticsView() {
  const groups = shipmentsByPlatform();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-8">
      <div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">Logistica</p>
        <h1 className="text-[28px] font-bold tracking-tight">Logistica</h1>
        <p className="text-sm text-muted-foreground">Spedizioni in corso, organizzate per piattaforma.</p>
      </div>

      {groups.map(({ marketplace, shipments }) => (
        <section key={marketplace}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <span className="flex size-5 items-center justify-center rounded bg-muted font-mono text-[10px] font-semibold">
                {MARKETPLACE_LABELS[marketplace][0]}
              </span>
              {MARKETPLACE_LABELS[marketplace]}
            </h3>
            <span className="text-xs text-muted-foreground">{shipments.length} in corso</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Capo</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Corriere</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Partita</TableHead>
                  <TableHead>Consegna prev.</TableHead>
                  <TableHead className="text-right">Prezzo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.itemLabel}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{s.sku}</TableCell>
                    <TableCell>{s.carrier}</TableCell>
                    <TableCell className="font-mono text-xs">{s.trackingCode}</TableCell>
                    <TableCell>{s.recipient}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[11px]", STATUS_CLASS[s.status])}>{SHIPMENT_STATUS_LABELS[s.status]}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.shippedAt}</TableCell>
                    <TableCell className="font-mono text-xs">{s.expectedDeliveryAt}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatEUR(s.priceCents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ))}
    </div>
  );
}
