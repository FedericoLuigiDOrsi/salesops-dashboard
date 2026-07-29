"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { cn, formatEUR } from "@/lib/utils";

interface PriceMarginCardProps {
  purchasePriceCents: number | null;
  suggestedSalePriceCents: number | null;
  onChange: (purchasePriceCents: number | null, suggestedSalePriceCents: number | null) => void;
  compact?: boolean;
  completion?: { current: number; total: number; missingLabel?: string };
}

function parseEuroInput(raw: string): number | null {
  const n = parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export function PriceMarginCard({
  purchasePriceCents,
  suggestedSalePriceCents,
  onChange,
  compact = false,
  completion,
}: PriceMarginCardProps) {
  const [buyRaw, setBuyRaw] = useState(purchasePriceCents != null ? String(purchasePriceCents / 100) : "");
  const [sellRaw, setSellRaw] = useState(suggestedSalePriceCents != null ? String(suggestedSalePriceCents / 100) : "");

  const buy = parseEuroInput(buyRaw);
  const sell = parseEuroInput(sellRaw);
  const margin = buy != null && sell != null ? sell - buy : null;
  const multiplier = buy != null && buy > 0 && sell != null ? sell / buy : null;

  function commit(nextBuyRaw: string, nextSellRaw: string) {
    onChange(parseEuroInput(nextBuyRaw), parseEuroInput(nextSellRaw));
  }

  if (compact) {
    const progress = completion ? Math.round((completion.current / completion.total) * 100) : 0;
    return (
      <div className="h-full lg:border-l lg:border-border lg:pl-7">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Prezzo</p>
        <label className="mt-2.5 flex w-fit items-baseline gap-1.5 rounded-[8px] border border-transparent transition-colors hover:border-border focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/25">
          <input
            inputMode="decimal"
            value={sellRaw}
            placeholder="—"
            onChange={(e) => {
              setSellRaw(e.target.value);
              commit(buyRaw, e.target.value);
            }}
            className="w-[116px] bg-transparent px-1 font-mono text-[30px] font-bold leading-none tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50"
            aria-label="Prezzo consigliato di vendita"
          />
          <span className="pr-1 font-mono text-[17px] font-medium text-muted-foreground">€</span>
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-1 text-[11.5px] leading-relaxed text-muted-foreground">
          <span>Acquisto</span>
          <label className="inline-flex items-center rounded border border-transparent hover:border-border focus-within:border-primary">
            <input
              inputMode="decimal"
              value={buyRaw}
              placeholder="—"
              onChange={(e) => {
                setBuyRaw(e.target.value);
                commit(e.target.value, sellRaw);
              }}
              className="w-12 bg-transparent px-1 text-right font-mono font-medium text-foreground outline-none"
              aria-label="Prezzo acquisto"
            />
            <span>€</span>
          </label>
          <span>· margine</span>
          <strong className={cn("font-mono font-semibold", margin != null && margin < 0 ? "text-destructive" : "text-success")}>
            {margin != null ? `${margin >= 0 ? "+" : "−"}${formatEUR(Math.abs(margin))}` : "—"}
          </strong>
        </div>
        {completion && (
          <>
            <div className="mt-3.5 flex items-center gap-2.5">
              <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span className="block h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <span className="font-mono text-[10.5px] font-medium tracking-[.08em] text-muted-foreground">
                {completion.current} / {completion.total}
              </span>
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
              {completion.missingLabel ? (
                <>Manca <strong className="font-semibold text-foreground">{completion.missingLabel}</strong> per confermare</>
              ) : (
                <strong className="font-semibold text-success">Scheda completa</strong>
              )}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-semibold">Prezzo &amp; margine</p>

      <div className="mt-2 flex items-center justify-between gap-3 border-b border-border py-3">
        <span className="text-sm text-foreground">Prezzo acquisto</span>
        <label className="flex items-center gap-1 rounded-lg border border-border-strong bg-background px-3 py-1.5">
          <span className="font-mono text-sm text-muted-foreground">€</span>
          <input
            inputMode="decimal"
            value={buyRaw}
            onChange={(e) => {
              setBuyRaw(e.target.value);
              commit(e.target.value, sellRaw);
            }}
            className="w-16 bg-transparent text-right font-mono text-base font-semibold text-foreground outline-none"
            aria-label="Prezzo acquisto"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 py-3">
        <span className="text-sm text-foreground">Prezzo consigliato vendita</span>
        <label className="flex items-center gap-1 rounded-lg border border-primary bg-primary/10 px-3 py-1.5">
          <span className="font-mono text-sm text-muted-foreground">€</span>
          <input
            inputMode="decimal"
            value={sellRaw}
            onChange={(e) => {
              setSellRaw(e.target.value);
              commit(buyRaw, e.target.value);
            }}
            className="w-16 bg-transparent text-right font-mono text-base font-semibold text-foreground outline-none"
            aria-label="Prezzo consigliato di vendita"
          />
        </label>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Margine stimato
        </span>
        <span className={cn("font-mono text-lg font-semibold", margin != null && margin < 0 ? "text-destructive" : "text-success")}>
          {margin != null ? `${margin >= 0 ? "+" : "−"}${formatEUR(Math.abs(margin))}` : "—"}
          {multiplier != null && (
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              · {multiplier.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}×
            </span>
          )}
        </span>
      </div>

      <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 flex-none" />
        Prezzo di vendita indicativo: non ancora collegato a un dataset di capi simili venduti — inseriscilo a mano per ora.
      </p>
    </div>
  );
}
