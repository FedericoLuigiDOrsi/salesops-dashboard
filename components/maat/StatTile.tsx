import { cn } from "@/lib/utils";

interface StatTileProps {
  number: number;
  label: string;
  attention?: boolean;
}

export function StatTile({ number, label, attention }: StatTileProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3",
        attention && "border-l-2 border-l-primary"
      )}
    >
      <span className="font-mono text-2xl font-semibold tabular-nums">{number}</span>
      <span className="text-[13px] text-muted-foreground">{label}</span>
    </div>
  );
}
