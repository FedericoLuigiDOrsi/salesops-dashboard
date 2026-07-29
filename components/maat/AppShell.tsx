"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Bell,
  Package,
  Layers,
  Wallet,
  Truck,
  Plus,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/notifications-store";
import { useSettings } from "@/lib/settings-store";
import { useOverlays } from "@/lib/overlays-store";
import { mockUserProfile } from "@/lib/tenant-mock";
import { SettingsModal } from "@/components/maat/SettingsModal";
import { OverlayHost } from "@/components/maat/OverlayHost";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/pubblicazione", label: "Pubblicazione", icon: Layers },
  { href: "/notifiche", label: "Notifiche", icon: Bell, badgeFromNotifications: true },
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
  const { openNotifications } = useOverlays();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const PRIMARY_MOBILE = ["/", "/inventario", "/notifiche"];
  const overflowItems = NAV_ITEMS.filter((item) => !PRIMARY_MOBILE.includes(item.href));
  const isOverflowActive = overflowItems.some((item) => pathname.startsWith(item.href));

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
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-primary font-mono text-sm font-extrabold text-primary-foreground">
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
            "mx-2 mb-2 flex items-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:translate-y-px",
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
              "badgeFromNotifications" in item && item.badgeFromNotifications ? unreadCount : undefined;
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            const itemClass = cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
              collapsed && "justify-center px-0",
              isActive
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            );
            const inner = (
              <>
                {!collapsed && (
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary transition-opacity",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                  />
                )}
                <Icon className="size-4.5 shrink-0" />
                {!collapsed && label}
                {!collapsed && badge ? (
                  <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-semibold text-primary-foreground">
                    {badge}
                  </span>
                ) : null}
              </>
            );
            return (
              <Link key={label} href={href} title={collapsed ? label : undefined} className={itemClass}>
                {inner}
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
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs font-semibold text-primary-foreground">
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
          <Link href="/" className="flex items-center gap-2" aria-label="Home">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-primary font-mono text-xs font-extrabold text-primary-foreground">
              M
            </span>
            <span className="font-mono text-sm font-semibold uppercase tracking-wide">MAAT</span>
          </Link>
          <span className="flex-1" />
          <button
            type="button"
            onClick={openNotifications}
            aria-label="Notifiche"
            className="relative flex size-11 items-center justify-center rounded-full hover:bg-accent"
          >
            <Bell className="size-4.5" />
            {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />}
          </button>
          <button
            type="button"
            onClick={() => openSettings("account")}
            aria-label="Account"
            className="flex size-11 items-center justify-center rounded-full bg-primary font-mono text-xs font-semibold text-primary-foreground"
          >
            {mockUserProfile.iniziali}
          </button>
        </header>

        <button
          type="button"
          onClick={openNotifications}
          aria-label="Notifiche"
          className="fixed top-5 right-6 z-30 hidden size-10 items-center justify-center rounded-[10px] bg-foreground/[.05] text-foreground transition-colors hover:bg-foreground/[.09] md:flex"
        >
          <Bell className="size-4.5" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </button>

        <main className="min-h-0 flex-1 bg-background pb-[calc(66px+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
          style={{ height: 66 }}
          aria-label="Navigazione principale"
        >
          <Link
            href="/"
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[active=true]:text-foreground data-[active=true]:font-semibold"
            data-active={pathname === "/"}
          >
            <Home className="size-5" /> Home
          </Link>
          <Link
            href="/inventario"
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[active=true]:text-foreground data-[active=true]:font-semibold"
            data-active={pathname.startsWith("/inventario")}
          >
            <Package className="size-5" /> Inventario
          </Link>
          <div className="flex w-[64px] flex-none items-start justify-center">
            <Link
              href={CREA_CAPO_HREF}
              aria-label="Crea capo"
              className="-mt-[18px] flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:translate-y-px"
            >
              <Plus className="size-7" strokeWidth={2.25} />
            </Link>
          </div>
          <Link
            href="/notifiche"
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[active=true]:text-foreground data-[active=true]:font-semibold"
            data-active={pathname.startsWith("/notifiche")}
          >
            <span className="relative flex">
              <Bell className="size-5" />
              {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-primary" />}
            </span>
            Notifiche
          </Link>
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="Altre sezioni"
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[active=true]:text-foreground data-[active=true]:font-semibold"
            data-active={isOverflowActive}
          >
            <Menu className="size-5" /> Altro
          </button>
        </nav>
      </div>

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Altre sezioni</DrawerTitle>
          </DrawerHeader>
          <nav className="flex flex-col gap-1 px-4 pb-6">
            {overflowItems.map((item) => {
              const { href, label, icon: Icon } = item;
              const badge =
                "badgeFromNotifications" in item && item.badgeFromNotifications ? unreadCount : undefined;
              const isActive = pathname.startsWith(href);
              return (
                <DrawerClose asChild key={label}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      isActive ? "bg-accent text-foreground" : "text-foreground/80 hover:bg-accent"
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    {label}
                    {badge ? (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[10px] font-semibold text-primary-foreground">
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                </DrawerClose>
              );
            })}
          </nav>
        </DrawerContent>
      </Drawer>

      <SettingsModal />
      <OverlayHost />
    </div>
  );
}
