"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Camera, ImageUp } from "lucide-react";
import { Sequence } from "@/components/maat/Sequence";
import { useMaatEntry } from "@/lib/maat-store";
import type { PhotoLabel } from "@/types/maat";

const SLOT_ORDER: { label: PhotoLabel; required: boolean; text: string }[] = [
  { label: "fronte", required: true, text: "Fronte" },
  { label: "retro", required: true, text: "Retro" },
  { label: "brand", required: true, text: "Brand" },
  { label: "taglia", required: false, text: "Taglia" },
  { label: "materiale", required: false, text: "Materiale" },
  { label: "extra", required: false, text: "Extra" },
];

interface PhotoCaptureFlowProps {
  initialLabel: PhotoLabel;
}

export function PhotoCaptureFlow({ initialLabel }: PhotoCaptureFlowProps) {
  const router = useRouter();
  const { entry, updatePhoto } = useMaatEntry();
  const [activeLabel, setActiveLabel] = useState<PhotoLabel>(initialLabel);
  const [capturing, setCapturing] = useState(false);

  const activeIndex = SLOT_ORDER.findIndex((s) => s.label === activeLabel);
  const activeSlot = SLOT_ORDER[activeIndex];
  const activePhoto = entry.photos.find((p) => p.label === activeLabel);

  const steps = SLOT_ORDER.map((slot) => {
    const photo = entry.photos.find((p) => p.label === slot.label);
    const state: "done" | "current" | "todo" =
      slot.label === activeLabel ? "current" : photo?.state === "validated" ? "done" : "todo";
    return { label: slot.text, state };
  });

  function goBackToDetail() {
    router.push(`/capi/${entry.id}`);
  }

  function goToNext() {
    const nextIndex = activeIndex + 1;
    if (nextIndex < SLOT_ORDER.length) {
      setActiveLabel(SLOT_ORDER[nextIndex].label);
    } else {
      goBackToDetail();
    }
  }

  function handleCapture() {
    setCapturing(true);
    updatePhoto(activeLabel, {
      id: `${activeLabel}-${Date.now()}`,
      label: activeLabel,
      url: "/placeholder.jpg",
      photoType: "standard",
      state: "captured",
      createdAt: new Date().toISOString(),
    });

    setTimeout(() => {
      updatePhoto(activeLabel, {
        id: `${activeLabel}-validated`,
        label: activeLabel,
        url: "/placeholder.jpg",
        photoType: "standard",
        state: "validated",
        createdAt: new Date().toISOString(),
      });
      setCapturing(false);
      goToNext();
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#001F3F]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <button onClick={goBackToDetail} className="text-white/70 transition-colors hover:text-white" aria-label="Chiudi">
          <X className="size-6" />
        </button>
        <span className="font-mono text-xs uppercase tracking-wide text-white/70">Scatta: {activeSlot.text}</span>
        <div className="w-6" />
      </div>

      {/* Viewfinder */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2a4a] to-[#001220]" />

        {activePhoto?.state === "rejected" && !capturing && (
          <div className="absolute inset-x-4 top-4 rounded-lg bg-destructive/90 px-4 py-2 text-center text-sm text-white">
            {activePhoto.qualityFlags?.[0] ?? "Foto non valida"} — riprova
          </div>
        )}

        <div className="relative flex h-3/4 w-2/3 items-center justify-center rounded-2xl border-2 border-dashed border-white/25">
          <span className="font-mono text-xs text-white/40">Inquadra: {activeSlot.text}</span>
        </div>

        {capturing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="font-mono text-sm uppercase tracking-wide text-white">Elaborazione…</span>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-6 px-4 pb-8 pt-4">
        <Sequence steps={steps} />
        <div className="grid w-full max-w-xs grid-cols-3 items-center">
          <button className="justify-self-start text-white/70 transition-colors hover:text-white" aria-label="Carica da galleria">
            <ImageUp className="size-6" />
          </button>
          <button
            onClick={handleCapture}
            disabled={capturing}
            className="size-16 justify-self-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
            aria-label="Scatta foto"
          >
            <Camera className="mx-auto size-7" />
          </button>
          <div className="justify-self-end">
            {!activeSlot.required && !capturing && (
              <button onClick={goToNext} className="whitespace-nowrap text-xs text-white/60 underline underline-offset-2">
                Salta
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
