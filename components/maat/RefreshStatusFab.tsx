"use client";

import { Check, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRefreshJob } from "@/lib/refresh-store";

/**
 * Indicatore globale del refresh "articoli fermi": in basso a destra su ogni
 * schermata (non solo Home), così l'utente può lasciare il widget e
 * continuare a lavorare mentre gira. Da cerchio (in corso) si allarga in
 * pillola col messaggio di fine, con la X per chiuderlo.
 */
export function RefreshStatusFab() {
  const { status, total, done, panelOpen, togglePanel, dismiss } = useRefreshJob();

  if (status === "idle") return null;

  const running = status === "running";
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {panelOpen && (
        <div className="w-[240px] rounded-xl border border-border bg-card p-3.5 shadow-e2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">
              {running ? "Refresh in corso" : "Refresh completato"}
            </span>
            {!running && (
              <button
                type="button"
                onClick={dismiss}
                aria-label="Chiudi"
                className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {running ? (
            <>
              <p className="mt-2 text-[13px] font-semibold tabular-nums">
                {done} / {total} <span className="font-normal text-muted-foreground">articoli</span>
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </>
          ) : (
            <p className="mt-2 text-[13px] font-medium text-success">
              Fatto! {total} articoli aggiornati.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={togglePanel}
        aria-label={running ? `Refresh in corso, ${done} di ${total} articoli` : "Refresh completato, mostra dettagli"}
        aria-expanded={panelOpen}
        className={cn(
          "flex items-center justify-center gap-2 rounded-full shadow-e2 transition-[width,padding,background-color] duration-300",
          running ? "size-12 bg-surface-dark text-text-on-dark" : "h-12 px-4 bg-success text-white"
        )}
      >
        {running ? (
          <RefreshCw className="size-5 animate-spin [animation-duration:1.6s]" strokeWidth={1.8} />
        ) : (
          <>
            <Check className="size-5 shrink-0" strokeWidth={2.2} />
            <span className="whitespace-nowrap text-[12.5px] font-semibold">Completato</span>
          </>
        )}
      </button>
    </div>
  );
}
