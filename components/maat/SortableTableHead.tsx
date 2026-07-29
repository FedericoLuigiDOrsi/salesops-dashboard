"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps {
  active: boolean;
  dir: 1 | -1;
  align?: "right";
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

/** TableHead cliccabile con freccia asc/desc, stesso linguaggio dell'header InventoryTable. */
export function SortableTableHead({ active, dir, align, onClick, children, className }: SortableTableHeadProps) {
  return (
    <TableHead className={cn(align === "right" && "text-right", className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex w-full items-center gap-1 transition-colors hover:text-foreground",
          align === "right" ? "justify-end" : "justify-start"
        )}
      >
        {children}
        {active &&
          (dir === 1 ? (
            <ArrowUp className="size-2.5 text-foreground" />
          ) : (
            <ArrowDown className="size-2.5 text-foreground" />
          ))}
      </button>
    </TableHead>
  );
}
