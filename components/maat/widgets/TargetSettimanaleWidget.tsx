"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { weeklyKpi } from "@/lib/accounting-mock";
import { DEFAULT_WEEKLY_TARGET_CENTS } from "@/lib/home-widgets-mock";
import { formatEUR } from "@/lib/utils";

const TARGET_STORAGE_KEY = "maat.home.weekly-target.v1";

export function TargetSettimanaleWidget() {
  const [targetCents, setTargetCents] = useState(DEFAULT_WEEKLY_TARGET_CENTS);
  const [draftEuro, setDraftEuro] = useState(String(DEFAULT_WEEKLY_TARGET_CENTS / 100));
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(TARGET_STORAGE_KEY));
      if (Number.isFinite(saved) && saved > 0) {
        setTargetCents(saved);
        setDraftEuro(String(saved / 100));
      }
    } catch {
      // localStorage non disponibile: resta il target di default
    }
  }, []);

  const progress = Math.min(100, Math.round((weeklyKpi.revenueCents / targetCents) * 100));
  const missingCents = Math.max(0, targetCents - weeklyKpi.revenueCents);

  function saveTarget() {
    const euros = Number(draftEuro.replace(",", "."));
    if (!Number.isFinite(euros) || euros <= 0) {
      setError("Inserisci un importo maggiore di zero.");
      return;
    }
    const next = Math.round(euros * 100);
    setTargetCents(next);
    setDraftEuro(String(next / 100));
    setError("");
    setEditing(false);
    try {
      window.localStorage.setItem(TARGET_STORAGE_KEY, String(next));
    } catch {
      // il valore resta valido per la sessione corrente
    }
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[.12em]">Target settimanale</p>
        {!editing ? (
          <button type="button" onClick={() => setEditing(true)} className="flex h-7 items-center gap-1 rounded-md border border-border px-2 font-mono text-[8px] font-semibold uppercase tracking-[.06em] text-muted-foreground transition-[background-color,transform] hover:bg-muted active:translate-y-px">
            <Pencil className="size-3" /> Modifica
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-4">
          <label htmlFor="weekly-target" className="block text-[11px] font-semibold">Target entrate</label>
          <div className="mt-2 flex items-center gap-1.5">
            <div className="relative min-w-0 flex-1">
              <input
                id="weekly-target"
                type="number"
                min="1"
                step="50"
                value={draftEuro}
                onChange={(event) => { setDraftEuro(event.target.value); setError(""); }}
                className="h-9 w-full rounded-md border border-input bg-background px-2.5 pr-7 font-mono text-sm font-semibold outline-none focus:border-foreground/30"
                autoFocus
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
            </div>
            <button type="button" aria-label="Salva target" onClick={saveTarget} className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform active:translate-y-px"><Check className="size-4" /></button>
            <button type="button" aria-label="Annulla modifica" onClick={() => { setEditing(false); setDraftEuro(String(targetCents / 100)); setError(""); }} className="flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-transform active:translate-y-px"><X className="size-4" /></button>
          </div>
          <p className={`mt-2 min-h-4 text-[10px] ${error ? "text-destructive" : "text-muted-foreground"}`} aria-live="polite">
            {error || "Importo manuale, salvato solo su questo dispositivo."}
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <p className="font-mono text-[23px] font-semibold leading-none tracking-tight tabular-nums">
            {formatEUR(weeklyKpi.revenueCents)} <span className="text-[11px] text-muted-foreground">/ {formatEUR(targetCents)}</span>
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full border border-border bg-muted" aria-label={`${progress}% del target raggiunto`}>
            <span className="block h-full origin-left rounded-full bg-primary transition-transform duration-500 [transition-timing-function:cubic-bezier(.22,1,.36,1)]" style={{ transform: `scaleX(${progress / 100})` }} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[8px] font-semibold uppercase tracking-[.06em] text-muted-foreground">
            <span><strong className="text-foreground">{progress}%</strong> raggiunto</span>
            <span>{missingCents > 0 ? `${formatEUR(missingCents)} mancanti` : "Target superato"}</span>
          </div>
          <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">Target manuale · si rinnova lunedì</p>
        </div>
      )}
    </div>
  );
}
