import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase per Server Components / Route Handlers.
// Usa il JWT dell'utente dai cookie → la RLS del backend canonico filtra per tenant.
// Nessun service_role qui: le letture passano dai grant `authenticated` + RLS.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chiamato da un Server Component: set non disponibile, lo gestisce il middleware
          }
        },
      },
    }
  );
}

// true se le variabili Supabase sono configurate (non placeholder): usato per
// decidere se tentare la lettura reale o fare fallback ai mock del prototipo.
// Ri-esportata da qui per non rompere gli import esistenti (inventory-data,
// review-data); l'implementazione è condivisa col client browser.
export { isSupabaseConfigured } from "./env";
