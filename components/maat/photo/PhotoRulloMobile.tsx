"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronLeft,
  Camera,
  Images,
  Plus,
  Check,
  Info,
  ImageIcon,
} from "lucide-react";
import { useMaatEntry } from "@/lib/maat-store";
import type { PhotoLabel } from "@/types/maat";
import { cn } from "@/lib/utils";

type Step = "scelta" | "acquisizione" | "etichettatura" | "elaborazione";

interface RawPhoto {
  id: string;
  label: PhotoLabel | null;
}

const LABELS: {
  label: PhotoLabel;
  text: string;
  required: boolean;
  aiTargeted?: boolean;
}[] = [
  { label: "fronte", text: "Fronte", required: true },
  { label: "retro", text: "Retro", required: true },
  { label: "brand", text: "Etichetta brand", required: true },
  { label: "taglia", text: "Taglia", required: false },
  { label: "materiale", text: "Materiale", required: false, aiTargeted: true },
  { label: "extra", text: "Aggiuntive", required: false },
];

const REQUIRED: PhotoLabel[] = ["fronte", "retro", "brand"];
const MIN_PHOTOS = 5;
const MAX_PHOTOS = 15;
const STEP_INDEX: Record<Step, number> = {
  scelta: 1,
  acquisizione: 2,
  etichettatura: 3,
  elaborazione: 4,
};
const TOTAL_STEPS = 6;

function seedPhotos(n: number): RawPhoto[] {
  return Array.from({ length: n }, (_, i) => ({ id: `raw-${i}`, label: null }));
}

