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
  if (itemStatus === "to_be_reviewed" || itemStatus === "local_draft") return "pending";
  return "off";
}

interface ChannelDotsProps {
  platforms: InventoryItem["platforms"];
  itemStatus: InventoryStatus;
  onToggle: (platform: PlatformKey) => void;
}

/** Tracking canali: colore fisso = piattaforma, dot overlay = stato pubblicazione. Click = toggle pubblica/rimuovi. */
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
                  border: "1.5px solid var(--card)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
