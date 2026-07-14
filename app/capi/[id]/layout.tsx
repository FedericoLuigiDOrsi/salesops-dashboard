import type { ReactNode } from "react";
import { MaatEntryProvider } from "@/lib/maat-store";
import { getCatalogEntry } from "@/lib/maat-mock";

export default async function CapiEntryLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <MaatEntryProvider id={id} initialEntry={getCatalogEntry(id)}>
      {children}
    </MaatEntryProvider>
  );
}
