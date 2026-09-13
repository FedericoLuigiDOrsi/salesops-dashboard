/**
 * Store minimale su localStorage, senza React.
 *
 * Serve a togliere di mezzo il pattern che si ripeteva in mezzo file:
 * `useState(DEFAULT)` + un effect di mount che legge lo storage e fa `setState`
 * (per non rompere l'idratazione SSR) + un secondo effect che riscrive. Quel
 * pattern costa un render in più a ogni montaggio, ed è quello che
 * `react-hooks/set-state-in-effect` segnala.
 *
 * Qui localStorage è l'unica fonte di verità e il consumatore lo legge con
 * `useSyncExternalStore` (vedi use-persistent-state.ts). Questo file non importa
 * React apposta: così è testabile con l'`environment: "node"` già configurato in
 * vitest, senza aggiungere jsdom.
 *
 * Vincolo non negoziabile: `read()` deve tornare lo STESSO riferimento finché la
 * stringa grezza non cambia. `useSyncExternalStore` confronta gli snapshot con
 * Object.is e va in loop infinito se ogni chiamata produce un oggetto nuovo — è
 * il motivo della cache qui sotto.
 */

// Marca una stringa grezza già esaminata e scartata (assente, JSON rotto, o
// rifiutata da `parse`). Serve a non ri-parsare ogni volta uno storage corrotto
// senza però memorizzare il fallback: vedi il commento sulla cache qui sotto.
const REJECTED = Symbol("rejected");

interface Entry {
  raw: string | null;
  value: unknown | typeof REJECTED;
}

// Chiave → ultimo (raw, parsed). Indicizzata SOLO sulla chiave, mai sul default,
// e per lo stesso motivo il default non finisce MAI dentro `value`: due
// componenti possono leggere la stessa chiave con default diversi
// (`maat:catalog-entry:<id>` lo fa davvero), e memorizzare il fallback del primo
// lettore lo servirebbe anche al secondo. È tearing, e i test lo coprono.
const cache = new Map<string, Entry>();
const listeners = new Map<string, Set<() => void>>();

function storage(): Storage | null {
  // Anche lato server questo modulo viene caricato: senza la guardia, la cache
  // si popolerebbe nel processo Node e sopravvivrebbe tra richieste diverse.
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // Safari in navigazione privata, storage disabilitato da policy, ecc.
    return null;
  }
}

/**
 * Legge e valida il valore sotto `key`. `parse` riceve la stringa grezza e
 * decide: torna il valore, oppure `undefined` se lo scarta (JSON corrotto,
 * schema vecchio, migrazione impossibile) e in quel caso si usa `fallback`.
 */
export function readPersisted<T>(key: string, parse: (raw: string) => T | undefined, fallback: T): T {
  const store = storage();
  const raw = store ? store.getItem(key) : null;

  const cached = cache.get(key);
  if (cached && cached.raw === raw) {
    return cached.value === REJECTED ? fallback : (cached.value as T);
  }

  let value: unknown | typeof REJECTED = REJECTED;
  if (raw !== null) {
    try {
      const parsed = parse(raw);
      if (parsed !== undefined) value = parsed;
    } catch {
      // storage corrotto: si riparte dal default, senza rompere il render
    }
  }

  cache.set(key, { raw, value });
  return value === REJECTED ? fallback : (value as T);
}

function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

/**
 * Scrive `value` sotto `key` e sveglia i lettori. Va usata SEMPRE al posto di
 * `localStorage.setItem` diretto: una scrittura che bypassa questa funzione è
 * invisibile ai subscriber, perché l'evento `storage` del browser non scatta
 * nella stessa tab che ha scritto.
 */
export function writePersisted<T>(key: string, value: T, serialize: (value: T) => string = JSON.stringify): void {
  const store = storage();
  const raw = serialize(value);
  // La cache si aggiorna comunque: se lo storage non è disponibile il valore
  // resta valido per la sessione corrente invece di sparire al render dopo.
  cache.set(key, { raw, value });
  try {
    store?.setItem(key, raw);
  } catch {
    // quota piena o storage non disponibile: si continua solo in memoria
  }
  notify(key);
}

/** Rimuove `key` e sveglia i lettori, che torneranno al proprio default. */
export function removePersisted(key: string): void {
  cache.delete(key);
  try {
    storage()?.removeItem(key);
  } catch {
    // niente da fare, il valore resta finché la tab è aperta
  }
  notify(key);
}

/**
 * Sottoscrizione per chiave. Include l'evento `storage` del browser, così due
 * tab aperte sulla stessa pagina restano allineate.
 */
export function subscribePersisted(key: string, onChange: () => void): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(onChange);

  const onStorage = (event: StorageEvent) => {
    // `event.key === null` = clear() dell'intero storage: invalida tutto.
    if (event.key === null || event.key === key) {
      cache.delete(key);
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("storage", onStorage);
    set.delete(onChange);
    // `=== set` e non solo `size === 0`: questa closure tiene la Set di QUESTA
    // sottoscrizione, che può essere già stata rimossa dalla mappa e sostituita
    // da una nuova (ultimo lettore esce → la mappa perde la chiave → arriva un
    // lettore nuovo → Set nuova). Un unsubscribe chiamato due volte, o tenuto
    // in giro un momento di troppo, cancellerebbe la Set del lettore nuovo e i
    // suoi listener smetterebbero di essere svegliati, in silenzio.
    if (set.size === 0 && listeners.get(key) === set) listeners.delete(key);
  };
}

/** Solo per i test: azzera cache e listener tra un caso e l'altro. */
export function __resetPersistedCache(): void {
  cache.clear();
  listeners.clear();
}
