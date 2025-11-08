"use client";

import { useSearchParams } from 'next/navigation';

export function useSimulationParams() {
  const searchParams = useSearchParams();
  return {
    algorithm: searchParams.get('algorithm'),
    quantum: searchParams.get('quantum')
  };
}