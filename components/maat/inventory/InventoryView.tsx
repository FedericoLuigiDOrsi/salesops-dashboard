import { Box } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mockCatalogEntries } from "@/lib/maat-mock";
import { inventoryListings, type ListingStatus } from "@/lib/inventory-mock";

const STATUS_CLASS: Record<ListingStatus, string> = {
  active: "border-transparent bg-[color-mix(in_oklab,var(--chart-2)_16%,transparent)] text-[var(--chart-2)]",
  pending: "border-transparent bg-primary/20 text-[#7a7000]",
  delisted: "border-transparent bg-muted text-muted-foreground",
};

function StatusCell({ status }: { status: ListingStatus | null }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  return <Badge className={cn("text-[11px]", STATUS_CLASS[status])}>{status}</Badge>;
}

export function InventoryView() {
  const rows = mockCatalogEntries.map((entry) => ({
    entry,
    listing: inventoryListings.find((l) => l.catalogEntryId === entry.id) ?? null,
  }));
  const needsManualDelist = rows.some((r) => r.listing?.depop === "delisted");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8">
      <div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
          Inventario · Listing &amp; fulfillment
        </p>
        <h1 className="text-[28px] font-bold tracking-tight">Inventario</h1>
        <p className="text-sm text-muted-foreground">Stato di pubblicazione per piattaforma e avanzamento delle spedizioni.</p>
      </div>

      {needsManualDelist && (
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/[.08] p-3 text-sm">
          <Box className="size-4 shrink-0 text-[#7a7000]" />
          1 listing richiede rimozione manuale dalla piattaforma (nessuna API).
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Capo</TableHead>
              <TableHead>Vinted</TableHead>
              <TableHead>Grailed</TableHead>
              <TableHead>Depop</TableHead>
              <TableHead>Fulfillment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ entry, listing }) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <div className="font-medium">{entry.attributes.brand}</div>
                  <div className="font-mono text-xs text-muted-foreground">SKU {entry.sku ?? entry.id.toUpperCase()}</div>
                </TableCell>
                <TableCell>
                  <StatusCell status={listing?.vinted ?? null} />
                </TableCell>
                <TableCell>
                  <StatusCell status={listing?.grailed ?? null} />
                </TableCell>
                <TableCell>
                  <StatusCell status={listing?.depop ?? null} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{listing?.fulfillment ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
