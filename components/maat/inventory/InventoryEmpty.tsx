import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lo stato che vede un tenant vero senza ancora un capo. Prima esisteva solo
// come assenza: `getInventoryItems` collassava "zero capi" su `null` e la pagina
// serviva i 18 mock, quindi il primo schermo di chi si registrava mostrava il
// magazzino di qualcun altro.
//
// Non è un "nessun risultato". È la prima cosa che MAAT dice a un cliente nuovo,
// quindi mostra il gesto invece di constatare il vuoto: tre passi, una sola
// azione. L'accento fluo sta sul bottone e da nessun'altra parte, come prescrive
// il design system (`ooux/maat-ds/DESIGN.md` §accento: solo azione, mai glow).

const STEPS = [
  { n: "01", t: "Scatti le foto", d: "Minimo tre, dal telefono o dal desktop. La prima è la copertina." },
  { n: "02", t: "L'AI compila la scheda", d: "Brand, tipo, taglia, condizioni e misure. Tu non scrivi niente." },
  { n: "03", t: "Confermi", d: "Correggi quello che serve e il capo entra a catalogo con il suo SKU." },
];

export function InventoryEmpty() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-6 p-8 sm:p-10">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Primo capo
          </p>
          <h2 className="max-w-[24ch] text-balance text-[22px] font-bold tracking-tight">
            Il catalogo è vuoto, ed è il posto giusto da cui partire.
          </h2>
          <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
            Un capo entra a catalogo dalle sue foto. Non c&apos;è un modulo da riempire.
          </p>
        </div>

        <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex flex-col gap-1.5 bg-card p-4">
              <span className="font-mono text-[11px] font-semibold tracking-[.1em] text-muted-foreground/60">
                {s.n}
              </span>
              <span className="text-[14px] font-semibold leading-snug">{s.t}</span>
              <span className="text-[13px] leading-relaxed text-muted-foreground">{s.d}</span>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button asChild className="gap-1.5">
            <Link href="/capi/nuovo">
              <Plus className="size-3.5" /> Crea il primo capo
            </Link>
          </Button>
          <p className="font-mono text-[11px] text-muted-foreground/70">
            Serve circa un minuto per capo.
          </p>
        </div>
      </div>
    </div>
  );
}
