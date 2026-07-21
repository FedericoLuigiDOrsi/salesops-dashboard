"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMaatEntry } from "@/lib/maat-store";

// Fasi percepite dell'elaborazione: non c'è una pipeline AI reale collegata
// (nessun servizio di estrazione attributi, vedi ReviewForm) — questa è
// percezione di lavoro in corso mentre le foto passano a "validated", non
// un progress reale. Se un giorno arriva una pipeline vera, questi testi
// vanno sostituiti da stato reale invece che simulato.
const STATUSES = [
  "Leggo l'etichetta brand…",
  "Riconosco il tipo di capo…",
  "Deduco taglia e colore…",
  "Calcolo le misure dal marker ArUco…",
  "Compilo la scheda…",
];

export function ElaborazioneScreen() {
  const router = useRouter();
  const { entry } = useMaatEntry();
  const [progress, setProgress] = useState(12);
  const [statusIndex, setStatusIndex] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const progressTimer = window.setInterval(() => {
      setProgress((p) => Math.min(100, p + 14 + Math.random() * 8));
    }, 320);
    const statusTimer = window.setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUSES.length);
    }, 480);
    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(statusTimer);
    };
  }, []);

  useEffect(() => {
    if (progress >= 100 && !doneRef.current) {
      doneRef.current = true;
      const t = window.setTimeout(() => router.push(`/capi/${entry.id}/review`), 350);
      return () => window.clearTimeout(t);
    }
  }, [progress, router, entry.id]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Sparkles className="size-6" />
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight">Sto preparando la scheda</h1>
        <p className="mt-1 text-sm text-muted-foreground">{STATUSES[statusIndex]}</p>
      </div>

      <div className="w-full max-w-xs">
        <Progress value={Math.round(progress)} />
      </div>

      <button
        type="button"
        onClick={() => router.push("/capi")}
        className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
      >
        Annulla elaborazione
      </button>
    </main>
  );
}
