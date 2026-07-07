"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CatalogEntry, Photo, PhotoLabel } from "@/types/maat";

interface MaatEntryContextValue {
  entry: CatalogEntry;
  updatePhoto: (label: PhotoLabel, photo: Photo) => void;
}

const MaatEntryContext = createContext<MaatEntryContextValue | null>(null);

function storageKey(id: string) {
  return `maat:catalog-entry:${id}`;
}

interface MaatEntryProviderProps {
  id: string;
  initialEntry: CatalogEntry;
  children: ReactNode;
}

export function MaatEntryProvider({ id, initialEntry, children }: MaatEntryProviderProps) {
  const [entry, setEntry] = useState<CatalogEntry>(initialEntry);

  // Load persisted state after mount (client-only) to avoid SSR hydration mismatch.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey(id));
      if (stored) setEntry(JSON.parse(stored) as CatalogEntry);
    } catch {
      // ignore malformed storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(id), JSON.stringify(entry));
    } catch {
      // ignore quota/serialization errors
    }
  }, [id, entry]);

  function updatePhoto(label: PhotoLabel, photo: Photo) {
    setEntry((prev) => ({
      ...prev,
      photos: [...prev.photos.filter((p) => p.label !== label), photo],
    }));
  }

  return <MaatEntryContext.Provider value={{ entry, updatePhoto }}>{children}</MaatEntryContext.Provider>;
}

export function useMaatEntry() {
  const ctx = useContext(MaatEntryContext);
  if (!ctx) throw new Error("useMaatEntry must be used within a MaatEntryProvider");
  return ctx;
}