export function PhotoRulloMobile({ initialLabel }: { initialLabel: PhotoLabel }) {
  const router = useRouter();
  const { entry, updatePhoto } = useMaatEntry();

  const [step, setStep] = useState<Step>("scelta");
  const [photos, setPhotos] = useState<RawPhoto[]>(() => seedPhotos(MIN_PHOTOS));
  const [activeIdx, setActiveIdx] = useState(0);

  function close() {
    router.push(`/capi/${entry.id}`);
  }

  function back() {
    if (step === "acquisizione") setStep("scelta");
    else if (step === "etichettatura") setStep("acquisizione");
    else close();
  }

  const labeledCount = photos.filter((p) => p.label).length;
  const requiredMet = REQUIRED.every((r) => photos.some((p) => p.label === r));

  function addPhoto() {
    setPhotos((prev) =>
      prev.length >= MAX_PHOTOS ? prev : [...prev, { id: `raw-${prev.length}`, label: null }]
    );
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function firstUnlabeled(list: RawPhoto[]) {
    const i = list.findIndex((p) => !p.label);
    return i >= 0 ? i : 0;
  }

  function startLabeling() {
    setActiveIdx(firstUnlabeled(photos));
    setStep("etichettatura");
  }

  function assign(label: PhotoLabel) {
    setPhotos((prev) => {
      const next = prev.map((p, i) => (i === activeIdx ? { ...p, label } : p));
      const nextUnlabeled = next.findIndex((p, i) => i !== activeIdx && !p.label);
      setActiveIdx(nextUnlabeled >= 0 ? nextUnlabeled : activeIdx);
      return next;
    });
  }

  function elabora() {
    if (!requiredMet) return;
    // Commit each labeled raw photo into the entry store (one photo per label).
    photos
      .filter((p): p is RawPhoto & { label: PhotoLabel } => Boolean(p.label))
      .forEach((p) => {
        updatePhoto(p.label, {
          id: `${p.label}-${p.id}`,
          label: p.label,
          url: "/placeholder.jpg",
          photoType: "standard",
          state: "captured",
          createdAt: "2026-07-20T00:00:00.000Z",
        });
      });
    setStep("elaborazione");
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      {/* Flow bar */}
      <header className="flex h-14 flex-none items-center gap-3 border-b border-border px-4">
        <button
          onClick={step === "scelta" ? close : back}
          aria-label={step === "scelta" ? "Chiudi" : "Indietro"}
          className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          {step === "scelta" ? <X className="size-5" /> : <ChevronLeft className="size-5" />}
        </button>
        <div className="flex flex-1 items-center gap-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i < STEP_INDEX[step] ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {STEP_INDEX[step]} / {TOTAL_STEPS}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {step === "scelta" && (
          <SceltaStep onScatta={() => setStep("acquisizione")} onGalleria={() => setStep("acquisizione")} onCancel={close} />
        )}
        {step === "acquisizione" && (
          <AcquisizioneStep
            count={photos.length}
            photos={photos}
            onAdd={addPhoto}
            onRemove={removePhoto}
            onContinue={startLabeling}
          />
        )}
        {step === "etichettatura" && (
          <EtichettaturaStep
            photos={photos}
            activeIdx={activeIdx}
            labeledCount={labeledCount}
            requiredMet={requiredMet}
            onPick={(i) => setActiveIdx(i)}
            onAssign={assign}
            onElabora={elabora}
          />
        )}
        {step === "elaborazione" && (
          <ElaborazioneStep onDone={() => router.push(`/capi/${entry.id}/review`)} onBackground={close} />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Step 1 · Scelta ─────────────────────────── */

function SceltaStep({
  onScatta,
  onGalleria,
  onCancel,
}: {
  onScatta: () => void;
  onGalleria: () => void;
  onCancel: () => void;
}) {
  return (
    <div>
      <Eyebrow>Scelta · Step 1/6</Eyebrow>
      <h1 className="mt-1.5 text-2xl font-bold tracking-tight">Come vuoi aggiungere le foto?</h1>
      <p className="mt-2.5 text-sm text-muted-foreground">
        Servono almeno <Mono>5</Mono> foto (max <Mono>15</Mono>) per far leggere il capo all&apos;AI.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <MobileChoice icon={<Camera className="size-5" />} title="Scatta ora" badge="Consigliato" desc="Fotografa il capo slot per slot, con la fotocamera guidata." recommended onClick={onScatta} />
        <MobileChoice icon={<Images className="size-5" />} title="Carica dalla galleria" desc="Seleziona più foto in blocco, poi assegnale agli slot." onClick={onGalleria} />
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-muted/60 p-3">
        <Info className="mt-0.5 size-4 flex-none text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <b className="text-foreground">Misure automatiche (ArUco)</b> — aggiungi una foto col marker tra
          gli scatti opzionali: l&apos;AI calcola le misure in automatico.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Set foto richiesto</span>
          <Mono className="text-xs text-muted-foreground">min 5 · max 15</Mono>
        </div>
        <div className="mt-3 space-y-2.5">
          <ChipRow label="Obbligatorie" chips={["Fronte", "Retro", "Etichetta brand"]} />
          <ChipRow label="Opzionali" chips={["Taglia", "Materiale", "Difetti", "Aggiuntive", "ArUco"]} muted />
        </div>
      </div>

      <button onClick={onCancel} className="mt-5 w-full rounded-lg border border-border py-3 text-sm font-medium text-muted-foreground">
        Annulla
      </button>
    </div>
  );
}

function MobileChoice({
  icon,
  title,
  desc,
  badge,
  recommended,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge?: string;
  recommended?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-3.5 text-left active:bg-muted/50">
      <span className={cn("grid size-10 flex-none place-items-center rounded-lg", recommended ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
        {icon}
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          {badge && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-primary-foreground">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}

/* ─────────────────────────── Step 2 · Acquisizione ─────────────────────────── */

function AcquisizioneStep({
  count,
  photos,
  onAdd,
  onRemove,
  onContinue,
}: {
  count: number;
  photos: RawPhoto[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onContinue: () => void;
}) {
  const enough = count >= MIN_PHOTOS;
  const remaining = Math.max(MIN_PHOTOS - count, 0);
  return (
    <div className="flex min-h-full flex-col">
      <Eyebrow>Acquisizione · Step 2/6</Eyebrow>
      <h1 className="mt-1.5 text-2xl font-bold tracking-tight">Aggiungi le foto</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Scatta o scegli dalla galleria le foto grezze del capo. Le{" "}
        <b className="text-foreground">etichetterai al passo successivo</b>: qui pensa solo a raccoglierle.
      </p>

      <div className="mt-5 flex gap-2.5">
        <button onClick={onAdd} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground active:opacity-90">
          <Camera className="size-4" /> Scatta
        </button>
        <button onClick={onAdd} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium active:bg-muted/50">
          <Images className="size-4" /> Galleria
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm font-semibold">Foto aggiunte</span>
        <Mono className="text-xs text-muted-foreground">
          {count} / {MAX_PHOTOS} · min {MIN_PHOTOS}
        </Mono>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((count / MIN_PHOTOS) * 100, 100)}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {enough ? "Set minimo raggiunto — puoi continuare." : <>Ancora <Mono>{remaining}</Mono> foto per raggiungere il minimo.</>}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {photos.map((p) => (
          <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
            <PhotoPlaceholder />
            <button
              onClick={() => onRemove(p.id)}
              aria-label="Rimuovi foto"
              className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-background/85 text-[#E5484D] shadow-sm"
            >
              <X className="size-3" strokeWidth={2.5} />
            </button>
          </div>
        ))}
        {count < MAX_PHOTOS && (
          <button onClick={onAdd} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground active:bg-muted/50">
            <Plus className="size-5" />
            <span className="text-[11px]">Aggiungi</span>
          </button>
        )}
      </div>

      <div className="mt-auto pt-6">
        <p className="mb-2 text-center text-xs text-muted-foreground">L&apos;etichettatura di ogni foto arriva al passo successivo.</p>
        <button
          onClick={onContinue}
          disabled={!enough}
          className="w-full rounded-lg bg-foreground py-3 text-sm font-semibold text-background transition-opacity disabled:opacity-40"
        >
          Continua
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Step 3 · Etichettatura (rullo) ─────────────────────────── */

function EtichettaturaStep({
  photos,
  activeIdx,
  labeledCount,
  requiredMet,
  onPick,
  onAssign,
  onElabora,
}: {
  photos: RawPhoto[];
  activeIdx: number;
  labeledCount: number;
  requiredMet: boolean;
  onPick: (i: number) => void;
  onAssign: (label: PhotoLabel) => void;
  onElabora: () => void;
}) {
  const active = photos[activeIdx];
  const countByLabel = useMemo(() => {
    const map = {} as Record<PhotoLabel, number>;
    photos.forEach((p) => {
      if (p.label) map[p.label] = (map[p.label] ?? 0) + 1;
    });
    return map;
  }, [photos]);

  return (
    <div className="flex min-h-full flex-col">
      <Eyebrow>Etichettatura · Step 3/6</Eyebrow>
      <h1 className="mt-1.5 text-2xl font-bold tracking-tight">Che foto è questa?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Assegna un&apos;etichetta a ogni foto: aiuta l&apos;AI a leggere meglio il capo. Puoi correggere qualsiasi assegnazione qui sotto.
      </p>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        {/* Hero + rullo */}
        <div className="flex gap-4">
          <div className="relative aspect-square w-28 flex-none overflow-hidden rounded-xl border border-border bg-muted">
            <PhotoPlaceholder large />
            <span className="absolute left-1.5 top-1.5 rounded-full bg-background/85 px-2 py-0.5 font-mono text-[10px] font-semibold shadow-sm">
              {Math.min(activeIdx + 1, photos.length)} / {photos.length}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Etichetta:</span>
            <div className="mt-2 flex flex-col gap-1.5">
              {LABELS.map((l) => {
                const isCurrent = active?.label === l.label;
                const usedCount = countByLabel[l.label] ?? 0;
                return (
                  <button
                    key={l.label}
                    onClick={() => onAssign(l.label)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-colors",
                      isCurrent
                        ? "border-primary bg-primary/15"
                        : usedCount > 0
                          ? "border-border bg-muted/50 text-muted-foreground"
                          : "border-border bg-card active:bg-muted/50"
                    )}
                  >
                    <span className="flex-1">
                      {l.text}
                      {l.required && <span className="ml-1 text-[#E5484D]">*</span>}
                    </span>
                    {l.aiTargeted && <span title="L'AI controlla mirato questa foto">🎯</span>}
                    {usedCount > 0 && <Check className="size-3.5 text-[#00804C]" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rullo — striscia scorrevole delle foto */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => {
            const meta = LABELS.find((l) => l.label === p.label);
            return (
              <button
                key={p.id}
                onClick={() => onPick(i)}
                className={cn(
                  "relative aspect-square w-14 flex-none overflow-hidden rounded-lg border-2 transition-colors",
                  i === activeIdx ? "border-primary" : p.label ? "border-[#00804C]/40" : "border-border"
                )}
                aria-label={meta ? `Foto etichettata ${meta.text}` : "Foto da etichettare"}
              >
                <PhotoPlaceholder />
                {p.label && (
                  <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#00804C] text-white ring-2 ring-card">
                    <Check className="size-2.5" strokeWidth={4} />
                  </span>
                )}
                {meta && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-background/85 px-1 py-0.5 text-center text-[8px] font-semibold uppercase tracking-wide">
                    {meta.text}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-start gap-2 border-t border-border pt-3">
          <span className="mt-0.5 size-2 flex-none animate-pulse rounded-full bg-primary" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Scegli un&apos;etichetta → si passa alla prossima. <span className="font-mono">🎯</span> = l&apos;AI controlla mirato quella foto ·{" "}
            <span className="font-mono">📐</span> = usata per le misure.
          </p>
        </div>
      </div>

      {/* Riepilogo per tag */}
      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm font-semibold">Assegnate per tag · correggi qui</span>
        <Mono className="text-[11px] text-muted-foreground">{labeledCount}/{photos.length} etichettate</Mono>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {LABELS.map((l) => {
          const c = countByLabel[l.label] ?? 0;
          const missing = l.required && c === 0;
          return (
            <div
              key={l.label}
              className={cn(
                "rounded-xl border p-2.5",
                missing ? "border-[#E5484D]/40 bg-[#E5484D]/5" : "border-border bg-card"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <span className={cn("size-1.5 rounded-full", missing ? "bg-[#E5484D]" : c > 0 ? "bg-[#00804C]" : "bg-muted-foreground/40")} />
                  {l.text}
                </span>
                <span className={cn("font-mono text-[10px]", missing ? "text-[#E5484D]" : "text-muted-foreground")}>
                  {l.required ? `${c}/1` : c}
                </span>
              </div>
              <div className="mt-2 aspect-[2/1] overflow-hidden rounded-lg bg-muted">
                {c > 0 ? <PhotoPlaceholder /> : <div className="grid size-full place-items-center text-muted-foreground/50"><ImageIcon className="size-4" /></div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={onElabora}
          disabled={!requiredMet}
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
        >
          Elabora con l&apos;AI
        </button>
        {!requiredMet && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Etichetta le foto obbligatorie (Fronte, Retro, Etichetta brand) per continuare.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Step 4 · Elaborazione ─────────────────────────── */

const PROC_STAGES = [
  "Leggo l'etichetta brand…",
  "Estraggo tipo capo e colore…",
  "Stimo taglia e materiale…",
  "Calcolo le misure dal marker…",
  "Compongo la scheda…",
];

function ElaborazioneStep({ onDone, onBackground }: { onDone: () => void; onBackground: () => void }) {
  const [pct, setPct] = useState(6);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPct((p) => {
        if (p >= 100) {
          window.clearInterval(id);
          window.setTimeout(onDone, 500);
          return 100;
        }
        return Math.min(p + 4, 100);
      });
    }, 220);
    return () => window.clearInterval(id);
  }, [onDone]);

  const stage = PROC_STAGES[Math.min(Math.floor(pct / 20), PROC_STAGES.length - 1)];

  return (
    <div className="flex min-h-full flex-col">
      <Eyebrow>Elaborazione · Step 4/6</Eyebrow>
      <h1 className="mt-1.5 text-2xl font-bold tracking-tight">Sto preparando la scheda</h1>

      <div className="mt-5 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className="size-2 animate-pulse rounded-full bg-primary" /> Elaborazione AI
          </span>
          <Mono className="text-sm font-semibold">{pct}%</Mono>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <span className="block h-full rounded-full bg-primary transition-all duration-200" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{stage}</span>
          <Mono className="text-xs text-muted-foreground">~{Math.max(Math.ceil((100 - pct) / 8), 0)}s rimanenti</Mono>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {[38, 30, 44].map((w, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3.5">
            <div className="h-2 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
            <div className="mt-2 h-3.5 animate-pulse rounded bg-muted" style={{ width: `${w + 22}%` }} />
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center gap-2 pt-6">
        <button onClick={onBackground} className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground active:bg-muted/50">
          Continua in background
        </button>
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          Puoi caricare un nuovo capo: lo ritrovi in <b className="text-foreground">Bozze</b> quando è pronto.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────── Shared bits ─────────────────────────── */

function PhotoPlaceholder({ large }: { large?: boolean }) {
  return (
    <div className="grid size-full place-items-center bg-gradient-to-br from-muted to-muted/60 text-muted-foreground/40">
      <ImageIcon className={large ? "size-8" : "size-5"} strokeWidth={1.4} />
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{children}</span>;
}

function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-mono text-foreground", className)}>{children}</span>;
}

function ChipRow({ label, chips, muted }: { label: string; chips: string[]; muted?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-16 flex-none pt-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span key={c} className={cn("rounded-full px-2.5 py-1 text-xs font-medium", muted ? "bg-muted text-muted-foreground" : "bg-foreground/5 text-foreground")}>
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
