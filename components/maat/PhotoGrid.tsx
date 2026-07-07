import { PhotoSlot } from "@/components/maat/PhotoSlot";
import type { Photo, PhotoLabel } from "@/types/maat";

const SLOT_ORDER: { label: PhotoLabel; required: boolean }[] = [
  { label: "fronte", required: true },
  { label: "retro", required: true },
  { label: "brand", required: true },
  { label: "taglia", required: false },
  { label: "materiale", required: false },
  { label: "extra", required: false },
];

interface PhotoGridProps {
  photos: Photo[];
  onCapture?: (label: PhotoLabel) => void;
  onRetake?: (label: PhotoLabel) => void;
}

export function PhotoGrid({ photos, onCapture, onRetake }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {SLOT_ORDER.map(({ label, required }) => (
        <PhotoSlot
          key={label}
          label={label}
          required={required}
          photo={photos.find((p) => p.label === label)}
          onCapture={() => onCapture?.(label)}
          onRetake={() => onRetake?.(label)}
        />
      ))}
    </div>
  );
}
