import { cn } from "@/lib/utils";

export interface SequenceStep {
  label: string;
  state: "done" | "current" | "todo";
}

interface SequenceProps {
  steps: SequenceStep[];
}

export function Sequence({ steps }: SequenceProps) {
  const currentIndex = steps.findIndex((s) => s.state === "current");
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const activeStep = steps[activeIndex];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5">
        {steps.map((step, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              step.state === "done" && "w-1.5 bg-[#00804C]",
              step.state === "current" && "w-4 bg-primary",
              step.state === "todo" && "w-1.5 bg-white/25"
            )}
          />
        ))}
      </div>
      <span className="font-mono text-xs uppercase tracking-wide text-white/70">
        {activeIndex + 1} / {steps.length} · {activeStep?.label}
      </span>
    </div>
  );
}
