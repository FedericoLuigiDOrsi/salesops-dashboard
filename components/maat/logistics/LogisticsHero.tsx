"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const LogisticsGlobe = dynamic(() => import("./LogisticsGlobe").then((m) => m.LogisticsGlobe), {
  ssr: false,
  loading: () => <div className="size-full bg-surface-dark" />,
});

const FLUO = "#DBE64C";

interface LogisticsHeroStat {
  key: string;
  label: string;
  count: number;
  color: string;
}

// Count-up numerico: ease-out-cubic su 600ms via requestAnimationFrame.
// Era una copia minimale di StatTile, rimosso il 02/09 come orfano: da allora
// questa è l'unica implementazione della curva. Se ne serve una seconda,
// estrarla in un hook invece di ricopiarla.
function useCountUp(target: number) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    const duration = 600;
    const start = performance.now();

    let frame: number;
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return display;
}

function HeroStat({ stat }: { stat: LogisticsHeroStat }) {
  const display = useCountUp(stat.count);
  const accent = stat.color.toUpperCase() === FLUO;
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className={cn("size-[9px] shrink-0 rounded-[3px]", accent ? "bg-primary" : "bg-text-on-dark/25")} />
        <span
          className={cn("font-mono text-[22px] font-bold leading-none tabular-nums", !accent && "text-text-on-dark/70")}
        >
          {display}
        </span>
      </div>
      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[.1em] text-text-on-dark/60">{stat.label}</div>
    </div>
  );
}

/** Misura l'altezza reale del pannello: il canvas del globo deve riempirla, non un valore fisso. */
function usePanelHeight(ref: React.RefObject<HTMLDivElement | null>) {
  const [height, setHeight] = useState(320);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const h = el.clientHeight;
      if (h > 0) setHeight(h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return height;
}

interface LogisticsHeroProps {
  stats: LogisticsHeroStat[];
  onClose: () => void;
  /** Click su una città del globo: filtra la board. */
  onCityClick?: (cityName: string) => void;
}

/**
 * Pannello "Rete di spedizioni": prima banner orizzontale in cima alla board,
 * ora vive nella colonna destra (1/3) della board, verticale a tutta altezza —
 * stesse informazioni, layout adattato allo spazio stretto e alto invece che
 * largo e basso.
 */
export function LogisticsHero({ stats, onClose, onCityClick }: LogisticsHeroProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const globeHeight = usePanelHeight(wrapRef);

  return (
    <div ref={wrapRef} className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-surface-dark text-text-on-dark">
      <div className="absolute inset-0 z-0">
        <LogisticsGlobe height={globeHeight} mode="hero" onCityClick={onCityClick} className="size-full" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,26,54,.30) 0%, rgba(0,26,54,.55) 42%, rgba(0,26,54,.97) 78%)",
        }}
      />
      <div className="relative z-[2] flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[.12em] text-text-on-dark/55">
              Rete di spedizioni · live
            </div>
            <div className="mt-1 text-[17px] font-bold leading-tight tracking-tight">Da Napoli al mondo</div>
            <div className="mt-1 text-[11.5px] text-text-on-dark/60">
              Tracce attive verso i destinatari in Italia ed Europa.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Nascondi mappa"
            className="flex size-[28px] shrink-0 items-center justify-center rounded-lg bg-text-on-dark/[0.12] text-text-on-dark transition-colors hover:bg-text-on-dark/20"
          >
            <X className="size-3.5" strokeWidth={1.8} />
          </button>
        </div>
        {/* Stessa gerarchia del widget: pastiglia fluo solo sul primo stato azionabile. */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          {stats.map((s) => (
            <HeroStat key={s.key} stat={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
