// Placeholder foto prodotto: SVG data-URI locale, deterministico per id (nessuna rete).
// Solo per preview/mock — sostituire con le foto reali quando disponibili.

const PALETTE = [
  { bg: "#ECEDE3", fg: "#5B6670" },
  { bg: "rgba(219,230,76,.28)", fg: "#6E6E00" },
  { bg: "rgba(0,128,76,.14)", fg: "#00804C" },
  { bg: "rgba(30,72,143,.14)", fg: "#1E488F" },
  { bg: "#F6F7ED", fg: "#9AA0A6" },
];

function hash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

export function placeholderPhoto(seed: string, label: string) {
  const { bg, fg } = PALETTE[hash(seed) % PALETTE.length];
  const initials = label
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="${bg}"/><text x="100" y="114" font-family="ui-monospace, monospace" font-size="56" font-weight="600" fill="${fg}" text-anchor="middle">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
