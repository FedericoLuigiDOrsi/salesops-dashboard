import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SHIPMENT_STATUS_LABELS, type CatalogEntryStatus, type ShipmentStatus } from "@/types/maat";

const CATALOG_STATUS_CONFIG: Record<CatalogEntryStatus, { label: string; className: string }> = {
  local_draft: { label: "Locale", className: "bg-neutral-soft text-muted-foreground" },
  to_be_reviewed: { label: "Bozza", className: "bg-primary text-primary-foreground" },
  available: { label: "Confermato", className: "bg-success-soft text-success" },
};

const SHIPMENT_STATUS_CLASS: Record<ShipmentStatus, string> = {
  shipped: "bg-muted text-muted-foreground",
  in_transit: "bg-neutral-soft text-muted-foreground",
  out_for_delivery: "bg-success-soft text-success",
};

type StatusBadgeProps =
  | { status: CatalogEntryStatus; kind?: undefined; className?: string }
  | { status: ShipmentStatus; kind: "shipment"; className?: string };

export function StatusBadge(props: StatusBadgeProps) {
  const config =
    props.kind === "shipment"
      ? { label: SHIPMENT_STATUS_LABELS[props.status], className: SHIPMENT_STATUS_CLASS[props.status] }
      : CATALOG_STATUS_CONFIG[props.status];
  const { className } = props;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full border-transparent px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide",
        config.className,
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {config.label}
    </Badge>
  );
}
