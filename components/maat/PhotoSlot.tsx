"use client";

import { Camera, RotateCcw, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Photo, PhotoLabel } from "@/types/maat";

const LABEL_TEXT: Record<PhotoLabel, string> = {
  fronte: "Fronte",
  retro: "Retro",
  brand: "Brand",
  taglia: "Taglia",
  materiale: "Materiale",
  difetti: "Difetti",
  extra: "Extra",
  aruco: "ArUco",
};

interface PhotoSlotProps {
  label: PhotoLabel;
  required: boolean;
  photo?: Photo;
  onCapture?: () => void;
  onRetake?: () => void;
}

export function PhotoSlot({ label, required, photo, onCapture, onRetake }: PhotoSlotProps) {
  const state = photo?.state ?? "empty";

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          "relative flex aspect-square items-center justify-center overflow-hidden rounded-[10px] border border-border bg-card",
          state === "empty" && "border-dashed border-[#C7CDB8] bg-[#FBFBF5]",
          state === "rejected" && "border-2 border-destructive"
        )}
      >
        {state === "empty" && (
          <button
            type="button"
            onClick={onCapture}
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Camera className="size-5" />
            <span className="text-xs font-medium">Scatta foto</span>
          </button>
        )}

        {(state === "captured" || state === "processing") && (
          <div className="h-full w-full animate-pulse bg-gradient-to-r from-[#ECEDE3] via-[#F5F6EC] to-[#ECEDE3] bg-[length:200%_100%]" />
        )}

        {state === "validated" && photo?.url && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={LABEL_TEXT[label]} className="h-full w-full object-cover" />
            <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-[#00804C] text-white">
              <Check className="size-3" />
            </span>
          </>
        )}

        {state === "rejected" && (
          <div className="flex flex-col items-center gap-1.5 px-2 text-center">
            <AlertTriangle className="size-5 text-destructive" />
            <span className="text-[11px] text-destructive">{photo?.qualityFlags?.[0] ?? "Foto non valida"}</span>
            <button
              type="button"
              onClick={onRetake}
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
            >
              <RotateCcw className="size-3" /> Riprendi
            </button>
          </div>
        )}

        {required && state === "empty" && (
          <span className="absolute left-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
        )}
      </div>
      <span className="text-center font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        {LABEL_TEXT[label]}
      </span>
    </div>
  );
}
