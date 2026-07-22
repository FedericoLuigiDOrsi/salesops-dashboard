"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetShellProps {
  editing: boolean;
  onRemove: () => void;
  removeLabel: string;
  children: ReactNode;
}

/**
 * Chrome comune dei widget Home: card standard + affordance di edit mode
 * (bordo tratteggiato, jiggle-lite, pulsante rimuovi). In edit mode il
 * contenuto è inerte — come le app della home iPad mentre "ballano".
 */
export function WidgetShell({ editing, onRemove, removeLabel, children }: WidgetShellProps) {
  return (
    <section
      className={cn(
        "relative h-full rounded-lg border border-border bg-card p-5 transition-transform",
        editing && "scale-[.98] border-dashed"
      )}
    >
      {editing ? (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -right-2 -top-2 z-10 flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-destructive"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
      <div className={cn(editing && "pointer-events-none select-none")}>{children}</div>
    </section>
  );
}
