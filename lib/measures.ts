import type { MeasureCategory } from "@/types/maat";

// Categoria derivata da "tipo di capo" (free-text) via keyword match — nessun
// campo dedicato in UI, per scelta di Federico (2026-07-07). Fallback "top":
// copre outerwear/nomi brand-specific senza keyword (es. "Beaufort", "Retro-X").
const BOTTOM_KEYWORDS = ["jeans", "pantalon", "short", "chino", "cargo", "legging", "salopette"];
const GONNA_KEYWORDS = ["gonna", "kilt"];
const ABITO_KEYWORDS = ["abito", "vestito", "jumpsuit", "tuta intera", "completo"];

export function getMeasureCategory(tipoCapo: string): MeasureCategory {
  const t = tipoCapo.toLowerCase();
  if (GONNA_KEYWORDS.some((k) => t.includes(k))) return "gonna";
  if (ABITO_KEYWORDS.some((k) => t.includes(k))) return "abito";
  if (BOTTOM_KEYWORDS.some((k) => t.includes(k))) return "bottom";
  return "top";
}

export const CATEGORY_LABELS: Record<MeasureCategory, string> = {
  top: "Top",
  bottom: "Bottom",
  gonna: "Gonna",
  abito: "Abito",
};

export const MEASURE_FIELDS: Record<MeasureCategory, { key: string; label: string }[]> = {
  top: [
    { key: "spalle", label: "Spalle" },
    { key: "lunghezzaTotale", label: "Lunghezza totale" },
    { key: "lunghezzaManica", label: "Lunghezza manica" },
    { key: "larghezzaManica", label: "Larghezza manica" },
    { key: "larghezzaTorace", label: "Larghezza torace" },
    { key: "larghezzaVita", label: "Larghezza vita" },
  ],
  bottom: [
    { key: "larghezzaVita", label: "Larghezza vita" },
    { key: "larghezzaFianchi", label: "Larghezza fianchi" },
    { key: "lunghezzaTotale", label: "Lunghezza totale" },
    { key: "cavallo", label: "Cavallo" },
    { key: "larghezzaCoscia", label: "Larghezza coscia" },
    { key: "larghezzaCaviglia", label: "Larghezza caviglia" },
  ],
  gonna: [
    { key: "larghezzaVita", label: "Larghezza vita" },
    { key: "larghezzaFianchi", label: "Larghezza fianchi" },
    { key: "lunghezzaTotale", label: "Lunghezza totale" },
  ],
  abito: [
    { key: "larghezzaSpalle", label: "Larghezza spalle" },
    { key: "larghezzaTorace", label: "Larghezza torace" },
    { key: "larghezzaVita", label: "Larghezza vita" },
    { key: "larghezzaFianchi", label: "Larghezza fianchi" },
    { key: "lunghezzaManica", label: "Lunghezza manica" },
  ],
};
