"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, RotateCcw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Photo, PhotoLabel } from "@/types/maat";

const SPRING = { type: "spring", stiffness: 420, damping: 26 } as const;

const SLOT_ORDER: { label: PhotoLabel; required: boolean; text: string }[] = [
  { label: "fronte", required: true, text: "Fronte" },
  { label: "retro", required: true, text: "Retro" },
  { label: "brand", required: true, text: "Brand" },
  { label: "taglia", required: false, text: "Taglia" },
  { label: "materiale", required: false, text: "Materiale" },
  { label: "difetti", required: false, text: "Difetti" },
  { label: "extra", required: false, text: "Extra" },
  { label: "aruco", required: false, text: "ArUco" },
];

interface ArticleMediaTrackProps {
  photos: Photo[];
  onCapture?: (label: PhotoLabel) => void;
  onRetake?: (label: PhotoLabel) => void;
}

export function ArticleMediaTrack({ photos, onCapture, onRetake }: ArticleMediaTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function goToSlot(idx: number) {
    setActive(idx);
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: idx * track.clientWidth, behavior: "smooth" });
  }

  function onTrackScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== active) setActive(idx);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={trackRef}
        onScroll={onTrackScroll}
        className="flex gap-3 overflow-x-auto rounded-xl [scroll-snap-type:x_mandatory] [scrollbar-width:thin]"
      >
        {SLOT_ORDER.map(({ label, required, text }) => {
          const photo = photos.find((p) => p.label === label);
          const state = photo?.state ?? "empty";
          return (
            <div
              key={label}
              className="relative flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted [scroll-snap-align:center]"
            >
              {state === "empty" && (
                <motion.button
                  type="button"
                  onClick={() => onCapture?.(label)}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  transition={SPRING}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 border-1.5 border-dashed border-[#C7CDB8] bg-[#FBFBF5] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  <Camera className="size-6" />
                  <span className="text-xs font-medium">Scatta foto</span>
                  <span className="absolute bottom-2.5 left-2.5 rounded-full bg-foreground/[.74] px-2.5 py-1 font-mono text-[10.5px] font-semibold tracking-wide text-background">
                    {text.toUpperCase()}
                  </span>
                </motion.button>
              )}

              {(state === "captured" || state === "processing") && (
                <div className="h-full w-full bg-[#ECEDE3] animate-shimmer" />
              )}

              {state === "validated" && photo?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.url} alt={text} className="h-full w-full object-cover" />
              )}

              {state === "rejected" && (
                <div className="flex flex-col items-center gap-1.5 px-2 text-center">
                  <AlertTriangle className="size-5 text-destructive" />
                  <span className="text-[11px] text-destructive">{photo?.qualityFlags?.[0] ?? "Foto non valida"}</span>
                  <motion.button
                    type="button"
                    onClick={() => onRetake?.(label)}
                    whileTap={{ scale: 0.95 }}
                    transition={SPRING}
                    className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
                  >
                    <RotateCcw className="size-3" /> Riprendi
                  </motion.button>
                </div>
              )}

              {state !== "empty" && (
                <span className="absolute bottom-2.5 left-2.5 rounded-full bg-foreground/[.74] px-2.5 py-1 font-mono text-[10.5px] font-semibold tracking-wide text-background">
                  {text.toUpperCase()}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {SLOT_ORDER.map(({ label, required, text }, i) => {
          const photo = photos.find((p) => p.label === label);
          const filled = !!photo;
          return (
            <motion.button
              key={label}
              type="button"
              onClick={() => goToSlot(i)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={SPRING}
              className={cn(
                "relative flex size-[46px] shrink-0 items-center justify-center rounded-[9px] border border-border bg-muted font-mono text-[9px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                i === active && "border-foreground ring-1 ring-foreground"
              )}
            >
              {text.slice(0, 3)}
              {required && !filled && (
                <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
