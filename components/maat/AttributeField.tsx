"use client";

import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttributeFieldProps {
  label: string;
  value: string;
  uncertain?: boolean;
  missing?: boolean;
  onEdit?: () => void;
}

export function AttributeField({ label, value, uncertain, missing, onEdit }: AttributeFieldProps) {
  const isMissing = missing || value === "";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border py-3 pl-3",
        uncertain && !isMissing && "border-l-2 border-l-accent-ink bg-accent-soft",
        isMissing && "border-l-2 border-l-destructive bg-destructive/5"
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {isMissing && <span className="text-[11px] font-medium text-destructive">Mancante</span>}
        {uncertain && !isMissing && <span className="text-[11px] font-medium text-muted-foreground">Da verificare</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("font-mono text-sm text-foreground", isMissing && "italic text-muted-foreground")}>
          {isMissing ? "Da compilare" : value}
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label={`Modifica ${label}`}
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
