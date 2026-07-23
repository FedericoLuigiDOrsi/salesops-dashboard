"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { AttributeField } from "@/components/maat/AttributeField";
import { ConfirmGateButton } from "@/components/maat/ConfirmGateButton";
import { PhotoGrid } from "@/components/maat/PhotoGrid";
import { PriceMarginCard } from "@/components/maat/PriceMarginCard";
import { useMaatEntry } from "@/lib/maat-store";
import { getMeasureCategory, MEASURE_FIELDS, CATEGORY_LABELS } from "@/lib/measures";
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

const UNCERTAIN_FIELDS = new Set<keyof CatalogEntry["attributes"]>(["stagionalita"]);

const REQUIRED_LABELS: { key: "fronte" | "retro" | "brand"; text: string }[] = [
  { key: "fronte", text: "Fronte" },
  { key: "retro", text: "Retro" },
  { key: "brand", text: "Brand" },
];

export function ReviewForm() {
  const router = useRouter();
  const { entry, confirmEntry, updatePrices, updateAttribute } = useMaatEntry();

  const missing = ATTRIBUTE_ORDER.filter(({ key }) => entry.attributes[key] === "");
  const uncertain = ATTRIBUTE_ORDER.filter(({ key }) => UNCERTAIN_FIELDS.has(key) && entry.attributes[key] !== "");
  const confident = ATTRIBUTE_ORDER.filter(
    ({ key }) => entry.attributes[key] !== "" && !UNCERTAIN_FIELDS.has(key)
  );
  const reviewedCount = ATTRIBUTE_ORDER.length - missing.length - uncertain.length;

  const missingPhotoLabels = REQUIRED_LABELS.filter(({ key }) => {
    const photo = entry.photos.find((p) => p.label === key);
    return !photo || photo.state !== "validated";
  }).map((l) => l.text);
  const missingLabels = [...missingPhotoLabels, ...missing.map((m) => m.label)];
  const gateEnabled = missingLabels.length === 0;

  function handleConfirm() {
    confirmEntry();
    // Non /capi/${id}: quella rotta è intercettata come Sheet laterale da
    // app/capi/@modal/(.)[id] — la schermata di conferma dedicata vive altrove.
    router.push(`/capi/${entry.id}/confermato`);
  }

  const measureCategory = getMeasureCategory(entry.attributes.tipoCapo);
  const measureFields = MEASURE_FIELDS[measureCategory];

  return (
    <div className="mx-auto flex max-w-3xl flex-col pb-28">
      <div className="px-4 py-6 sm:px-0">
        <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {entry.attributes.brand} — {entry.attributes.tipoCapo}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Rivedi capo</h1>
      </div>

      {/* Banner */}
      <div className="mx-4 mb-6 flex items-center gap-4 rounded-xl bg-primary/25 px-5 py-4 sm:mx-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary">
          <Sparkles className="size-4 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Rivedi i campi proposti dall'AI</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {missing.length} campo mancante, {uncertain.length} da verificare — gli altri sono precompilati con fiducia alta
          </p>
        </div>
        <div className="rounded-full bg-card px-3 py-1.5 font-mono text-xs font-semibold">
          {reviewedCount} / {ATTRIBUTE_ORDER.length}
        </div>
      </div>

      {/* Foto read-only di riferimento */}
      <div className="px-4 pb-6 sm:px-0">
        <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Foto (riferimento)
        </h2>
        <PhotoGrid
          photos={entry.photos}
          onCapture={(label) => router.push(`/capi/${entry.id}/foto/${label}`)}
          onRetake={(label) => router.push(`/capi/${entry.id}/foto/${label}`)}
        />
      </div>

      {/* Attributi per urgenza */}
      <div className="px-4 sm:px-0">
        {missing.length > 0 && (
          <>
            <h3 className="mb-2 mt-2 text-xs font-semibold text-muted-foreground">Mancanti</h3>
            {missing.map(({ key, label }) => (
              <AttributeField
                key={key}
                label={label}
                value={entry.attributes[key]}
                missing
                onSave={(value) => updateAttribute(key, value)}
              />
            ))}
          </>
        )}
        {uncertain.length > 0 && (
          <>
            <h3 className="mb-2 mt-5 text-xs font-semibold text-muted-foreground">Da verificare</h3>
            {uncertain.map(({ key, label }) => (
              <AttributeField
                key={key}
                label={label}
                value={entry.attributes[key]}
                uncertain
                onSave={(value) => updateAttribute(key, value)}
              />
            ))}
          </>
        )}
        {confident.length > 0 && (
          <>
            <h3 className="mb-2 mt-5 text-xs font-semibold text-muted-foreground">Confermati dall'AI</h3>
            {confident.map(({ key, label }) => (
              <AttributeField
                key={key}
                label={label}
                value={entry.attributes[key]}
                onSave={(value) => updateAttribute(key, value)}
              />
            ))}
          </>
        )}
      </div>

      {/* Misure — calcolate via ArUco, read-only */}
      <div className="mx-4 mt-6 rounded-xl border border-border bg-card p-5 sm:mx-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Misure</p>
            <p className="text-xs text-muted-foreground">Calcolate automaticamente dalla foto reference con marker ArUco</p>
          </div>
          <span className="rounded-full bg-foreground/5 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase text-muted-foreground">
            {CATEGORY_LABELS[measureCategory]}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          {measureFields.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="font-mono text-base font-semibold">
                {entry.measures[key] ?? "—"} <span className="text-xs font-normal text-muted-foreground">cm</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Prezzo & margine */}
      <div className="mx-4 mt-6 sm:mx-0">
        <PriceMarginCard
          purchasePriceCents={entry.purchasePriceCents}
          suggestedSalePriceCents={entry.suggestedSalePriceCents}
          onChange={updatePrices}
        />
      </div>

      {/* Sticky confirm gate — nascosto a conferma avvenuta: non c'è più nulla da confermare. */}
      {entry.status !== "available" && (
        <div className="fixed inset-x-0 bottom-0">
          <div className="mx-auto max-w-3xl">
            <ConfirmGateButton enabled={gateEnabled} missingLabels={missingLabels} onConfirm={handleConfirm} />
          </div>
        </div>
      )}
    </div>
  );
}
