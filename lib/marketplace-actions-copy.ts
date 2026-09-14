import type { MarketplaceActionKind, MarketplaceActionState } from "@/types/maat";
import type { StatusPillEntry, StatusTone } from "@/components/maat/StatusPill";
import type { ExtensionStatusKind } from "./marketplace-actions";

// Le parole che l'utente vede. Gli stati restano quelli del team (inglese),
// qui diventano italiano. Toni dalla convenzione di StatusPill: fluo pieno
// "sta succedendo qualcosa", rosso "serve te".

export const ACTION_STATE_PILL: Record<MarketplaceActionState, StatusPillEntry & { live?: boolean }> = {
  pending: { label: "In coda", tone: "neutral" },
  throttled: { label: "In coda", tone: "neutral" },
  composing: { label: "In corso", tone: "warn", live: true },
  submitting: { label: "In corso", tone: "warn", live: true },
  done: { label: "Fatta", tone: "success" },
  failed: { label: "Non riuscita", tone: "danger" },
  awaiting_challenge: { label: "Bloccata", tone: "danger" },
  needs_reauth: { label: "Bloccata", tone: "danger" },
  cancelled: { label: "Annullata", tone: "neutral" },
};

export interface ExtensionCopy {
  label: string;
  tone: StatusTone;
  detail: string;
  cta?: { label: string; href?: string; resume?: boolean };
  secondary?: { label: string; href: string };
}

export const EXTENSION_STATUS_COPY: Record<ExtensionStatusKind, ExtensionCopy> = {
  reauth: {
    label: "Vinted da ricollegare",
    tone: "danger",
    detail: "Vinted ha chiesto di accedere di nuovo. Le azioni restano in coda finché non ricolleghi l'account.",
    cta: { label: "Ricollega Vinted", href: "/pubblicazione" },
  },
  challenge: {
    label: "Captcha da risolvere",
    tone: "danger",
    detail: "Vinted ha chiesto una verifica. Risolvila nella scheda di Vinted, poi fai ripartire la coda.",
    cta: { label: "Ho risolto", resume: true },
    secondary: { label: "Apri Vinted", href: "https://www.vinted.it" },
  },
  stale: {
    label: "Azioni ferme",
    tone: "warn",
    detail: "Da più di 2 minuti non parte niente. Apri Vinted nel browser dove hai installato l'estensione MAAT.",
    secondary: { label: "Apri Vinted", href: "https://www.vinted.it" },
  },
  active: {
    label: "Estensione attiva",
    tone: "success",
    detail: "Le azioni partono una alla volta, con le attese che servono a non farsi bloccare.",
  },
  not_connected: {
    label: "Vinted non collegato",
    tone: "neutral",
    detail: "Collega il tuo account Vinted per far partire le azioni.",
    cta: { label: "Collega Vinted", href: "/pubblicazione" },
  },
};

export const ACTION_KIND_LABEL: Record<MarketplaceActionKind, string> = {
  publish: "Pubblica",
  draft: "Salva bozza",
  hide: "Nascondi",
  unhide: "Mostra",
  delist: "Ritira",
  offer_accept: "Accetta offerta",
  offer_reject: "Rifiuta offerta",
  offer_counter: "Controproposta",
  thread_reply: "Risposta",
  like_outreach: "Messaggio al like",
};

export const SIMULATED_NOTE = "Stato simulato: l'estensione non è ancora collegata a MAAT.";
