"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { mockUserProfile, mockTenantBrand } from "@/lib/tenant-mock";
import type { TenantBrand, UserProfile } from "@/types/maat";

export type SettingsSection =
  | "generale"
  | "account"
  | "dipendenti"
  | "piano"
  | "notifiche"
  | "privacy"
  | "lingua"
  | "scopri";

interface SettingsContextValue {
  isOpen: boolean;
  section: SettingsSection;
  open: (section?: SettingsSection) => void;
  close: () => void;
  goto: (section: SettingsSection) => void;
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  brand: TenantBrand;
  setBrand: (brand: TenantBrand) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [section, setSection] = useState<SettingsSection>("account");
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [brand, setBrand] = useState<TenantBrand>(mockTenantBrand);

  const value = useMemo<SettingsContextValue>(
    () => ({
      isOpen,
      section,
      open: (s) => {
        if (s) setSection(s);
        setIsOpen(true);
      },
      close: () => setIsOpen(false),
      goto: (s) => setSection(s),
      profile,
      setProfile,
      brand,
      setBrand,
    }),
    [isOpen, section, profile, brand]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
