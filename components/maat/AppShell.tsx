"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shirt, Camera, Bell, Settings, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/notifications-store";

const NAV_ITEMS = [
  { href: "/capi", label: "Capi", icon: Shirt },
  { href: "#", label: "Acquisizione", icon: Camera },
  { href: "/notifiche", label: "Notifiche", icon: Bell },
  { href: "#", label: "Impostazioni", icon: Settings },
  { href: "/mobile/maat-shell.html", label: "Anteprima mobile", icon: Smartphone, external: true },
] as const;

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  return (
    <div className="flex min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="size-2 rounded-full bg-[#DBE64C]" />
          <span className="font-mono text-sm font-semibold uppercase tracking-wide">MAAT</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const { href, label, icon: Icon } = item;
            const badge = href === "/notifiche" && unreadCount > 0 ? unreadCount : undefined;
            const external = "external" in item ? item.external : false;
            const isActive = !external && href !== "#" && pathname.startsWith(href);
            const className = cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            );
            const inner = (
              <>
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[#DBE64C] transition-opacity",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                />
                <Icon className="size-4.5" />
                {label}
                {badge ? (
                  <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DBE64C] px-1 font-mono text-[10px] font-semibold text-[#001F3F]">
                    {badge}
                  </span>
                ) : null}
              </>
            );
            return external ? (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={className}>
                {inner}
              </a>
            ) : (
              <Link key={label} href={href} className={className}>
                {inner}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 border-t border-sidebar-border px-4 py-4">
          <div className="flex size-8 items-center justify-center rounded-full bg-[#DBE64C] font-mono text-xs font-semibold text-[#001F3F]">
            FD
          </div>
          <span className="text-sm text-sidebar-foreground/80">Federico</span>
        </div>
      </aside>

      <main className="min-h-dvh flex-1 bg-background pl-[240px]">{children}</main>
    </div>
  );
}
