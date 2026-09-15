// Catalogo delle metriche disponibili per il box "Panoramica" configurabile
// in Home. L'utente sceglie quali mostrare e in che ordine (persistito solo
// in stato locale per ora); qui vive solo il dato — valori statici allineati
// al design Claude Design "Panoramica - widget.dc.html".

export type MetricKind = "hero" | "trend";

export interface HomeMetric {
  key: string;
  kind: MetricKind;
  value: string;
  label: string;
  /** Aggiunge il simbolo € (più piccolo) accanto al valore. */
  euro?: boolean;
  /** Solo hero/trend: variazione mostrata accanto al valore ("+12%", "+2"). */
  delta?: string;
  /** true = variazione positiva (verde), false/assente = neutra. */
  up?: boolean;
  /** Solo hero: didascalia sotto il valore. */
  sub?: string;
  /** Solo hero/trend: punti grezzi per lo sparkline (normalizzati min-max nel componente). */
  spark?: number[];
}

export const HOME_METRICS: HomeMetric[] = [
  {
    key: "entrate",
    kind: "hero",
    value: "2.680",
    label: "Entrate · settimana",
    euro: true,
    delta: "+12%",
    up: true,
    sub: "+287 € vs settimana scorsa",
    spark: [10, 8, 9, 15, 13, 20, 18, 26],
  },
  { key: "venduti", kind: "trend", value: "9", label: "Articoli venduti", delta: "+2", up: true, spark: [20, 17, 18, 11, 13, 4] },
  { key: "pubblicati", kind: "trend", value: "27", label: "Capi pubblicati", delta: "+5", up: true, spark: [15, 13, 16, 11, 12, 7] },
  { key: "catalogo", kind: "trend", value: "96", label: "Capi a catalogo", delta: "+4", up: false },
  { key: "spedizioni", kind: "trend", value: "10", label: "Spedizioni in corso" },
  { key: "escrow", kind: "trend", value: "940", label: "In escrow", euro: true },
];

/** Ordine iniziale delle metriche visibili. */
export const DEFAULT_SELECTED_METRICS: string[] = [
  "entrate",
  "venduti",
  "pubblicati",
  "catalogo",
  "spedizioni",
];
