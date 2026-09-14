"use client";

import Link from "next/link";
import { Plug } from "lucide-react";
import { MARKETPLACE_LABELS } from "@/types/maat";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/components/maat/StatusPill";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActionControls } from "@/components/maat/ActionControls";
import { isActive } from "@/lib/marketplace-actions";
import { ACTION_KIND_LABEL, EXTENSION_STATUS_COPY, SIMULATED_NOTE } from "@/lib/marketplace-actions-copy";
import { useMarketplaceActions } from "@/lib/marketplace-actions-store";

const DOT_TONE: Record<StatusTone, string> = {
  success: "text-success",
  warn: "text-primary",
  danger: "text-destructive",
  neutral: "text-muted-foreground",
};

/**
 * Stato dell'estensione visibile in ogni schermata: riga nel menu laterale
 * (icona col menu chiuso), pillola nell'intestazione mobile. Al clic apre la
 * coda completa. Finché il fattorino è il simulatore lo dichiara.
 */
export function ExtensionIndicator({ variant, collapsed = false }: { variant: "sidebar" | "header"; collapsed?: boolean }) {
  const { extension, actions, resume, isSimulated } = useMarketplaceActions();
  const copy = EXTENSION_STATUS_COPY[extension.kind];
  const summary = extension.kind === "active" ? `${extension.queued} in coda` : copy.label;
  const open = [...actions].filter((a) => isActive(a) || a.state === "failed").sort((a, b) => b.createdAt - a.createdAt);

  const dot = <span aria-hidden className={cn("size-2 shrink-0 rounded-full bg-current", DOT_TONE[copy.tone])} />;

  const trigger =
    variant === "header" ? (
      <button
        type="button"
        className="flex h-9 items-center gap-1.5 rounded-full border border-border px-2.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-foreground"
        aria-label={`Estensione: ${copy.label}`}
      >
        {dot}
        {/* "active" mostra solo il conteggio (serve il prefisso "Vinted ·");
            gli altri kind usano copy.label, che contiene già "Vinted" — niente
            doppione. isSimulated si dichiara anche in questo spazio stretto. */}
        <span>
          {extension.kind === "active" ? `Vinted · ${summary}` : summary}
          {isSimulated ? " · sim" : ""}
        </span>
      </button>
    ) : (
      <button
        type="button"
        title={collapsed ? `Estensione: ${copy.label}${isSimulated ? " · simulato" : ""}` : undefined}
        className={cn(
          "flex w-full items-center gap-2 border-t border-sidebar-border px-3 py-3 text-left transition-colors hover:bg-sidebar-accent",
          collapsed && "justify-center px-0"
        )}
      >
        <span className="relative flex">
          <Plug className="size-4 text-sidebar-foreground/70" />
          <span className="absolute -right-1 -top-1">{dot}</span>
        </span>
        {!collapsed && (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm text-sidebar-foreground/90">{copy.label}</span>
            <span className="font-mono text-[10px] uppercase tracking-wide text-sidebar-foreground/50">
              {extension.kind === "active" ? summary : "Vinted"}
              {isSimulated ? " · simulato" : ""}
            </span>
          </span>
        )}
      </button>
    );

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={variant === "header" ? "end" : "start"} side={variant === "header" ? "bottom" : "right"} className="w-80 p-0">
        <div className="border-b border-border p-4">
          <p className="flex items-center gap-2 text-[14px] font-semibold">
            {dot}
            {copy.label}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">{copy.detail}</p>
          {isSimulated ? (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{SIMULATED_NOTE}</p>
          ) : null}
          {copy.cta || copy.secondary ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {copy.cta?.href ? (
                <Button size="sm" asChild>
                  <Link href={copy.cta.href}>{copy.cta.label}</Link>
                </Button>
              ) : null}
              {copy.cta?.resume ? (
                <Button size="sm" onClick={() => resume(extension.marketplace ?? "vinted")}>
                  {copy.cta.label}
                </Button>
              ) : null}
              {copy.secondary ? (
                <Button size="sm" variant="outline" asChild>
                  <a href={copy.secondary.href} target="_blank" rel="noopener noreferrer">
                    {copy.secondary.label}
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          <p className="px-2 pb-1 pt-1 font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
            Coda azioni
          </p>
          {open.length === 0 ? (
            <p className="px-2 py-3 text-[13px] text-muted-foreground">Nessuna azione in coda.</p>
          ) : (
            <ul className="flex flex-col">
              {open.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">{ACTION_KIND_LABEL[a.kind]}</span>
                    <span className="block truncate font-mono text-[10px] text-muted-foreground">
                      {MARKETPLACE_LABELS[a.marketplace]} · {a.target.id}
                    </span>
                  </span>
                  <ActionControls action={a} className="shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
