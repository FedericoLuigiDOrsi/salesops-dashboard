"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const LogisticsGlobe = dynamic(() => import("./LogisticsGlobe").then((m) => m.LogisticsGlobe), {
  ssr: false,
  loading: () => <div className="size-full bg-surface-dark" />,
});

const HERO_HEIGHT = 184;
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
          className={cn("font-mono text-[26px] font-bold leading-none tabular-nums", !accent && "text-text-on-dark/70")}
        >
          {display}
        </span>
      </div>
      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[.1em] text-text-on-dark/60">{stat.label}</div>
    </div>
  );
}

interface LogisticsHeroProps {
  stats: LogisticsHeroStat[];
  onClose: () => void;
  /** Click su una città del globo: filtra la board. */
  onCityClick?: (cityName: string) => void;
}

export function LogisticsHero({ stats, onClose, onCityClick }: LogisticsHeroProps) {
  return (
    <div
      className="relative flex-none overflow-hidden rounded-2xl bg-surface-dark text-text-on-dark"
      style={{ height: HERO_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
        <LogisticsGlobe height={HERO_HEIGHT} mode="hero" onCityClick={onCityClick} className="size-full" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,26,54,.97) 0%, rgba(0,26,54,.82) 40%, rgba(0,26,54,.35) 66%, rgba(0,26,54,0) 88%)",
        }}
      />
      <div className="relative z-[2] flex h-full max-w-[640px] flex-col justify-between px-6 py-[18px]">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[.12em] text-text-on-dark/55">
            Rete di spedizioni · live
          </div>
          <div className="mt-1 text-[21px] font-bold tracking-tight">Da Napoli al mondo</div>
          <div className="mt-0.5 text-[12.5px] text-text-on-dark/60">
            Tracce attive verso i destinatari in Italia ed Europa.
          </div>
        </div>
        {/* Stessa gerarchia del widget: pastiglia fluo solo sul primo stato azionabile. */}
        <div className="flex gap-6">
          {stats.map((s) => (
            <HeroStat key={s.key} stat={s} />
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        title="Nascondi mappa"
        className="absolute right-3 top-3 z-[3] flex size-[30px] items-center justify-center rounded-lg bg-text-on-dark/[0.12] text-text-on-dark transition-colors hover:bg-text-on-dark/20"
      >
        <ChevronUp className="size-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}
