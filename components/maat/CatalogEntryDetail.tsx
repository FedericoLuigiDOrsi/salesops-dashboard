"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/maat/StatusBadge";
import { AttributeCluster } from "@/components/maat/AttributeCluster";
import { ArticleMediaTrack } from "@/components/maat/ArticleMediaTrack";
import { useMaatEntry } from "@/lib/maat-store";
import { getMeasureCategory, MEASURE_FIELDS, CATEGORY_LABELS } from "@/lib/measures";
import { cn } from "@/lib/utils";
import type { CatalogEntry } from "@/types/maat";

type AttrKey = keyof CatalogEntry["attributes"];

const ATTRIBUTE_LABELS: Record<AttrKey, string> = {
  brand: "Brand",
  tipoCapo: "Tipo di capo",
  colore: "Colore",
  taglia: "Taglia",
  materiale: "Materiale",
  genere: "Genere",
  condizioni: "Condizioni",
  difetti: "Difetti",
  stile: "Stile",
  stagionalita: "Stagionalità",
};

const CLUSTERS: { name: string; keys: AttrKey[] }[] = [
  { name: "Identità", keys: ["brand", "tipoCapo", "genere", "stagionalita"] },
  { name: "Colore & materiale", keys: ["colore", "materiale", "stile"] },
  { name: "Taglia & condizioni", keys: ["taglia", "condizioni", "difetti"] },
];

const REQUIRED_LABELS: { key: "fronte" | "retro" | "brand"; text: string }[] = [
  { key: "fronte", text: "Fronte" },
  { key: "retro", text: "Retro" },
  { key: "brand", text: "Brand" },
];

const SPRING = { type: "spring", stiffness: 400, damping: 32 } as const;

const STAGGER_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: SPRING },
};

