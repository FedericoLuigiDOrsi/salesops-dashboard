"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Zap,
  Check,
  Shirt,
  Tag,
  Ruler,
  Layers,
  Search,
  Images,
  ScanLine,
  RotateCw,
  type LucideIcon,
} from "lucide-react";
import { useMaatEntry } from "@/lib/maat-store";
import type { PhotoLabel } from "@/types/maat";
import { cn } from "@/lib/utils";

/**
 * Acquisizione foto mobile — porting fedele del wireframe v2b
 * (public/mobile/acquisizione-foto-v2b.html): spina di dot verticale
 * (bianco=fatto, fluo=corrente, grigio=da fare, NIENTE contatore n/8),
 * etichetta del capo transiente in alto, menu ad arco a semiluna che si
 * apre solo dalla spina, tap-to-focus sull'inquadratura.
 *
 * Costanti geometriche del menu ad arco identiche al wireframe: la spina
 * di dot resta visibile a riposo mentre il resto dell'arco (icone, anello)
 * appare solo con il menu aperto — evita di dover ricalcolare il layout,
 * riusa esattamente i numeri validati con Federico (STEP/R/RANGE/RGT).
 */

type SlotDef = {
  text: string;
  icon: LucideIcon;
  photoLabel: PhotoLabel;
  hint?: string;
};

const SLOTS: SlotDef[] = [
  { text: "Fronte", icon: Shirt, photoLabel: "fronte" },
  { text: "Retro", icon: Shirt, photoLabel: "retro" },
  { text: "Brand", icon: Tag, photoLabel: "brand" },
  { text: "Taglia", icon: Ruler, photoLabel: "taglia" },
  { text: "Materiale", icon: Layers, photoLabel: "materiale" },
  { text: "Difetti", icon: Search, photoLabel: "difetti" },
  { text: "Extra", icon: Images, photoLabel: "extra" },
  { text: "ArUco", icon: ScanLine, photoLabel: "aruco", hint: "marker per le misure automatiche" },
];

const N = SLOTS.length;
const MIN_READY = 5;
const REQUIRED_LABELS = new Set<PhotoLabel>(["fronte", "retro", "brand"]);
const REQUIRED_INDEXES = SLOTS.reduce<number[]>((acc, slot, i) => {
  if (REQUIRED_LABELS.has(slot.photoLabel)) acc.push(i);
  return acc;
}, []);
const STEP = (15 * Math.PI) / 180;
const R = 150;
const RANGE = 4.2;
const RGT = { CX: 412, CY: 214 };
const DRAG_PX_PER_STEP = 52;

interface PhotoCaptureMobileProps {
  initialLabel?: PhotoLabel;
}

