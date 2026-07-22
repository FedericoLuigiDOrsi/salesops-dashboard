"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, Check, Copy } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/maat/StatusBadge";
import { SegmentedFilter } from "@/components/maat/SegmentedFilter";
import { EmptyState } from "@/components/maat/EmptyState";
import { formatEUR } from "@/lib/utils";
import { MARKETPLACE_LABELS, SHIPMENT_STATUS_LABELS, type Shipment, type ShipmentStatus } from "@/types/maat";
import { shipments } from "@/lib/logistics-mock";

type StatusFilter = "tutte" | ShipmentStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "tutte", label: "Tutte" },
  { value: "shipped", label: SHIPMENT_STATUS_LABELS.shipped },
  { value: "in_transit", label: SHIPMENT_STATUS_LABELS.in_transit },
  { value: "out_for_delivery", label: SHIPMENT_STATUS_LABELS.out_for_delivery },
];

const columnHelper = createColumnHelper<Shipment>();

function SortableHead({ label, sorted, onSort }: { label: string; sorted: false | "asc" | "desc"; onSort: () => void }) {
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={onSort}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
      <Icon className="size-3" />
    </button>
  );
}

export function LogisticsView() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "expectedDeliveryAt", desc: false }]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("tutte");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyTracking(id: string, code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    });
  }

  const filtered = useMemo(
    () => (statusFilter === "tutte" ? shipments : shipments.filter((s) => s.status === statusFilter)),
    [statusFilter]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("itemLabel", { header: "Capo" }),
      columnHelper.accessor("sku", { header: "SKU", cell: (info) => <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span> }),
      columnHelper.accessor("marketplace", { header: "Piattaforma", cell: (info) => MARKETPLACE_LABELS[info.getValue()] }),
      columnHelper.accessor("carrier", { header: "Corriere" }),
      columnHelper.accessor("trackingCode", {
        header: "Tracking",
        cell: (info) => {
          const s = info.row.original;
          return (
            <button
              type="button"
              onClick={() => copyTracking(s.id, s.trackingCode)}
              className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {s.trackingCode}
              {copiedId === s.id ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
            </button>
          );
        },
      }),
      columnHelper.accessor("recipient", { header: "Destinatario" }),
      columnHelper.accessor("status", {
        header: "Stato",
        cell: (info) => <StatusBadge status={info.getValue()} kind="shipment" />,
      }),
      columnHelper.accessor("shippedAt", { header: "Partita", cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span> }),
      columnHelper.accessor("expectedDeliveryAt", {
        header: "Consegna prev.",
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
      columnHelper.accessor("priceCents", {
        header: "Prezzo",
        cell: (info) => <span className="font-mono text-xs">{formatEUR(info.getValue())}</span>,
      }),
    ],
    [copiedId]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    globalFilterFn: (row, _columnId, value) => {
      const s = row.original;
      const needle = String(value).toLowerCase();
      return s.itemLabel.toLowerCase().includes(needle) || s.sku.toLowerCase().includes(needle) || s.recipient.toLowerCase().includes(needle);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8">
      <div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Logistica</p>
        <h1 className="text-[28px] font-bold tracking-tight">Logistica</h1>
        <p className="text-sm text-muted-foreground">Spedizioni in corso su tutte le piattaforme.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedFilter options={STATUS_OPTIONS} active={statusFilter} onChange={setStatusFilter} />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca capo, SKU o destinatario…"
          className="max-w-xs"
        />
        <span className="ml-auto text-xs text-muted-foreground">{rows.length} spedizioni</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Nessuna spedizione" subtitle="Nessun risultato per il filtro selezionato." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      <SortableHead
                        label={header.column.columnDef.header as string}
                        sorted={header.column.getIsSorted()}
                        onSort={() => header.column.toggleSorting()}
                      />
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
