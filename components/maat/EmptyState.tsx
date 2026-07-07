import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-foreground/5">{icon}</div>
      ) : null}
      <p className="text-[15px] font-semibold text-foreground">{title}</p>
      {subtitle ? <p className="max-w-[32ch] text-[13px]">{subtitle}</p> : null}
      {action}
    </div>
  );
}
