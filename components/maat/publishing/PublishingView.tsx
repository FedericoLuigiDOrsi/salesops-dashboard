"use client";

import { Layers } from "lucide-react";
import { EmptyState } from "@/components/maat/EmptyState";

export function PublishingView() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-8">
      <div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
          Pubblicazione multipiattaforma
        </p>
        <h1 className="text-[28px] font-bold tracking-tight">Pubblicazione</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Da qui gestirai e avvierai la pubblicazione dei capi in inventario su più piattaforme in contemporanea.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={<Layers className="size-5" />}
          title="In lavorazione"
          subtitle="Questa schermata ospiterà il processo di pubblicazione multipiattaforma: piattaforme predefinite, coda dei capi pronti e stato di avanzamento per ogni annuncio."
          action={<p className="font-mono text-xs text-muted-foreground/70">Non ancora disponibile</p>}
        />
      </div>
    </div>
  );
}
