"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { StatusBadge } from "@/components/maat/StatusBadge";
import { storageKey } from "@/lib/maat-store";
import type { CatalogEntry } from "@/types/maat";

const AUTO_DISMISS_MS = 8000;

interface ConfirmedFloatingCardProps {
  id: string;
  onDismiss: () => void;
}

/** Riepilogo flottante del capo appena confermato (o annullato con foto già
 * scattate), sopra la lista Capi — sostituisce l'apertura forzata del Sheet
 * laterale dopo la conferma. Letto da localStorage: il dataset della lista
 * (`mockCatalogEntries`) è statico e non include le bozze create dal flusso
 * live, quindi non c'è altra fonte per questi dati lato client. */
export function ConfirmedFloatingCard({ id, onDismiss }: ConfirmedFloatingCardProps) {
  const [entry, setEntry] = useState<CatalogEntry | null | undefined>(undefined);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey(id));
      setEntry(stored ? (JSON.parse(stored) as CatalogEntry) : null);
    } catch {
      setEntry(null);
    }
  }, [id]);

  useEffect(() => {
    const t = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!entry) return null;

  const title = entry.attributes.brand || entry.attributes.tipoCapo
    ? [entry.attributes.brand, entry.attributes.tipoCapo].filter(Boolean).join(" — ")
    : "Capo confermato";

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-6">
      <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-lg">
        <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-success-soft text-success">
          <Check className="size-5" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={entry.status} />
            {entry.sku && <span className="font-mono text-[11px] text-muted-foreground">{entry.sku}</span>}
          </div>
        </div>
        <Link
          href={`/capi/${id}`}
          className="flex-none text-xs font-semibold text-foreground underline-offset-2 hover:underline"
        >
          Apri
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Chiudi"
          className="flex-none text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
