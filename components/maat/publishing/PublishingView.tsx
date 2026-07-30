// components/maat/publishing/PublishingView.tsx
"use client";

import { useMemo, useState } from "react";
import { Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { inventoryItems, type InventoryItem } from "@/lib/inventory-mock";
import { getToPublishItems, getLiveItems } from "@/lib/publishing-mock";
import { applyBulkPriceDelta, type BulkPriceMode } from "@/lib/publishing-bulk";
import type { PlatformKey } from "@/lib/inventory-columns";
import { PublishingStrategyProvider, usePublishingStrategy } from "@/lib/publishing-strategy-store";
import { StrategySheet } from "@/components/maat/publishing/StrategySheet";
import { ToPublishTab } from "@/components/maat/publishing/ToPublishTab";
import { LiveTab } from "@/components/maat/publishing/LiveTab";

const PUBLISH_DELAY_MS = 1500;

function PublishingViewInner() {
  const [items, setItems] = useState<InventoryItem[]>(inventoryItems);
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const { strategy } = usePublishingStrategy();

  const toPublish = useMemo(() => getToPublishItems(items), [items]);
  const live = useMemo(() => getLiveItems(items), [items]);

  function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      setCheckedAt(new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));
    }, 700);
  }

  function setPlatforms(ids: string[], platforms: PlatformKey[], state: "pending" | "active" | "delisted") {
    setItems((prev) =>
      prev.map((item) => {
        if (!ids.includes(item.id)) return item;
        const nextPlatforms = { ...item.platforms };
        for (const key of platforms) {
          if (nextPlatforms[key] === "sold") continue;
          nextPlatforms[key] = state;
        }
        return { ...item, platforms: nextPlatforms };
      })
    );
  }

  function activatePendingPlatforms(ids: string[], platforms: PlatformKey[]) {
    setItems((prev) =>
      prev.map((item) => {
        if (!ids.includes(item.id)) return item;
        const nextPlatforms = { ...item.platforms };
        for (const key of platforms) {
          if (nextPlatforms[key] === "pending") nextPlatforms[key] = "active";
        }
        return { ...item, platforms: nextPlatforms };
      })
    );
  }

  function publishItems(ids: string[], platforms: PlatformKey[]) {
    setPlatforms(ids, platforms, "pending");
    window.setTimeout(() => activatePendingPlatforms(ids, platforms), PUBLISH_DELAY_MS);
  }

  function republishItems(ids: string[], platforms: PlatformKey[], priceCents: number | null) {
    if (priceCents !== null) {
      setItems((prev) => prev.map((item) => (ids.includes(item.id) ? { ...item, priceCents } : item)));
    }
    setPlatforms(ids, platforms, "pending");
    window.setTimeout(() => activatePendingPlatforms(ids, platforms), PUBLISH_DELAY_MS);
  }

  function delistItems(ids: string[]) {
    setItems((prev) =>
      prev.map((item) => {
        if (!ids.includes(item.id)) return item;
        const nextPlatforms = { ...item.platforms };
        (Object.keys(nextPlatforms) as PlatformKey[]).forEach((key) => {
          if (nextPlatforms[key] !== null && nextPlatforms[key] !== "sold") nextPlatforms[key] = "delisted";
        });
        return { ...item, platforms: nextPlatforms };
      })
    );
  }

  function bulkPrice(ids: string[], mode: BulkPriceMode, signedValue: number) {
    setItems((prev) =>
      prev.map((item) =>
        ids.includes(item.id) ? { ...item, priceCents: applyBulkPriceDelta(item.priceCents, mode, signedValue) } : item
      )
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground/70">
            Pubblicazione multipiattaforma
          </p>
          <h1 className="text-[28px] font-bold tracking-tight">Pubblicazione</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            La dogana tra MAAT e le piattaforme: cosa esce, cosa è già live, come si governa nel tempo.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="gap-1.5" onClick={() => setStrategyOpen(true)}>
              <Zap className="size-3.5" /> Strategie
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} /> Aggiorna
            </Button>
          </div>
          {checkedAt && <span className="font-mono text-[10px] text-muted-foreground">Ultimo controllo · {checkedAt}</span>}
        </div>
      </div>

      <Tabs defaultValue="to-publish">
        <TabsList>
          <TabsTrigger value="to-publish">Da pubblicare ({toPublish.length})</TabsTrigger>
          <TabsTrigger value="live">Live ({live.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="to-publish" className="mt-4">
          <ToPublishTab items={toPublish} allItems={items} defaultPlatforms={strategy.defaultPublishPlatforms} onPublish={publishItems} />
        </TabsContent>
        <TabsContent value="live" className="mt-4">
          <LiveTab items={live} onRepublish={republishItems} onDelist={delistItems} onBulkPrice={bulkPrice} />
        </TabsContent>
      </Tabs>

      <StrategySheet open={strategyOpen} onOpenChange={setStrategyOpen} />
    </div>
  );
}

export function PublishingView() {
  return (
    <PublishingStrategyProvider>
      <PublishingViewInner />
    </PublishingStrategyProvider>
  );
}
