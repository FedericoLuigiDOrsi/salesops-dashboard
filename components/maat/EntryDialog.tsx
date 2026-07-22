"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CatalogEntryDetail } from "@/components/maat/CatalogEntryDetail";

interface EntryDialogProps {
  /** onOpenChange(false): "back" torna in history (overlay da lista), "close" naviga a /capi (hard nav diretta sulla route). */
  onDismiss?: "back" | "close";
}

/**
 * Overlay scheda prodotto: dialog centrato e scurito sullo sfondo, non una
 * pagina interna. Renderizzato sia dalla route intercettata
 * `app/capi/@modal/(.)[id]` (overlay sopra la lista, URL condivisibile) sia
 * dalla route piena `app/capi/[id]` (hard nav / refresh diretto sull'URL).
 */
export function EntryDialog({ onDismiss = "back" }: EntryDialogProps) {
  const router = useRouter();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (open) return;
        if (onDismiss === "back") router.back();
        else router.push("/capi");
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] w-full max-w-[calc(100%-2rem)] gap-0 overflow-y-auto rounded-[18px] border-border/60 p-0 shadow-e2 md:max-w-[940px]"
      >
        <DialogTitle className="sr-only">Dettaglio capo</DialogTitle>
        <CatalogEntryDetail />
      </DialogContent>
    </Dialog>
  );
}
