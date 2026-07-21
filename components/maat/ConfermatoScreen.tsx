"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMaatEntry, storageKey } from "@/lib/maat-store";

export function ConfermatoScreen() {
  const router = useRouter();
  const { entry } = useMaatEntry();

  function nuovoCapo() {
    // "nuovo" è lo slot unico riusato da ogni "Crea capo": pulirlo qui evita
    // che il prossimo capo riparta mostrando questo appena confermato (la
    // navigazione resta sullo stesso id, quindi il provider non lo rileva da solo).
    try {
      window.localStorage.removeItem(storageKey("nuovo"));
    } catch {
      // ignore
    }
    router.push("/capi/nuovo/foto/fronte");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-success text-white">
        <Check className="size-7" strokeWidth={3} />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Capo confermato</h1>
      {entry.sku && (
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 font-mono text-sm font-semibold tracking-wide text-foreground">
          <span className="text-[10px] font-semibold text-muted-foreground">SKU</span>
          {entry.sku}
        </span>
      )}
      <p className="max-w-xs text-sm text-muted-foreground">È nel Catalogo, pronto per la vendita.</p>

      <div className="mt-4 flex w-full max-w-xs flex-col gap-2.5">
        <Button className="h-12 w-full rounded-full font-semibold" onClick={nuovoCapo}>
          Nuovo capo
        </Button>
        <Button
          variant="outline"
          className="h-12 w-full rounded-full font-semibold"
          onClick={() => router.push(`/capi?confirmed=${entry.id}`)}
        >
          Vai al Catalogo
        </Button>
      </div>
    </main>
  );
}
