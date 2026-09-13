"use client";

import { cn } from "@/lib/utils";
import { MARKETPLACE_LABELS } from "@/types/maat";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/inventory-columns";
import type { InventoryItem, InventoryStatus, PlatformListingState } from "@/lib/inventory-mock";

const PLATFORM_BG: Record<PlatformKey, string> = {
  vinted: "var(--channel-vinted)",
  grailed: "var(--channel-grailed)",
  depop: "var(--channel-depop)",
};

const PLATFORM_INITIAL: Record<PlatformKey, string> = {
  vinted: "V",
  grailed: "G",
  depop: "D",
};

type ChannelStatus = "published" | "pending" | "off";

const STATUS_LABEL: Record<ChannelStatus, string> = {
  published: "Pubblicato",
  pending: "In attesa",
  off: "Non pubblicato",
};

/**
 * "sold" conta come pubblicato: il capo è stato venduto proprio da quel canale.
 * "pending" è anche derivato: un capo ancora in bozza non ha scelto di non pubblicare,
 * deve solo ancora succedere — distinzione voluta dal design handoff.
 */
function channelStatus(state: PlatformListingState, itemStatus: InventoryStatus): ChannelStatus {
  if (state === "active" || state === "sold") return "published";
  if (state === "pending") return "pending";
  // Esplicito prima del ripiego su itemStatus: un annuncio nascosto non e
  // raggiungibile da chi compra, e non e "deve ancora succedere".
  if (state === "hidden") return "off";
  if (itemStatus === "to_be_reviewed" || itemStatus === "local_draft") return "pending";
  return "off";
}

interface ChannelDotsProps {
  platforms: InventoryItem["platforms"];
  itemStatus: InventoryStatus;
  onToggle: (platform: PlatformKey) => void;
}

/**
 * Tracking canali: colore fisso = piattaforma, dot overlay = stato
 * pubblicazione. Click = toggle pubblica/rimuovi.
 *
 * ── I tre stati non si distinguono per la sola tinta ─────────────────────────
 * DESIGN.md §11: lo stato non si veicola col solo colore.
 *   off        nessun dot + cerchio al 38% di opacità
 *   published  dot pieno, contorno chiaro (--card)
 *   pending    dot pieno, contorno SCURO (--foreground)
 *
 * Il contorno scuro sull'attesa vale 12,17:1 contro il fluo e 16,56:1 contro
 * la card: è un bordo che si vede in scala di grigi e con qualunque
 * discromatopsia, mentre la sola coppia di tinte no.
 *
 * ⚠️ Perché NON un anello vuoto, che sarebbe la scelta ovvia: --primary
 * (#DBE64C) ha 1,36:1 contro la card bianca e circa 2,3:1 contro le tinte
 * piattaforma. Un anello fluo con il buco chiaro sarebbe praticamente
 * invisibile — il buco e il tratto avrebbero quasi la stessa luminanza. Il
 * vuoto si può disegnare solo sul verde scuro (5,01:1 contro il bianco), cioè
 * sullo stato «pubblicato», che è l'opposto della convenzione «pieno = fatto,
 * vuoto = in sospeso». Fra invertire la convenzione e cambiare canale, si
 * cambia canale.
 *
 * Nota di misura: --success (#00804C) e --primary (#DBE64C) differiscono già
 * di 3,68:1 in luminanza, quindi la coppia non era illeggibile a un deuteranope
 * come sembrava a occhio. Restava però una distinzione di solo colore, che è
 * ciò che §11 vieta.
 */
export function ChannelDots({ platforms, itemStatus, onToggle }: ChannelDotsProps) {
  return (
    <div className="flex gap-1.5">
      {PLATFORM_KEYS.map((key) => {
        const status = channelStatus(platforms[key], itemStatus);
        const label = `${MARKETPLACE_LABELS[key]} · ${STATUS_LABEL[status]}`;
        return (
          <button
            key={key}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={status === "published"}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(key);
            }}
            className={cn(
              "relative flex size-[22px] shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold transition-opacity duration-150",
              status === "off" && "opacity-[.38]"
            )}
            style={{ backgroundColor: PLATFORM_BG[key], color: "var(--text-on-dark)" }}
          >
            {PLATFORM_INITIAL[key]}
            {status !== "off" && (
              <span
                className="absolute -bottom-px -right-px size-2 rounded-full"
                style={{
                  background: status === "published" ? "var(--success)" : "var(--primary)",
                  // Il contorno è il secondo canale, oltre alla tinta: scuro su
                  // «in attesa», chiaro su «pubblicato». Vedi la nota sopra per
                  // perché non è un anello vuoto.
                  border:
                    status === "pending"
                      ? "1.5px solid var(--foreground)"
                      : "1.5px solid var(--card)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
