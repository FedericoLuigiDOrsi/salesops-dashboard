import type { ComponentType } from "react";
import { Archive, BadgeEuro, Bell, ChartColumn, CloudSun, Gauge, Globe, HandCoins, ListChecks, StickyNote, Target, Trophy, type LucideIcon } from "lucide-react";
import type { WidgetKey } from "@/lib/home-layout-store";
import type { Tier } from "@/lib/tiers";
import { AzioniWidget } from "./AzioniWidget";
import { EntrateWidget } from "./EntrateWidget";
import { LogisticaWidget } from "./LogisticaWidget";
import { NotificheWidget } from "./NotificheWidget";
import { OfferteWidget } from "./OfferteWidget";
import { PanoramicaWidget } from "./PanoramicaWidget";
import { VenditeWidget } from "./VenditeWidget";
import { InventarioFermoWidget } from "./InventarioFermoWidget";
import { NoteWidget } from "./NoteWidget";
import { TargetSettimanaleWidget } from "./TargetSettimanaleWidget";
import { TempoOperativoWidget } from "./TempoOperativoWidget";
import { TopPerformerWidget } from "./TopPerformerWidget";

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
  /**
   * true = supporta il sistema a moduli (taglie piccolo/medio/grande scelte
   * dall'utente, vedi lib/widget-sizes.ts) invece della Tier fissa. Per ora
   * solo "offerte": gli altri non hanno ancora un design per ogni taglia.
   */
  resizable?: boolean;
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
    resizable: true,
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
    description: "Scorciatoie rapide alle attività quotidiane, con contatori",
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
  {
    key: "top-performer",
    title: "Top performer",
    description: "Ranking di capi e categorie per vendite",
    icon: Trophy,
    tier: "medio",
    component: TopPerformerWidget,
  },
  {
    key: "inventario-fermo",
    title: "Inventario fermo",
    description: "Capi invenduti oltre una soglia configurabile",
    icon: Archive,
    tier: "medio",
    component: InventarioFermoWidget,
  },
  {
    key: "target-settimanale",
    title: "Target settimanale",
    description: "Progresso verso l’obiettivo di entrate",
    icon: Target,
    tier: "piccolo",
    component: TargetSettimanaleWidget,
  },
  {
    key: "note",
    title: "Note",
    description: "Un promemoria personale sempre visibile",
    icon: StickyNote,
    tier: "piccolo",
    component: NoteWidget,
    bleed: true,
  },
  {
    key: "tempo-operativo",
    title: "Tempo operativo",
    description: "Ora, clima e avanzamento della giornata",
    icon: CloudSun,
    tier: "piccolo",
    component: TempoOperativoWidget,
    bleed: true,
  },
];

export function getWidget(key: WidgetKey): WidgetDef {
  const def = HOME_WIDGETS.find((w) => w.key === key);
  if (!def) throw new Error(`Widget sconosciuto: ${key}`);
  return def;
}
