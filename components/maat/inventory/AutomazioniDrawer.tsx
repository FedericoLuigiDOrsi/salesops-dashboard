"use client";

import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Box, Layers, RefreshCw, TrendingDown, Zap } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MARKETPLACE_LABELS, type Marketplace } from "@/types/maat";

type PlatformKey = Extract<Marketplace, "vinted" | "grailed" | "depop">;
const PLATFORM_KEYS: PlatformKey[] = ["vinted", "grailed", "depop"];

interface AutomazioniDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutomazioniDrawer({ open, onOpenChange }: AutomazioniDrawerProps) {
  // 1 · Auto-delist
  const [delistOn, setDelistOn] = useState(true);
  const [delistPlatforms, setDelistPlatforms] = useState<Record<PlatformKey, boolean>>({
    vinted: true,
    grailed: true,
    depop: true,
  });
  const [delistDays, setDelistDays] = useState(90);

  // 2 · Repricing automatico
  const [repricingOn, setRepricingOn] = useState(true);
  const [repricingDiscount, setRepricingDiscount] = useState(5);
  const [repricingFrequency, setRepricingFrequency] = useState("7");
  const [repricingFloor, setRepricingFloor] = useState(40);

  // 3 · Auto-relist
  const [relistOn, setRelistOn] = useState(true);
  const [relistPlatforms, setRelistPlatforms] = useState<Record<PlatformKey, boolean>>({
    vinted: true,
    grailed: true,
    depop: false,
  });
  const [relistFrequency, setRelistFrequency] = useState("7");

  // 4 · Pubblicazione multipiattaforma (manuale, niente switch)
  const [publishPlatforms, setPublishPlatforms] = useState<Record<PlatformKey, boolean>>({
    vinted: true,
    grailed: false,
    depop: true,
  });

