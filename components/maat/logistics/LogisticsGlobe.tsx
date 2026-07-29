"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  geoDistance,
  geoGraticule,
  geoInterpolate,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import { shipments } from "@/lib/logistics-mock";
import { buildCityAggregates, cityTooltip, DIRTYTAG_ORIGIN, type CityAggregate } from "@/lib/logistics-globe-data";
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from "react";

/* ------------------------------------------------------------------
   Globo spedizioni — direzione "globo di linee" (1a).
   Canvas 2D + d3-geo al posto di react-globe.gl/three:
   ~15 KB di runtime, nessun WebGL, nessuna texture fotografica.
   Il fluo marca solo le spedizioni che richiedono azione (da_fare/fatti);
   spediti e consegnati sono tratteggio neutro.
------------------------------------------------------------------- */

const PAPER = "246,247,237"; // --text-on-dark
const FLUO = "#DBE64C"; // --primary
const SURFACE_DARK = "#001A36";

const STYLE = {
  sphere: `rgba(${PAPER},.035)`,
  graticule: `rgba(${PAPER},.10)`,
  coast: `rgba(${PAPER},.46)`,
  limb: `rgba(${PAPER},.24)`,
  quiet: `rgba(${PAPER},.28)`,
  city: `rgba(${PAPER},.55)`,
} as const;

/** Centro di vista: Europa occidentale, l'area dove vanno davvero i pacchi. */
const CENTER: [number, number] = [9, 44];
const SWING_DEG = 20; // ampiezza dell'oscillazione lenta
const PACKET_PERIOD = 2.6; // s per rotta attiva

const ORIGIN: [number, number] = [DIRTYTAG_ORIGIN.lng, DIRTYTAG_ORIGIN.lat];
const GRATICULE = geoGraticule().step([15, 15])();

type Land = GeoPermissibleObjects;

let landPromise: Promise<Land> | null = null;
/** Geometria Natural Earth 110m, caricata una volta e condivisa tra le istanze. */
function loadLand(): Promise<Land> {
  if (!landPromise) {
    landPromise = Promise.all([import("world-atlas/land-110m.json"), import("topojson-client")]).then(
      ([mod, topojson]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const topo = ((mod as any).default ?? mod) as any;
        return topojson.feature(topo, topo.objects.land) as unknown as Land;
      }
    );
  }
  return landPromise;
}

function greatCircle(a: [number, number], b: [number, number]) {
  const it = geoInterpolate(a, b);
  const coordinates: [number, number][] = [];
  for (let i = 0; i <= 40; i++) coordinates.push(it(i / 40) as [number, number]);
  return { type: "LineString" as const, coordinates };
}

/** Inquadratura: nell'hero la sfera è croppata a destra, nel widget è centrata. */
function frame(w: number, h: number, mode: "hero" | "widget") {
  if (mode === "hero") return { cx: w * 0.74, cy: h * 0.61, r: h * 1.26 };
  const m = Math.min(w, h);
  return { cx: w / 2, cy: h / 2, r: m * 0.6 };
}

interface LogisticsGlobeProps {
  /** Altezza in px del canvas — il contenitore controlla il resto del chrome. */
  height?: number;
  /** "hero" croppa la sfera sul bordo destro; "widget" la centra. */
  mode?: "hero" | "widget";
  /** Click su una città: usalo per filtrare la board. Se assente il globo è solo esplorabile. */
  onCityClick?: (cityName: string) => void;
  className?: string;
}

