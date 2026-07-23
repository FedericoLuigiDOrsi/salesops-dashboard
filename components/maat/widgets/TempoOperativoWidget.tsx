"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const TIME_ZONE = "Europe/Rome";
const WORK_START_MINUTES = 8 * 60;
const WORK_END_MINUTES = 19 * 60;

function getRomeTimeParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function TempoOperativoWidget() {
  const [now, setNow] = useState<Date | null>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    const measure = () => setTimelineWidth(timeline.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(timeline);
    return () => observer.disconnect();
  }, []);

  const display = useMemo(() => {
    if (!now) return { time: "--:--", seconds: "--", date: "Caricamento…", progress: 0, remaining: "Sincronizzazione", phase: "day" as const };
    const value = getRomeTimeParts(now);
    const currentMinutes = Number(value.hour) * 60 + Number(value.minute) + Number(value.second) / 60;
    const progress = Math.max(0, Math.min(1, (currentMinutes - WORK_START_MINUTES) / (WORK_END_MINUTES - WORK_START_MINUTES)));
    const minutesLeft = Math.max(0, Math.ceil(WORK_END_MINUTES - currentMinutes));
    let remaining = `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m rimaste`;
    if (currentMinutes < WORK_START_MINUTES) {
      const untilStart = Math.ceil(WORK_START_MINUTES - currentMinutes);
      remaining = `inizia tra ${Math.floor(untilStart / 60)}h ${untilStart % 60}m`;
    } else if (currentMinutes >= WORK_END_MINUTES) {
      remaining = "giornata conclusa";
    }
    return {
      time: new Intl.DateTimeFormat("it-IT", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" }).format(now),
      seconds: new Intl.DateTimeFormat("it-IT", { timeZone: TIME_ZONE, second: "2-digit" }).format(now),
      date: new Intl.DateTimeFormat("it-IT", { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long" }).format(now),
      progress,
      remaining,
      phase: Number(value.hour) >= 7 && Number(value.hour) < 20 ? "day" as const : "night" as const,
    };
  }, [now]);

  return (
    <div data-phase={display.phase} className="maat-clock relative flex h-full min-h-[180px] flex-col overflow-hidden rounded-xl bg-surface-dark p-5 text-text-on-dark">
      <div aria-hidden className="maat-clock-ambient pointer-events-none absolute -right-12 -top-14 size-36 rounded-full bg-[radial-gradient(circle,rgba(219,230,76,.16),rgba(219,230,76,0)_68%)]" />
      <div className="relative flex items-center justify-between gap-2">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[.13em] text-text-on-dark/55">Tempo operativo</p>
        <span className="flex h-6 items-center gap-1.5 rounded-full border border-white/10 bg-white/[.06] px-2 font-mono text-[7px] font-semibold uppercase tracking-[.08em]">
          <span className="maat-live-dot size-1.5 rounded-full bg-primary" /> Live
        </span>
      </div>

      <div className="relative mt-2 grid grid-cols-[minmax(0,1fr)_94px] gap-2">
        <div>
          <p className="flex items-baseline gap-1 font-mono text-[28px] font-semibold leading-none tracking-[-.06em] tabular-nums">
            {display.time}<span className="text-xs text-primary">{display.seconds}</span>
          </p>
          <p className="mt-1.5 truncate text-[10px] capitalize text-text-on-dark/65">{display.date}</p>
        </div>
        <div className="border-l border-white/10 pl-3 text-right" title="Dato climatico dimostrativo">
          <div className="maat-weather-icon relative ml-auto h-8 w-14" aria-hidden>
            <span className="maat-weather-rays absolute right-1 top-0 size-7 rounded-full border border-dashed border-primary/40" />
            <span className="maat-weather-sun absolute right-[9px] top-[5px] size-[18px] rounded-full bg-primary" />
            <span className="maat-weather-cloud maat-weather-cloud-back" />
            <span className="maat-weather-cloud" />
          </div>
          <p className="mt-0.5 font-mono text-xs font-semibold">27°</p>
          <p className="mt-1 whitespace-nowrap font-mono text-[6px] font-semibold uppercase tracking-[.06em] text-text-on-dark/45">Sereno · demo</p>
        </div>
      </div>

      <div className="relative mt-2.5">
        <div className="flex items-center justify-between gap-2 font-mono text-[7px] font-semibold uppercase tracking-[.06em] text-text-on-dark/50">
          <span>Giornata · 08–19</span><strong className="text-text-on-dark/85">{display.remaining}</strong>
        </div>
        <div ref={timelineRef} className="relative mt-2 h-1.5 rounded-full bg-white/10">
          <span className="absolute inset-0 origin-left rounded-full bg-primary transition-transform duration-500 [transition-timing-function:cubic-bezier(.22,1,.36,1)]" style={{ transform: `scaleX(${display.progress})` }} />
          <span className="maat-timeline-marker absolute -top-[3px] left-0 size-3 rounded-full border-2 border-surface-dark bg-primary transition-transform duration-500 [transition-timing-function:cubic-bezier(.22,1,.36,1)]" style={{ transform: `translate3d(${Math.max(0, timelineWidth - 12) * display.progress}px,0,0)` }} />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[6px] text-text-on-dark/35"><span>08</span><span>12</span><span>16</span><span>19</span></div>
      </div>

      <div className="relative mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-2 font-mono text-[7px] font-semibold uppercase tracking-[.05em] text-text-on-dark/45">
        <span>Napoli · Europe/Rome</span><strong className="text-text-on-dark/80">{Math.round(display.progress * 100)}% giornata</strong>
      </div>
    </div>
  );
}
