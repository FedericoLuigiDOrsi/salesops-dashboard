import type { ReactNode } from "react";

/**
 * Layout della sezione Capi con slot parallelo `@modal`: ospita l'overlay
 * scheda prodotto (route intercettata) sopra la lista, senza smontarla.
 * Per la lista e per la route piena `/capi/[id]`, `modal` ricade su @modal/default.tsx (null).
 */
export default function CapiLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
