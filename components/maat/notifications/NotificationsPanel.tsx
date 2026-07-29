"use client";

import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NotificationInboxContent } from "@/components/maat/notifications/NotificationInboxContent";
import { useNotifications } from "@/lib/notifications-store";

// Float notifiche richiudibile: la stessa inbox, aperta sopra la sezione
// corrente da qualsiasi schermata (campanella). "Apri sezione" porta alla
// pagina piena /notifiche per il lavoro esteso.

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const { unreadCountV2, markAllReadV2 } = useNotifications();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
          <SheetTitle className="text-[17px]">Notifiche</SheetTitle>
          <div className="flex items-center gap-3">
            {unreadCountV2 > 0 && (
              <button
                type="button"
                onClick={markAllReadV2}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <Check className="size-3.5" />
                Segna tutte lette
              </button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href="/notifiche" onClick={() => onOpenChange(false)}>
                Apri sezione <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </SheetHeader>
        <div className="px-3 py-4">
          <NotificationInboxContent variant="panel" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
