"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NotificationInboxContent } from "@/components/maat/notifications/NotificationInboxContent";

// Float notifiche richiudibile: la stessa inbox, aperta sopra la sezione
// corrente da qualsiasi schermata (campanella). "Apri sezione" porta alla
// pagina piena /notifiche per il lavoro esteso.

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
          <SheetTitle className="text-[17px]">Notifiche</SheetTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/notifiche" onClick={() => onOpenChange(false)}>
              Apri sezione <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </SheetHeader>
        <div className="px-3 py-4">
          <NotificationInboxContent variant="panel" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
