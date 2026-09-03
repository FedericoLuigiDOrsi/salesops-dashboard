import Link from "next/link";
import { getDraft } from "@/lib/review-data";
import { ReviewPanel } from "@/components/maat/review/ReviewPanel";

// Schermata Review (S-10) — metà operatore del loop P2C, su backend canonico.
// Legge il draft reale (item + ai_extractions + foto). Se non c'è sessione o il draft
// non è del tenant, mostra lo stato vuoto (dati live dipendono dall'M0 last mile).
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draft = await getDraft(id);

  return (
    <main className="min-h-dvh bg-background px-4 py-8 sm:px-8">
      {draft ? (
        <ReviewPanel draft={draft} />
      ) : (
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
          <h1 className="text-lg font-semibold text-foreground">Draft non disponibile</h1>
          <p className="text-sm text-muted-foreground">
            Serve una sessione attiva e un draft del tuo tenant. Finché non c’è l’utente di test
            (M0), la Review non ha dati reali da mostrare.
          </p>
          <Link href="/inventario" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            ← Torna all’Inventario
          </Link>
        </div>
      )}
    </main>
  );
}
