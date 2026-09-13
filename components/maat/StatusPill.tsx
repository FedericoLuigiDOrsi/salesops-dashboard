import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Pillola di stato condivisa: pillola + dot + mono uppercase.
 *
 * Nasce dalla regola del tre. Catalog Entry, Listing e Marketplace Account
 * vogliono ciascuno un badge di stato con un vocabolario diverso ma la stessa
 * identica forma visiva. Tre istanze quasi uguali giustificano l'astrazione —
 * due l'avrebbero solo suggerita.
 *
 * Decisione: docs/technical/ooux/21-atomic-bridge-marketplace-account.md §Layer 3
 *
 * `StatusBadge` (Catalog Entry) resta fuori di proposito: è in produzione da
 * mesi, e migrarlo è un remap con il suo piano e la sua conferma, non un
 * effetto collaterale di questa PR.
 */

export type StatusTone = "success" | "warn" | "danger" | "neutral";

/**
 * ⚠️ I tone sono ricavati dalle due istanze che esistono già, NON dai nomi di
 * token del contratto di Fase 6. Quel contratto propone `warn → --accent`, ma
 * in questo codebase `--accent` è un grigio (rgba(91,102,112,.10)), non il
 * fluo. E `danger → --danger` non si può scrivere come utility: @theme espone
 * `--color-danger-soft` ma non `--color-danger`, quindi `text-danger` compila
 * a niente e il testo eredita il colore senza che nessuno se ne accorga.
 *
 * Il contratto del doc va corretto contro il file dei token: qui si usano le
 * classi che i badge esistenti usano davvero, così la migrazione di
 * ListingStatusBadge non cambia un pixel.
 */
export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  success: "bg-success-soft text-success",
  // Fluo pieno: è il trattamento che sia StatusBadge sia ListingStatusBadge
  // danno già al proprio stato «sta succedendo qualcosa». Due istanze
  // indipendenti concordano, quindi è la convenzione della casa, non una
  // scelta presa qui.
  warn: "bg-primary text-primary-foreground",
  danger: "bg-destructive/12 text-destructive",
  neutral: "bg-neutral-soft text-muted-foreground",
};

const BASE =
  "gap-1.5 rounded-full border-transparent px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide transition-colors duration-200";

export interface StatusPillEntry {
  label: string;
  tone: StatusTone;
}

interface StatusPillProps<T extends string> {
  value: T;
  /** Vocabolario dello stato: ogni valore dell'enum ha label e tono. */
  config: Record<T, StatusPillEntry>;
  className?: string;
}

export function StatusPill<T extends string>({ value, config, className }: StatusPillProps<T>) {
  const { label, tone } = config[value];

  return (
    <Badge variant="outline" className={cn(BASE, STATUS_TONE_CLASS[tone], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
