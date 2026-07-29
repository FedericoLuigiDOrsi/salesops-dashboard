"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/maat/StatusBadge";
import { AttributeCluster } from "@/components/maat/AttributeCluster";
import { ArticleMediaTrack } from "@/components/maat/ArticleMediaTrack";
import { PriceMarginCard } from "@/components/maat/PriceMarginCard";
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
  { name: "Colore & materiale", keys: ["colore", "materiale", "stile", "taglia"] },
  { name: "Taglia & condizioni", keys: ["condizioni", "difetti"] },
];

const REQUIRED_LABELS: { key: "fronte" | "retro" | "brand"; text: string }[] = [
  { key: "fronte", text: "Fronte" },
  { key: "retro", text: "Retro" },
  { key: "brand", text: "Brand" },
];

export function CatalogEntryDetail() {
  const router = useRouter();
  const attributesRef = useRef<HTMLDivElement>(null);
  const { entry, confirmEntry, revertToDraft, updateAttribute, updateMeasure, updatePrices } = useMaatEntry();

  const missingAttributeKeys = (Object.keys(ATTRIBUTE_LABELS) as AttrKey[]).filter(
    (key) => entry.attributes[key] === ""
  );
  const missingPhotoLabels = REQUIRED_LABELS.filter(({ key }) => {
    const photo = entry.photos.find((p) => p.label === key);
    return !photo || photo.state !== "validated";
  }).map((l) => l.text);
  const missingLabels = [...missingPhotoLabels, ...missingAttributeKeys.map((key) => ATTRIBUTE_LABELS[key])];
  const gateEnabled = missingLabels.length === 0;
  const isConfirmed = entry.status === "available";

  const measureCategory = getMeasureCategory(entry.attributes.tipoCapo);
  const measureFields = MEASURE_FIELDS[measureCategory];
  const completedAttributes = Object.keys(ATTRIBUTE_LABELS).length - missingAttributeKeys.length;
  const completedGateItems = completedAttributes + (REQUIRED_LABELS.length - missingPhotoLabels.length);
  const formattedDate = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(entry.createdAt));
  const validatedPhotos = entry.photos.filter((photo) => photo.state === "validated").length;

  function editFields() {
    if (isConfirmed) revertToDraft();
    attributesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-5 px-5 pb-0 pt-5 md:px-7 md:pt-6">
        <div className="min-w-0 flex-1">
          <StatusBadge status={entry.status} />
          <h1 className="mt-2.5 text-[26px] font-extrabold leading-[1.1] tracking-[-.03em] text-foreground">
            {entry.attributes.brand || "Brand da definire"}
            <span className="ml-2 text-[16px] font-medium tracking-normal text-muted-foreground">
              {entry.attributes.tipoCapo || "Tipo di capo"}
            </span>
          </h1>
          <p className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-[.06em] text-muted-foreground">
            {entry.sku ?? "SKU non assegnato"} · {entry.accountId} · {formattedDate}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="icon" onClick={editFields} title={isConfirmed ? "Riporta in bozza e modifica" : "Modifica campi"} className="rounded-[10px] bg-foreground/[.05] text-muted-foreground hover:bg-foreground/[.09] hover:text-foreground">
            <Pencil className="size-4" strokeWidth={1.7} />
          </Button>
          <Button variant="ghost" size="icon" title="Non ancora disponibile" disabled className="rounded-[10px] bg-foreground/[.05] text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="size-4" strokeWidth={1.7} />
          </Button>
          {!isConfirmed && (
            <Button
              size="sm"
              disabled={!gateEnabled}
              onClick={confirmEntry}
              title={!gateEnabled ? `Mancano: ${missingLabels.join(", ")}` : undefined}
              className="h-9 rounded-[12px] px-4 enabled:active:scale-[0.98]"
            >
              Conferma capo
            </Button>
          )}
        </div>
      </div>

      {/* Media */}
      <div className="px-5 py-5 md:px-7 md:py-[22px]">
        <ArticleMediaTrack
          photos={entry.photos}
          onCapture={(label) => router.push(`/capi/${entry.id}/foto/${label}`)}
          onRetake={(label) => router.push(`/capi/${entry.id}/foto/${label}`)}
        />
      </div>

      {/* Attributi */}
      <div ref={attributesRef} className="grid border-t border-border px-5 md:grid-cols-3 md:px-7">
        {CLUSTERS.map((cluster, index) => (
          <div key={cluster.name} className={cn("py-2 md:px-5", index === 0 && "md:pl-0", index > 0 && "border-t border-border md:border-l md:border-t-0", index === CLUSTERS.length - 1 && "md:pr-0")}>
              <AttributeCluster
                name={cluster.name}
                fields={cluster.keys.map((key) => ({
                  key,
                  label: ATTRIBUTE_LABELS[key],
                  value: entry.attributes[key],
                  onChange: (value: string) => updateAttribute(key, value),
                }))}
                metaField={index === CLUSTERS.length - 1 ? { label: "Fonte", value: `AI · ${validatedPhotos} foto` } : undefined}
              />
          </div>
        ))}
      </div>

      {/* Misure + prezzo */}
      <div className="grid gap-6 border-t border-border px-5 py-5 md:px-7 lg:grid-cols-[1.3fr_1fr] lg:gap-7">
        <section>
          <div className="mb-2.5 flex items-baseline gap-2.5">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Misure</span>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[.1em] text-muted-foreground/75">
              {CATEGORY_LABELS[measureCategory]} · ArUco
            </span>
          </div>
          <div className="flex items-start gap-5">
              <svg
                viewBox="0 0 120 150"
                width="66"
                height="83"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                className="mt-1 shrink-0 text-foreground"
              >
                <path d="M40 18 L30 26 L18 40 L26 50 L34 44 L34 132 L86 132 L86 44 L94 50 L102 40 L90 26 L80 18 L70 24 Q60 32 50 24 Z" />
                <line x1="50" y1="24" x2="50" y2="132" strokeDasharray="3 3" strokeWidth="1" opacity=".5" />
                <line x1="70" y1="24" x2="70" y2="132" strokeDasharray="3 3" strokeWidth="1" opacity=".5" />
              </svg>
              <div className="grid flex-1 grid-cols-1 gap-x-5 sm:grid-cols-2">
                {measureFields.map(({ key, label }, i) => (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center justify-between gap-3 py-2 text-[12.5px] text-muted-foreground",
                      i > 0 && "border-t border-border",
                      i === 1 && "sm:border-t-0"
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
                      className="w-[72px] rounded-[7px] border border-transparent bg-transparent px-1.5 py-1 text-right font-mono font-medium text-foreground outline-none transition-colors hover:border-border hover:bg-muted focus:border-primary focus:bg-card focus:ring-[3px] focus:ring-primary/25"
                    >
                      {entry.measures[key] != null ? `${entry.measures[key]} cm` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
        </section>
        <PriceMarginCard
          compact
          purchasePriceCents={entry.purchasePriceCents}
          suggestedSalePriceCents={entry.suggestedSalePriceCents}
          onChange={updatePrices}
          completion={{
            current: completedGateItems,
            total: Object.keys(ATTRIBUTE_LABELS).length + REQUIRED_LABELS.length,
            missingLabel: missingLabels[0],
          }}
        />
      </div>
    </div>
  );
}
