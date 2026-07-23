import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/maat/StatusBadge";
import type { CatalogEntry } from "@/types/maat";

// Vista tabellare — non nel brief originale (05-sketch-brief.md prevedeva solo
// griglia card), estensione confermata con Federico il 2026-07-06 come vista
// di default della Lista capi, accanto a Card e Kanban.
interface CatalogTableProps {
  entries: CatalogEntry[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

export function CatalogTable({ entries }: CatalogTableProps) {
  const router = useRouter();
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-14"></TableHead>
            <TableHead>Capo</TableHead>
            <TableHead>Taglia</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">Creato</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow
              key={entry.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/capi/${entry.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/capi/${entry.id}`);
                }
              }}
              className="cursor-pointer hover:bg-muted/40"
            >
              <TableCell>
                <div className="flex size-9 items-center justify-center rounded-md border border-border bg-background">
                  <span className="font-mono text-[8px] uppercase tracking-wide text-muted-foreground/60">Foto</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {entry.attributes.brand} — {entry.attributes.tipoCapo}
              </TableCell>
              <TableCell className="font-mono text-muted-foreground">{entry.attributes.taglia}</TableCell>
              <TableCell>
                <StatusBadge status={entry.status} />
              </TableCell>
              <TableCell className="font-mono text-muted-foreground">{entry.sku ?? "—"}</TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {formatDate(entry.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
