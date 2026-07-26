"use client";

import { useEffect, useRef, useState } from "react";
import { Spinner } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";

interface MatchingStepProps {
  onComplete: () => void;
}

const TRACE_LINES = [
  "Scanning recipients...",
  "Evaluating compatibility rules...",
  "Calculating scores...",
] as const;

const TOTAL_MS = 800;

export function MatchingStep({ onComplete }: MatchingStepProps) {
  const called = useRef(false);
  const reduce = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const stageInterval = (TOTAL_MS - 200) / TRACE_LINES.length;
    const timers = TRACE_LINES.slice(1).map((_, i) =>
      window.setTimeout(() => setVisibleCount(i + 2), stageInterval * (i + 1)),
    );

    const complete = window.setTimeout(() => onComplete(), TOTAL_MS);
    return () => {
      window.clearTimeout(complete);
      timers.forEach(window.clearTimeout);
    };
  }, [onComplete]);

  return (
    <div
      className="flex flex-col items-center justify-center gap-6 py-16"
      role="status"
      aria-live="polite"
    >
      <div className="relative h-10 w-10">
        {!reduce && (
          <motion.span
            className="absolute -inset-1 rounded-full border-2 border-orange/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          />
        )}
        <Spinner size={40} className="animate-spin text-orange" />
      </div>

      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-navy">
          Matching your donation
        </h2>
        <p className="mt-1 text-sm text-fog-600">
          Checking recipient availability and compatibility...
        </p>
      </div>

      <div className="trace text-center text-fog-600 space-y-1">
        {TRACE_LINES.slice(0, visibleCount).map((line) => (
          <motion.p
            key={line}
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {line}
          </motion.p>
        ))}
      </div>
    </div>
  );
}
