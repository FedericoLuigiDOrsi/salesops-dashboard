// Sistema a moduli quadrati (stile home iOS): ogni widget ha una larghezza e
// un'altezza in unità di griglia, trascinabili dall'angolo in basso a destra
// (l'angolo in alto a sinistra resta fermo). Per ora supportato solo dai
// widget marcati `resizable` nella registry — gli altri restano sulla Tier
// fissa finché non vengono ridisegnati taglia per taglia (vedi lib/tiers.ts).
export interface ModuleDims {
  w: number;
  h: number;
}

export const DEFAULT_MODULE_DIMS: ModuleDims = { w: 2, h: 3 };

// Sotto 2×2 i widget col design attuale (es. OfferteWidget) non hanno ancora
// un layout dedicato che regga; sopra 4×4 si perderebbe la leggibilità della
// griglia a 6 colonne. Limiti da rivedere quando si disegnano più taglie.
export const MODULE_MIN: ModuleDims = { w: 2, h: 2 };
export const MODULE_MAX: ModuleDims = { w: 4, h: 4 };

export function clampModuleDims(dims: ModuleDims): ModuleDims {
  return {
    w: Math.min(MODULE_MAX.w, Math.max(MODULE_MIN.w, Math.round(dims.w))),
    h: Math.min(MODULE_MAX.h, Math.max(MODULE_MIN.h, Math.round(dims.h))),
  };
}

export function isModuleDims(value: unknown): value is ModuleDims {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.w === "number" && typeof v.h === "number";
}
