import type { ComponentType } from "react";
import { BadgeEuro, Bell, ChartColumn, Gauge, Globe, HandCoins, ListChecks, type LucideIcon } from "lucide-react";
import type { WidgetKey } from "@/lib/home-layout-store";
import type { Tier } from "@/lib/tiers";
import { AzioniWidget } from "./AzioniWidget";
import { EntrateWidget } from "./EntrateWidget";
import { LogisticaWidget } from "./LogisticaWidget";
import { NotificheWidget } from "./NotificheWidget";
import { OfferteWidget } from "./OfferteWidget";
import { PanoramicaWidget } from "./PanoramicaWidget";
import { VenditeWidget } from "./VenditeWidget";

export interface WidgetDef {
  key: WidgetKey;
  /** Nome mostrato nel catalogo "Aggiungi widget". */
  title: string;
  /** Una riga di spiegazione nel catalogo. */
  description: string;
  icon: LucideIcon;
  /** Fascia fissa: determina il footprint nella bento grid desktop (mobile è sempre 1 colonna). */
  tier: Tier;
  component: ComponentType;
  /** Il widget porta la propria card (hero dark full-bleed): salta il chrome standard della shell. */
  bleed?: boolean;
}

export const HOME_WIDGETS: WidgetDef[] = [
  {
    key: "panoramica",
    title: "Panoramica",
    description: "Le metriche chiave del negozio, configurabili",
    icon: Gauge,
    tier: "grande",
    component: PanoramicaWidget,
  },
  {
    key: "offerte",
    title: "Offerte",
    description: "Offerte in sospeso, accetta o rifiuta al volo",
    icon: HandCoins,
    tier: "grande",
    component: OfferteWidget,
  },
  {
    key: "vendite",
    title: "Vendite",
    description: "Le vendite più recenti sui marketplace",
    icon: BadgeEuro,
    tier: "piccolo",
    component: VenditeWidget,
  },
  {
    key: "azioni",
    title: "Prossime azioni",
    description: "Bozze e offerte in sospeso, in un'unica coda per urgenza",
    icon: ListChecks,
    tier: "medio",
    component: AzioniWidget,
  },
  {
    key: "notifiche",
    title: "Notifiche",
    description: "Le ultime novità dal tuo account",
    icon: Bell,
    tier: "piccolo",
    component: NotificheWidget,
  },
  {
    key: "entrate",
    title: "Entrate",
    description: "Andamento ricavi delle ultime settimane",
    icon: ChartColumn,
    tier: "medio",
    component: EntrateWidget,
  },
  {
    key: "logistica",
    title: "Logistica",
    description: "Rete di spedizioni live, conteggi per stato",
    icon: Globe,
    tier: "medio",
    component: LogisticaWidget,
    bleed: true,
  },
];

export function getWidget(key: WidgetKey): WidgetDef {
  const def = HOME_WIDGETS.find((w) => w.key === key);
  if (!def) throw new Error(`Widget sconosciuto: ${key}`);
  return def;
}
