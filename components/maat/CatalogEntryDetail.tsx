"use client";

import { useRouter } from "next/navigation";
import { MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/maat/StatusBadge";
import { AttributeField } from "@/components/maat/AttributeField";
import { ConfirmGateButton } from "@/components/maat/ConfirmGateButton";
import { PhotoGrid } from "@/components/maat/PhotoGrid";
import { useMaatEntry } from "@/lib/maat-store";
import { getMeasureCategory, MEASURE_FIELDS, CATEGORY_LABELS } from "@/lib/measures";
import { cn } from "@/lib/utils";
import type { CatalogEntry } from "@/types/maat";

const ATTRIBUTE_ORDER: { key: keyof CatalogEntry["attributes"]; label: string }[] = [
  { key: "brand", label: "Brand" },
  { key: "tipoCapo", label: "Tipo di capo" },
  { key: "colore", label: "Colore" },
  { key: "taglia", label: "Taglia" },
  { key: "materiale", label: "Materiale" },
  { key: "genere", label: "Genere" },
  { key: "condizioni", label: "Condizioni" },
  { key: "difetti", label: "Difetti" },
  { key: "stile", label: "Stile" },
  { key: "stagionalita", label: "Stagionalità" },
];

const REQUIRED_LABELS: { key: "fronte" | "retro" | "brand"; text: string }[] = [
  { key: "fronte", text: "Fronte" },
  { key: "retro", text: "Retro" },
  { key: "brand", text: "Brand" },
];

const UNCERTAIN_FIELDS = new Set<keyof CatalogEntry["attributes"]>(["stagionalita"]);

interface CatalogEntryDetailProps {
  /** "page" = route piena (gate fixed a fondo viewport); "panel" = dentro l'overlay Sheet (gate sticky). */
  variant?: "page" | "panel";
}

export function CatalogEntryDetail({ variant = "page" }: CatalogEntryDetailProps) {
  const router = useRouter();
  const { entry } = useMaatEntry();
  const isPanel = variant === "panel";
  const pad = isPanel ? "px-5" : "px-4 sm:px-0";
  const missingLabels = REQUIRED_LABELS.filter(({ key }) => {
    const photo = entry.photos.find((p) => p.label === key);
    return !photo || photo.state !== "validated";
  }).map((l) => l.text);
  const gateEnabled = missingLabels.length === 0;

  const heroPhoto = entry.photos.find((p) => p.label === "fronte");
  const measureCategory = getMeasureCategory(entry.attributes.tipoCapo);
  const measureFields = MEASURE_FIELDS[measureCategory];

  return (
    <div className={cn("flex flex-col", isPanel ? "min-h-full" : "mx-auto max-w-3xl pb-28")}>
      {/* Hero */}
      <div className={cn("flex items-start gap-4 border-b border-border py-6", pad)}>
        <div className="size-20 shrink-0 overflow-hidden rounded-[14px] bg-muted">
          {heroPhoto?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroPhoto.url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <StatusBadge status={entry.status} />
            {entry.sku && <span className="font-mono text-xs text-muted-foreground">{entry.sku}</span>}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {entry.attributes.brand} — {entry.attributes.tipoCapo}
          </h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem variant="destructive">
              <Trash2 className="size-4" /> Elimina capo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Photo grid */}
      <div className={cn("border-b border-border py-6", pad)}>
        <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">Foto</h2>
        <PhotoGrid
          photos={entry.photos}
          onCapture={(label) => router.push(`/capi/${entry.id}/foto/${label}`)}
          onRetake={(label) => router.push(`/capi/${entry.id}/foto/${label}`)}
        />
      </div>

      {/* Attributes */}
      <div className={pad}>
        {ATTRIBUTE_ORDER.map(({ key, label }) => (
          <AttributeField
            key={key}
            label={label}
            value={entry.attributes[key]}
            uncertain={UNCERTAIN_FIELDS.has(key)}
          />
        ))}
      </div>

      {/* Misure — calcolate dalla foto ArUco, categoria derivata da tipoCapo */}
      <div className={cn("py-2", pad)}>
        <Accordion type="single" collapsible>
          <AccordionItem value="misure">
            <AccordionTrigger className="font-medium">
              Misure <span className="ml-2 font-mono text-xs text-muted-foreground">{CATEGORY_LABELS[measureCategory]}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-x-4 font-mono text-sm">
                {measureFields.map(({ key, label }) => (
                  <div key={key} className="flex justify-between border-b border-border py-2">
                    <span className="text-muted-foreground">{label}</span>
                    <span>{entry.measures[key] ?? "—"} cm</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Metadata footer */}
      <div className={cn("flex justify-between py-4 text-xs text-muted-foreground", pad)}>
        <span className="font-mono">{new Date(entry.createdAt).toLocaleDateString("it-IT")}</span>
        <span className="font-mono">{entry.accountId}</span>
      </div>

      {/* Confirm gate — fixed a fondo viewport nella pagina, sticky dentro il pannello */}
      {isPanel ? (
        <div className="sticky bottom-0 z-10 mt-auto">
          <ConfirmGateButton enabled={gateEnabled} missingLabels={missingLabels} />
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0">
          <div className="mx-auto max-w-3xl">
            <ConfirmGateButton enabled={gateEnabled} missingLabels={missingLabels} />
          </div>
        </div>
      )}
    </div>
  );
}
