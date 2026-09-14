import { Suspense } from "react";
import { LogisticsView } from "@/components/maat/logistics/LogisticsView";

export default function LogisticaPage() {
  return (
    <Suspense>
      <LogisticsView />
    </Suspense>
  );
}
