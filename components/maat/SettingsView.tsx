"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { User, Store, Upload, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  mockUserProfile,
  mockTenantBrand,
  BRAND_TONES,
  PHOTO_AESTHETICS,
} from "@/lib/tenant-mock";

export function SettingsView() {
  const [profile, setProfile] = useState(mockUserProfile);
  const [brand, setBrand] = useState(mockTenantBrand);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onAvatarFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  const toneHint = BRAND_TONES.find((t) => t.value === brand.tono)?.hint;
  const aestheticHint = PHOTO_AESTHETICS.find((a) => a.value === brand.estetica)?.hint;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
      <div className="mb-6">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
          Account
        </p>
        <h1 className="text-[28px] font-bold tracking-tight">Impostazioni</h1>
      </div>

      <Tabs defaultValue="profilo">
        <TabsList className="mb-6">
          <TabsTrigger value="profilo" className="gap-1.5">
            <User className="size-3.5" /> Profilo
          </TabsTrigger>
          <TabsTrigger value="brand" className="gap-1.5">
            <Store className="size-3.5" /> Brand
          </TabsTrigger>
        </TabsList>

        {/* ── Profilo ── */}
        <TabsContent value="profilo" className="flex flex-col gap-6">
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
            <Avatar className="size-20">
              {(avatarPreview ?? profile.avatarUrl) && (
                <AvatarImage src={(avatarPreview ?? profile.avatarUrl) as string} alt="" />
              )}
              <AvatarFallback className="bg-primary font-mono text-lg font-semibold text-primary-foreground">
                {profile.iniziali}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-semibold">{profile.nome}</span>
              <span className="text-sm text-muted-foreground">{profile.ruolo}</span>
              <Button
                variant="outline"
                size="sm"
                className="mt-1 w-fit"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-3.5" /> Cambia foto
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarFile}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={profile.nome}
                onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ruolo">Ruolo</Label>
              <Select
                value={profile.ruolo}
                onValueChange={(v) => setProfile({ ...profile, ruolo: v as typeof profile.ruolo })}
              >
                <SelectTrigger id="ruolo" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin — vede contabilità ed escrow</SelectItem>
                  <SelectItem value="Operator">Operator — catalogazione e vendita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* ── Brand ── */}
        <TabsContent value="brand" className="flex flex-col gap-6">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-primary/[.06] p-4">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-[#7a7000]" />
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Questi valori guidano l&apos;AI: <b className="text-foreground">tono</b> ed{" "}
              <b className="text-foreground">estetica</b> orientano il copy delle schede e lo stile
              foto suggerito in catalogazione.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="negozio">Nome negozio</Label>
              <Input
                id="negozio"
                value={brand.nomeNegozio}
                onChange={(e) => setBrand({ ...brand, nomeNegozio: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tono">Tono di voce</Label>
              <Select
                value={brand.tono}
                onValueChange={(v) => setBrand({ ...brand, tono: v as typeof brand.tono })}
              >
                <SelectTrigger id="tono" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRAND_TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {toneHint && <p className="text-xs text-muted-foreground">{toneHint}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="estetica">Estetica foto</Label>
              <Select
                value={brand.estetica}
                onValueChange={(v) => setBrand({ ...brand, estetica: v as typeof brand.estetica })}
              >
                <SelectTrigger id="estetica" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_AESTHETICS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {aestheticHint && <p className="text-xs text-muted-foreground">{aestheticHint}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bio">Bio negozio</Label>
              <Textarea
                id="bio"
                rows={3}
                value={brand.bio}
                onChange={(e) => setBrand({ ...brand, bio: e.target.value })}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
