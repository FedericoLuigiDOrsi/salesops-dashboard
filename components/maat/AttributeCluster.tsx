"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring", stiffness: 500, damping: 32 } as const;

interface ClusterField {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

interface AttributeClusterProps {
  name: string;
  fields: ClusterField[];
}

export function AttributeCluster({ name, fields }: AttributeClusterProps) {
  const missing = fields.filter((f) => f.value === "").length;

  return (
    <div className="rounded-[14px] border border-border bg-card px-4 pb-1">
      <div className="flex items-center justify-between py-3">
        <span className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" />
          {name}
        </span>
        {missing > 0 && (
          <span className="font-mono text-[10.5px] font-semibold tracking-wide text-muted-foreground/70">
            {fields.length - missing}/{fields.length}
          </span>
        )}
      </div>
      {fields.map((field, i) => (
        <AttributeRow key={field.key} field={field} bordered={i > 0} />
      ))}
    </div>
  );
}

function AttributeRow({ field, bordered }: { field: ClusterField; bordered: boolean }) {
  const [editing, setEditing] = useState(false);
  const valueRef = useRef<HTMLSpanElement>(null);
  const isMissing = field.value === "" && !editing;

  useEffect(() => {
    if (editing) valueRef.current?.focus();
  }, [editing]);

  function commit(e: React.FocusEvent<HTMLSpanElement>) {
    setEditing(false);
    field.onChange(e.currentTarget.textContent?.trim() ?? "");
  }

  function onKeyDown(e: KeyboardEvent<HTMLSpanElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }

  return (
    <div className={cn("flex items-center justify-between gap-3 py-2.5", bordered && "border-t border-border")}>
      <span className="text-[12.5px] text-muted-foreground">{field.label}</span>
      <AnimatePresence mode="wait" initial={false}>
        {isMissing ? (
          <motion.button
            key="add"
            type="button"
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            whileTap={{ scale: 0.94 }}
            transition={SPRING}
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 rounded-[9px] border border-primary/50 bg-primary/20 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Plus className="size-3" /> Aggiungi
          </motion.button>
        ) : (
          <motion.span
            key="value"
            ref={valueRef}
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={SPRING}
            contentEditable
            suppressContentEditableWarning
            onFocus={() => setEditing(true)}
            onBlur={commit}
            onKeyDown={onKeyDown}
            className="rounded-lg border border-transparent bg-muted px-2.5 py-1 text-right font-mono text-sm font-medium text-foreground outline-none transition-colors hover:border-border focus:border-primary focus:bg-card focus:ring-[3px] focus:ring-primary/25"
          >
            {field.value}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
