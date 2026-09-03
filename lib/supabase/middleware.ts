import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Route-guard fail-closed + refresh sessione (pattern @supabase/ssr), esposto via proxy.ts (Next 16).
// - Rotte PUBBLICHE: passano SENZA toccare Supabase → /login resta raggiungibile anche se il DB è
//   lento o in pausa (un route-guard non deve mai appendere tutta l'app a una chiamata di rete).
// - Rotte protette: getUser() con TIMEOUT; se non risponde entro il budget si tratta come "non
//   autenticato" e si reindirizza a /login (fail-closed), senza mai impiccare la richiesta.
// - Senza env reali (prototipo su mock): passthrough, non tocca nulla.
const PUBLIC_PATHS = ["/login", "/registrazione", "/auth"];
const GETUSER_TIMEOUT_MS = 3000;

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Prototipo senza env reali, oppure rotta pubblica: passa senza chiamare Supabase.
  if (
    !url || !key || url.includes("PLACEHOLDER") || key.includes("PLACEHOLDER") ||
    isPublic(pathname)
  ) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // NON inserire logica tra createServerClient e getUser (refresh token). getUser con timeout: un
  // Supabase lento/in pausa NON deve impiccare la richiesta. Su timeout/errore → nessun utente.
  let user: unknown = null;
  try {
    const result = (await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("getUser timeout")), GETUSER_TIMEOUT_MS)
      ),
    ])) as { data?: { user?: unknown } };
    user = result?.data?.user ?? null;
  } catch {
    user = null;
  }

  if (!user) {
    // /api/*: mai un redirect. Un fetch() segue il 307 e legge `/login` come 200 HTML —
    // lib/bff.ts non riesce a fare .json() e il ramo "sessione scaduta" di humanMessage()
    // non scatta mai. Stesso pattern fail-closed di services/backend/middleware.ts.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  return supabaseResponse;
}
