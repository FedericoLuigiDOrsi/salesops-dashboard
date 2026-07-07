import { notFound } from "next/navigation";
import { PhotoCaptureFlow } from "@/components/maat/PhotoCaptureFlow";
import type { PhotoLabel } from "@/types/maat";

const VALID_LABELS: readonly string[] = ["fronte", "retro", "brand", "taglia", "materiale", "extra"];

export default async function PhotoCapturePage({
  params,
}: {
  params: Promise<{ id: string; label: string }>;
}) {
  const { label } = await params;

  if (!VALID_LABELS.includes(label)) {
    notFound();
  }

  return <PhotoCaptureFlow initialLabel={label as PhotoLabel} />;
}
