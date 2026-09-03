"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDraft } from "@/lib/review-data";
import { MIN_PHOTOS, type ConfirmResult } from "@/lib/review-types";
import { confirmItemAsBff } from "@/lib/db/bff-writer";

// Human-in-the-loop confirm (REQ-207): draft|incomplete → confirmed.
//
// La scrittura NON passa più dal ruolo `authenticated` (che perde i grant con la migration 20):
// va al ruolo server least-privilege `bff_writer`, con il claim tenant iniettato per-transazione
// così la RLS del backend canonico resta attiva (nessun bypass, nessun service_role).
//
// Il gate composito (≥N foto + campi obbligatori) è imposto dal DB dal trigger
// `items_status_guard`: unica fonte di verità. Qui lo ri-valutiamo SOLO per dare
// all'utente un messaggio utile prima di andare a sbattere sul DB.
export async function confirmDraft(id: string): Promise<ConfirmResult> {
  const draft = await getDraft(id);
  if (!draft) return { ok: false, error: "Sessione mancante o draft non trovato" };

  if (!draft.canConfirm) {
    const reasons: string[] = [];
    if (draft.photoCount < MIN_PHOTOS) reasons.push(`${MIN_PHOTOS - draft.photoCount} foto mancanti`);
    if (draft.missingRequired.length) reasons.push(`campi obbligatori: ${draft.missingRequired.join(", ")}`);
    if (!["draft", "incomplete"].includes(draft.status)) reasons.push(`stato non confermabile (${draft.status})`);
    return { ok: false, error: `Gate non superato — ${reasons.join("; ")}` };
  }

  // tenant_id/role SEMPRE dal JWT verificato server-side, mai dal client.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tenantId = user?.app_metadata?.tenant_id as string | undefined;
  if (!user || !tenantId) {
    return { ok: false, error: "Sessione non valida o tenant non assegnato" };
  }
  const role = (user.app_metadata?.role as string) ?? "operator";

  try {
    const status = await confirmItemAsBff(id, { tenant_id: tenantId, role });
    revalidatePath(`/review/${id}`);
    return { ok: true, status };
  } catch (e) {
    // Il trigger DB rifiuta gate non superato / transizioni illegali (errcode check_violation).
    return { ok: false, error: e instanceof Error ? e.message : "Conferma fallita" };
  }
}
