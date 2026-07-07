import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CatalogEntryStatus } from "@/types/maat";

const STATUS_CONFIG: Record<CatalogEntryStatus, { label: string; className: string }> = {
  local_draft: { label: "Locale", className: "bg-[rgba(91,102,112,.14)] text-[#5B6670]" },
  to_be_reviewed: { label: "Bozza", className: "bg-primary text-primary-foreground" },
  available: { label: "Confermato", className: "bg-[rgba(0,128,76,.12)] text-[#00804C]" },
};

interface StatusBadgeProps {
  status: CatalogEntryStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

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
