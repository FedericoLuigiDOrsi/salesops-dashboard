"use client";

import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CatalogEntryDetail } from "@/components/maat/CatalogEntryDetail";

/**
 * Overlay scheda prodotto. Renderizzato dalla route intercettata
 * `app/capi/@modal/(.)[id]`: la lista resta sotto, l'URL diventa `/capi/[id]`
 * (condivisibile), il refresh ricade sulla pagina piena. Alla chiusura torna
 * indietro nella history, così l'overlay sparisce e resta la lista.
 */
export function EntrySheet() {
  const router = useRouter();
  return (
    <Sheet open onOpenChange={(open) => { if (!open) router.back(); }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="sr-only">
          <SheetTitle>Dettaglio capo</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <CatalogEntryDetail variant="panel" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
