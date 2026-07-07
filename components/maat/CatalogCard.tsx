import Link from "next/link";
import { StatusBadge } from "@/components/maat/StatusBadge";
import type { CatalogEntry } from "@/types/maat";

interface CatalogCardProps {
  entry: CatalogEntry;
  variant?: "grid" | "row";
}

function Thumb({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-md border border-border bg-background ${className ?? ""}`}>
      <span className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground/60">Foto</span>
    </div>
  );
}

export function CatalogCard({ entry, variant = "grid" }: CatalogCardProps) {
  const { brand, tipoCapo, taglia } = entry.attributes;

  if (variant === "row") {
    return (
      <Link
        href={`/capi/${entry.id}`}
        className="flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-foreground/[.03]"
      >
        <Thumb className="size-11 shrink-0" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[13px] font-semibold">
            {brand} — {tipoCapo}
          </span>
          <span className="font-mono text-xs text-muted-foreground">Taglia {taglia}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/capi/${entry.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-card shadow-[var(--card-shadow,0_1px_2px_rgba(0,31,63,.04),0_6px_20px_rgba(0,31,63,.06))] transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/5] border-b border-border">
        <Thumb className="h-full w-full rounded-none border-0" />
        <div className="absolute left-3 top-3">
          <StatusBadge status={entry.status} />
        </div>
      </div>
      <div className="flex flex-col gap-0.5 p-4">
        <span className="text-[15px] font-semibold">
          {brand} — {tipoCapo}
        </span>
        <span className="font-mono text-[13px] text-muted-foreground">Taglia {taglia}</span>
      </div>
    </Link>
  );
}
