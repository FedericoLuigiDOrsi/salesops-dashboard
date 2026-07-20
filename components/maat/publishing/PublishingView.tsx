import { Layers, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublishingView() {
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
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="size-3.5" /> Aggiorna
        </Button>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground">
          <Layers className="size-5" />
        </div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
          In lavorazione
        </p>
        <p className="max-w-[48ch] text-sm text-muted-foreground">
          Questa schermata ospiterà il processo di pubblicazione multipiattaforma: piattaforme predefinite, coda dei
          capi pronti e stato di avanzamento per ogni annuncio.
        </p>
        <p className="font-mono text-xs text-muted-foreground/70">Aggiorna per vedere i dati attuali</p>
      </div>
    </div>
  );
}
