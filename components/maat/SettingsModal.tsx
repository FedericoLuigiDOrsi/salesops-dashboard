"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Cog,
  User,
  Users,
  CreditCard,
  Bell,
  Shield,
  Globe,
  PlayCircle,
  Compass,
  LogOut,
  Search,
  Check,
  ChevronRight,
  Upload,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSettings, type SettingsSection } from "@/lib/settings-store";
import { BRAND_TONES, PHOTO_AESTHETICS } from "@/lib/tenant-mock";

const NAV_GROUPS: { label: string; items: { section: SettingsSection; label: string; icon: typeof Cog }[] }[] = [
  {
    label: "Impostazioni",
    items: [
      { section: "generale", label: "Generale", icon: Cog },
      { section: "account", label: "Account", icon: User },
      { section: "dipendenti", label: "Dipendenti", icon: Users },
      { section: "piano", label: "Piano e fatturazione", icon: CreditCard },
      { section: "notifiche", label: "Notifiche", icon: Bell },
      { section: "privacy", label: "Privacy", icon: Shield },
    ],
  },
  {
    label: "Altro",
    items: [{ section: "lingua", label: "Lingua", icon: Globe }],
  },
];

const TEAM = [
  { iniziali: "GF", nome: "Giulia Ferrari", email: "giulia@dirtytag.it", ruolo: "Responsabile catalogo" },
  { iniziali: "MB", nome: "Marco Bianchi", email: "marco@dirtytag.it", ruolo: "Fotografo" },
  { iniziali: "SG", nome: "Sofia Greco", email: "sofia@dirtytag.it", ruolo: "Operatore listing" },
  { iniziali: "LM", nome: "Luca Moretti", email: "luca@dirtytag.it", ruolo: "Magazziniere", invitato: true },
];

const PLANS: { id: string; name: string; price: string; current?: boolean; feats: string[] }[] = [
  { id: "Starter", name: "Starter", price: "Gratis", feats: ["2 account", "50 capi / mese", "Canali di vendita base"] },
  {
    id: "Team",
    name: "Team",
    price: "29€",
    current: true,
    feats: ["5 account", "Capi illimitati", "Pubblicazione multi-canale", "Misure automatiche (ArUco)"],
  },
  {
    id: "Business",
    name: "Business",
    price: "79€",
    feats: ["Account illimitati", "API & webhook", "Gestione ruoli avanzata", "Supporto prioritario"],
  },
];