export function PhotoCaptureMobile({ initialLabel }: PhotoCaptureMobileProps) {
  const router = useRouter();
  const { entry, updatePhoto } = useMaatEntry();

  const initialIndex = Math.max(0, SLOTS.findIndex((s) => s.photoLabel === initialLabel));

  const [held, setHeld] = useState(false);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [done, setDone] = useState<boolean[]>(() => Array(N).fill(false));
  const [labelShown, setLabelShown] = useState(false);
  const [labelText, setLabelText] = useState(SLOTS[initialIndex].text);
  const [slotHint, setSlotHint] = useState<string | null>(SLOTS[initialIndex].hint ?? null);
  const [flash, setFlash] = useState(false);
  const [snap, setSnap] = useState(false);
  const [focus, setFocus] = useState<{ key: number; x: number; y: number } | null>(null);

  const afRef = useRef(initialIndex);
  const iconRefs = useRef<Array<HTMLDivElement | null>>([]);
  const selectorRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const labelTimerRef = useRef<number | null>(null);

  const doneCount = done.filter(Boolean).length;
  const requiredDone = REQUIRED_INDEXES.every((i) => done[i]);
  const ready = doneCount >= MIN_READY && requiredDone;

  function close() {
    // Va alla lista, non al dettaglio capo: /capi/${id} è intercettata da
    // app/capi/@modal/(.)[id] e aprirebbe il Sheet laterale su una bozza
    // annullata (mai voluto, vedi taccuino-2026-07-21-maat-p2c-nav-bugfix).
    router.push("/capi");
  }

  function complete() {
    if (!ready) return;
    SLOTS.forEach((slot, i) => {
      if (!done[i]) return;
      updatePhoto(slot.photoLabel, {
        id: `cam-${String(i + 1).padStart(2, "0")}`,
        label: slot.photoLabel,
        url: "/placeholder.jpg",
        photoType: "standard",
        state: "captured",
        createdAt: new Date().toISOString(),
      });
    });
    router.push(`/capi/${entry.id}/elaborazione`);
  }

  const placeIcon = useCallback((i: number, af: number) => {
    const node = iconRefs.current[i];
    if (!node) return;
    const d = i - af;
    const ad = Math.abs(d);
    const th = d * STEP;
    const x = RGT.CX - R * Math.cos(th);
    const y = RGT.CY + R * Math.sin(th);
    const scale = Math.max(0.5, 1 - 0.14 * ad);
    const op = ad > RANGE ? 0 : Math.max(0, 1 - 0.32 * ad);
    const blur = ad <= 0.5 ? 0 : Math.min(6, (ad - 0.5) * 2.2);
    node.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
    node.style.opacity = op.toFixed(2);
    node.style.pointerEvents = op > 0.15 ? "auto" : "none";
    node.style.filter = blur ? `blur(${blur.toFixed(1)}px)` : "none";
    node.classList.toggle("on", ad < 0.5);
  }, []);

  const renderIcons = useCallback(
    (af: number) => {
      for (let i = 0; i < N; i++) placeIcon(i, af);
    },
    [placeIcon]
  );

  function showModeLabel(index: number) {
    const slot = SLOTS[index];
    setLabelText(slot.text);
    setSlotHint(slot.hint ?? null);
    setLabelShown(true);
    if (labelTimerRef.current) window.clearTimeout(labelTimerRef.current);
    // Lo slot ArUco porta una spiegazione in più: resta a schermo più a lungo per dare il tempo di leggerla.
    labelTimerRef.current = window.setTimeout(() => setLabelShown(false), slot.hint ? 2400 : 1600);
  }

  function hideModeLabel() {
    if (labelTimerRef.current) window.clearTimeout(labelTimerRef.current);
    setLabelShown(false);
  }

  useEffect(() => {
    showModeLabel(initialIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (held) renderIcons(afRef.current);
  }, [held, renderIcons]);

  function openMenu(startAf: number) {
    afRef.current = startAf;
    setHeld(true);
    hideModeLabel();
  }

  function closeMenu(finalIndex: number) {
    afRef.current = finalIndex;
    setHeld(false);
    setActiveIndex(finalIndex);
    showModeLabel(finalIndex);
  }

  function showFocus(clientX: number, clientY: number) {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    setFocus({ key: Date.now(), x: clientX - rect.left, y: clientY - rect.top });
  }

  // ── pointer choreography — porting 1:1 della logica del wireframe v2b ──
  const gestureRef = useRef<{
    mode: "open" | "sel" | "focus" | null;
    dragging: boolean;
    moved: boolean;
    startClientY: number;
    startAf: number;
    downIcon: number | null;
    focusX: number;
    focusY: number;
  }>({ mode: null, dragging: false, moved: false, startClientY: 0, startAf: 0, downIcon: null, focusX: 0, focusY: 0 });

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    const onRail = !!(e.target as HTMLElement).closest("[data-rail]");
    const wasHeld = held;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const g = gestureRef.current;
    g.moved = false;
    g.downIcon = null;

    if (!wasHeld) {
      if (onRail) {
        g.mode = "open";
        g.dragging = true;
        g.startClientY = e.clientY;
        g.startAf = activeIndex;
        openMenu(activeIndex);
      } else {
        g.mode = "focus";
        g.focusX = e.clientX;
        g.focusY = e.clientY;
        g.dragging = false;
      }
    } else {
      g.mode = "sel";
      g.dragging = true;
      g.startClientY = e.clientY;
      g.startAf = afRef.current;
      const iconEl = (e.target as HTMLElement).closest<HTMLElement>("[data-icon-index]");
      g.downIcon = iconEl ? Number(iconEl.dataset.iconIndex) : null;
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const g = gestureRef.current;
    if (!g.dragging) return;
    if (Math.abs(e.clientY - g.startClientY) > 3) g.moved = true;
    selectorRef.current?.classList.add("dragging");
    let af = g.startAf + (g.startClientY - e.clientY) / DRAG_PX_PER_STEP;
    af = Math.max(0, Math.min(N - 1, af));
    afRef.current = af;
    renderIcons(af);
  }

  function finishGesture() {
    const g = gestureRef.current;
    selectorRef.current?.classList.remove("dragging");
    if (g.mode === "focus") {
      showFocus(g.focusX, g.focusY);
    } else if (g.mode === "open") {
      if (g.moved) closeMenu(Math.round(afRef.current));
    } else if (g.mode === "sel") {
      if (g.moved) {
        closeMenu(Math.round(afRef.current));
      } else if (g.downIcon != null) {
        closeMenu(g.downIcon);
      } else {
        closeMenu(Math.round(afRef.current));
      }
    }
    g.mode = null;
    g.dragging = false;
  }

  function onShoot() {
    if (held) return;
    setDone((prev) => {
      const next = [...prev];
      next[activeIndex] = true;
      return next;
    });
    setSnap(true);
    window.setTimeout(() => setSnap(false), 160);
    if (activeIndex < N - 1) {
      const next = activeIndex + 1;
      setActiveIndex(next);
      afRef.current = next;
      showModeLabel(next);
    } else {
      showModeLabel(activeIndex);
    }
  }

  const hintText = ready
    ? "tocca usa per continuare"
    : `${doneCount}/${MIN_READY} foto min · tocca la spina per scegliere`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050607]">
      <div className="relative aspect-[9/19] h-full max-h-[880px] w-full max-w-[420px] overflow-hidden bg-black text-white">
        {/* Preview / viewfinder */}
        <div ref={previewRef} className="absolute inset-x-0 top-[9%] h-[63%] overflow-hidden rounded-[14px] bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(120%_82%_at_50%_40%,#eff0e9_0%,#dcddd3_52%,#c2c4b8_100%)]" />
          <Shirt className="absolute left-1/2 top-[47%] size-24 -translate-x-1/2 -translate-y-1/2 text-[#8f9488]" strokeWidth={1} />

          {/* grid terzi */}
          <div className="pointer-events-none absolute inset-0">
            <span className="absolute inset-y-0 left-1/3 w-px bg-white/60" />
            <span className="absolute inset-y-0 left-2/3 w-px bg-white/60" />
            <span className="absolute inset-x-0 top-1/3 h-px bg-white/60" />
            <span className="absolute inset-x-0 top-2/3 h-px bg-white/60" />
          </div>

          {/* etichetta transiente */}
          <span
            className={cn(
              "pointer-events-none absolute left-1/2 top-3 z-[6] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#DBE64C] px-[11px] py-[3px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#001F3F] shadow-[0_3px_12px_rgba(0,0,0,.28)] transition-all duration-[280ms]",
              labelShown ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0"
            )}
          >
            {labelText}
          </span>
          {/* spiegazione contestuale (solo per slot che ne hanno una, es. ArUco) */}
          {slotHint && (
            <span
              className={cn(
                "pointer-events-none absolute left-1/2 top-[38px] z-[6] -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-white/85 [text-shadow:0_1px_4px_rgba(0,0,0,.55)] transition-all duration-[280ms]",
                labelShown ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0"
              )}
            >
              {slotHint}
            </span>
          )}

          {/* reticolo tap-to-focus */}
          {focus && (
            <svg
              key={focus.key}
              viewBox="0 0 66 66"
              className="pointer-events-none absolute z-[4] size-[66px] animate-[focusPulse_1.15s_ease_forwards] [filter:drop-shadow(0_1px_3px_rgba(0,0,0,.5))]"
              style={{ left: focus.x - 33, top: focus.y - 33 }}
              fill="none"
              stroke="#DBE64C"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M8 22V12a4 4 0 0 1 4-4h10" />
              <path d="M44 8h10a4 4 0 0 1 4 4v10" />
              <path d="M58 44v10a4 4 0 0 1-4 4H44" />
              <path d="M22 58H12a4 4 0 0 1-4-4V44" />
              <circle cx={33} cy={33} r={2.4} fill="#DBE64C" stroke="none" />
            </svg>
          )}

          {/* selettore: layer full-bleed che cattura i pointer event */}
          <div
            ref={selectorRef}
            className="absolute inset-0 z-[5]"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishGesture}
            onPointerCancel={finishGesture}
          >
            {held && (
              <div
                className="pointer-events-none absolute rounded-full opacity-100 transition-opacity duration-[280ms]"
                style={{
                  left: RGT.CX - (R + 40),
                  top: RGT.CY - (R + 40),
                  width: (R + 40) * 2,
                  height: (R + 40) * 2,
                  background: `radial-gradient(circle at center, transparent ${(((R - 24) / (R + 40)) * 100).toFixed(1)}%, rgba(64,72,80,.34) ${(((R - 24) / (R + 40)) * 100).toFixed(1)}%, rgba(64,72,80,.34) ${(((R + 24) / (R + 40)) * 100).toFixed(1)}%, transparent ${(((R + 24) / (R + 40)) * 100).toFixed(1)}%)`,
                }}
              />
            )}
            {held &&
              SLOTS.map((slot, i) => {
                const Icon = slot.icon;
                return (
                  <div
                    key={i}
                    data-icon-index={i}
                    ref={(node) => {
                      iconRefs.current[i] = node;
                    }}
                    className={cn(
                      "icon-node absolute left-0 top-0 size-[34px] opacity-0 transition-[transform,opacity,filter] duration-300 [transition-timing-function:cubic-bezier(.22,1,.36,1)]"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-[34px] items-center justify-center rounded-[10px] border border-white/20 bg-[rgba(28,34,40,.42)] text-white/90 transition-colors",
                        "icon-box"
                      )}
                    >
                      <Icon className="size-[19px]" strokeWidth={1.7} />
                      {done[i] && (
                        <span className="absolute -right-[5px] -top-[5px] grid size-[14px] place-items-center rounded-full bg-[#00804C] text-white">
                          <Check className="size-[9px]" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <span className="ilabel pointer-events-none absolute right-[calc(100%+9px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#DBE64C] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#001F3F] opacity-0 shadow-[0_3px_10px_rgba(0,0,0,.28)] transition-opacity duration-200">
                      {slot.text}
                    </span>
                  </div>
                );
              })}

            {/* spina di dot — a riposo, sparisce col menu aperto */}
            <div
              data-rail
              className={cn(
                "absolute right-3 top-1/2 z-[6] -translate-y-1/2 cursor-pointer transition-opacity duration-200",
                held && "pointer-events-none opacity-0"
              )}
            >
              <div className="relative flex flex-col items-center gap-[7px] rounded-full border border-white/16 bg-[rgba(64,72,80,.40)] px-[9px] py-[11px] shadow-[0_4px_14px_rgba(0,0,0,.22)] backdrop-blur-[7px]">
                {SLOTS.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "w-[7px] rounded-full transition-[height,background-color] duration-[220ms]",
                      i === activeIndex
                        ? "h-[22px] bg-[#DBE64C] shadow-[0_0_0_3px_rgba(219,230,76,.22)]"
                        : done[i]
                          ? "h-[7px] bg-white/72"
                          : "h-[7px] bg-white/30"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* hint */}
          {!held && (
            <p className="pointer-events-none absolute inset-x-0 bottom-[106px] z-[6] text-center font-mono text-[9.5px] uppercase tracking-[0.10em] text-white/50">
              {hintText}
            </p>
          )}
        </div>

        {/* Header */}
        <div className="absolute inset-x-0 top-9 z-[8] flex items-center justify-between px-5">
          <button
            onClick={close}
            aria-label="Annulla acquisizione"
            className="grid size-11 place-items-center rounded-full text-white transition-colors active:bg-white/20"
          >
            <X className="size-6" />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFlash((v) => !v)}
              aria-label="Flash"
              className={cn(
                "grid size-11 place-items-center rounded-full transition-colors",
                flash ? "bg-[#DBE64C] text-[#001F3F] shadow-[0_0_0_2px_rgba(219,230,76,.55)]" : "bg-white/14 text-white"
              )}
            >
              <Zap className="size-[19px]" />
            </button>
            <button
              onClick={complete}
              disabled={!ready}
              aria-label="Usa foto acquisite"
              className={cn(
                "flex h-11 min-w-11 items-center justify-center gap-[5px] rounded-xl border border-white/18 px-[9px] font-mono text-[10px] font-bold uppercase tracking-[0.06em] shadow-[0_3px_12px_rgba(0,0,0,.24)] transition-opacity",
                ready ? "bg-[#DBE64C] text-[#001F3F]" : "bg-white/14 text-white opacity-40"
              )}
            >
              <Check className="size-[15px]" />
              <span>{ready ? "Usa" : `${doneCount}/${MIN_READY}`}</span>
            </button>
          </div>
        </div>

        {/* Shutter row */}
        <div className="absolute inset-x-0 bottom-[30px] z-[8] grid grid-cols-[1fr_auto_1fr] items-center px-8">
          <div className="flex justify-start">
            <div className="grid size-11 place-items-center rounded-[11px] border border-white/30 bg-[radial-gradient(120%_100%_at_50%_35%,#eff0e9,#c2c4b8)] text-[#5b6058]">
              <Shirt className="size-6" strokeWidth={1.2} />
            </div>
          </div>
          <button
            onClick={onShoot}
            aria-label="Scatta"
            className={cn(
              "size-[70px] rounded-full border-[3px] border-black bg-white shadow-[0_0_0_3px_#fff] transition-transform",
              snap && "scale-90"
            )}
          />
          <div className="flex justify-end">
            <div className="grid size-11 place-items-center rounded-full bg-white/14 text-white">
              <RotateCw className="size-[23px]" strokeWidth={1.8} />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes focusPulse {
          0% {
            opacity: 0;
            transform: scale(1.55);
          }
          16% {
            opacity: 1;
          }
          42% {
            transform: scale(1);
          }
          58% {
            opacity: 1;
          }
          72% {
            transform: scale(0.93);
          }
          100% {
            opacity: 0;
            transform: scale(1);
          }
        }
        .icon-node.on .icon-box {
          background: #dbe64c;
          border-color: #dbe64c;
          color: #001f3f;
          box-shadow: 0 0 0 3px rgba(219, 230, 76, 0.25);
        }
        .icon-node.on .ilabel {
          opacity: 1;
        }
        [data-rail].dragging {
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
