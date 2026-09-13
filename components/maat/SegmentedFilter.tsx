"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Segmented control unico del design system (`maat-ds/COMPONENTS.md` §Atomi).
 *
 * Spec dichiarata: «track grigio + segmenti pill; attivo = fill near-black,
 * testo `--text-on-dark`». Fino al 03/08 ne esistevano DUE implementazioni —
 * questa (pill chiara, senza indicatore) e `StatusSegment`, locale a
 * `InventoryToolbar` (pill near-black + indicatore che scorre + contatori).
 * Era il disallineamento #6 del registro: quella conforme alla spec era la
 * locale, quindi la fusione va in quella direzione, non nell'altra.
 *
 * `count` è opzionale: lo usa solo il filtro di stato dell'Inventario, le altre
 * tre call-site (vista, densità, ordinamento) non hanno numeri da mostrare.
 */

interface SegmentedFilterOption<T extends string> {
  value: T;
  label: string;
  /** Badge numerico a destra dell'etichetta. Omesso = nessun badge. */
  count?: number;
  /** Icona a sinistra dell'etichetta. La usa il toggle Tabella/Griglia. */
  icon?: ReactNode;
}

interface SegmentedFilterProps<T extends string> {
  options: SegmentedFilterOption<T>[];
  active: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedFilter<T extends string>({
  options,
  active,
  onChange,
  className,
}: SegmentedFilterProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  // L'indicatore è posizionato in pixel, quindi va ri-misurato quando cambia
  // ciò che ne altera la geometria: la voce attiva, le opzioni (un badge che
  // passa da 9 a 10 allarga il segmento) e la larghezza della track.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const el = track.querySelector<HTMLElement>('[data-active="true"]');
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    // I font custom cambiano la larghezza del testo dopo il primo paint.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [active, options]);

  return (
    <div
      ref={trackRef}
      className={cn("relative inline-flex items-center gap-0.5 rounded-full bg-secondary p-1", className)}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-0 rounded-full bg-foreground shadow-[0_2px_8px_rgba(0,31,63,.20)] transition-[transform,width] duration-[380ms] ease-[cubic-bezier(.22,1,.36,1)]"
        style={indicator ? { width: indicator.width, transform: `translateX(${indicator.left}px)` } : { width: 0, opacity: 0 }}
      />
      {options.map((option) => {
        const on = active === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            data-active={on}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 inline-flex items-center whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition-colors duration-200",
              option.icon ? "gap-1.5" : "gap-2",
              on ? "font-bold text-text-on-dark" : "font-medium text-muted-foreground hover:text-foreground"
            )}
          >
            {option.icon}
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  "inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 font-mono text-xs font-semibold tabular-nums transition-colors duration-200",
                  on ? "bg-[rgba(246,247,237,.20)] text-text-on-dark" : "bg-card text-muted-foreground"
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
