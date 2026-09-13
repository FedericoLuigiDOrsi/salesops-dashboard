import { cn } from "@/lib/utils";
import { MARKETPLACE_LABELS, type Marketplace } from "@/types/maat";

// Il marketplace, come badge. Stessa molecola in Listing Detail e Shipment
// Detail: i due oggetti condividono l'attributo, e la spec (Atomic Bridge
// §Layer 3) la voleva una sola, non duplicata due volte.
//
// Copre tutti e CINQUE i marketplace del canonico. `PLATFORM_BRAND` in
// lib/inventory-columns.ts ne copre tre, ed è il gap che la Fase 5 aveva
// segnalato: i due token colore mancanti sono stati aggiunti a globals.css
// insieme a questo componente.

const BRAND: Record<Marketplace, { color: string; initial: string }> = {
  vinted: { color: "var(--channel-vinted)", initial: "V" },
  depop: { color: "var(--channel-depop)", initial: "D" },
  grailed: { color: "var(--channel-grailed)", initial: "G" },
  vestiaire: { color: "var(--channel-vestiaire)", initial: "VC" },
  ebay: { color: "var(--channel-ebay)", initial: "E" },
};

interface MarketplaceBadgeProps {
  marketplace: Marketplace;
  /** `dot` per le liste dense, `full` quando c'è spazio per il nome. */
  variant?: "full" | "dot";
  className?: string;
}

export function MarketplaceBadge({ marketplace, variant = "full", className }: MarketplaceBadgeProps) {
  const brand = BRAND[marketplace];
  const label = MARKETPLACE_LABELS[marketplace];

  if (variant === "dot") {
    return (
      <span
        title={label}
        aria-label={label}
        className={cn(
          "inline-grid size-[22px] shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold",
          className
        )}
        style={{ backgroundColor: brand.color, color: "var(--text-on-dark)" }}
      >
        {brand.initial}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs font-semibold",
        className
      )}
      style={{ backgroundColor: `color-mix(in oklab, ${brand.color} 14%, transparent)` }}
    >
      <span
        aria-hidden
        className="grid size-[18px] place-items-center rounded-full font-mono text-[9px] font-bold"
        style={{ backgroundColor: brand.color, color: "var(--text-on-dark)" }}
      >
        {brand.initial}
      </span>
      {label}
    </span>
  );
}
