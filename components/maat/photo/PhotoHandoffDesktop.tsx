"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Images,
  Info,
  UploadCloud,
  Check,
} from "lucide-react";
import { useMaatEntry } from "@/lib/maat-store";
import { qrMatrix } from "@/components/maat/photo/qr-matrix";
import { cn } from "@/lib/utils";

type View = "scelta" | "qr" | "upload";

const SHOT_SEQUENCE = ["Fronte", "Retro", "Brand", "Taglia", "Materiale"];
const MIN_PHOTOS = 5;
const MAX_PHOTOS = 15;

const STEP_LABEL: Record<View, string> = {
  scelta: "Acquisizione foto",
  qr: "Scatta dal telefono",
  upload: "Carica dal computer",
};

export function PhotoHandoffDesktop() {
  const router = useRouter();
  const { entry } = useMaatEntry();
  const [view, setView] = useState<View>("scelta");

  // QR handoff simulated state
  const [shots, setShots] = useState(0);
  const [sent, setSent] = useState(false);

  // Upload simulated state
  const [uploaded, setUploaded] = useState(0);

  const matrix = useMemo(() => qrMatrix(23), []);

  function close() {
    // Non /capi/${id}: quella rotta è intercettata come Sheet laterale da
    // app/capi/@modal/(.)[id] — evitiamo lo stesso mismatch già corretto
    // lato mobile (vedi PhotoCaptureMobile.close()).
    router.push("/capi");
  }

  function goReview() {
    router.push(`/capi/${entry.id}/review`);
  }

  const connected = shots > 0;
  const shotLabel =
    shots >= SHOT_SEQUENCE.length
      ? "Set completo"
      : `Scatto ${shots + 1} · ${SHOT_SEQUENCE[shots]}`;
  const statusText = sent
    ? "Foto ricevute · scheda in preparazione"
    : shots >= MIN_PHOTOS
      ? `${shots} foto pronte · tocca Invia dal telefono`
      : connected
        ? `Telefono connesso · ${shots}/${MIN_PHOTOS} scatti`
        : "In attesa del telefono…";
  const statusProgress = sent ? 100 : Math.min((shots / MIN_PHOTOS) * 100, 100);

  function shoot() {
    if (sent) return;
    setShots((s) => Math.min(s + 1, MAX_PHOTOS));
  }

  function send() {
    if (shots < MIN_PHOTOS) return;
    setSent(true);
    window.setTimeout(goReview, 1100);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex h-16 flex-none items-center gap-3 border-b border-border px-4 sm:px-6">
        <button
          onClick={close}
          aria-label="Chiudi"
          className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        {view !== "scelta" && (
          <button
            onClick={() => setView("scelta")}
            aria-label="Indietro"
            className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
        <span className="ml-1 grid size-6 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
          M
        </span>
        <span className="text-sm font-semibold">Nuovo capo</span>
        <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {STEP_LABEL[view]}
        </span>
      </header>

      {/* Stage */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
          {view === "scelta" && <SceltaView onQr={() => setView("qr")} onUpload={() => setView("upload")} onCancel={close} />}
          {view === "qr" && (
            <QrView
              matrix={matrix}
              shots={shots}
              sent={sent}
              connected={connected}
              shotLabel={shotLabel}
              statusText={statusText}
              statusProgress={statusProgress}
              onShoot={shoot}
              onSend={send}
            />
          )}
          {view === "upload" && (
            <UploadView
              uploaded={uploaded}
              onAdd={() => setUploaded((n) => Math.min(n + 1, MAX_PHOTOS))}
              onContinue={goReview}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Scelta ─────────────────────────── */

function SceltaView({
  onQr,
  onUpload,
  onCancel,
}: {
  onQr: () => void;
  onUpload: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg">
      <Eyebrow>Scelta · Acquisizione</Eyebrow>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Come vuoi aggiungere le foto?</h1>
      <p className="mt-3 text-muted-foreground">
        Servono almeno <Mono>5</Mono> foto (max <Mono>15</Mono>) per far leggere il capo all&apos;AI.
      </p>

      <div className="mt-8 flex flex-col gap-3.5">
        <ChoiceButton
          icon={<Camera className="size-5" />}
          title="Scatta ora"
          badge="Consigliato"
          desc="Inquadra il QR e fotografa il capo dal telefono, con la fotocamera guidata."
          recommended
          onClick={onQr}
        />
        <ChoiceButton
          icon={<Images className="size-5" />}
          title="Carica dalla galleria"
          desc="Trascina più foto in blocco dal computer, poi assegnale agli slot."
          onClick={onUpload}
        />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 size-4 flex-none text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Misure automatiche (ArUco)</p>
            <p className="mt-0.5">
              Appoggia il capo sul pannello con i marker agli angoli e aggiungi quella foto tra gli
              scatti opzionali: la distanza nota tra i marker calcola le misure reali senza metro.
            </p>
          </div>
        </div>
        <div className="my-3.5 h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Set foto richiesto</span>
          <Mono className="text-xs text-muted-foreground">min 5 · max 15</Mono>
        </div>
        <div className="mt-3 space-y-2.5">
          <ChipRow label="Obbligatorie" chips={["Fronte", "Retro", "Etichetta brand"]} />
          <ChipRow label="Opzionali" chips={["Taglia", "Materiale", "Difetti", "Aggiuntive", "ArUco"]} muted />
        </div>
      </div>

      <button
        onClick={onCancel}
        className="mt-6 w-full rounded-lg border border-border bg-card py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Annulla
      </button>
    </div>
  );
}

function ChoiceButton({
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
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center gap-4 rounded-xl border bg-card p-4 text-left transition-all hover:border-foreground/25 hover:shadow-sm",
        recommended ? "border-foreground/15" : "border-border"
      )}
    >
      <span
        className={cn(
          "grid size-11 flex-none place-items-center rounded-lg",
          recommended ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        )}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          {badge && (
            <span className="rounded-full bg-primary px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{desc}</span>
      </span>
      <ChevronRight className="size-5 flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

/* ─────────────────────────── QR handoff ─────────────────────────── */

function QrView({
  matrix,
  shots,
  sent,
  connected,
  shotLabel,
  statusText,
  statusProgress,
  onShoot,
  onSend,
}: {
  matrix: boolean[][];
  shots: number;
  sent: boolean;
  connected: boolean;
  shotLabel: string;
  statusText: string;
  statusProgress: number;
  onShoot: () => void;
  onSend: () => void;
}) {
  return (
    <div className="grid items-start gap-12 lg:grid-cols-[1fr_minmax(260px,320px)]">
      {/* Left — instructions + QR */}
      <section>
        <Eyebrow>Photo-to-Catalog · Passo 1</Eyebrow>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Scatta le foto dal telefono</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          La fotocamera del telefono è più comoda del computer. Inquadra il codice con l&apos;app{" "}
          <b className="text-foreground">MAAT</b>: fotografi il capo dal telefono e le foto arrivano
          qui per l&apos;etichettatura.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-6">
          {/* QR card */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${matrix.length}, 1fr)`,
                width: 168,
                height: 168,
              }}
            >
              {matrix.flatMap((row, y) =>
                row.map((on, x) => (
                  <span
                    key={`${x}-${y}`}
                    className={on ? "bg-foreground" : "bg-transparent"}
                    style={{ borderRadius: 1 }}
                  />
                ))
              )}
            </div>
            <span className="pointer-events-none absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground ring-4 ring-card">
              M
            </span>
          </div>

          {/* Steps */}
          <ol className="flex-1 space-y-3">
            {[
              ["Apri MAAT sul telefono", "Non ce l'hai? Installalo dallo store."],
              ["Tocca Scansiona e inquadra questo QR", ""],
              ["Fotografa il capo", "L'app ti guida scatto per scatto."],
              ["Conferma dal telefono", "Le foto arrivano qui per l'etichettatura."],
            ].map(([title, sub], i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-6 flex-none place-items-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                  {i + 1}
                </span>
                <span className="text-sm">
                  <span className="font-medium">{title}</span>
                  {sub && <span className="mt-0.5 block text-xs text-muted-foreground">{sub}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <StoreBadge>App Store</StoreBadge>
          <StoreBadge>Google Play</StoreBadge>
          <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            Anche via web app
          </span>
        </div>

        {/* Status */}
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <span
            className={cn(
              "size-2 flex-none rounded-full",
              sent ? "bg-[#00804C]" : connected ? "bg-primary" : "bg-muted-foreground/40 animate-pulse"
            )}
          />
          <span className="flex-1 text-sm text-muted-foreground" role="status" aria-live="polite">
            {statusText}
          </span>
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${statusProgress}%` }}
            />
          </span>
        </div>
      </section>

      {/* Right — device preview */}
      <aside className="flex flex-col items-center gap-3">
        <div className="relative w-full max-w-[280px] rounded-[2.4rem] border-[10px] border-[#0b1f38] bg-[#001220] p-0 shadow-xl">
          <span className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/20" />
          <div className="relative flex aspect-[9/17.5] flex-col overflow-hidden rounded-[1.7rem]">
            {/* Viewfinder */}
            <div className="relative flex-1 bg-gradient-to-br from-[#0a2a4a] to-[#001220]">
              <div
                className="absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />
              <svg
                viewBox="0 0 48 48"
                className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 text-white/25"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.4}
              >
                <path d="M18 8 L24 12 L30 8 L38 14 L34 21 L30 18.5 L30 41 L18 41 L18 18.5 L14 21 L10 14 Z" />
              </svg>
              {/* corner guides */}
              <span className="absolute left-6 top-16 size-5 rounded-tl border-l-2 border-t-2 border-primary/70" />
              <span className="absolute right-6 top-16 size-5 rounded-tr border-r-2 border-t-2 border-primary/70" />
              <span className="absolute bottom-24 left-6 size-5 rounded-bl border-b-2 border-l-2 border-primary/70" />
              <span className="absolute bottom-24 right-6 size-5 rounded-br border-b-2 border-r-2 border-primary/70" />

              <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
                <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-white/90">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {shotLabel}
                </span>
                <span className="grid size-5 place-items-center rounded-full bg-black/30 text-[10px] text-white/70">
                  ?
                </span>
              </div>
              <p className="absolute inset-x-4 bottom-4 text-center font-mono text-[10px] leading-relaxed text-white/70">
                Inquadra tutto il capo dentro le guide · <span className="text-white">tocca</span> per scattare
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-3 bg-[#001220] px-4 py-4">
              <div className="flex w-10 gap-1">
                {Array.from({ length: Math.min(shots, 3) }).map((_, i) => (
                  <span key={i} className="size-6 flex-none rounded bg-white/15 ring-1 ring-primary/40" />
                ))}
              </div>
              <button
                onClick={onShoot}
                disabled={sent}
                aria-label="Scatta"
                className={cn(
                  "size-14 flex-none rounded-full border-4 border-white/80 bg-white transition-transform active:scale-95 disabled:opacity-40",
                  !connected && !sent && "animate-pulse"
                )}
              />
              <button
                onClick={onSend}
                disabled={shots < MIN_PHOTOS || sent}
                className={cn(
                  "w-10 text-right font-mono text-[11px] font-semibold uppercase tracking-wide transition-colors",
                  shots >= MIN_PHOTOS && !sent ? "text-primary" : "text-white/35"
                )}
              >
                {sent ? <Check className="ml-auto size-4 text-[#7fd4a6]" /> : "Invia"}
              </button>
            </div>
          </div>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" />
          Anteprima interattiva · tocca lo scatto
        </span>
      </aside>
    </div>
  );
}

function StoreBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium">
      {children}
    </span>
  );
}

/* ─────────────────────────── Upload ─────────────────────────── */

function UploadView({
  uploaded,
  onAdd,
  onContinue,
}: {
  uploaded: number;
  onAdd: () => void;
  onContinue: () => void;
}) {
  const enough = uploaded >= MIN_PHOTOS;
  return (
    <div className="mx-auto max-w-lg">
      <Eyebrow>Galleria · Passo 1</Eyebrow>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Carica le foto dal computer</h1>
      <p className="mt-3 text-muted-foreground">
        Trascina qui le foto grezze del capo, oppure sfoglia. Le etichetterai al passo successivo.
      </p>

      <button
        onClick={onAdd}
        className="mt-6 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card py-12 transition-colors hover:border-foreground/25"
      >
        <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <UploadCloud className="size-6" />
        </span>
        <span className="mt-1 font-semibold">Trascina le foto qui</span>
        <span className="text-sm text-muted-foreground">
          oppure <span className="text-foreground underline underline-offset-2">sfoglia dal computer</span>
        </span>
        <span className="mt-1 flex gap-1.5">
          {["JPG", "PNG", "HEIC", "max 20 MB"].map((f) => (
            <span key={f} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {f}
            </span>
          ))}
        </span>
      </button>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span>
          <b>{uploaded}</b> / {MAX_PHOTOS} foto
        </span>
        <span className="text-muted-foreground">
          {enough ? "Set minimo raggiunto" : `Trascina qui o seleziona · min ${MIN_PHOTOS}`}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min((uploaded / MIN_PHOTOS) * 100, 100)}%` }}
        />
      </div>

      <button
        onClick={onContinue}
        disabled={!enough}
        className="mt-6 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
      >
        Continua all&apos;etichettatura
      </button>
    </div>
  );
}

/* ─────────────────────────── Shared bits ─────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </span>
  );
}

function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-mono text-foreground", className)}>{children}</span>;
}

function ChipRow({ label, chips, muted }: { label: string; chips: string[]; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 flex-none font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={c}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              muted ? "bg-muted text-muted-foreground" : "bg-foreground/5 text-foreground"
            )}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
