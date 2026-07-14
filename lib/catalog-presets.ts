import type { CatalogEntryStatus } from "@/types/maat";

export type ViewMode = "table" | "card" | "kanban";
export type PresetValue = "lavorazione" | "catalogo" | "ricerca";

/**
 * Preset-operazione: ogni voce è una "lente" sul catalogo pensata attorno a
 * un'operazione reale del reseller, non un filtro generico. Determina la vista
 * di default, quali status mostrare (`statuses: null` = tutti) e l'ordinamento.
 * La vista resta poi sovrascrivibile con lo switch formato (Card/Table/Kanban).
 */
export interface OperationPreset {
  value: PresetValue;
  label: string;
  view: ViewMode;
  statuses: CatalogEntryStatus[] | null;
  sort: "createdAtAsc" | "createdAtDesc";
  hint: string;
}

export const OPERATION_PRESETS: OperationPreset[] = [
  {
    value: "lavorazione",
    label: "Lavorazione",
    view: "kanban",
    statuses: ["local_draft", "to_be_reviewed"],
    sort: "createdAtAsc",
    hint: "Coda di capi da rivedere e confermare, dai più vecchi.",
  },
  {
    value: "catalogo",
    label: "Catalogo",
    view: "card",
    statuses: ["available"],
    sort: "createdAtDesc",
    hint: "Capi confermati, pronti alla vendita.",
  },
  {
    value: "ricerca",
    label: "Ricerca",
    view: "table",
    statuses: null,
    sort: "createdAtDesc",
    hint: "Tutti i capi, in tabella densa. Cerca per brand, tipo o SKU.",
  },
];

export const DEFAULT_PRESET: PresetValue = "lavorazione";

export function getPreset(value: PresetValue): OperationPreset {
  return OPERATION_PRESETS.find((p) => p.value === value) ?? OPERATION_PRESETS[0];
}
