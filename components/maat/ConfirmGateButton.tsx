"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmGateButtonProps {
  enabled: boolean;
  missingLabels: string[];
  onConfirm?: () => void;
}

export function ConfirmGateButton({ enabled, missingLabels, onConfirm }: ConfirmGateButtonProps) {
  return (
    <div className="flex flex-col gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
      {!enabled && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="size-3.5 text-destructive" />
          <span>Mancano: {missingLabels.join(", ")}</span>
        </div>
      )}
      <Button
        size="lg"
        disabled={!enabled}
        onClick={onConfirm}
        className="w-full rounded-full font-semibold active:scale-[0.98]"
      >
        Conferma capo
      </Button>
    </div>
  );
}
