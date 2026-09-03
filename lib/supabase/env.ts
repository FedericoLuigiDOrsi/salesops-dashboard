// Guardia condivisa client/server: le variabili Supabase sono configurate e non
// sono i placeholder di `.env.example`?
//
// Vive in un modulo a parte (e non in server.ts) perché serve anche ai Client
// Component di login/registrazione: importare server.ts da lì tirerebbe dentro
// `next/headers`.
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("PLACEHOLDER") && !key.includes("PLACEHOLDER"));
}
