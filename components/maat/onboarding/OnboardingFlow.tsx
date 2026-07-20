"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Check, ChevronLeft, Lock, Play, Shirt, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Sequenza prodotto (welcome→bozza) porta a /registrazione reale, mai a pannelli auth finti.
// "browser"/"channels"/"done" sono raggiunti solo dopo la registrazione vera, via ?step=browser.
type Step = "welcome" | "platforms" | "scheda" | "camera" | "bozza" | "browser" | "channels" | "done";
const STEPS: Step[] = ["welcome", "platforms", "scheda", "camera", "bozza", "browser", "channels", "done"];

function PanelShell({
  dark,
  className,
  children,
}: {
  dark?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-h-dvh flex-col items-center", dark ? "bg-foreground text-background" : "bg-background text-foreground")}>
      <div className={cn("flex w-full max-w-sm flex-1 flex-col px-5 py-8", className)}>{children}</div>
    </div>
  );
}

function BackButton({ dark, onClick }: { dark?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Indietro"
      className={cn(
        "mb-2 flex size-8 items-center justify-center rounded-full transition-colors",
        dark ? "text-background/70 hover:bg-background/10 hover:text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <ChevronLeft className="size-4" />
    </button>
  );
}

const PLATFORMS = [
  { id: "vinted", name: "Vinted", short: "VI", note: "Il tuo canale principale" },
  { id: "depop", name: "Depop", short: "DE" },
  { id: "vestiaire", name: "Vestiaire", short: "VC" },
  { id: "catawiki", name: "Catawiki", short: "CW" },
  { id: "ebay", name: "eBay", short: "EB" },
];

const BOZZA_ATTRS = [
  { key: "Brand", value: "Carhartt WIP", ai: true },
  { key: "Categoria", value: "Bomber", ai: true },
  { key: "Taglia", value: "M", ai: true },
  { key: "Colore", value: "Verde militare", ai: true },
  { key: "Prezzo", value: "€ 68", ai: false },
];

const CHANNELS = [
  { id: "vinted", name: "Vinted", short: "VI", note: "Sessione attiva" },
  { id: "depop", name: "Depop", short: "DE" },
  { id: "vestiaire", name: "Vestiaire", short: "VC" },
];

export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedStep = searchParams.get("step") as Step | null;
  const initialStep: Step = requestedStep && STEPS.includes(requestedStep) ? requestedStep : "welcome";

  const [current, setCurrent] = React.useState<Step>(initialStep);
  const [stack, setStack] = React.useState<Step[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = React.useState(new Set(["vinted", "depop"]));
  const [connectedChannels, setConnectedChannels] = React.useState(new Set(["vinted"]));
  const [flashing, setFlashing] = React.useState(false);

  const go = (step: Step) => {
    setStack((s) => [...s, current]);
    setCurrent(step);
  };
  const back = () => {
    setStack((s) => {
      if (!s.length) return s;
      const next = [...s];
      setCurrent(next.pop() as Step);
      return next;
    });
  };
  const canGoBack = stack.length > 0;

  const togglePlatform = (id: string) =>
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleChannel = (id: string) =>
    setConnectedChannels((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleShoot = () => {
    setFlashing(true);
    setTimeout(() => setFlashing(false), 200);
    setTimeout(() => go("bozza"), 420);
  };

  switch (current) {
    case "welcome":
      return (
        <PanelShell dark className="items-center justify-center gap-3 text-center">
          <div className="mb-2 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wide text-background/70">MAAT</span>
          </div>
          <h1 className="text-[38px] font-extrabold leading-[1.02] tracking-tight">
            Fotografi il capo.
            <br />
            <span className="text-primary">MAAT fa il resto.</span>
          </h1>
          <p className="mt-2 max-w-xs text-sm text-background/70">
            Titolo, descrizione, misure e prezzo, pubblicati su tutte le tue piattaforme. Tu scatti, il lavoro è fatto.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3">
            <Button className="h-11" onClick={() => go("platforms")}>
              Inizia ora
            </Button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm text-background/70 underline-offset-2 hover:underline"
            >
              Ho già un account
            </button>
          </div>
        </PanelShell>
      );

    case "platforms":
      return (
        <PanelShell className="gap-3">
          <BackButton onClick={back} />
          <h2 className="text-[25px] font-extrabold leading-tight tracking-tight">
            Dove vendi
            <br />
            adesso?
          </h2>
          <p className="text-sm text-muted-foreground">Seleziona le piattaforme che usi. Le colleghi dopo.</p>
          <div className="mt-2 flex flex-col gap-2">
            {PLATFORMS.map((p) => {
              const selected = selectedPlatforms.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    selected ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-bold">
                    {p.short}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{p.name}</span>
                    {p.note && <span className="block text-xs text-muted-foreground">{p.note}</span>}
                  </span>
                  {selected && <Check className="size-4 shrink-0 text-primary" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
          <div className="mt-auto flex flex-col gap-2 pt-6">
            <Button className="h-11" onClick={() => go("scheda")}>
              Continua
            </Button>
            <button
              type="button"
              onClick={() => router.push("/registrazione")}
              className="self-center text-sm text-muted-foreground hover:underline"
            >
              Salta per ora
            </button>
          </div>
        </PanelShell>
      );

    case "scheda":
      return (
        <PanelShell className="gap-3">
          <BackButton onClick={back} />
          <h2 className="text-[25px] font-extrabold leading-tight tracking-tight">
            Il tuo primo
            <br />
            articolo
          </h2>
          <p className="text-sm text-muted-foreground">
            Scatta il capo: MAAT riconosce marca, categoria e taglia e compila la scheda.
          </p>
          <button
            type="button"
            onClick={() => go("camera")}
            className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/40 p-6 text-center transition-colors hover:bg-muted/60"
          >
            <Camera className="size-7 text-muted-foreground" />
            <span className="text-sm font-semibold">Crea il tuo primo articolo</span>
            <span className="text-xs font-semibold text-primary">+ Scatta il capo</span>
          </button>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> L'AI compilerà la scheda dallo scatto
          </p>
          <div className="overflow-hidden rounded-xl border border-border">
            {["Brand", "Categoria", "Taglia", "Colore", "Prezzo"].map((k) => (
              <div key={k} className="flex items-center justify-between border-b border-border px-3 py-2.5 text-sm last:border-0">
                <span className="text-muted-foreground">{k}</span>
                <span className="h-3 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => router.push("/registrazione")}
            className="mt-auto self-center pt-4 text-sm text-muted-foreground hover:underline"
          >
            Salta
          </button>
        </PanelShell>
      );

    case "camera":
      return (
        <div className="relative flex min-h-dvh flex-col bg-black text-white">
          <div className="flex items-center justify-between px-5 pt-8">
            <button type="button" onClick={back} aria-label="Chiudi" className="text-white/80 hover:text-white">
              <X className="size-5" />
            </button>
            <span className="font-mono text-xs uppercase tracking-wide text-white/70">Fronte</span>
            <span className="size-5" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <Shirt className="size-24 text-white/20" strokeWidth={1} />
          </div>
          <p className="pb-4 text-center text-sm text-white/70">Inquadra il capo e scatta</p>
          <div className="flex justify-center pb-10">
            <button
              type="button"
              onClick={handleShoot}
              aria-label="Scatta"
              className="size-16 rounded-full border-4 border-white/80 bg-white/10 transition-transform active:scale-95"
            />
          </div>
          <div
            aria-hidden="true"
            className={cn("pointer-events-none absolute inset-0 bg-white transition-opacity duration-300", flashing ? "opacity-90" : "opacity-0")}
          />
        </div>
      );

    case "bozza":
      return (
        <PanelShell className="gap-3">
          <BackButton onClick={back} />
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">Articolo pronto</p>
          <h2 className="text-[25px] font-extrabold leading-tight tracking-tight">
            Il tuo capo
            <br />è pronto
          </h2>
          <p className="text-sm text-muted-foreground">Foto e scheda compilate. Conservalo creando l'account.</p>
          <div className="flex gap-2">
            {["Fronte", "Retro", "Dettaglio"].map((label, i) => (
              <div key={label} className="relative flex h-20 flex-1 items-center justify-center rounded-xl border border-border bg-muted/40">
                <Shirt className="size-7 text-muted-foreground/50" strokeWidth={1} />
                <span className="absolute bottom-1 left-1.5 text-[10px] font-medium text-muted-foreground">{label}</span>
                {i === 0 && (
                  <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-2.5" strokeWidth={3.5} />
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            {BOZZA_ATTRS.map(({ key, value, ai }) => (
              <div key={key} className="flex items-center justify-between border-b border-border px-3 py-2.5 text-sm last:border-0">
                <span className="text-muted-foreground">{key}</span>
                <span className="flex items-center gap-1.5 font-medium">
                  {value}
                  {ai && (
                    <span className="rounded-full bg-primary/25 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#5f6a12]">AI</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-auto flex flex-col gap-2 pt-4">
            <Button className="h-11" onClick={() => router.push("/registrazione")}>
              Conserva l'articolo e registrati
            </Button>
            <button
              type="button"
              onClick={() => router.push("/registrazione")}
              className="self-center text-sm text-muted-foreground hover:underline"
            >
              Salta ed entra
            </button>
          </div>
        </PanelShell>
      );

    case "browser":
      return (
        <PanelShell dark className="gap-3">
          {canGoBack && <BackButton dark onClick={back} />}
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-background/60">Collega il browser · 2 minuti</p>
          <h2 className="text-[25px] font-extrabold leading-tight tracking-tight">
            Collega il
            <br />
            browser
          </h2>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-background/15 bg-background/5 py-8">
            <Play className="size-5" />
            <span className="font-mono text-xs">0:45</span>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-background/15 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Lock className="size-3.5" /> Le tue credenziali restano tue
            </p>
            <p className="text-xs text-background/70">
              L'estensione pubblica nella tua sessione, come se fossi tu. MAAT non vede né conserva la tua password, e non può
              entrare nel tuo account senza che tu sia loggato.
            </p>
          </div>
          <div className="mt-auto flex flex-col gap-2 pt-6">
            <Button className="h-11" onClick={() => go("channels")}>
              Aggiungi MAAT a Chrome
            </Button>
            <button type="button" onClick={() => go("channels")} className="self-center text-sm text-background/70 hover:underline">
              Uso Firefox o Edge
            </button>
          </div>
        </PanelShell>
      );

    case "channels":
      return (
        <PanelShell dark className="gap-3">
          <BackButton dark onClick={back} />
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-background/60">Collega i canali</p>
          <h2 className="text-[25px] font-extrabold leading-tight tracking-tight">
            Collega i
            <br />
            tuoi canali
          </h2>
          <p className="text-sm text-background/70">Aggancia i canali che hai scelto. MAAT pubblicherà lì per te, come se fossi tu.</p>
          <div className="flex flex-col gap-2">
            {CHANNELS.map((c) => {
              const connected = connectedChannels.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleChannel(c.id)}
                  className="flex items-center gap-3 rounded-xl border border-background/15 bg-background/5 px-3 py-2.5"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background/10 font-mono text-[10px] font-bold">
                    {c.short}
                  </span>
                  <span className="flex-1 text-left">
                    <span className="block text-sm font-semibold">{c.name}</span>
                    {c.note && connected && <span className="block text-xs text-background/60">{c.note}</span>}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      connected ? "bg-primary text-primary-foreground" : "border border-background/20 text-background/70"
                    )}
                  >
                    {connected ? "Collegato" : "Collega"}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-auto flex flex-col gap-2 pt-6">
            <Button className="h-11" onClick={() => go("done")}>
              Vai alla dashboard
            </Button>
            <button type="button" onClick={() => go("done")} className="self-center text-sm text-background/70 hover:underline">
              Lo faccio dopo
            </button>
          </div>
        </PanelShell>
      );

    case "done":
      return (
        <PanelShell className="items-center justify-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-6" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Account creato correttamente</h2>
          <p className="max-w-xs text-sm text-muted-foreground">Il tuo account è pronto e la bozza è salvata. Entra in MAAT per pubblicare.</p>
          <Button className="mt-4 h-11 w-full" onClick={() => router.push("/")}>
            Entra in MAAT
          </Button>
        </PanelShell>
      );
  }
}
