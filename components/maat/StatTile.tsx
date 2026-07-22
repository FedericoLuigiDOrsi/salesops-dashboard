"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  number: number;
  label: string;
  attention?: boolean;
}

export function StatTile({ number, label, attention }: StatTileProps) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = number;
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
  }, [number]);

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3",
        attention && "border-l-2 border-l-primary"
      )}
    >
      <span className="font-mono text-2xl font-semibold tabular-nums">{display}</span>
      <span className="text-[13px] text-muted-foreground">{label}</span>
    </div>
  );
}
