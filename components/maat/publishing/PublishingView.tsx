"use client";

import { useState } from "react";
import { Layers, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/maat/EmptyState";
import { cn } from "@/lib/utils";

export function PublishingView() {
  const [refreshing, setRefreshing] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      setCheckedAt(new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));
    }, 700);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Pubblicazione multipiattaforma
          </p>
          <h1 className="text-[28px] font-bold tracking-tight">Pubblicazione</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Da qui gestirai e avvierai la pubblicazione dei capi in inventario su più piattaforme in contemporanea.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} /> Aggiorna
          </Button>
          {checkedAt && (
            <span className="font-mono text-[10px] text-muted-foreground">Ultimo controllo · {checkedAt}</span>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={<Layers className="size-5" />}
          title="In lavorazione"
          subtitle="Questa schermata ospiterà il processo di pubblicazione multipiattaforma: piattaforme predefinite, coda dei capi pronti e stato di avanzamento per ogni annuncio."
          action={<p className="font-mono text-xs text-muted-foreground/70">Aggiorna per vedere i dati attuali</p>}
        />
      </div>
    </div>
  );
}
