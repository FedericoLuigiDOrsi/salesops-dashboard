import type { ComponentType } from "react";
import { BadgeEuro, Bell, ChartColumn, Gauge, HandCoins, ListChecks, type LucideIcon } from "lucide-react";
import type { WidgetKey } from "@/lib/home-layout-store";
import { AzioniWidget } from "./AzioniWidget";
import { EntrateWidget } from "./EntrateWidget";
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
  /** Colonne occupate nella bento grid desktop (mobile è sempre 1 colonna). */
  span: 1 | 2;
  component: ComponentType;
}

export const HOME_WIDGETS: WidgetDef[] = [
  {
    key: "panoramica",
    title: "Panoramica",
    description: "Le metriche chiave del negozio, configurabili",
    icon: Gauge,
    span: 2,
    component: PanoramicaWidget,
  },
  {
    key: "offerte",
    title: "Offerte",
    description: "Offerte in sospeso, accetta o rifiuta al volo",
    icon: HandCoins,
    span: 1,
    component: OfferteWidget,
  },
  {
    key: "vendite",
    title: "Vendite",
    description: "Le vendite più recenti sui marketplace",
    icon: BadgeEuro,
    span: 1,
    component: VenditeWidget,
  },
  {
    key: "azioni",
    title: "Azioni richieste",
    description: "Bozze e capi in attesa di revisione",
    icon: ListChecks,
    span: 1,
    component: AzioniWidget,
  },
  {
    key: "notifiche",
    title: "Notifiche",
    description: "Le ultime novità dal tuo account",
    icon: Bell,
    span: 1,
    component: NotificheWidget,
  },
  {
    key: "entrate",
    title: "Entrate",
    description: "Andamento ricavi delle ultime settimane",
    icon: ChartColumn,
    span: 1,
    component: EntrateWidget,
  },
];

export function getWidget(key: WidgetKey): WidgetDef {
  const def = HOME_WIDGETS.find((w) => w.key === key);
  if (!def) throw new Error(`Widget sconosciuto: ${key}`);
  return def;
}
