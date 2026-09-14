"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/maat/EmptyState";
import { placeholderPhoto } from "@/lib/placeholder-photo";
import { cn } from "@/lib/utils";
import { messages as initialMessages, type BuyerMessage } from "@/lib/messages-mock";
import { MARKETPLACE_LABELS } from "@/types/maat";

function MessageRow({ message, onOpen }: { message: BuyerMessage; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(message.id)}
      className="flex w-full items-center gap-3 border-b border-border px-1 py-3 text-left transition-colors last:border-0 hover:bg-foreground/[.025]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={placeholderPhoto(message.id, message.itemLabel)}
        alt=""
        className="h-12 w-11 shrink-0 rounded-[9px] border border-border object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("truncate text-[13.5px]", message.unread ? "font-bold" : "font-semibold text-foreground/85")}>
            {message.sender}
          </span>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[.06em] text-muted-foreground">
            {MARKETPLACE_LABELS[message.marketplace]}
          </span>
          {message.unread && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />}
        </div>
        <p className={cn("mt-0.5 truncate text-[12.5px]", message.unread ? "text-foreground" : "text-muted-foreground")}>
          {message.preview}
        </p>
        <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{message.itemLabel} · {message.sku}</p>
      </div>
      <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">{message.time}</span>
    </button>
  );
}

/** Inbox messaggi acquirenti: domande pre-vendita e chiarimenti, distinti dalle Offerte. */
export function MessagesView() {
  const [list, setList] = useState<BuyerMessage[]>(initialMessages);

  function markRead(id: string) {
    setList((prev) => prev.map((m) => (m.id === id ? { ...m, unread: false } : m)));
  }

  const unreadCount = list.filter((m) => m.unread).length;

  return (
    <div className="flex w-full flex-col gap-4 px-4 py-8 sm:px-8">
      <div className="flex items-center gap-3">
        <h1 className="text-[28px] font-bold tracking-tight">Messaggi</h1>
        {unreadCount > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 font-mono text-[11px] font-semibold text-primary-foreground">
            {unreadCount}
          </span>
        )}
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<MessageCircle className="size-5" />}
            title="Nessun messaggio"
            subtitle="Le domande degli acquirenti sui tuoi annunci arriveranno qui."
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card px-3">
          {list.map((message) => (
            <MessageRow key={message.id} message={message} onOpen={markRead} />
          ))}
        </div>
      )}
    </div>
  );
}
