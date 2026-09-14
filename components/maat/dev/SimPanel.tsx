"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FlaskConical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CANCELLABLE_STATES } from "@/lib/marketplace-actions";
import { ACTION_KIND_LABEL } from "@/lib/marketplace-actions-copy";
import type { SimOutcome, SimSettings } from "@/lib/marketplace-actions-sim";
import { useMarketplaceActions } from "@/lib/marketplace-actions-store";

const OUTCOMES: { value: SimOutcome; label: string }[] = [
  { value: "done", label: "Fatta" },
  { value: "failed", label: "Non riuscita" },
  { value: "awaiting_challenge", label: "Captcha" },
  { value: "needs_reauth", label: "Da ricollegare" },
];

const SPEEDS: SimSettings["speed"][] = [1, 10, 60];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors",
        active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function SimPanelInner() {
  const params = useSearchParams();
  const enabled = process.env.NODE_ENV !== "production" || params.get("prova") === "1";
  const [open, setOpen] = useState(false);
  const { settings, simulator, actions } = useMarketplaceActions();

  if (!enabled) return null;

  const claimable = actions.filter((a) => CANCELLABLE_STATES.includes(a.state));

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-40 flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wide shadow-sm md:bottom-4"
      >
        <FlaskConical className="size-3.5" /> Prova
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 z-40 w-72 rounded-xl border border-border bg-card p-4 shadow-lg md:bottom-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em]">Pannello di prova · simulatore</p>
        <button type="button" aria-label="Chiudi pannello di prova" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3 text-[12px]">
        <div>
          <p className="mb-1.5 text-muted-foreground">Estensione</p>
          <div className="flex gap-1.5">
            <Chip active={settings.extensionOn} onClick={() => simulator.updateSettings({ extensionOn: true })}>Accesa</Chip>
            <Chip active={!settings.extensionOn} onClick={() => simulator.updateSettings({ extensionOn: false })}>Spenta</Chip>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-muted-foreground">Account Vinted</p>
          <div className="flex gap-1.5">
            <Chip active={settings.accountConnected} onClick={() => simulator.updateSettings({ accountConnected: true })}>Collegato</Chip>
            <Chip active={!settings.accountConnected} onClick={() => simulator.updateSettings({ accountConnected: false })}>Non collegato</Chip>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-muted-foreground">Esito della prossima azione</p>
          <div className="flex flex-wrap gap-1.5">
            {OUTCOMES.map((o) => (
              <Chip key={o.value} active={settings.nextOutcome === o.value} onClick={() => simulator.updateSettings({ nextOutcome: o.value })}>
                {o.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-muted-foreground">Velocità</p>
          <div className="flex gap-1.5">
            {SPEEDS.map((s) => (
              <Chip key={s} active={settings.speed === s} onClick={() => simulator.updateSettings({ speed: s })}>
                ×{s}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-muted-foreground">Forza la presa (per &quot;Troppo tardi&quot;)</p>
          {claimable.length === 0 ? (
            <p className="text-muted-foreground">Nessuna azione in coda.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {claimable.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{ACTION_KIND_LABEL[a.kind]} · <span className="font-mono">{a.target.id}</span></span>
                  <button type="button" onClick={() => simulator.claimNow(a.id)} className="font-semibold underline-offset-2 hover:underline">
                    Prendi ora
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="button" onClick={() => simulator.clear()} className="self-start font-semibold text-destructive underline-offset-2 hover:underline">
          Svuota coda
        </button>
      </div>
    </div>
  );
}

/** Visibile in sviluppo o con ?prova=1. Suspense serve a useSearchParams nell'App Router. */
export function SimPanel() {
  return (
    <Suspense fallback={null}>
      <SimPanelInner />
    </Suspense>
  );
}
