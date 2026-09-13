import { StatusPill, type StatusPillEntry } from "@/components/maat/StatusPill";
import type { DelistOutcome } from "@/lib/sale-detail-mock";

// Esito del ritiro di UN annuncio dopo che il capo si è venduto altrove.
//
// Non è lo stato dell'annuncio (`ListingStatusBadge`) né quello del capo
// (`StatusBadge`): risponde a «il ritiro alla vendita ha funzionato qui?».
// Un annuncio può essere `active` nel canonico e, da questa domanda, essere
// «ancora online» perché la regola non è passata — è la stessa informazione
// letta da un'altra parte.
//
// Toni scelti perché la lettura sia per azione, non per cronaca: il lettore
// deve trovare in un colpo d'occhio le righe che chiedono qualcosa.
//   sold_here → neutral   è contesto, non chiede niente
//   delisted  → success   ha funzionato
//   still_online / manual_required → warn   chiedono una mano
//   error     → danger

const CONFIG: Record<DelistOutcome, StatusPillEntry> = {
  sold_here: { label: "Venduto qui", tone: "neutral" },
  delisted: { label: "Ritirato", tone: "success" },
  still_online: { label: "Ancora online", tone: "warn" },
  manual_required: { label: "Da ritirare a mano", tone: "warn" },
  error: { label: "Errore", tone: "danger" },
};

interface DelistOutcomeBadgeProps {
  outcome: DelistOutcome;
  className?: string;
}

export function DelistOutcomeBadge({ outcome, className }: DelistOutcomeBadgeProps) {
  return <StatusPill value={outcome} config={CONFIG} className={className} />;
}

export { CONFIG as DELIST_OUTCOME_PILL };
