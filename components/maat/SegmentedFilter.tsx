"use client";

import { cn } from "@/lib/utils";

interface SegmentedFilterOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedFilterProps<T extends string> {
  options: SegmentedFilterOption<T>[];
  active: T;
  onChange: (value: T) => void;
}

export function SegmentedFilter<T extends string>({ options, active, onChange }: SegmentedFilterProps<T>) {
  return (
    <div className="inline-flex gap-0.5 rounded-full bg-foreground/[.05] p-[3px]">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors",
            active === option.value && "bg-card text-foreground shadow-sm"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
