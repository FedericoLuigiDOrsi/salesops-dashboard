"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { shipments } from "@/lib/logistics-mock";
import { buildArcs, buildRings, DIRTYTAG_ORIGIN } from "@/lib/logistics-globe-data";

const GLOBE_HEIGHT = 360;

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export function LogisticsGlobe() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [width, setWidth] = useState(0);
  const [webglSupported] = useState(hasWebGL);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!globeRef.current || width === 0) return;
    globeRef.current.pointOfView({ lat: 46, lng: 8, altitude: 2.1 }, 0);
    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.enableZoom = false;
  }, [width]);

  const arcs = useMemo(() => buildArcs(shipments, DIRTYTAG_ORIGIN), []);
  const rings = useMemo(() => buildRings(shipments), []);

  if (!webglSupported) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-border bg-card text-sm text-muted-foreground"
        style={{ height: GLOBE_HEIGHT }}
      >
        Visualizzazione 3D non supportata su questo dispositivo.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-lg border border-border bg-card"
      style={{ height: GLOBE_HEIGHT }}
    >
      {width > 0 && (
        <Globe
          ref={globeRef}
          width={width}
          height={GLOBE_HEIGHT}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          atmosphereColor="#1E488F"
          atmosphereAltitude={0.2}
          arcsData={arcs}
          arcColor="color"
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={2000}
          arcStroke={0.6}
          arcAltitudeAutoScale={0.3}
          ringsData={rings}
          ringColor="color"
          ringMaxRadius={2.5}
          ringPropagationSpeed={2}
          ringRepeatPeriod={900}
        />
      )}
    </div>
  );
}
