"use client";

import { useEffect, useState } from "react";
import { usePersistentString } from "@/lib/use-persistent-state";

const NOTE_STORAGE_KEY = "maat.home.note.v1";
const DEFAULT_NOTE = "Rivedere i prezzi dei capispalla prima del prossimo drop.";
const FOLD_PX = 20;

export function NoteWidget() {
  // `note` è il testo persistito, `draft` quello che si sta digitando: la
  // scrittura è in debounce, quindi i due valori divergono per ~450ms.
  const [note, setNote] = usePersistentString(NOTE_STORAGE_KEY, DEFAULT_NOTE);
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const text = draft ?? note;

  // `setSaved(false)` sta nell'onChange della textarea, non qui: spegnere il
  // badge "Salvata" è la reazione a una digitazione, non una sincronizzazione
  // con un sistema esterno. Nell'effect resta solo il debounce di scrittura.
  useEffect(() => {
    if (draft === null || draft === note) return;
    const timer = window.setTimeout(() => {
      setNote(draft);
      setSaved(true);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [draft, note, setNote]);

  return (
    // Il widget è "bleed": niente card/bordo standard della shell, così il
    // post-it può essere inclinato e proiettare la propria ombra sopra la
    // griglia, come se fosse appiccicato sullo schermo.
    <div className="h-full min-h-[140px] p-2">
      <div
        className="group relative flex h-full -rotate-[1.6deg] flex-col p-4 shadow-[3px_5px_12px_rgba(0,31,63,.20),0_1px_2px_rgba(0,31,63,.10)] transition-transform duration-200 hover:-rotate-[0.3deg] hover:shadow-[4px_7px_16px_rgba(0,31,63,.24),0_1px_2px_rgba(0,31,63,.10)]"
        style={{
          background: "linear-gradient(160deg, #FBF3A3 0%, #F3E56E 55%, #ECDB55 100%)",
          clipPath: `polygon(0 0, 100% 0, 100% calc(100% - ${FOLD_PX}px), calc(100% - ${FOLD_PX}px) 100%, 0 100%)`,
        }}
      >
        {/* angolo piegato in basso a destra, come se la carta si sollevasse */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 size-5"
          style={{ background: "linear-gradient(225deg, rgba(0,31,63,.22) 0%, rgba(0,31,63,.05) 55%, transparent 62%)" }}
        />

        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[.12em] text-foreground/80">Nota</p>
          <span
            className={`flex items-center gap-1 font-mono text-[9px] font-semibold text-success transition-opacity ${saved ? "opacity-100" : "opacity-0"}`}
            aria-live="polite"
          >
            <span className="size-1.5 rounded-full bg-current" /> Salvata
          </span>
        </div>

        <label htmlFor="home-note" className="sr-only">
          Promemoria personale
        </label>
        <textarea
          id="home-note"
          value={text}
          onChange={(event) => {
            setSaved(false);
            setDraft(event.target.value);
          }}
          maxLength={280}
          placeholder="Scrivi un promemoria…"
          className="mt-3 min-h-20 flex-1 resize-none bg-transparent text-[13.5px] leading-relaxed text-foreground outline-none placeholder:text-foreground/35"
        />

        <div className="mt-2 flex items-center justify-between border-t border-foreground/10 pt-2.5 font-mono text-[8px] font-semibold uppercase tracking-[.08em] text-foreground/55">
          <span>Solo per te</span>
          <span>{text.length} / 280</span>
        </div>
      </div>
    </div>
  );
}
