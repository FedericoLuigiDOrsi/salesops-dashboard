// Sistema a moduli (stile home iOS): ogni widget dichiara in lib/widget-catalog.ts
// le taglie che ha disegnato. Si ridimensiona dall'angolo in basso a destra,
// l'angolo in alto a sinistra resta fermo.

export interface ModuleDims {
  w: number;
  h: number;
}

export interface WidgetSizes {
  min: ModuleDims;
  max: ModuleDims;
  default: ModuleDims;
}

/** Tetto sulla griglia a 6 colonne: oltre si perde la leggibilità. */
export const GRID_MAX: ModuleDims = { w: 4, h: 4 };

export function clampModuleDims(dims: ModuleDims, sizes: WidgetSizes): ModuleDims {
  return {
    w: Math.min(sizes.max.w, Math.max(sizes.min.w, Math.round(dims.w))),
    h: Math.min(sizes.max.h, Math.max(sizes.min.h, Math.round(dims.h))),
  };
}

export function isResizable(sizes: WidgetSizes): boolean {
  return sizes.min.w !== sizes.max.w || sizes.min.h !== sizes.max.h;
}

/** Su telefono la griglia è a una colonna: larghezza minima, altezza predefinita. */
export function mobileSize(sizes: WidgetSizes): ModuleDims {
  return { w: sizes.min.w, h: sizes.default.h };
}

export function isModuleDims(value: unknown): value is ModuleDims {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.w === "number" && typeof v.h === "number";
}
