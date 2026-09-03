import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16: convenzione "proxy" (ex "middleware"). Rinfresca la sessione Supabase
// su ogni navigazione (esclusi asset statici).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // tutto tranne asset statici Next e immagini
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
