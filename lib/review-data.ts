import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { signedPhotoUrl } from "@/lib/storage";
import {
  REQUIRED_ATTRS,
  MIN_PHOTOS,
  type ReviewAttrKey,
  type ReviewDraft,
} from "@/lib/review-types";

// Legge un singolo draft dal backend canonico (RLS per-tenant) per la schermata Review.
// Unisce le colonne core di `items`, il jsonb `attributes`, l'ultima `ai_extractions` e le
// `photos` (con signed URL R2). Ritorna null se manca sessione o l'item non è del tenant.
//
// ATTENZIONE al pre-check foto. Qui si conta la PRESENZA (`photoCount >= MIN_PHOTOS`), e questo
// combacia col gate della migration `19_bff_writer_confirm_gate.sql`. Ma in `_sql/` esiste anche
// `28_items_status_guard_validated.sql`, che stringe il conteggio a `photos.state = 'validated'`.
//
// Quale delle due è viva su `maat-dev` NON è deducibile dal repo — la 28 porta un
// «⚠️ APPLICARE SOLO quando la validazione è attiva» e potrebbe non essere stata applicata.
// Se lo è, questo pre-check è ottimista: dice «puoi confermare» e poi il trigger rifiuta con
// «servono almeno 3 foto validate». L'errore arriva comunque all'utente (confirmDraft lo
// propaga), ma come messaggio SQL grezzo invece che come stato della schermata.
//
// Da verificare contro il DB, non contro un documento, prima di cambiare questo conteggio.
//
// Nota storica: il commento precedente diceva che `photos` non ha `state` né `label`. È falso
// dalla migration 27, che aggiunge entrambe le colonne.

type ItemRow = {
  id: string;
  catalog_ref: string | null;
  status: string;
  brand: string | null;
  category: string | null;
  size: string | null;
  condition: string | null;
  color: string | null;
  material: string | null;
  era: string | null;
  attributes: Record<string, unknown> | null;
  photos: { id: string; storage_path: string; role: string; position: number }[] | null;
  ai_extractions:
    | { raw_output: Record<string, unknown> | null; confidence: Record<string, unknown> | null; status: string; created_at: string }[]
    | null;
};

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// Risolve i 10 attributi web da un mix di colonne canoniche + jsonb.
function resolveAttrs(row: ItemRow): Record<ReviewAttrKey, string> {
  const a = row.attributes ?? {};
  return {
    brand: row.brand ?? str(a.brand),
    tipoCapo: str(a.tipoCapo) || str(a.product_type) || (row.category ?? ""),
    colore: row.color ?? str(a.colore),
    taglia: row.size ?? str(a.taglia),
    materiale: row.material ?? str(a.materiale),
    genere: str(a.gender) || str(a.genere),
    condizioni: row.condition ?? str(a.condizioni),
    difetti: str(a.difetti) || str(a.defects),
    stile: str(a.stile) || str(a.style),
    stagionalita: str(a.stagionalita) || str(a.season),
  };
}

export async function getDraft(id: string): Promise<ReviewDraft | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("items")
      .select(
        `id, catalog_ref, status, brand, category, size, condition, color, material, era, attributes,
         photos ( id, storage_path, role, position ),
         ai_extractions ( raw_output, confidence, status, created_at )`
      )
      .eq("id", id)
      .single();

    if (error || !data) return null;
    const row = data as ItemRow;

    const attributes = resolveAttrs(row);

    const photosRaw = [...(row.photos ?? [])].sort((a, b) => a.position - b.position);
    const photos = await Promise.all(
      photosRaw.map(async (p) => ({
        id: p.id,
        role: p.role,
        position: p.position,
        url: await signedPhotoUrl(p.storage_path),
      }))
    );

    const latestAi =
      [...(row.ai_extractions ?? [])].sort((a, b) => (b.created_at > a.created_at ? 1 : -1))[0] ?? null;

    const missingRequired = REQUIRED_ATTRS.filter((k) => attributes[k] === "");
    const photoCount = photosRaw.length;
    const canConfirm =
      missingRequired.length === 0 &&
      photoCount >= MIN_PHOTOS &&
      ["draft", "incomplete"].includes(row.status);

    return {
      id: row.id,
      catalogRef: row.catalog_ref,
      status: row.status,
      attributes,
      confidence: latestAi?.confidence ?? null,
      aiHasRun: latestAi != null,
      photos,
      photoCount,
      missingRequired,
      canConfirm,
    };
  } catch {
    return null;
  }
}
