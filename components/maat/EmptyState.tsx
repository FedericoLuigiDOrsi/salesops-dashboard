import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Gli stati vuoti di MAAT sono TRE, non due. Regola completa in
// docs/technical/ooux/maat-ds/DESIGN.md §13.
//
//   first-run  «non hai ancora niente»      insegna il gesto, una CTA
//   no-match   «niente corrisponde»          constata, offri di azzerare i filtri
//   idle       «niente in questo momento»    constata e basta, nessuna azione
//
// La distinzione non è cosmetica. Con due soli stati il vuoto transitorio finisce
// nel primo, e una colonna Kanban "Consegnati" senza pacchi diventa un invito a
// crearne uno: un rimprovero per uno stato del tutto normale.
//
// `tone` governa solo il PESO VISIVO. Cosa scrivere e se mettere una CTA resta
// una decisione umana: un prop non può impedirti di mettere "Crea capo" sotto un
// no-match, il documento sì.

export type EmptyTone = "first-run" | "no-match" | "idle";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Default `no-match`: è il caso più comune dentro una lista già popolata. */
  tone?: EmptyTone;
  className?: string;
}

const TONE: Record<EmptyTone, { wrap: string; title: string; sub: string }> = {
  // Occupa la pagina: è la prima cosa che un cliente nuovo vede.
  "first-run": { wrap: "py-16 gap-3", title: "text-[15px] font-semibold text-foreground", sub: "text-[13px]" },
  // Interrompe una lista che esiste: presente ma non invadente.
  "no-match": { wrap: "py-12 gap-2.5", title: "text-[14px] font-semibold text-foreground", sub: "text-[13px]" },
  // Vive dentro un contenitore piccolo (colonna, widget): deve quasi sparire.
  idle: { wrap: "py-6 gap-1.5", title: "font-mono text-[11px] font-normal text-muted-foreground/70", sub: "text-[12px]" },
};

export function EmptyState({ icon, title, subtitle, action, tone = "no-match", className }: EmptyStateProps) {
  const t = TONE[tone];
  return (
    <div className={cn("flex flex-col items-center text-center text-muted-foreground", t.wrap, className)}>
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-foreground/5">{icon}</div>
      ) : null}
      <p className={t.title}>{title}</p>
      {subtitle ? <p className={cn("max-w-[38ch]", t.sub)}>{subtitle}</p> : null}
      {action}
    </div>
  );
}
