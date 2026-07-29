"use client";

import { useState } from "react";
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
  const [active, setActive] = useState(0);
  const slot = SLOT_ORDER[active];
  const activePhoto = photos.find((photo) => photo.label === slot.label);
  const activeState = activePhoto?.state ?? "empty";
  const requiredLabels = SLOT_ORDER.filter((item) => item.required).map((item) => item.label);
  const validatedCount = photos.filter(
    (photo) => requiredLabels.includes(photo.label) && photo.state === "validated"
  ).length;

  function goToSlot(idx: number) {
    setActive(idx);
  }

  return (
    <div className="grid gap-5 md:grid-cols-[230px_minmax(0,1fr)]">
      <div className="group relative aspect-square w-full max-w-[320px] overflow-hidden rounded-[10px] bg-[#DDE0D2] md:w-[230px]">
        {activeState === "empty" && (
          <motion.button
            type="button"
            onClick={() => onCapture?.(slot.label)}
            whileTap={{ scale: 0.98 }}
            transition={SPRING}
            className="flex size-full flex-col items-center justify-center gap-2 border border-dashed border-[#C7CDB8] bg-[#FBFBF5] text-muted-foreground transition-colors hover:border-foreground/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Camera className="size-6" strokeWidth={1.7} />
            <span className="text-xs font-medium">Scatta foto {slot.text.toLowerCase()}</span>
          </motion.button>
        )}

        {(activeState === "captured" || activeState === "processing") && (
          <div className="size-full bg-[#ECEDE3] animate-shimmer" aria-label={`Elaborazione foto ${slot.text}`} />
        )}

        {activeState === "validated" && activePhoto?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={activePhoto.url} alt={slot.text} className="size-full object-cover" />
        )}

        {activeState === "validated" && !activePhoto?.url && (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Camera className="size-7" strokeWidth={1.4} />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[.12em]">{slot.text}</span>
          </div>
        )}

        {activeState === "rejected" && (
          <div className="flex size-full flex-col items-center justify-center gap-2 px-6 text-center">
            <AlertTriangle className="size-6 text-destructive" strokeWidth={1.7} />
            <span className="text-xs text-destructive">{activePhoto?.qualityFlags?.[0] ?? "Foto non valida"}</span>
            <motion.button
              type="button"
              onClick={() => onRetake?.(slot.label)}
              whileTap={{ scale: 0.95 }}
              transition={SPRING}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline"
            >
              <RotateCcw className="size-3.5" /> Riprendi
            </motion.button>
          </div>
        )}

        {activeState !== "empty" && activeState !== "rejected" && (
          <motion.button
            type="button"
            onClick={() => onRetake?.(slot.label)}
            whileTap={{ scale: 0.95 }}
            transition={SPRING}
            title={`Riprendi foto ${slot.text}`}
            className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-[9px] bg-surface-dark/75 text-text-on-dark opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Camera className="size-4" strokeWidth={1.7} />
          </motion.button>
        )}
      </div>

      <div className="flex min-w-0 flex-col">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">
          Foto · {validatedCount} / {SLOT_ORDER.filter((item) => item.required).length} richieste validate
        </p>
        <div className="mt-2.5 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {SLOT_ORDER.map(({ label, required, text }, i) => {
            const photo = photos.find((item) => item.label === label);
            const state = photo?.state ?? "empty";
            return (
              <motion.button
                key={label}
                type="button"
                onClick={() => goToSlot(i)}
                whileTap={{ scale: 0.94 }}
                transition={SPRING}
                aria-pressed={i === active}
                aria-label={`Mostra foto ${text}`}
                className={cn(
                  "relative flex aspect-square min-w-0 items-end justify-center overflow-hidden rounded-[8px] border border-transparent bg-[#DDE0D2] pb-1 font-mono text-[8.5px] font-semibold uppercase tracking-[.06em] text-muted-foreground transition-[border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  state === "empty" && "border-dashed border-[#C7CDB8] bg-[#FBFBF5]",
                  i === active && "border-foreground ring-1 ring-foreground"
                )}
              >
                {state === "validated" && photo?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.url} alt="" className="absolute inset-0 size-full object-cover" />
                )}
                {(state === "captured" || state === "processing") && (
                  <span className="absolute inset-0 bg-[#ECEDE3] animate-shimmer" />
                )}
                <span className={cn("relative", photo?.url && "rounded bg-surface-dark/70 px-1 text-text-on-dark")}>{text.slice(0, 3)}</span>
                {state === "validated" && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-success" />}
                {state === "rejected" && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-destructive" />}
                {required && state === "empty" && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />}
              </motion.button>
            );
          })}
        </div>
        <p className="mt-auto pt-3 text-[11.5px] leading-relaxed text-muted-foreground">
          Seleziona una miniatura per rivederla. Passa sulla foto principale per ripetere lo scatto.
        </p>
      </div>
    </div>
  );
}
