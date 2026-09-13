import type { ReactNode } from "react";
import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Marca una parte di interfaccia che esiste ma non fa ancora niente.
 *
 * Regola di prodotto (Federico, 03/09): tutto ciò che è fuori dall'MVP ma è
 * già nel frontend va segnalato. Un comando che si muove e non produce
 * nessun effetto è peggio di un comando assente, perché chi lo usa crede di
 * aver configurato qualcosa.
 *
 * ── Perché «Prossimamente» e non «In arrivo» ────────────────────────────────
 * «In arrivo» è già occupato nel prodotto con un altro significato: «Offerte
 * in arrivo» (OfferteWidget) e «Payout in arrivo» (AccountingView) vogliono
 * dire «sta per succedere davvero». Usarlo anche per «funzione non ancora
 * costruita» metterebbe due concetti sotto lo stesso nome, che è esattamente
 * l'incidente di «auto-delist» (due feature diverse, un nome solo).
 *
 * ── Perché muto e non fluo ──────────────────────────────────────────────────
 * Il fluo (`--primary`) in questo codebase significa «sta succedendo
 * qualcosa» — è il tono `warn` di StatusPill. Una funzione che non c'è non
 * sta succedendo, e non deve pesare quanto un avviso vivo. Il bordo
 * tratteggiato è la convenzione locale del provvisorio (ArticleMediaTrack,
 * HomeDashboard, ui/empty).
 *
 * L'etichetta ripete il tipografico dei titoli di sezione, quindi porta
 * l'icona: senza, dentro una Sheet, si leggerebbe come l'inizio di una
 * sezione nuova invece che come una riserva su quella corrente.
 *
 * Per disattivare i controlli di un intero blocco non serve questo
 * componente né prop drilling: basta un `<fieldset disabled>` attorno, che
 * il browser propaga nativamente a ogni controllo contenuto.
 */
interface ComingSoonNoteProps {
  /** Cosa farà, e cosa succede nel frattempo. Due frasi, non di più. */
  children: ReactNode;
  className?: string;
}

export function ComingSoonNote({ children, className }: ComingSoonNoteProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border bg-muted/40 px-3.5 py-3",
        className
      )}
    >
      <p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
        <Clock3 className="size-3" aria-hidden="true" />
        Prossimamente
      </p>
      <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{children}</p>
    </div>
  );
}
