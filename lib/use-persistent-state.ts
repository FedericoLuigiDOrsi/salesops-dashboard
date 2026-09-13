"use client";

import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { readPersisted, subscribePersisted, writePersisted } from "./persistent-store";

/**
 * Stato persistito in localStorage, con lo storage come unica fonte di verità.
 *
 * Sostituisce il pattern `useState(DEFAULT)` + effect di idratazione, che
 * costava un render in più a ogni montaggio ed è quello che
 * `react-hooks/set-state-in-effect` segnala. Qui non c'è nessuno stato React
 * duplicato: si legge con useSyncExternalStore e si scrive sullo store.
 *
 * `getServerSnapshot` torna il fallback, quindi il markup del server e quello
 * del primo render client coincidono: nessun mismatch di idratazione. Subito
 * dopo React confronta con `getSnapshot`, vede il valore salvato e ri-renderizza
 * una volta sola — cioè quello che facevano già i vecchi effect, ma senza
 * passare dallo stato.
 *
 * `parse` riceve la stringa grezza e torna `undefined` per rifiutarla (schema
 * vecchio, dati corrotti): è il punto dove vivono validazione e migrazioni.
 * DEVE essere una funzione stabile (definita a livello di modulo), come
 * `fallback`.
 */
export function usePersistentState<T>(
  key: string,
  parse: (raw: string) => T | undefined,
  fallback: T
): [T, (value: T) => void] {
  // Il fallback viene congelato al primo render. useSyncExternalStore confronta
  // gli snapshot con Object.is: se il chiamante passasse un oggetto letterale
  // inline, ogni render produrrebbe una reference nuova e si andrebbe in loop.
  // Congelandolo qui il loop è impossibile anche se il call-site è distratto.
  const fallbackRef = useRef(fallback);
  const parseRef = useRef(parse);

  const subscribe = useMemo(() => (onChange: () => void) => subscribePersisted(key, onChange), [key]);
  const getSnapshot = useMemo(
    () => () => readPersisted(key, parseRef.current, fallbackRef.current),
    [key]
  );
  const getServerSnapshot = useMemo(() => () => fallbackRef.current, []);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setValue = useCallback((next: T) => writePersisted(key, next), [key]);

  return [value, setValue];
}

/** Variante per i valori che in storage sono già stringhe (niente JSON). */
export function usePersistentString(key: string, fallback: string): [string, (value: string) => void] {
  const fallbackRef = useRef(fallback);

  const subscribe = useMemo(() => (onChange: () => void) => subscribePersisted(key, onChange), [key]);
  const getSnapshot = useMemo(() => () => readPersisted(key, identity, fallbackRef.current), [key]);
  const getServerSnapshot = useMemo(() => () => fallbackRef.current, []);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setValue = useCallback((next: string) => writePersisted(key, next, identity), [key]);

  return [value, setValue];
}

const identity = (raw: string) => raw;
