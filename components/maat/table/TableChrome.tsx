"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Linguaggio visivo condiviso da tutte le tabelle MAAT (Inventario, Pubblicazione,
 * Contabilità): guscio card, checkbox riga, header ordinabile, azioni hover.
 * Estratto da InventoryTable — unica fonte, non duplicare per tabella.
 */
export const TABLE_CARD_CLASS = "overflow-hidden rounded-[14px] border border-border bg-card shadow-e1";

export function RowCheckbox({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-[6px] border-[1.5px] transition-colors",
        checked ? "border-primary bg-primary" : "border-border bg-card"
      )}
    >
      {checked && <Check className="size-3.5" style={{ color: "var(--primary-foreground)" }} />}
    </button>
  );
}

export function SortHeaderCell({
  label,
  align,
  active,
  dir,
  onClick,
}: {
  label: string;
  align?: "right";
  active: boolean;
  dir: 1 | -1;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground transition-colors hover:text-foreground",
        align === "right" && "justify-end"
      )}
    >
      {label}
      {active &&
        (dir === 1 ? (
          <ArrowUp className="size-2.5 text-foreground" />
        ) : (
          <ArrowDown className="size-2.5 text-foreground" />
        ))}
    </button>
  );
}

/** Etichetta header per colonne non ordinabili — stesso linguaggio tipografico di SortHeaderCell. */
export function HeaderLabel({ label, align }: { label: string; align?: "right" }) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground",
        align === "right" && "text-right"
      )}
    >
      {label}
    </span>
  );
}

/** Pannello azioni che appare in hover sulla riga (bordo destro, stile Inventario). */
export function RowHoverActions({ children }: { children: ReactNode }) {
  return (
    <div className="absolute right-3.5 top-1/2 flex -translate-y-1/2 gap-1 rounded-[11px] border border-border bg-card p-1 shadow-e2">
      {children}
    </div>
  );
}

export function RowActionButton({
  icon: Icon,
  label,
  onClick,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  tone?: "default" | "destructive";
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      aria-label={label}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg transition-colors",
        tone === "destructive" ? "hover:bg-destructive/10" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
      style={tone === "destructive" ? { color: "var(--destructive)" } : undefined}
    >
      <Icon className="size-4" />
    </button>
  );
}

/** Cella "capo": thumb + brand/tipo su due righe — stessa gabbia in ogni tabella MAAT. */
export function CapoCell({ photoUrl, title, subtitle }: { photoUrl: string | null; title: string; subtitle: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-secondary">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="font-mono text-[7px] uppercase text-muted-foreground/50">Foto</span>
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[14px] font-semibold tracking-[-.01em] text-foreground">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}
