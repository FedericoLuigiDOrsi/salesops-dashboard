import type { Shipment } from "@/types/maat";

const CITIES: Record<string, Shipment["destinationCity"]> = {
  Milano: { name: "Milano", lat: 45.4642, lng: 9.19 },
  Torino: { name: "Torino", lat: 45.0703, lng: 7.6869 },
  Roma: { name: "Roma", lat: 41.9028, lng: 12.4964 },
  Bologna: { name: "Bologna", lat: 44.4949, lng: 11.3426 },
  Napoli: { name: "Napoli", lat: 40.8518, lng: 14.2681 },
  Bari: { name: "Bari", lat: 41.1171, lng: 16.8719 },
  Londra: { name: "Londra", lat: 51.5074, lng: -0.1278 },
  Manchester: { name: "Manchester", lat: 53.4808, lng: -2.2426 },
  Berlino: { name: "Berlino", lat: 52.52, lng: 13.405 },
  Parigi: { name: "Parigi", lat: 48.8566, lng: 2.3522 },
  Madrid: { name: "Madrid", lat: 40.4168, lng: -3.7038 },
  Amsterdam: { name: "Amsterdam", lat: 52.3676, lng: 4.9041 },
  Barcellona: { name: "Barcellona", lat: 41.3874, lng: 2.1686 },
};

// [marketplace, capo, sku, corriere, destinatario, città, stato, oreFa, prezzoCents, tracking]
const RAW: [Shipment["marketplace"], string, string, string, string, keyof typeof CITIES, Shipment["status"], number, number, string][] = [
  ["vinted", "Stone Island · Bomber", "B-091", "BRT", "M. Rossi", "Milano", "da_fare", 3, 17200, "BRT-8842190"],
  ["vinted", "Burberry · Trench", "B-088", "InPost", "L. Bianchi", "Torino", "fatti", 6, 22800, "INP-5521048"],
  ["vinted", "The North Face · Nuptse", "B-090", "Poste", "G. Esposito", "Roma", "spediti", 26, 15000, "RR118904471IT"],
  ["vinted", "Nike · Hoodie vintage", "B-093", "GLS", "F. Romano", "Bologna", "fatti", 26, 5200, "GLS-70418826"],
  ["vinted", "Levi's · Giacca denim", "B-102", "InPost", "A. Ricci", "Bari", "consegnati", 54, 6800, "INP-5530993"],
  ["depop", "Dr. Martens · 1460", "B-099", "Evri", "C. Marino", "Londra", "da_fare", 5, 8800, "EVR-99215540"],
  ["depop", "Adidas · Track jacket", "B-095", "Poste", "E. Greco", "Napoli", "fatti", 30, 4500, "RR118990553IT"],
  ["depop", "Prada · Nylon bag", "B-101", "DHL", "D. Bruno", "Berlino", "spediti", 30, 31000, "DHL-6641200788"],
  ["depop", "Ralph Lauren · Oxford", "B-074", "Evri", "V. Gallo", "Manchester", "consegnati", 72, 3800, "EVR-99230071"],
  ["grailed", "Carhartt WIP · Detroit", "B-110", "DHL", "T. Weber", "Berlino", "da_fare", 28, 9600, "DHL-6641230012"],
  ["grailed", "Nike · Air Max 90", "B-112", "GLS", "P. Dubois", "Parigi", "fatti", 12, 11800, "GLS-70455190"],
  ["grailed", "Supreme · Box logo tee", "B-108", "DHL", "R. Costa", "Madrid", "spediti", 44, 14500, "DHL-6641255500"],
  ["vestiaire", "Gucci · Horsebit loafer", "B-120", "DHL", "S. Laurent", "Parigi", "da_fare", 46, 26000, "DHL-6641280041"],
  ["vestiaire", "Celine · Trotteur bag", "B-118", "UPS", "M. Santos", "Barcellona", "spediti", 28, 42000, "1Z998AA1039"],
  ["vestiaire", "Hermès · Silk scarf", "B-121", "DHL", "N. Meyer", "Amsterdam", "consegnati", 96, 18500, "DHL-6641299813"],
  ["ebay", "Casio · G-Shock DW", "B-130", "Poste", "J. Smith", "Londra", "da_fare", 1, 7500, "RR119003321IT"],
  ["ebay", "Levi's · 501 vintage", "B-131", "Evri", "K. Brown", "Manchester", "fatti", 7, 5900, "EVR-99244410"],
  ["ebay", "Nikon · FM2 film", "B-133", "DHL", "O. Nowak", "Berlino", "consegnati", 120, 21000, "DHL-6641312207"],
];

export const shipments: Shipment[] = RAW.map(([marketplace, itemLabel, sku, carrier, recipient, city, status, hoursAgo, priceCents, trackingCode], i) => ({
  id: `sh-${i + 1}`,
  itemLabel,
  sku,
  marketplace,
  carrier,
  trackingCode,
  recipient,
  status,
  hoursAgo,
  priceCents,
  destinationCity: CITIES[city],
}));
