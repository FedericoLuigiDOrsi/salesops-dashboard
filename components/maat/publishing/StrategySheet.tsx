"use client";

import type { ReactNode } from "react";
import { Box, Layers, TrendingDown, RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MARKETPLACE_LABELS } from "@/types/maat";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/inventory-columns";
import { usePublishingStrategy } from "@/lib/publishing-strategy-store";
import { PlatformChips } from "@/components/maat/publishing/PlatformChips";

const FREQ_OPTIONS = [
  { value: "3", label: "3 giorni" },
  { value: "7", label: "7 giorni" },
  { value: "14", label: "14 giorni" },
  { value: "30", label: "30 giorni" },
];

interface StrategySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StrategySheet({ open, onOpenChange }: StrategySheetProps) {
  const { strategy, toggleDefaultPublishPlatform, setAutoDelist, setRepricing, setAutoRelist } = usePublishingStrategy();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="gap-1.5 border-b border-border">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Pubblicazione · Regole
          </p>
          <SheetTitle className="text-xl">Strategie</SheetTitle>
          <SheetDescription>
            Regole per piattaforma che agiscono in autonomia su listino, prezzo e pubblicazione dei capi.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="text-sm font-semibold">Piattaforme predefinite</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Preselezionate nella barra di pubblicazione della tab &quot;Da pubblicare&quot;.
            </p>
            <div className="mt-3">
              <PlatformChips selected={strategy.defaultPublishPlatforms} onToggle={toggleDefaultPublishPlatform} />
            </div>
          </section>

          <RuleCard icon={<Box className="size-4" />} title="Auto-delist" description="Ritira in automatico gli annunci invenduti dopo N giorni, per piattaforma.">
            {PLATFORM_KEYS.map((key) => (
              <PlatformRow key={key} platform={key} enabled={strategy.platforms[key].autoDelist.enabled} onToggle={(enabled) => setAutoDelist(key, { enabled })}>
                {strategy.platforms[key].autoDelist.enabled && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    dopo
                    <Select
                      value={String(strategy.platforms[key].autoDelist.staleDays)}
                      onValueChange={(v) => setAutoDelist(key, { staleDays: Number(v) })}
                    >
                      <SelectTrigger size="sm" className="w-24" aria-label={`Giorni auto-delist ${key}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["30", "60", "90", "120", "180"].map((d) => (
                          <SelectItem key={d} value={d}>
                            {d} gg
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </span>
                )}
              </PlatformRow>
            ))}
          </RuleCard>

          <RuleCard icon={<TrendingDown className="size-4" />} title="Repricing automatico" description="Abbassa il prezzo degli annunci invenduti: sconto, frequenza e minimo per piattaforma.">
            {PLATFORM_KEYS.map((key) => (
              <PlatformRow key={key} platform={key} enabled={strategy.platforms[key].repricing.enabled} onToggle={(enabled) => setRepricing(key, { enabled })}>
                {strategy.platforms[key].repricing.enabled && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Stepper
                      value={strategy.platforms[key].repricing.discountPct}
                      min={1}
                      max={20}
                      step={1}
                      unit="%"
                      prefix="−"
                      onChange={(v) => setRepricing(key, { discountPct: v })}
                    />
                    <Select
                      value={String(strategy.platforms[key].repricing.frequencyDays)}
                      onValueChange={(v) => setRepricing(key, { frequencyDays: Number(v) })}
                    >
                      <SelectTrigger size="sm" className="w-28" aria-label={`Frequenza repricing ${key}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQ_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>
                      floor{" "}
                      <Stepper
                        value={strategy.platforms[key].repricing.floorPct}
                        min={10}
                        max={70}
                        step={5}
                        unit="%"
                        onChange={(v) => setRepricing(key, { floorPct: v })}
                      />
                    </span>
                  </div>
                )}
              </PlatformRow>
            ))}
          </RuleCard>

          <RuleCard icon={<RefreshCw className="size-4" />} title="Auto-relist" description="Ripubblica gli annunci per farli risalire, per piattaforma.">
            {PLATFORM_KEYS.map((key) => (
              <PlatformRow key={key} platform={key} enabled={strategy.platforms[key].autoRelist.enabled} onToggle={(enabled) => setAutoRelist(key, { enabled })}>
                {strategy.platforms[key].autoRelist.enabled && (
                  <Select
                    value={String(strategy.platforms[key].autoRelist.frequencyDays)}
                    onValueChange={(v) => setAutoRelist(key, { frequencyDays: Number(v) })}
                  >
                    <SelectTrigger size="sm" className="w-28" aria-label={`Frequenza auto-relist ${key}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQ_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </PlatformRow>
            ))}
          </RuleCard>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Chiudi
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function RuleCard({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{title}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">{children}</div>
    </section>
  );
}

function PlatformRow({
  platform,
  enabled,
  onToggle,
  children,
}: {
  platform: PlatformKey;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-foreground">{MARKETPLACE_LABELS[platform]}</span>
        <Switch checked={enabled} onCheckedChange={onToggle} aria-label={`Attiva regola su ${MARKETPLACE_LABELS[platform]}`} />
      </div>
      {children}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  step,
  unit = "",
  prefix = "",
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  prefix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border p-1">
      <Button type="button" variant="ghost" size="icon-sm" className="size-6" onClick={() => onChange(Math.max(min, value - step))} aria-label="Diminuisci">
        −
      </Button>
      <span className="min-w-[3.25rem] text-center font-mono text-sm tabular-nums">
        {prefix}
        {value}
        {unit}
      </span>
      <Button type="button" variant="ghost" size="icon-sm" className="size-6" onClick={() => onChange(Math.min(max, value + step))} aria-label="Aumenta">
        +
      </Button>
    </div>
  );
}
