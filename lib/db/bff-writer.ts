import "server-only";
import { Pool, type PoolClient } from "pg";

// Client di SCRITTURA del BFF — connessione Postgres diretta come ruolo `bff_writer`
// (least-privilege, NON service_role). Le LETTURE restano via supabase-js (anon + JWT + RLS);
// qui SOLO scritture, dopo che la migration 20 ha revocato le scritture ad `authenticated`.
//
// La RLS continua ad applicarsi perché iniettiamo il claim tenant PER-TRANSAZIONE con
// set_config('request.jwt.claims', ...): current_tenant_id()/current_app_role() lo leggono,
// esattamente come nel gate di isolamento 99b. bff_writer NON è superuser → la RLS filtra.
//
// PREREQUISITI (passi Databros):
//   1) migration 19 applicata (ruolo bff_writer + gate) e password impostata fuori banda.
//   2) `npm i pg @types/pg` in apps/web.
//   3) env SERVER (mai NEXT_PUBLIC), es. in apps/web/.env.local:
//      BFF_WRITER_DATABASE_URL=postgresql://bff_writer:<pwd>@<PROJECT>.pooler.supabase.com:6543/postgres
//      (Supavisor, transaction mode, porta 6543).
//
// Già importato da confirmDraft (lib/actions/review.ts) — questo è il quarto percorso di
// scrittura di apps/web verso il backend, parallelo agli endpoint REST di services/backend
// (vedi docs/technical/13-confini-frontend-backend.md §02/§09). Resta un secondo BFF de facto,
// non ancora coperto da un ADR esplicito (docs/technical/10-audit-plug-and-play.md §3.2).

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const cs = process.env.BFF_WRITER_DATABASE_URL;
    if (!cs) throw new Error("BFF_WRITER_DATABASE_URL non configurata (client bff_writer)");
    // Supavisor transaction mode: no prepared statements persistenti.
    pool = new Pool({ connectionString: cs, max: 4, statement_timeout: 5000 });
  }
  return pool;
}

export type TenantClaims = { tenant_id: string; role: string };

// Esegue `fn` in una transazione con il contesto tenant iniettato (RLS attiva).
// NON cambia ruolo: resta `bff_writer` (che ha i grant di scrittura); la RLS scopa per tenant.
export async function withTenant<T>(
  claims: TenantClaims,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    await client.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ app_metadata: { tenant_id: claims.tenant_id, role: claims.role } }),
    ]);
    const out = await fn(client);
    await client.query("commit");
    return out;
  } catch (e) {
    try {
      await client.query("rollback");
    } catch {
      /* connessione già chiusa */
    }
    throw e;
  } finally {
    client.release();
  }
}

// Conferma un item: la transizione a 'confirmed' è validata dal trigger DB items_status_guard
// (≥3 foto + attributi obbligatori). Se il gate non passa, la query lancia (errcode check_violation)
// e la rilanciamo al chiamante per il messaggio in UI.
export async function confirmItemAsBff(itemId: string, claims: TenantClaims): Promise<string> {
  return withTenant(claims, async (client) => {
    const res = await client.query<{ status: string }>(
      "update public.items set status = 'confirmed' where id = $1 returning status",
      [itemId]
    );
    if (res.rowCount === 0) {
      // 0 righe: item inesistente o di un altro tenant (nascosto dalla RLS).
      throw new Error("Item non trovato o non appartenente al tenant");
    }
    return res.rows[0].status;
  });
}