export function LogisticsGlobe({ height = 360, mode = "widget", onCityClick, className }: LogisticsGlobeProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [width, setWidth] = useState(0);
  const [land, setLand] = useState<Land | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);

  const cities = useMemo(() => buildCityAggregates(shipments), []);
  const routes = useMemo(() => cities.filter((c) => c.name !== "Napoli"), [cities]);
  const active = useMemo(() => routes.filter((r) => r.needsAction), [routes]);

  const rot = useRef<[number, number]>([-CENTER[0], -CENTER[1]]);
  const live = useRef(true);
  const drag = useRef<{ x: number; y: number; from: [number, number] } | null>(null);
  const proj = useRef(geoOrthographic().clipAngle(90).precision(0.4));

  useEffect(() => {
    loadLand().then(setLand).catch(() => setLand(null));
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visible = useCallback((c: [number, number]) => {
    const [lon, lat] = rot.current;
    return geoDistance(c, [-lon, -lat]) < Math.PI / 2 - 0.02;
  }, []);

  /** Città sotto il puntatore, entro 16 px. */
  const pick = useCallback(
    (mx: number, my: number) => {
      let best: { city: CityAggregate; p: [number, number] } | null = null;
      let bd = 16;
      for (const city of cities) {
        const c: [number, number] = [city.lng, city.lat];
        if (!visible(c)) continue;
        const p = proj.current(c);
        if (!p) continue;
        const d = Math.hypot(p[0] - mx, p[1] - my);
        if (d < bd) {
          bd = d;
          best = { city, p: p as [number, number] };
        }
      }
      return best;
    },
    [cities, visible]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !land || !width) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { cx, cy, r } = frame(width, height, mode);
    const p = proj.current.translate([cx, cy]).scale(r);
    const path = geoPath(p, ctx);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const big = mode === "hero";

    let t = 0;
    let last = 0;
    let raf = 0;

    const draw = (ts: number) => {
      const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0);
      last = ts;
      t += dt;
      if (live.current && !reduced) rot.current[0] = -CENTER[0] + Math.sin(t * 0.11) * SWING_DEG;
      p.rotate(rot.current);

      ctx.clearRect(0, 0, width, height);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.fillStyle = STYLE.sphere;
      ctx.fill();

      ctx.beginPath();
      path(GRATICULE as GeoPermissibleObjects);
      ctx.strokeStyle = STYLE.graticule;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      path(land);
      ctx.strokeStyle = STYLE.coast;
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.strokeStyle = STYLE.limb;
      ctx.lineWidth = 1;
      ctx.stroke();

      // rotte quiete: spediti / consegnati
      ctx.strokeStyle = STYLE.quiet;
      ctx.lineWidth = 1;
      ctx.setLineDash([2.5, 3.5]);
      for (const c of routes) {
        if (c.needsAction) continue;
        ctx.beginPath();
        path(greatCircle(ORIGIN, [c.lng, c.lat]));
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // rotte che richiedono azione
      ctx.strokeStyle = FLUO;
      ctx.lineWidth = big ? 1.8 : 1.5;
      for (const c of active) {
        ctx.beginPath();
        path(greatCircle(ORIGIN, [c.lng, c.lat]));
        ctx.stroke();
      }

      // un pacco in movimento per volta, a ciclo
      if (active.length && !reduced) {
        const idx = Math.floor(t / PACKET_PERIOD) % active.length;
        const dest: [number, number] = [active[idx].lng, active[idx].lat];
        const f = (t % PACKET_PERIOD) / PACKET_PERIOD;
        const pos = geoInterpolate(ORIGIN, dest)(Math.min(1, f * 1.05)) as [number, number];
        if (visible(pos)) {
          const q = p(pos);
          if (q) {
            const rr = big ? 3.4 : 2.8;
            ctx.beginPath();
            ctx.arc(q[0], q[1], rr, 0, Math.PI * 2);
            ctx.fillStyle = FLUO;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(q[0], q[1], rr, 0, Math.PI * 2);
            ctx.strokeStyle = SURFACE_DARK;
            ctx.lineWidth = 1.3;
            ctx.stroke();
          }
        }
      }

      // città: raggio in base al numero di spedizioni
      for (const city of cities) {
        const c: [number, number] = [city.lng, city.lat];
        if (!visible(c)) continue;
        const q = p(c);
        if (!q) continue;
        const rr = (big ? 2.1 : 1.9) + Math.min(2.4, city.total * 0.6);
        ctx.beginPath();
        ctx.arc(q[0], q[1], rr, 0, Math.PI * 2);
        ctx.fillStyle = city.needsAction ? FLUO : STYLE.city;
        ctx.fill();
      }

      // origine Napoli: quadrato + anello, non un punto come gli altri
      if (visible(ORIGIN)) {
        const q = p(ORIGIN);
        if (q) {
          const s = big ? 4.6 : 4;
          ctx.fillStyle = `rgb(${PAPER})`;
          ctx.fillRect(q[0] - s / 2, q[1] - s / 2, s, s);
          ctx.strokeStyle = `rgba(${PAPER},.35)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(q[0], q[1], s + 3.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [land, width, height, mode, cities, routes, active, visible]);

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, from: [...rot.current] as [number, number] };
    live.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (drag.current) {
      const k = 0.26;
      rot.current = [
        drag.current.from[0] + (e.clientX - drag.current.x) * k,
        Math.max(-80, Math.min(80, drag.current.from[1] - (e.clientY - drag.current.y) * k)),
      ];
      return;
    }
    const box = e.currentTarget.getBoundingClientRect();
    const hit = pick(e.clientX - box.left, e.clientY - box.top);
    setTip(hit ? { x: hit.p[0], y: hit.p[1], text: cityTooltip(hit.city) } : null);
  };

  const release = () => {
    drag.current = null;
    live.current = true;
  };

  const onClick = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (!onCityClick) return;
    const box = e.currentTarget.getBoundingClientRect();
    const hit = pick(e.clientX - box.left, e.clientY - box.top);
    if (hit) {
      e.preventDefault();
      e.stopPropagation();
      onCityClick(hit.city.name);
    }
  };

  return (
    <div ref={wrapRef} className={className} style={{ height, position: "relative" }}>
      <canvas
        ref={canvasRef}
        className="block touch-none select-none"
        style={{ cursor: onCityClick ? "pointer" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerEnter={() => {
          live.current = false;
        }}
        onPointerLeave={() => {
          live.current = true;
          setTip(null);
        }}
        onClick={onClick}
      />
      {tip && (
        <div
          className="pointer-events-none absolute z-[5] whitespace-nowrap rounded-lg bg-primary px-2 py-1 font-mono text-[10.5px] font-semibold leading-tight text-primary-foreground"
          style={{ left: tip.x, top: tip.y, transform: "translate(-50%,-140%)" }}
        >
          {tip.text}
        </div>
      )}
    </div>
  );
}
