"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/**
 * Stato del refresh "articoli fermi", globale come gli altri overlay (mirror
 * di overlays-store): l'azione parte dal widget Prossime azioni in Home, ma
 * l'indicatore deve restare visibile anche se l'utente cambia pagina mentre
 * gira — per questo vive in un provider in layout, non nello stato locale del
 * widget.
 */
export type RefreshStatus = "idle" | "running" | "done";

interface RefreshContextValue {
  status: RefreshStatus;
  total: number;
  done: number;
  /** Pannello di stato aperto/chiuso: si apre da solo quando parte, l'utente può richiuderlo senza fermare il refresh. */
  panelOpen: boolean;
  start: (total: number) => void;
  togglePanel: () => void;
  dismiss: () => void;
}

const RefreshContext = createContext<RefreshContextValue | null>(null);

const STEP_MS = 500;

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<RefreshStatus>("idle");
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  function start(nextTotal: number) {
    if (status === "running" || nextTotal <= 0) return;
    setStatus("running");
    setTotal(nextTotal);
    setDone(0);
    setPanelOpen(true);
    timerRef.current = window.setInterval(() => {
      setDone((prev) => {
        const next = prev + 1;
        if (next >= nextTotal) {
          if (timerRef.current !== null) window.clearInterval(timerRef.current);
          setStatus("done");
        }
        return next;
      });
    }, STEP_MS);
  }

  function dismiss() {
    setStatus("idle");
    setPanelOpen(false);
    setTotal(0);
    setDone(0);
  }

  const value = useMemo<RefreshContextValue>(
    () => ({
      status,
      total,
      done,
      panelOpen,
      start,
      togglePanel: () => setPanelOpen((v) => !v),
      dismiss,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, total, done, panelOpen]
  );

  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
}

export function useRefreshJob() {
  const ctx = useContext(RefreshContext);
  if (!ctx) throw new Error("useRefreshJob must be used within a RefreshProvider");
  return ctx;
}
