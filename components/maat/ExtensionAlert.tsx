"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { isBlockingStatus } from "@/lib/marketplace-actions";
import { EXTENSION_STATUS_COPY, SIMULATED_NOTE } from "@/lib/marketplace-actions-copy";
import { useMarketplaceActions } from "@/lib/marketplace-actions-store";

/**
 * Compare in Home solo quando qualcosa blocca le azioni. Un problema alla
 * volta, il più grave. Non si chiude: sparisce quando il problema è risolto.
 */
export function ExtensionAlert() {
  const { extension, resume, isSimulated } = useMarketplaceActions();
  if (!isBlockingStatus(extension.kind)) return null;

  const copy = EXTENSION_STATUS_COPY[extension.kind];
  // "Ferme" descrive solo lo staleness (regola 7): per reauth/challenge le
  // azioni in coda non sono "ferme" in quel senso, quindi la formulazione
  // cambia — e sparisce del tutto se c'è una sola azione coinvolta.
  const count =
    extension.kind === "stale"
      ? extension.waiting === 1
        ? "1 azione ferma"
        : `${extension.waiting} azioni ferme`
      : extension.waiting > 1
        ? `${extension.waiting} in coda`
        : null;

  return (
    <div
      role="alert"
      className={cn(
        "mt-6 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3",
        extension.kind === "stale" ? "border-primary/40 bg-accent-soft" : "border-destructive/30 bg-danger-soft"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold">
          {copy.label}
          {count ? <span className="font-mono text-[11px] font-medium text-muted-foreground"> · {count}</span> : null}
        </p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{copy.detail}</p>
        {isSimulated ? (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{SIMULATED_NOTE}</p>
        ) : null}
      </div>
      {copy.cta?.href ? (
        <Button size="sm" asChild>
          <Link href={copy.cta.href}>{copy.cta.label}</Link>
        </Button>
      ) : copy.cta?.resume ? (
        <Button size="sm" onClick={() => resume(extension.marketplace ?? "vinted")}>
          {copy.cta.label}
        </Button>
      ) : copy.secondary ? (
        <Button size="sm" variant="outline" asChild>
          <a href={copy.secondary.href} target="_blank" rel="noopener noreferrer">
            {copy.secondary.label}
          </a>
        </Button>
      ) : null}
    </div>
  );
}
