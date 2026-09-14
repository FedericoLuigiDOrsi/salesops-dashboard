import * as React from "react";

// La griglia della Home è a una colonna sotto `lg` (1024px), non sotto il
// breakpoint mobile di use-mobile.ts (768px). Stesso schema a external store.
const QUERY = "(max-width: 1023px)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function useBelowLg() {
  return React.useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
