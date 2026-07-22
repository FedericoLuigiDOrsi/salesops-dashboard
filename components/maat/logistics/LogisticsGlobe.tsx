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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ready || !globeRef.current) return;
    globeRef.current.pointOfView({ lat: DIRTYTAG_ORIGIN.lat, lng: DIRTYTAG_ORIGIN.lng, altitude: 0.9 }, 0);
    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.1;
    controls.enableZoom = false;
    controls.enableRotate = true;
  }, [ready]);

  const arcs = useMemo(() => buildArcs(shipments), []);
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
          globeImageUrl="/earth-dark.jpg"
          onGlobeReady={() => setReady(true)}
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
