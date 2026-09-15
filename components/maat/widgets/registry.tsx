import type { ComponentType } from "react";
import { Archive, BadgeEuro, Bell, CloudSun, Globe, HandCoins, ListChecks, StickyNote, Target, Trophy, Truck, Undo2, type LucideIcon } from "lucide-react";
import type { WidgetKey } from "@/lib/widget-catalog";
import type { ModuleDims } from "@/lib/widget-sizes";
import { AzioniWidget } from "./AzioniWidget";
import { DaRitirareWidget } from "./DaRitirareWidget";
import { DaSpedireWidget } from "./DaSpedireWidget";
import { LogisticaWidget } from "./LogisticaWidget";
import { NotificheWidget } from "./NotificheWidget";
import { OfferteWidget } from "./OfferteWidget";
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
  /** Riceve la taglia corrente: può cambiare disposizione interna per taglia. Taglie e ruolo in lib/widget-catalog.ts. */
  component: ComponentType<{ size: ModuleDims }>;
  /** Il widget porta la propria card (hero dark full-bleed): salta il chrome standard della shell. */
  bleed?: boolean;
}

export const HOME_WIDGETS: WidgetDef[] = [
  {
    key: "offerte",
    title: "Offerte",
    description: "Offerte in sospeso, accetta o rifiuta al volo",
    icon: HandCoins,
    component: OfferteWidget,
  },
  {
    key: "vendite",
    title: "Vendite",
    description: "Le vendite più recenti sui marketplace",
    icon: BadgeEuro,
    component: VenditeWidget,
  },
  {
    key: "azioni",
    title: "Prossime azioni",
    description: "Scorciatoie rapide alle attività quotidiane, con contatori",
    icon: ListChecks,
    component: AzioniWidget,
  },
  {
    key: "notifiche",
    title: "Notifiche",
    description: "Le ultime novità dal tuo account",
    icon: Bell,
    component: NotificheWidget,
  },
  {
    key: "logistica",
    title: "Logistica",
    description: "Rete di spedizioni live, conteggi per stato",
    icon: Globe,
    component: LogisticaWidget,
    bleed: true,
  },
  {
    key: "da-ritirare",
    title: "Da ritirare",
    description: "Annunci ancora online dopo una vendita altrove",
    icon: Undo2,
    component: DaRitirareWidget,
  },
  {
    key: "da-spedire",
    title: "Da spedire",
    description: "Pacchi pronti da imballare, stampa l'etichetta da qui",
    icon: Truck,
    component: DaSpedireWidget,
  },
  {
    key: "top-performer",
    title: "Top performer",
    description: "Ranking di capi e categorie per vendite",
    icon: Trophy,
    component: TopPerformerWidget,
  },
  {
    key: "inventario-fermo",
    title: "Inventario fermo",
    description: "Capi invenduti oltre una soglia configurabile",
    icon: Archive,
    component: InventarioFermoWidget,
  },
  {
    key: "target-settimanale",
    title: "Target settimanale",
    description: "Progresso verso l’obiettivo di entrate",
    icon: Target,
    component: TargetSettimanaleWidget,
  },
  {
    key: "note",
    title: "Note",
    description: "Un promemoria personale sempre visibile",
    icon: StickyNote,
    component: NoteWidget,
    bleed: true,
  },
  {
    key: "tempo-operativo",
    title: "Tempo operativo",
    description: "Ora, clima e avanzamento della giornata",
    icon: CloudSun,
    component: TempoOperativoWidget,
    bleed: true,
  },
];

export function getWidget(key: WidgetKey): WidgetDef {
  const def = HOME_WIDGETS.find((w) => w.key === key);
  if (!def) throw new Error(`Widget sconosciuto: ${key}`);
  return def;
}
