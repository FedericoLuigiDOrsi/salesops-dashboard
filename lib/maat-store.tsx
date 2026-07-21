"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { CatalogEntry, Photo, PhotoLabel } from "@/types/maat";

interface MaatEntryContextValue {
  entry: CatalogEntry;
  updatePhoto: (label: PhotoLabel, photo: Photo) => void;
  confirmEntry: () => void;
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
  // Specchio sincrono di `entry`: chi chiama updatePhoto/confirmEntry fa quasi
  // sempre router.push() nella riga successiva (fine scatto → review, conferma
  // → dettaglio). setState è asincrono/batched — scrivere su localStorage solo
  // dentro l'updater o in un useEffect(*, [entry]) rischia di perdere la
  // modifica se la navigazione smonta il provider prima che React lo flushi.
  // Il ref garantisce lettura/scrittura sincrona nello stesso tick della call.
  const entryRef = useRef(entry);
  entryRef.current = entry;

  // Load persisted state after mount (client-only) to avoid SSR hydration mismatch.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey(id));
      if (stored) {
        const parsed = JSON.parse(stored) as CatalogEntry;
        entryRef.current = parsed;
        setEntry(parsed);
      }
    } catch {
      // ignore malformed storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function apply(next: CatalogEntry) {
    entryRef.current = next;
    setEntry(next);
    try {
      window.localStorage.setItem(storageKey(id), JSON.stringify(next));
    } catch {
      // ignore quota/serialization errors
    }
  }

  function updatePhoto(label: PhotoLabel, photo: Photo) {
    const base = entryRef.current;
    apply({ ...base, photos: [...base.photos.filter((p) => p.label !== label), photo] });
    // Simula la validazione AI: nessun codice trasformava mai una foto
    // "captured" in "validated", quindi PhotoSlot restava sullo skeleton in
    // pulse per sempre e il gate "Conferma capo" (richiede validated su
    // fronte/retro/brand) non si sbloccava mai dal flusso di scatto reale.
    if (photo.state === "captured") {
      window.setTimeout(() => {
        const current = entryRef.current;
        apply({
          ...current,
          photos: current.photos.map((p) => (p.label === label && p.state === "captured" ? { ...p, state: "validated" as const } : p)),
        });
      }, 900);
    }
  }

  function confirmEntry() {
    apply({ ...entryRef.current, status: "available" });
  }

  return <MaatEntryContext.Provider value={{ entry, updatePhoto, confirmEntry }}>{children}</MaatEntryContext.Provider>;
}

export function useMaatEntry() {
  const ctx = useContext(MaatEntryContext);
  if (!ctx) throw new Error("useMaatEntry must be used within a MaatEntryProvider");
  return ctx;
}
