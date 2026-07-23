"use client";

import dynamic from "next/dynamic";
import { ChevronUp } from "lucide-react";

const LogisticsGlobe = dynamic(() => import("./LogisticsGlobe").then((m) => m.LogisticsGlobe), {
  ssr: false,
  loading: () => <div className="size-full bg-surface-dark" />,
});

const HERO_HEIGHT = 184;

interface LogisticsHeroStat {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface LogisticsHeroProps {
  stats: LogisticsHeroStat[];
  onClose: () => void;
}

export function LogisticsHero({ stats, onClose }: LogisticsHeroProps) {
  return (
    <div
      className="relative flex-none overflow-hidden rounded-2xl bg-surface-dark text-text-on-dark"
      style={{ height: HERO_HEIGHT }}
    >
      <div className="absolute inset-0 z-0">
        <LogisticsGlobe height={HERO_HEIGHT} />
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
        <div className="flex gap-6">
          {stats.map((s) => (
            <div key={s.key}>
              <div className="flex items-center gap-1.5">
                <span className="size-[9px] shrink-0 rounded-[3px]" style={{ background: s.color }} />
                <span className="font-mono text-[26px] font-bold leading-none">{s.count}</span>
              </div>
              <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[.1em] text-text-on-dark/60">
                {s.label}
              </div>
            </div>
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
