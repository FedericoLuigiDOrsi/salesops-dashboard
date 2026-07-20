"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { FormLabel } from "@/components/ui/form";

/** Glifo di brand MAAT: 2×2 punti, l'ultimo "next" con bordo fluo. */
function BrandMark() {
  return (
    <div className="mb-6 flex items-center justify-center gap-2.5">
      <div className="grid grid-cols-2 grid-rows-2 gap-[3px]" aria-hidden="true">
        <span className="size-2 rounded-[2.5px] bg-foreground" />
        <span className="size-2 rounded-[2.5px] bg-foreground" />
        <span className="size-2 rounded-[2.5px] bg-foreground" />
        <span className="size-2 rounded-[2.5px] border-[1.5px] border-primary" />
      </div>
      <span className="text-base font-semibold tracking-tight text-foreground">MAAT</span>
    </div>
  );
}

/** Contenitore full-screen centrato per le schermate pre-login (fuori dalla AppShell). */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <BrandMark />
        {children}
      </div>
    </div>
  );
}

export function AuthHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="mb-5">
      <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
        {eyebrow}
      </p>
      <h1 className="text-[23px] font-bold leading-tight tracking-tight text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground/70">
      <span className="h-px flex-1 bg-border" />
      oppure
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function AuthFooter({ children }: { children: ReactNode }) {
  return <p className="mt-6 text-center text-sm text-muted-foreground">{children}</p>;
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-foreground underline-offset-2 hover:underline">
      {children}
    </Link>
  );
}

export function AuthBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3 inline-flex items-center gap-1.5 self-start font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="size-3.5" /> Indietro
    </button>
  );
}

/** Label campo in stile MP076 (mono, uppercase). Usare dentro un FormItem. */
export function AuthFieldLabel({ children }: { children: ReactNode }) {
  return (
    <FormLabel className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </FormLabel>
  );
}
