"use client";

import { useEffect, useState } from "react";

const NOTE_STORAGE_KEY = "maat.home.note.v1";
const DEFAULT_NOTE = "Rivedere i prezzi dei capispalla prima del prossimo drop.";

export function NoteWidget() {
  const [note, setNote] = useState(DEFAULT_NOTE);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(NOTE_STORAGE_KEY);
      if (stored !== null) setNote(stored);
    } catch {
      // storage non disponibile: nota mantenuta solo in memoria
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaved(false);
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(NOTE_STORAGE_KEY, note);
      } catch {
        // il testo resta disponibile per la sessione corrente
      }
      setSaved(true);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [hydrated, note]);

  return (
    <div className="relative flex h-full min-h-[140px] flex-col">
      <div aria-hidden className="pointer-events-none absolute -right-5 -top-5 size-10 bg-[linear-gradient(45deg,transparent_49%,rgba(219,230,76,.22)_50%)]" />
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[.12em]">Nota</p>
        <span className={`flex items-center gap-1 font-mono text-[9px] font-semibold text-success transition-opacity ${saved ? "opacity-100" : "opacity-0"}`} aria-live="polite">
          <span className="size-1.5 rounded-full bg-current" /> Salvata
        </span>
      </div>
      <label htmlFor="home-note" className="sr-only">Promemoria personale</label>
      <textarea
        id="home-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={280}
        placeholder="Scrivi un promemoria…"
        className="mt-3 min-h-20 flex-1 resize-none bg-transparent text-[13px] leading-relaxed outline-none placeholder:text-text-3"
      />
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2.5 font-mono text-[8px] font-semibold uppercase tracking-[.08em] text-muted-foreground">
        <span>Solo per te</span><span>{note.length} / 280</span>
      </div>
    </div>
  );
}
