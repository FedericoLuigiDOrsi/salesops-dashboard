"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-[18px]" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-[18px]" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.415 2.06-1.244 2.76-.828.68-1.782 1.06-2.86.995-.013-1.09.41-2.06 1.24-2.79.85-.75 1.9-1.17 2.864-.965zM19.98 17.19c-.354.822-.774 1.6-1.26 2.335-.66 1-1.348 2.005-2.42 2.02-1.06.02-1.4-.63-2.61-.63-1.21 0-1.6.61-2.6.65-1.04.04-1.83-1.09-2.5-2.08-1.35-2.02-2.39-5.72-1-8.22.7-1.24 1.94-2.02 3.29-2.04 1.02-.02 1.98.69 2.6.69.61 0 1.79-.85 3.02-.72.51.02 1.95.21 2.88 1.55-.08.05-1.72.99-1.7 2.95.02 2.33 2.03 3.11 2.05 3.12-.02.06-.32 1.1-1.06 2.16z" />
    </svg>
  );
}

/**
 * Accessi social prioritari (flusso combo). Placeholder onesti: l'OAuth Google/Apple
 * non esiste ancora nel prototipo, quindi al click mostrano una nota "a breve".
 */
export function SocialButtons() {
  const [note, setNote] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <Button type="button" variant="outline" className="h-11 justify-center gap-3 text-sm font-semibold" onClick={() => setNote(true)}>
        <GoogleIcon /> Continua con Google
      </Button>
      <Button type="button" variant="outline" className="h-11 justify-center gap-3 text-sm font-semibold" onClick={() => setNote(true)}>
        <AppleIcon /> Continua con Apple
      </Button>
      {note && (
        <p className="text-center text-xs text-muted-foreground" role="status">
          Accesso con Google e Apple disponibile a breve.
        </p>
      )}
    </div>
  );
}
