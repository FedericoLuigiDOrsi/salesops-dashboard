// Catalogo delle metriche disponibili per il box "Panoramica" configurabile
// in Home. L'utente sceglie quali mostrare (persistito solo in stato locale
// per ora); qui vive solo il dato — valori statici allineati al mockup
// public/mobile/maat-shell-account.html (righe 3653-3699).

import type { Tier } from "./tiers";

export interface HomeMetric {
  key: string;
  value: string;
  label: string;
  /** Classe Tailwind per il pallino colorato accanto alla label. */
  dotColor: string;
  /** Fascia fissa: determina lo span in griglia e la silhouette della tile. */
  tier: Tier;
}

export const HOME_METRICS: HomeMetric[] = [
  { key: "catalogo", value: "96", label: "Capi a catalogo", dotColor: "bg-muted-foreground", tier: "piccolo" },
  { key: "bozze", value: "12", label: "Bozze da revisionare", dotColor: "bg-primary", tier: "medio" },
  { key: "pubblicati", value: "27", label: "Capi pubblicati", dotColor: "bg-[var(--chart-1)]", tier: "piccolo" },
  { key: "venduti", value: "9", label: "Articoli venduti", dotColor: "bg-[var(--chart-2)]", tier: "piccolo" },
  { key: "entrate", value: "€ 2.680", label: "Entrate · settimana", dotColor: "bg-primary", tier: "grande" },
  { key: "offerte", value: "3", label: "Offerte in sospeso", dotColor: "bg-[var(--chart-1)]", tier: "grande" },
  { key: "spedizioni", value: "10", label: "Spedizioni in corso", dotColor: "bg-muted-foreground", tier: "medio" },
  { key: "escrow", value: "€ 940", label: "In escrow", dotColor: "bg-primary/60", tier: "medio" },
];

export const DEFAULT_SELECTED_METRICS: string[] = [
  "catalogo",
  "bozze",
  "entrate",
  "spedizioni",
  "offerte",
  "escrow",
];
