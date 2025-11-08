"use client";

import dynamic from 'next/dynamic';

const SimulationContent = dynamic(
  () => import('./SimulationContent').then(mod => ({ default: mod.SimulationContent })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-muted-foreground p-8">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse">⚙️</div>
          <h3 className="text-xl font-semibold">Loading simulation...</h3>
        </div>
      </div>
    )
  }
);

export default function SimulationPage() {
  return <SimulationContent />;
}