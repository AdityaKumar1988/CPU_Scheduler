import { Suspense } from "react";
import { SimulationContent } from "./SimulationContent";

export default function SimulationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-muted-foreground p-8">
            <div className="mx-auto mb-4 h-12 w-12 animate-pulse">⚙️</div>
            <h3 className="text-xl font-semibold">Loading simulation...</h3>
          </div>
        </div>
      }
    >
      <SimulationContent />
    </Suspense>
  );
}
