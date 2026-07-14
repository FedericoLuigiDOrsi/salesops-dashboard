import type { BrandTone, PhotoAesthetic, TenantBrand, UserProfile } from "@/types/maat";

export const mockUserProfile: UserProfile = {
  nome: "Federico D'Orsi",
  email: "federico@dirtytag.it",
  ruolo: "Admin",
  iniziali: "FD",
  avatarUrl: null,
};

export const mockTenantBrand: TenantBrand = {
  nomeNegozio: "DirtyTag",
  tono: "streetwise",
  estetica: "vintage",
  bio: "Resale vintage selezionato: capi con una storia, letti bene e prezzati onesti.",
};

export const BRAND_TONES: { value: BrandTone; label: string; hint: string }[] = [
  { value: "diretto", label: "Diretto", hint: "Frasi brevi, zero fronzoli." },
  { value: "caldo", label: "Caldo", hint: "Vicino, colloquiale, umano." },
  { value: "professionale", label: "Professionale", hint: "Preciso, curato, affidabile." },
  { value: "streetwise", label: "Streetwise", hint: "Slang misurato, cultura del capo." },
];

export const PHOTO_AESTHETICS: { value: PhotoAesthetic; label: string; hint: string }[] = [
  { value: "pulita", label: "Pulita e neutra", hint: "Sfondo bianco, luce piena — stile Catawiki." },
  { value: "editoriale", label: "Editoriale", hint: "Composizione curata, mood da lookbook." },
  { value: "street", label: "Street", hint: "Contesto urbano, luce naturale." },
  { value: "vintage", label: "Vintage calda", hint: "Toni caldi, grana, atmosfera analogica." },
];