export function SettingsModal() {
  const { isOpen, close, section, goto, profile, setProfile, brand, setBrand } = useSettings();
  const router = useRouter();
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

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <DialogContent
        showCloseButton={false}
        className="grid h-[min(680px,90dvh)] max-w-[min(920px,94vw)] grid-cols-1 gap-0 overflow-hidden p-0 sm:grid-cols-[220px_1fr] sm:max-w-[min(920px,94vw)]"
      >
        <DialogTitle className="sr-only">Impostazioni</DialogTitle>

        <aside className="flex flex-col gap-4 overflow-y-auto border-b border-border bg-muted/40 p-4 sm:border-b-0 sm:border-r">
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            <Search className="size-3.5" />
            <span>Cerca</span>
          </div>

          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <p className="px-2 pb-1 font-mono text-[10px] font-semibold uppercase tracking-[.08em] text-muted-foreground/70">
                {group.label}
              </p>
              {group.items.map(({ section: s, label, icon: Icon }) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => goto(s)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors",
                    section === s ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-accent"
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          ))}

          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => {
                close();
                router.push("/onboarding");
              }}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
            >
              <PlayCircle className="size-4" /> Tutorial
            </button>
            <button
              type="button"
              onClick={() => goto("scopri")}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors",
                section === "scopri" ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-accent"
              )}
            >
              <Compass className="size-4" /> Scopri di più
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              close();
              router.push("/login");
            }}
            className="mt-auto flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="size-4" /> Esci
          </button>
        </aside>

        <div className="overflow-y-auto p-6">
          {section === "generale" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Generale</h2>
                <p className="text-sm text-muted-foreground">Identità del negozio e stile guidato dall&apos;AI.</p>
              </div>
              <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="negozio">Nome negozio</Label>
                  <Input id="negozio" value={brand.nomeNegozio} onChange={(e) => setBrand({ ...brand, nomeNegozio: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tono">Tono di voce</Label>
                  <Select value={brand.tono} onValueChange={(v) => setBrand({ ...brand, tono: v as typeof brand.tono })}>
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
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="estetica">Estetica foto</Label>
                  <Select value={brand.estetica} onValueChange={(v) => setBrand({ ...brand, estetica: v as typeof brand.estetica })}>
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
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bio">Bio negozio</Label>
                  <Textarea id="bio" rows={3} value={brand.bio} onChange={(e) => setBrand({ ...brand, bio: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {section === "account" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Account</h2>
                <p className="text-sm text-muted-foreground">Il tuo profilo e la gestione del team.</p>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                <Avatar className="size-12">
                  {(avatarPreview ?? profile.avatarUrl) && <AvatarImage src={(avatarPreview ?? profile.avatarUrl) as string} alt="" />}
                  <AvatarFallback className="bg-primary font-mono text-sm font-semibold text-primary-foreground">
                    {profile.iniziali}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{profile.nome}</p>
                  <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{profile.ruolo}</span>
                  <Switch
                    checked={profile.ruolo === "Admin"}
                    onCheckedChange={(checked) => setProfile({ ...profile, ruolo: checked ? "Admin" : "Operator" })}
                    aria-label="Cambia ruolo (dimostrativo)"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16">
                    {(avatarPreview ?? profile.avatarUrl) && <AvatarImage src={(avatarPreview ?? profile.avatarUrl) as string} alt="" />}
                    <AvatarFallback className="bg-primary font-mono text-base font-semibold text-primary-foreground">
                      {profile.iniziali}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="size-3.5" /> Cambia foto
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarFile} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" value={profile.nome} onChange={(e) => setProfile({ ...profile, nome: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <SettingsListRow
                  icon={Users}
                  title="Dipendenti"
                  sub="Account del team · 5 / 5 posti usati"
                  onClick={() => goto("dipendenti")}
                />
                <SettingsListRow
                  icon={CreditCard}
                  title="Piano e fatturazione"
                  sub="Piano attuale: Team · 29€/mese"
                  onClick={() => goto("piano")}
                />
              </div>
            </div>
          )}

          {section === "dipendenti" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Dipendenti</h2>
                  <p className="text-sm text-muted-foreground">Account del team DirtyTag · 5 / 5 posti usati</p>
                </div>
                <Button size="sm" onClick={() => goto("piano")}>
                  Aggiungi dipendente
                </Button>
              </div>

              <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 p-4">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary font-mono text-xs font-semibold text-primary-foreground">
                      {profile.iniziali}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                      {profile.nome} <Badge variant="secondary" className="text-[10px]">Tu</Badge>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{profile.ruolo}</span>
                  <StatusDot label="Attivo" />
                </div>
                {TEAM.map((m) => (
                  <div key={m.email} className="flex items-center gap-3 p-4">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-secondary font-mono text-xs font-semibold">{m.iniziali}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{m.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{m.ruolo}</span>
                    <StatusDot label={m.invitato ? "Invitato" : "Attivo"} muted={m.invitato} />
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Posti esauriti sul piano Team.{" "}
                <button type="button" onClick={() => goto("piano")} className="font-semibold text-foreground underline-offset-2 hover:underline">
                  Aggiorna il piano
                </button>{" "}
                per aggiungere altri dipendenti.
              </p>
            </div>
          )}

          {section === "piano" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Aggiorna piano</h2>
                <p className="text-sm text-muted-foreground">Scegli il piano più adatto al team DirtyTag. Prezzi provvisori.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-xl border p-4",
                      plan.current ? "border-primary bg-primary/[.06]" : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{plan.name}</span>
                      {plan.current && <Badge className="text-[10px]">Attuale</Badge>}
                    </div>
                    <div className="text-2xl font-bold">
                      {plan.price} {plan.id !== "Starter" && <small className="text-sm font-normal text-muted-foreground">/ mese</small>}
                    </div>
                    <ul className="flex flex-col gap-1.5">
                      {plan.feats.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                          <Check className="size-3.5 text-success" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button variant={plan.current ? "outline" : plan.id === "Business" ? "default" : "outline"} size="sm" disabled={plan.current} className="mt-auto">
                      {plan.current ? "Piano attuale" : `Passa a ${plan.name}`}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(section === "notifiche" || section === "privacy" || section === "lingua" || section === "scopri") && (
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold tracking-tight">{sectionTitle(section)}</h2>
              <p className="text-sm text-muted-foreground">{sectionSub(section)}</p>
              <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Contenuto non ancora progettato.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettingsListRow({
  icon: Icon,
  title,
  sub,
  onClick,
}: {
  icon: typeof Users;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
    >
      <span className="flex size-8 items-center justify-center rounded-md bg-muted">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}

function StatusDot({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", muted ? "bg-muted-foreground" : "bg-success")} />
      {label}
    </span>
  );
}

const SECTION_TITLES: Partial<Record<SettingsSection, string>> = {
  notifiche: "Notifiche",
  privacy: "Privacy",
  lingua: "Lingua",
  scopri: "Scopri di più",
};

const SECTION_SUBS: Partial<Record<SettingsSection, string>> = {
  notifiche: "Come e quando ricevere gli avvisi.",
  privacy: "Dati dell'account e sicurezza.",
  lingua: "Lingua dell'interfaccia MAAT.",
  scopri: "Novità, guide e risorse su MAAT.",
};

function sectionTitle(section: SettingsSection) {
  return SECTION_TITLES[section] ?? "";
}

function sectionSub(section: SettingsSection) {
  return SECTION_SUBS[section] ?? "";
}
