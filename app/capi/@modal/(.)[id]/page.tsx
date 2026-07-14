import { MaatEntryProvider } from "@/lib/maat-store";
import { getCatalogEntry } from "@/lib/maat-mock";
import { EntrySheet } from "@/components/maat/EntrySheet";

/**
 * Intercetta `/capi/[id]` in navigazione soft dalla lista: monta la scheda
 * prodotto in un overlay Sheet sopra `/capi`. In hard navigation / refresh
 * l'intercept non scatta e renderizza la route piena `app/capi/[id]`.
 */
export default async function InterceptedEntryModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <MaatEntryProvider id={id} initialEntry={getCatalogEntry(id)}>
      <EntrySheet />
    </MaatEntryProvider>
  );
}