export function CatalogEntryDetail() {
  const router = useRouter();
  const { entry, confirmEntry, revertToDraft, updateAttribute, updateMeasure } = useMaatEntry();

  const missingLabels = REQUIRED_LABELS.filter(({ key }) => {
    const photo = entry.photos.find((p) => p.label === key);
    return !photo || photo.state !== "validated";
  }).map((l) => l.text);
  const gateEnabled = missingLabels.length === 0;
  const isConfirmed = entry.status === "available";

  const measureCategory = getMeasureCategory(entry.attributes.tipoCapo);
  const measureFields = MEASURE_FIELDS[measureCategory];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <StatusBadge status={entry.status} />
            {entry.sku && <span className="font-mono text-xs text-muted-foreground">{entry.sku}</span>}
          </div>
          <h1 className="mt-1.5 text-[21px] font-bold tracking-tight text-foreground">
            {entry.attributes.brand}
            {" — "}
            {entry.attributes.tipoCapo}
          </h1>
          {!gateEnabled && !isConfirmed && (
            <p className="mt-1 text-xs text-muted-foreground">Mancano: {missingLabels.join(", ")}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative inline-flex gap-0.5 rounded-full bg-foreground/[.05] p-[3px]">
            <motion.button
              type="button"
              onClick={revertToDraft}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "relative z-10 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                !isConfirmed ? "text-background" : "text-muted-foreground"
              )}
            >
              {!isConfirmed && (
                <motion.span
                  layoutId="status-pill"
                  transition={SPRING}
                  className="absolute inset-0 -z-10 rounded-full bg-foreground"
                />
              )}
              Bozza
            </motion.button>
            <motion.button
              type="button"
              onClick={() => gateEnabled && confirmEntry()}
              disabled={!gateEnabled}
              whileTap={gateEnabled ? { scale: 0.96 } : undefined}
              title={!gateEnabled ? `Mancano: ${missingLabels.join(", ")}` : undefined}
              className={cn(
                "relative z-10 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                isConfirmed ? "text-white" : "text-muted-foreground"
              )}
            >
              {isConfirmed && (
                <motion.span
                  layoutId="status-pill"
                  transition={SPRING}
                  className="absolute inset-0 -z-10 rounded-full bg-success"
                />
              )}
              <span className="size-1.5 rounded-full bg-current" /> Confermato
            </motion.button>
          </div>

          {!isConfirmed && (
            <Button
              size="sm"
              disabled={!gateEnabled}
              onClick={confirmEntry}
              title={!gateEnabled ? `Mancano: ${missingLabels.join(", ")}` : undefined}
              className="rounded-full enabled:active:scale-[0.97]"
            >
              Conferma capo
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            title="Elimina"
            className="rounded-[11px] text-destructive transition-transform active:scale-95 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-[18px]" />
          </Button>
        </div>
      </div>

      {/* Media + campi */}
      <div className="grid grid-cols-1 md:grid-cols-[380px_1fr]">
        <div className="border-b border-border bg-gradient-to-b from-background to-card p-5 md:border-b-0 md:border-r">
          <ArticleMediaTrack
            photos={entry.photos}
            onCapture={(label) => router.push(`/capi/${entry.id}/foto/${label}`)}
            onRetake={(label) => router.push(`/capi/${entry.id}/foto/${label}`)}
          />
        </div>

        <motion.div
          className="flex max-h-[600px] flex-col gap-3.5 overflow-y-auto p-5"
          initial="hidden"
          animate="show"
          variants={STAGGER_CONTAINER}
        >
          {CLUSTERS.map((cluster) => (
            <motion.div key={cluster.name} variants={STAGGER_ITEM}>
              <AttributeCluster
                name={cluster.name}
                fields={cluster.keys.map((key) => ({
                  key,
                  label: ATTRIBUTE_LABELS[key],
                  value: entry.attributes[key],
                  onChange: (value: string) => updateAttribute(key, value),
                }))}
              />
            </motion.div>
          ))}

          {/* Misure — calcolate dalla foto ArUco, categoria derivata da tipoCapo */}
          <motion.div variants={STAGGER_ITEM} className="rounded-[14px] border border-border bg-card px-4 pb-3">
            <div className="flex items-center gap-2 py-3 font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              Misure
              <span className="ml-auto normal-case tracking-normal text-muted-foreground/70">
                {CATEGORY_LABELS[measureCategory]}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <svg
                viewBox="0 0 120 150"
                width="80"
                height="100"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
                className="shrink-0 text-foreground"
              >
                <path d="M40 18 L30 26 L18 40 L26 50 L34 44 L34 132 L86 132 L86 44 L94 50 L102 40 L90 26 L80 18 L70 24 Q60 32 50 24 Z" />
                <line x1="50" y1="24" x2="50" y2="132" strokeDasharray="3 3" strokeWidth="1" opacity=".5" />
                <line x1="70" y1="24" x2="70" y2="132" strokeDasharray="3 3" strokeWidth="1" opacity=".5" />
              </svg>
              <div className="flex-1">
                {measureFields.map(({ key, label }, i) => (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center justify-between gap-3 py-2 text-[12.5px] text-muted-foreground",
                      i > 0 && "border-t border-border"
                    )}
                  >
                    <span>{label}</span>
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const num = parseFloat(e.currentTarget.textContent?.replace(/[^0-9.]/g, "") ?? "");
                        if (!Number.isNaN(num)) updateMeasure(key, num);
                      }}
                      className="w-16 rounded-lg border border-transparent bg-muted px-2 py-1 text-right font-mono font-medium text-foreground outline-none transition-colors hover:border-border focus:border-primary focus:bg-card focus:ring-[3px] focus:ring-primary/25"
                    >
                      {entry.measures[key] != null ? `${entry.measures[key]} cm` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Metadata */}
          <motion.div variants={STAGGER_ITEM} className="flex justify-between pt-1 text-xs text-muted-foreground">
            <span className="font-mono">{new Date(entry.createdAt).toLocaleDateString("it-IT")}</span>
            <span className="font-mono">{entry.accountId}</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
