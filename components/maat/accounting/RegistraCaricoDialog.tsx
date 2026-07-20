"use client";

import { useEffect, useState } from "react";
import { Shirt, Package, Minus, Plus, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CARICO_CATEGORIES } from "@/lib/suppliers-mock";
import type { LotType, Supplier } from "@/types/maat";

const NEW_SUPPLIER = "__new__";

const TIPO_CONFIG: Record<LotType, { label: string; unit: string; hint: string; def: number; step: number }> = {
  pezzo: { label: "Numero di articoli", unit: "pezzi", hint: "Quanti capi contiene il carico.", def: 10, step: 1 },
  ingrosso: { label: "Peso del carico", unit: "kg", hint: "Peso complessivo dei capi, in chilogrammi.", def: 25, step: 5 },
};

// Mirrors mockup's parsePrezzo(): se c'è la virgola tratta i punti come separatori
// delle migliaia (formato IT), altrimenti il punto resta decimale. Ritorna centesimi.
function parsePricePaidCents(raw: string): number | null {
  let s = raw.trim().replace(/[€\s]/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const value = parseFloat(s.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

interface RegistraCaricoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  onSubmit: (data: {
    name?: string;
    type: LotType;
    quantity: number;
    category: string;
    supplierName: string;
    pricePaidCents?: number | null;
    executedAt: string;
  }) => void;
}

export function RegistraCaricoDialog({ open, onOpenChange, suppliers, onSubmit }: RegistraCaricoDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<LotType>("pezzo");
  const [qty, setQty] = useState(TIPO_CONFIG.pezzo.def);
  const [pricePaid, setPricePaid] = useState("");
  const [executedAt, setExecutedAt] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [category, setCategory] = useState<string>(CARICO_CATEGORIES[0]);
  const [supplierChoice, setSupplierChoice] = useState<string>(suppliers[0]?.name ?? NEW_SUPPLIER);
  const [newSupplierName, setNewSupplierName] = useState("");

  const cfg = TIPO_CONFIG[type];
  const supplierName = supplierChoice === NEW_SUPPLIER ? newSupplierName.trim() : supplierChoice;
  const canSubmit = qty > 0 && supplierName.length > 0;

  // Data di esecuzione preimpostata a oggi ad ogni apertura del dialog (client-only,
  // niente Date a livello di modulo per evitare mismatch SSR/hydration).
  useEffect(() => {
    if (!open) return;
    const today = new Date().toISOString().slice(0, 10);
    setExecutedAt(today);
    setMaxDate(today);
  }, [open]);

  function changeType(next: LotType) {
    setType(next);
    setQty(TIPO_CONFIG[next].def);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim() || undefined,
      type,
      quantity: qty,
      category,
      supplierName,
      pricePaidCents: parsePricePaidCents(pricePaid),
      executedAt: executedAt || maxDate,
    });
    onOpenChange(false);
    setNewSupplierName("");
    setName("");
    setPricePaid("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registra carico</DialogTitle>
          <DialogDescription>Un carico ricevuto da un fornitore</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Nome del carico</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Giacche invernali"
              autoComplete="off"
              maxLength={40}
            />
            <span className="text-xs text-muted-foreground">Se lo lasci vuoto assegniamo un codice automatico.</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Tipo di carico</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => changeType("pezzo")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                  type === "pezzo" ? "border-primary bg-primary/[.08] text-foreground" : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                <Shirt className="size-4" /> Al pezzo
              </button>
              <button
                type="button"
                onClick={() => changeType("ingrosso")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                  type === "ingrosso" ? "border-primary bg-primary/[.08] text-foreground" : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                <Package className="size-4" /> All&apos;ingrosso
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{cfg.label}</span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon" onClick={() => setQty((q) => Math.max(cfg.step, q - cfg.step))} aria-label="Diminuisci">
                <Minus className="size-4" />
              </Button>
              <div className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border py-2">
                <Input
                  value={qty}
                  onChange={(e) => setQty(Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))}
                  inputMode="numeric"
                  className="w-16 border-none text-center shadow-none focus-visible:ring-0"
                />
                <span className="text-sm text-muted-foreground">{cfg.unit}</span>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => setQty((q) => q + cfg.step)} aria-label="Aumenta">
                <Plus className="size-4" />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">{cfg.hint}</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Prezzo pagato</span>
            <div className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1">
              <span className="text-sm text-muted-foreground">€</span>
              <Input
                value={pricePaid}
                onChange={(e) => setPricePaid(e.target.value.replace(/[^0-9.,]/g, ""))}
                inputMode="decimal"
                placeholder="0,00"
                aria-label="Prezzo pagato in euro"
                className="border-none p-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <span className="text-xs text-muted-foreground">Totale versato al fornitore per questo carico (facoltativo).</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Data di esecuzione</span>
            <Input type="date" value={executedAt} max={maxDate} onChange={(e) => setExecutedAt(e.target.value)} />
            <span className="text-xs text-muted-foreground">Quando hai ricevuto il carico · preimpostata a oggi, modificabile.</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Categoria</span>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARICO_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Fornitore</span>
            <Select value={supplierChoice} onValueChange={setSupplierChoice}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
                <SelectItem value={NEW_SUPPLIER}>+ Aggiungi nuovo fornitore…</SelectItem>
              </SelectContent>
            </Select>
            {supplierChoice === NEW_SUPPLIER && (
              <Input
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="Nome del nuovo fornitore"
                autoComplete="off"
              />
            )}
            <div className="flex items-start gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
              <Shield className="mt-0.5 size-3.5 shrink-0" />
              <span>
                I nomi dei tuoi fornitori restano <b className="text-foreground">privati</b>: MAAT non ha accesso alla tua lista, la
                gestisci soltanto tu.
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            Registra carico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
