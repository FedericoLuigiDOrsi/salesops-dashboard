import { Suspense } from "react";
import { InventoryView } from "@/components/maat/inventory/InventoryView";
import { InventoryColumnsProvider } from "@/lib/inventory-columns-store";

export default function InventarioPage() {
  return (
    <InventoryColumnsProvider>
      <Suspense fallback={null}>
        <InventoryView />
      </Suspense>
    </InventoryColumnsProvider>
  );
}
