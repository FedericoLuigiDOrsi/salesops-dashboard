"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CONFIGURABLE_COLUMNS, type ColumnKey } from "@/lib/inventory-columns";

export interface ColumnPreset {
  id: string;
  name: string;
  /** Ordine + visibilità delle colonne configurabili (esclude sempre "capo"). */
  visible: ColumnKey[];
  /** Il preset Default: non rinominabile né eliminabile. */
  builtIn?: boolean;
}

const STORAGE_KEY = "maat.inventory.columns.v1";
const DEFAULT_PRESET_ID = "default";

function isColumnKey(value: unknown): value is ColumnKey {
  return typeof value === "string" && (CONFIGURABLE_COLUMNS as readonly string[]).includes(value);
}

function makeDefaultPreset(): ColumnPreset {
  return { id: DEFAULT_PRESET_ID, name: "Default", visible: [...CONFIGURABLE_COLUMNS], builtIn: true };
}

// id stabile per i preset custom, senza collisioni. Date.now è ammesso in runtime browser.
function newPresetId() {
  return `preset-${Date.now().toString(36)}`;
}

interface PersistShape {
  activePresetId: string;
  presets: ColumnPreset[];
}

interface InventoryColumnsContextValue {
  activePreset: ColumnPreset;
  presets: ColumnPreset[];
  visibleColumns: ColumnKey[];
  hiddenColumns: ColumnKey[];
  setActivePreset: (id: string) => void;
  reorderVisible: (next: ColumnKey[]) => void;
  showColumn: (key: ColumnKey) => void;
  hideColumn: (key: ColumnKey) => void;
  savePreset: (name: string) => void;
  renamePreset: (id: string, name: string) => void;
  deletePreset: (id: string) => void;
}

const Ctx = createContext<InventoryColumnsContextValue | null>(null);

export function InventoryColumnsProvider({ children }: { children: ReactNode }) {
  const [presets, setPresets] = useState<ColumnPreset[]>([makeDefaultPreset()]);
  const [activePresetId, setActivePresetId] = useState<string>(DEFAULT_PRESET_ID);
  const hydrated = useRef(false);

  // Hydration da localStorage (una volta). Storage corrotto → default.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<PersistShape>;
        const cleaned = Array.isArray(saved.presets)
          ? saved.presets
              .filter((p): p is ColumnPreset => !!p && typeof p.id === "string" && typeof p.name === "string" && Array.isArray(p.visible))
              .map((p) => ({ ...p, visible: p.visible.filter(isColumnKey) }))
          : [];
        // Garantisce sempre la presenza del Default builtIn.
        const withDefault = cleaned.some((p) => p.id === DEFAULT_PRESET_ID)
          ? cleaned
          : [makeDefaultPreset(), ...cleaned];
        setPresets(withDefault);
        if (typeof saved.activePresetId === "string" && withDefault.some((p) => p.id === saved.activePresetId)) {
          setActivePresetId(saved.activePresetId);
        }
      }
    } catch {
      // storage non disponibile/corrotto: si resta sul default
    }
    hydrated.current = true;
  }, []);

  // Persist a ogni cambiamento (dopo l'hydration).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ activePresetId, presets }));
    } catch {
      // storage pieno/bloccato: lo stato resta in memoria
    }
  }, [activePresetId, presets]);

  const activePreset = useMemo(
    () => presets.find((p) => p.id === activePresetId) ?? presets[0] ?? makeDefaultPreset(),
    [presets, activePresetId]
  );

  const visibleColumns = activePreset.visible;
  const hiddenColumns = useMemo(
    () => CONFIGURABLE_COLUMNS.filter((k) => !visibleColumns.includes(k)),
    [visibleColumns]
  );

  // Muta il preset ATTIVO in place (nessun buffer "modificato non salvato": semplificazione accettata).
  function updateActive(fn: (visible: ColumnKey[]) => ColumnKey[]) {
    setPresets((prev) => prev.map((p) => (p.id === activePresetId ? { ...p, visible: fn(p.visible) } : p)));
  }

  const value = useMemo<InventoryColumnsContextValue>(
    () => ({
      activePreset,
      presets,
      visibleColumns,
      hiddenColumns,
      setActivePreset: (id) => setActivePresetId(id),
      reorderVisible: (next) => updateActive(() => next.filter(isColumnKey)),
      showColumn: (key) => updateActive((v) => (v.includes(key) ? v : [...v, key])),
      hideColumn: (key) => updateActive((v) => v.filter((k) => k !== key)),
      savePreset: (name) => {
        const id = newPresetId();
        setPresets((prev) => [...prev, { id, name: name.trim() || "Senza nome", visible: [...visibleColumns] }]);
        setActivePresetId(id);
      },
      renamePreset: (id, name) =>
        setPresets((prev) => prev.map((p) => (p.id === id && !p.builtIn ? { ...p, name: name.trim() || p.name } : p))),
      deletePreset: (id) => {
        setPresets((prev) => prev.filter((p) => p.id !== id || p.builtIn));
        setActivePresetId((cur) => (cur === id ? DEFAULT_PRESET_ID : cur));
      },
    }),
    // activePresetId serve a updateActive; visibleColumns/hiddenColumns derivano da activePreset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePreset, presets, visibleColumns, hiddenColumns, activePresetId]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInventoryColumns() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useInventoryColumns must be used within an InventoryColumnsProvider");
  return ctx;
}
