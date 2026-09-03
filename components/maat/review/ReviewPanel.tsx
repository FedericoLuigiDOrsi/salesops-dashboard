"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Sparkles, ImageOff } from "lucide-react";
import { AttributeField } from "@/components/maat/AttributeField";
import { ConfirmGateButton } from "@/components/maat/ConfirmGateButton";
import { cn } from "@/lib/utils";
import { confirmDraft } from "@/lib/actions/review";
import {
  REVIEW_ATTRIBUTES,
  REQUIRED_ATTRS,
  MIN_PHOTOS,
  type ReviewDraft,
  type ConfirmResult,
} from "@/lib/review-types";

const REQUIRED = new Set<string>(REQUIRED_ATTRS);
const REVIEW_ATTR_LABEL = new Map(REVIEW_ATTRIBUTES.map(({ key, label }) => [key, label]));

// Vocabolario di stato del draft reale (schema canonico, `draft.status` è uno
// string libero lato DB — non lo stesso enum di CatalogEntryStatus usato dal
// flusso mock in ReviewForm/StatusBadge, quindi non riusiamo StatusBadge qui:
// mappiamo esplicitamente i soli valori che questo componente riconosce.
const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  draft: { label: "Bozza", className: "bg-primary text-primary-foreground" },
  incomplete: { label: "Da completare", className: "bg-neutral-soft text-muted-foreground" },
};

export function ReviewPanel({ draft }: { draft: ReviewDraft }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ConfirmResult | null>(null);

  const confirmed = result?.ok === true || !["draft", "incomplete"].includes(draft.status);

  function onConfirm() {
    setResult(null);
    start(async () => setResult(await confirmDraft(draft.id)));
  }

  const title =
    [draft.attributes.brand, draft.attributes.tipoCapo].filter(Boolean).join(" — ") ||
    draft.catalogRef ||
    "Draft senza titolo";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            Review · {draft.catalogRef ?? draft.id.slice(0, 8)}
          </div>
          <h1 className="mt-1 text-lg font-semibold text-foreground">{title}</h1>
        </div>
        {(() => {
          const status = confirmed
            ? { label: "Confermato", className: "bg-success-soft text-success" }
            : (STATUS_LABEL[draft.status] ?? { label: draft.status, className: "bg-neutral-soft text-muted-foreground" });
          return (
            <span
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide",
                status.className
              )}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {status.label}
            </span>
          );
        })()}
      </header>

      {!draft.aiHasRun && !confirmed && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 shrink-0" />
          L’AI non ha ancora elaborato questo draft: compila i campi a mano prima di confermare.
        </div>
      )}

      {/* Foto */}
      <section>
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          Foto ({draft.photoCount})
        </div>
        {draft.photos.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
            <ImageOff className="size-4" /> Nessuna foto
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {draft.photos.map((p) =>
              p.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={p.url}
                  alt={p.role}
                  className="aspect-square w-full rounded-md border border-border object-cover"
                />
              ) : (
                <div
                  key={p.id}
                  className="flex aspect-square w-full items-center justify-center rounded-md border border-border bg-muted text-muted-foreground"
                >
                  <ImageOff className="size-4" />
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* Attributi (10) */}
      <section>
        <div className="mb-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          Attributi
        </div>
        <div className="rounded-md border border-border">
          {REVIEW_ATTRIBUTES.map(({ key, label }) => (
            <AttributeField
              key={key}
              label={label}
              value={draft.attributes[key]}
              missing={REQUIRED.has(key) && draft.attributes[key] === ""}
            />
          ))}
        </div>
      </section>

      {/* Gate + confirm — stesso componente del fratello ReviewForm (capi/[id]/review) */}
      {!confirmed && (
        <ConfirmGateButton
          enabled={draft.canConfirm && !pending}
          missingLabels={[
            ...(draft.photoCount < MIN_PHOTOS ? [`Foto (servono almeno ${MIN_PHOTOS}, ora ${draft.photoCount})`] : []),
            ...draft.missingRequired.map((key) => REVIEW_ATTR_LABEL.get(key) ?? key),
          ]}
          onConfirm={onConfirm}
        />
      )}

      {result && !result.ok && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {result.error}
        </div>
      )}
      {confirmed && (
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <CheckCircle2 className="size-4 text-primary" /> Capo confermato: è passato a catalogo.
        </div>
      )}

      <p className="text-center font-mono text-[10px] text-muted-foreground/60">
        Gate = campi obbligatori + ≥{MIN_PHOTOS} foto. Nota: lo schema canonico non traccia lo stato
        &quot;validated&quot; per foto → gate su presenza, non validazione (vedi proposta gap).
      </p>
    </div>
  );
}
