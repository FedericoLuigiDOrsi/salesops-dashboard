"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Shirt,
  Bell,
  Package,
  Wallet,
  Truck,
  Plus,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/notifications-store";
import { useSettings } from "@/lib/settings-store";
import { mockUserProfile } from "@/lib/tenant-mock";
import { mockCatalogEntries } from "@/lib/maat-mock";
import { SettingsModal } from "@/components/maat/SettingsModal";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/capi", label: "Capi", icon: Shirt, badge: mockCatalogEntries.length },
  { href: "/notifiche", label: "Notifiche", icon: Bell, badgeFromNotifications: true },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/contabilita", label: "Contabilità", icon: Wallet },
  { href: "/logistica", label: "Logistica", icon: Truck },
] as const;

const CREA_CAPO_HREF = "/capi/nuovo/foto/fronte";
const RAIL_COLLAPSED_KEY = "maat:rail-collapsed";

interface AppShellProps {
  children: React.ReactNode;
}

const BARE_ROUTES = ["/login", "/registrazione", "/onboarding"];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const { open: openSettings } = useSettings();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(RAIL_COLLAPSED_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(RAIL_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }

  // Route pre-login: nessuna sidebar/nav, solo il contenuto full-screen.
  if (BARE_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh">
      <aside
        className="sticky top-0 hidden h-dvh shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex"
        style={{ width: collapsed ? 64 : 216 }}
      >
        <div className={cn("flex h-14 items-center gap-2 px-4", collapsed && "justify-center px-0")}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[#DBE64C] font-mono text-sm font-extrabold text-[#001F3F]">
            M
          </span>
          {!collapsed && <span className="font-mono text-sm font-semibold uppercase tracking-wide">MAAT</span>}
          {!collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Comprimi menu"
              className="ml-auto flex size-7 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
        </div>

        <Link
          href={CREA_CAPO_HREF}
          className={cn(
            "mx-2 mb-2 flex items-center gap-2 rounded-md bg-[#DBE64C] px-3 py-2.5 text-sm font-semibold text-[#001F3F] transition-transform active:translate-y-px",
            collapsed && "justify-center px-0"
          )}
          title="Crea capo"
        >
          <Plus className="size-4 shrink-0" strokeWidth={2.5} />
          {!collapsed && "Crea capo"}
        </Link>

        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Espandi menu"
            className="absolute left-full top-4 flex size-7 -translate-x-1/2 items-center justify-center rounded-md bg-sidebar text-sidebar-foreground/70 shadow ring-1 ring-sidebar-border"
          >
            <ChevronLeft className="size-4 rotate-180" />
          </button>
        )}

        <nav className="relative flex flex-1 flex-col gap-0.5 px-2 py-1">
          {NAV_ITEMS.map((item) => {
            const { href, label, icon: Icon } = item;
            const badge =
              "badgeFromNotifications" in item && item.badgeFromNotifications
                ? unreadCount
                : "badge" in item
                  ? item.badge
                  : undefined;
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={label}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                {!collapsed && (
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[#DBE64C] transition-opacity",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                  />
                )}
                <Icon className="size-4.5 shrink-0" />
                {!collapsed && label}
                {!collapsed && badge ? (
                  <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DBE64C] px-1 font-mono text-[10px] font-semibold text-[#001F3F]">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => openSettings("account")}
          className={cn(
            "flex items-center gap-2 border-t border-sidebar-border px-3 py-3.5 transition-colors hover:bg-sidebar-accent",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#DBE64C] font-mono text-xs font-semibold text-[#001F3F]">
            {mockUserProfile.iniziali}
          </div>
          {!collapsed && (
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm text-sidebar-foreground/90">{mockUserProfile.nome.split(" ")[0]}</span>
              <span className="font-mono text-[10px] uppercase tracking-wide text-sidebar-foreground/50">
                {mockUserProfile.ruolo}
              </span>
            </span>
          )}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-4 md:hidden">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-[#DBE64C] font-mono text-xs font-extrabold text-[#001F3F]">
            M
          </span>
          <span className="font-mono text-sm font-semibold uppercase tracking-wide">MAAT</span>
          <span className="flex-1" />
          <Link
            href="/notifiche"
            aria-label="Notifiche"
            className="relative flex size-9 items-center justify-center rounded-full hover:bg-accent"
          >
            <Bell className="size-4.5" />
            {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />}
          </Link>
          <button
            type="button"
            onClick={() => openSettings("account")}
            aria-label="Account"
            className="flex size-8 items-center justify-center rounded-full bg-[#DBE64C] font-mono text-xs font-semibold text-[#001F3F]"
          >
            {mockUserProfile.iniziali}
          </button>
        </header>

        <main className="min-h-0 flex-1 bg-background pb-[calc(66px+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
          style={{ height: 66 }}
          aria-label="Navigazione principale"
        >
          <Link
            href="/capi"
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground data-[active=true]:text-primary"
            data-active={pathname.startsWith("/capi")}
          >
            <Shirt className="size-5" /> Capi
          </Link>
          <div className="flex w-[76px] flex-none items-start justify-center">
            <Link
              href={CREA_CAPO_HREF}
              aria-label="Crea capo"
              className="-mt-[18px] flex size-14 items-center justify-center rounded-full bg-[#DBE64C] text-[#001F3F] shadow-lg active:translate-y-px"
            >
              <Plus className="size-7" strokeWidth={2.25} />
            </Link>
          </div>
          <Link
            href="/notifiche"
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground data-[active=true]:text-primary"
            data-active={pathname.startsWith("/notifiche")}
          >
            <Bell className="size-5" /> Notifiche
          </Link>
        </nav>
      </div>

      <SettingsModal />
    </div>
  );
}
