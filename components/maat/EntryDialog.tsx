"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CatalogEntryDetail } from "@/components/maat/CatalogEntryDetail";

/**
 * Overlay scheda prodotto per `app/capi/[id]`: dialog centrato e scurito
 * sullo sfondo, non una pagina interna. /inventario apre questa route via
 * router.push; alla chiusura si torna lì (non più intercettata da un
 * @modal — la vecchia lista /capi è stata rimossa a favore di /inventario).
 */
export function EntryDialog() {
  const router = useRouter();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.push("/inventario");
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] w-full max-w-[calc(100%-2rem)] gap-0 overflow-y-auto rounded-[16px] border-border/60 p-0 shadow-e2 md:max-w-[1000px]"
      >
        <DialogTitle className="sr-only">Dettaglio capo</DialogTitle>
        <CatalogEntryDetail />
      </DialogContent>
    </Dialog>
  );
}
