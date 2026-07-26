"use client";

import { motion, useReducedMotion, useSpring } from "motion/react";
import type { WorkflowStep } from "@/hooks/useDonationWorkflow";

const STEP_ORDER: WorkflowStep[] = [
  "idle",
  "capturing",
  "analyzing",
  "editing",
  "confirming",
  "matching",
  "results",
];

const STEP_LABELS: Partial<Record<WorkflowStep, string>> = {
  idle: "Capture",
  capturing: "Capture",
  analyzing: "Analyze",
  editing: "Review",
  confirming: "Confirm",
  matching: "Match",
  results: "Results",
};

function progressFor(step: WorkflowStep, errorState: boolean): number {
  if (step === "no_match" || step === "expired") return 0.9;
  if (step === "error") return errorState ? 0.25 : 0.0;
  const idx = STEP_ORDER.indexOf(step);
  if (idx < 0) return 0;
  return idx / (STEP_ORDER.length - 1);
}

export function DonateProgress({ step }: { step: WorkflowStep }) {
  const reduce = useReducedMotion();
  const raw = progressFor(step, true);
  const progress = useSpring(raw, {
    stiffness: 160,
    damping: 28,
    mass: 0.5,
  });

  if (reduce || step === "error" || step === "expired" || step === "no_match") {
    return null;
  }

  const stepLabel =
    STEP_LABELS[step] ?? step.charAt(0).toUpperCase() + step.slice(1);
  const idx = STEP_ORDER.indexOf(step);
  const humanIdx = Math.max(1, idx + 1);
  const humanTotal = STEP_ORDER.length - 1;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0"
      aria-hidden
    >
      <motion.span
        className="block h-[2px] origin-left bg-orange"
        style={{ scaleX: progress }}
      />
      <div className="absolute right-4 top-[calc(100%+0.25rem)] font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-fog-600">
        {humanIdx <= humanTotal && (
          <span>
            {humanIdx} / {humanTotal} <span className="text-navy/60">·</span> {stepLabel}
          </span>
        )}
      </div>
    </div>
  );
}
