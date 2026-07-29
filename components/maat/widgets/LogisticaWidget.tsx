"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { shipments } from "@/lib/logistics-mock";
import { SHIPMENT_STATUS_LABELS, type ShipmentStatus } from "@/types/maat";
import { needsAction } from "@/lib/logistics-globe-data";

const LogisticsGlobe = dynamic(
  () => import("@/components/maat/logistics/LogisticsGlobe").then((m) => m.LogisticsGlobe),
  { ssr: false, loading: () => null }
);

const STATUS_ORDER: ShipmentStatus[] = ["da_fare", "fatti", "spediti", "consegnati"];

/** Card di ingresso alla board Logistica dalla Home: rete spedizioni live + conteggi per stato. */
export function LogisticaWidget() {
  const counts = STATUS_ORDER.map((status) => ({
    status,
    label: SHIPMENT_STATUS_LABELS[status],
    count: shipments.filter((s) => s.status === status).length,
  }));

  return (
    <Link
      href="/logistica"
      className="group relative flex h-full min-h-[180px] flex-col justify-between overflow-hidden rounded-xl bg-surface-dark px-6 py-5 text-text-on-dark transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-1/2 aspect-square w-[56%] max-w-[280px] -translate-y-1/2"
        style={{
          maskImage: "linear-gradient(90deg, transparent 0%, #000 54%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 54%)",
        }}
      >
        <LogisticsGlobe height={280} mode="widget" />
      </div>

      <div className="relative max-w-[64%]">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.14em] text-text-on-dark/55">
          <span className="size-[7px] shrink-0 animate-pulse rounded-full bg-primary" />
          Rete di spedizioni · Live
        </span>
        <div className="mt-2.5 text-[21px] font-bold tracking-tight">Da Napoli al mondo</div>
        <p className="mt-1 text-[13px] leading-relaxed text-text-on-dark/60">
          Tracce attive verso i destinatari in Italia ed Europa.
        </p>
      </div>

      {/* Riga di KPI senza tessere colorate: numeri mono su una linea di base,
          divisori hairline, quadratino fluo solo su ciò che richiede azione. */}
      <div className="relative flex items-end">
        {counts.map(({ status, label, count }, i) => (
          <div
            key={status}
            className={cn("flex-1", i > 0 && "border-l border-text-on-dark/15 pl-3.5")}
          >
            <div className="flex items-center gap-1.5">
              {status === "da_fare" && <span className="size-[7px] shrink-0 rounded-[2px] bg-primary" />}
              <span
                className={cn(
                  "font-mono text-[25px] font-bold leading-none tracking-tight tabular-nums",
                  !needsAction(status) && "text-text-on-dark/60"
                )}
              >
                {count}
              </span>
            </div>
            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[.1em] text-text-on-dark/55">
              {label}
            </div>
          </div>
        ))}
      </div>

      <span className="relative mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        Apri logistica <ArrowRight className="size-3.5" />
      </span>
    </Link>
  );
}
