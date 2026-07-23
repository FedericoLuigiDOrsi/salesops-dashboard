"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface AttributeFieldProps {
  label: string;
  value: string;
  uncertain?: boolean;
  missing?: boolean;
  onSave?: (value: string) => void;
}

export function AttributeField({ label, value, uncertain, missing, onSave }: AttributeFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const isMissing = missing || value === "";

  function commit() {
    const next = draft.trim();
    if (next && next !== value) onSave?.(next);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border py-3 pl-3",
        uncertain && !isMissing && "border-l-2 border-l-primary bg-primary/5",
        isMissing && "border-l-2 border-l-destructive bg-destructive/5"
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {isMissing && !editing && <span className="text-[11px] font-medium text-destructive">Mancante</span>}
        {uncertain && !isMissing && !editing && (
          <span className="text-[11px] font-medium text-muted-foreground">Da verificare</span>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
            onBlur={commit}
            aria-label={`Modifica ${label}`}
            className="h-9 w-36 font-mono text-sm"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={commit}
            aria-label="Salva"
            className="flex size-9 shrink-0 items-center justify-center text-success"
          >
            <Check className="size-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={cancel}
            aria-label="Annulla modifica"
            className="flex size-9 shrink-0 items-center justify-center text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className={cn("font-mono text-sm text-foreground", isMissing && "italic text-muted-foreground")}>
            {isMissing ? "Da compilare" : value}
          </span>
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setEditing(true);
            }}
            className="flex size-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`Modifica ${label}`}
          >
            <Pencil className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