  function togglePlatform(setter: Dispatch<SetStateAction<Record<PlatformKey, boolean>>>, key: PlatformKey) {
    setter((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="gap-1.5 border-b border-border">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Inventario · Regole
          </p>
          <SheetTitle className="text-xl">Automazioni</SheetTitle>
          <SheetDescription>
            Regole che agiscono in autonomia su listino, prezzo e pubblicazione dei capi.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {/* 1 · Auto-delist */}
          <AutoCard
            icon={<Box className="size-4" />}
            title="Auto-delist"
            description="Quando un capo viene venduto su una piattaforma selezionata, viene ritirato in automatico da tutte le altre."
            control={
              <Switch checked={delistOn} onCheckedChange={setDelistOn} aria-label="Attiva auto-delist" />
            }
            dimmed={!delistOn}
          >
            <ConfigRow label="Ritira quando venduto su" sub="La vendita su queste piattaforme fa da innesco">
              <PlatformChips value={delistPlatforms} onToggle={(k) => togglePlatform(setDelistPlatforms, k)} />
            </ConfigRow>
            <ConfigRow label="Ritira anche gli invenduti dopo" sub="Nessuna vendita nel periodo" inline>
              <Stepper value={delistDays} min={30} max={180} step={30} unit=" gg" onChange={setDelistDays} />
            </ConfigRow>
          </AutoCard>

          {/* 2 · Repricing automatico */}
          <AutoCard
            icon={<TrendingDown className="size-4" />}
            title="Repricing automatico"
            description="Abbassa da solo il prezzo degli annunci ancora invenduti: scegli di quanto e ogni quanto."
            control={
              <Switch checked={repricingOn} onCheckedChange={setRepricingOn} aria-label="Attiva repricing" />
            }
            dimmed={!repricingOn}
          >
            <ConfigRow label="Ribasso a ogni ciclo" hint="Consigliato −5%" inline>
              <Stepper value={repricingDiscount} min={1} max={20} step={1} unit="%" prefix="−" onChange={setRepricingDiscount} />
            </ConfigRow>
            <ConfigRow label="Ogni quanto" inline>
              <Select value={repricingFrequency} onValueChange={setRepricingFrequency}>
                <SelectTrigger size="sm" className="w-28" aria-label="Frequenza repricing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 giorni</SelectItem>
                  <SelectItem value="7">7 giorni</SelectItem>
                  <SelectItem value="14">14 giorni</SelectItem>
                  <SelectItem value="30">30 giorni</SelectItem>
                </SelectContent>
              </Select>
            </ConfigRow>
            <ConfigRow label="Prezzo minimo" sub="Non scendere oltre, dal prezzo iniziale" inline>
              <Stepper value={repricingFloor} min={10} max={70} step={5} unit="%" prefix="−" onChange={setRepricingFloor} />
            </ConfigRow>
          </AutoCard>

          {/* 3 · Auto-relist */}
          <AutoCard
            icon={<RefreshCw className="size-4" />}
            title="Auto-relist"
            description="Ripubblica in automatico gli annunci per farli risalire nei risultati: scegli su quali piattaforme e ogni quanto."
            control={
              <Switch checked={relistOn} onCheckedChange={setRelistOn} aria-label="Attiva auto-relist" />
            }
            dimmed={!relistOn}
          >
            <ConfigRow label="Piattaforme" sub="Il refresh avviene solo su quelle attive">
              <PlatformChips value={relistPlatforms} onToggle={(k) => togglePlatform(setRelistPlatforms, k)} />
            </ConfigRow>
            <ConfigRow label="Ripeti ogni" inline>
              <Select value={relistFrequency} onValueChange={setRelistFrequency}>
                <SelectTrigger size="sm" className="w-28" aria-label="Frequenza auto-relist">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 giorni</SelectItem>
                  <SelectItem value="7">7 giorni</SelectItem>
                  <SelectItem value="14">14 giorni</SelectItem>
                  <SelectItem value="30">30 giorni</SelectItem>
                </SelectContent>
              </Select>
            </ConfigRow>
          </AutoCard>

          {/* 4 · Pubblicazione multipiattaforma */}
          <AutoCard
            icon={<Layers className="size-4" />}
            title="Pubblicazione multipiattaforma"
            description="Piattaforme predefinite per i capi in inventario non ancora online. Avvii tu il processo."
            control={
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                Manuale
              </span>
            }
          >
            <ConfigRow label="Piattaforme predefinite">
              <PlatformChips value={publishPlatforms} onToggle={(k) => togglePlatform(setPublishPlatforms, k)} />
            </ConfigRow>
            <div className="flex items-center gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
              <Layers className="size-3.5 shrink-0" />
              <span>
                <span className="font-semibold text-foreground">3 capi</span> pronti alla pubblicazione
              </span>
            </div>
            <Button type="button" className="w-full gap-1.5">
              <Zap className="size-3.5" /> Avvia pubblicazione
            </Button>
          </AutoCard>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Salva regole
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function AutoCard({
  icon,
  title,
  description,
  control,
  dimmed,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  control: ReactNode;
  dimmed?: boolean;
  children: ReactNode;
}) {
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
        {control}
      </div>
      <div
        className={cn(
          "mt-4 flex flex-col gap-3 border-t border-border pt-4 transition-opacity",
          dimmed && "pointer-events-none opacity-40"
        )}
      >
        {children}
      </div>
    </section>
  );
}

function ConfigRow({
  label,
  sub,
  hint,
  inline,
  children,
}: {
  label: string;
  sub?: string;
  hint?: string;
  inline?: boolean;
  children: ReactNode;
}) {
  if (inline) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-foreground">
            {label} {hint && <span className="font-normal text-muted-foreground">{hint}</span>}
          </div>
          {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
        </div>
        {children}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div>
        <div className="text-xs font-medium text-foreground">{label}</div>
        {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
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
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-6"
        onClick={() => onChange(Math.max(min, value - step))}
        aria-label="Diminuisci"
      >
        −
      </Button>
      <span className="min-w-[3.25rem] text-center font-mono text-sm tabular-nums">
        {prefix}
        {value}
        {unit}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-6"
        onClick={() => onChange(Math.min(max, value + step))}
        aria-label="Aumenta"
      >
        +
      </Button>
    </div>
  );
}

function PlatformChips({
  value,
  onToggle,
}: {
  value: Record<PlatformKey, boolean>;
  onToggle: (key: PlatformKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PLATFORM_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={value[key]}
          onClick={() => onToggle(key)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
            value[key]
              ? "border-primary/60 bg-primary/15 text-foreground"
              : "border-border bg-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="flex size-4 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-semibold">
            {MARKETPLACE_LABELS[key][0]}
          </span>
          {MARKETPLACE_LABELS[key]}
        </button>
      ))}
    </div>
  );
}
