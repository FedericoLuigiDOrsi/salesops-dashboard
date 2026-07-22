import { EntryDialog } from "@/components/maat/EntryDialog";

/**
 * Hard nav / refresh diretto su `/capi/[id]`: nessuna lista sotto (slot
 * @modal è null in questo caso), ma la scheda resta comunque un dialog
 * flottante, non una pagina interna — coerente con l'overlay intercettato.
 */
export default function CatalogEntryPage() {
  return <EntryDialog onDismiss="close" />;
}
