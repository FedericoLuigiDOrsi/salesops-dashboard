import { createBrowserClient } from "@supabase/ssr";

// Client Supabase per il browser (auth, letture RLS lato client).
// Usa SOLO anon key (pubblica): il service_role non entra MAI nel bundle web.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
