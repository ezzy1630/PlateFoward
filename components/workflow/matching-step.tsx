"use client";

import { useEffect, useRef } from "react";
import { Spinner } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";

interface MatchingStepProps {
  onComplete: () => void;
}

export function MatchingStep({ onComplete }: MatchingStepProps) {
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    const timer = setTimeout(() => {
      onComplete();
    }, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16" role="status" aria-live="polite">
      <Badge variant="demo">Demo operation</Badge>
      <Spinner size={40} className="animate-spin text-orange" />
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-navy">
          Matching your donation
        </h2>
        <p className="mt-1 text-sm text-fog-600">
          Checking recipient availability and compatibility...
        </p>
      </div>
      <div className="trace text-center text-fog-600">
        <p>Checking categories, service area, capacity</p>
        <p>Verifying operating hours and deadlines</p>
      </div>
    </div>
  );
}
