"use client";

import { useEffect, useState } from "react";
import { PhotoHandoffDesktop } from "@/components/maat/photo/PhotoHandoffDesktop";
import { PhotoCaptureMobile } from "@/components/maat/photo/PhotoCaptureMobile";
import type { PhotoLabel } from "@/types/maat";

interface PhotoCaptureFlowProps {
  initialLabel: PhotoLabel;
}

/**
 * Acquisizione foto responsive:
 * - desktop (≥768px) → handoff QR: scatta dal telefono / carica dal computer;
 * - mobile (<768px) → scatto diretto v2b (spina di dot, menu ad arco, tap-to-focus).
 *
 * La scelta avviene dopo il mount (matchMedia) per evitare hydration mismatch:
 * fino ad allora si mostra una superficie neutra a tutta pagina.
 */
export function PhotoCaptureFlow({ initialLabel }: PhotoCaptureFlowProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  if (isMobile === null) {
    return <div className="fixed inset-0 z-50 bg-background" aria-hidden />;
  }

  return isMobile ? <PhotoCaptureMobile initialLabel={initialLabel} /> : <PhotoHandoffDesktop />;
}
