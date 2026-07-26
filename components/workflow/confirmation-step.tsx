"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Tag, Thermometer, Package, Stack, CalendarCheck } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { vibrate } from "@/lib/haptics";
import type { Confirmations } from "@/hooks/useDonationWorkflow";
import type { FoodCategory, TemperatureState, PackagingState } from "@/lib/domain/types";

interface ConfirmationStepProps {
  confirmations: Confirmations;
  onSetConfirmation: (key: keyof Confirmations, value: boolean) => void;
  allConfirmed: () => boolean;
  onProceed: () => void;
  onBack: () => void;
  foodCategory: FoodCategory;
  temperatureState: TemperatureState;
  packagingState: PackagingState;
  quantity: number;
  pickupBy: string;
}

const CONFIRMATION_ITEMS: {
  key: keyof Confirmations;
  label: string;
  description: string;
}[] = [
  {
    key: "prepTimeLogged",
    label: "Prep time logged",
    description: "I confirm the food was prepared within a safe timeframe and I have logged the preparation time.",
  },
  {
    key: "refrigerationMaintained",
    label: "Refrigeration maintained",
    description: "I confirm that perishable items have been kept at proper temperature throughout.",
  },
  {
    key: "packagingIntact",
    label: "Packaging intact",
    description: "I confirm all packaging is sealed and undamaged. No leaks, tears, or compromised seals.",
  },
  {
    key: "notPreviouslyServed",
    label: "Not previously served",
    description: "I confirm this food has not been previously served to customers or left out for consumption.",
  },
  {
    key: "allergensReviewed",
    label: "Allergens reviewed",
    description: "I confirm I have reviewed the allergen information and labeled items accordingly.",
  },
  {
    key: "quantityVerified",
    label: "Quantity verified",
    description: "I confirm the stated quantity is accurate to the best of my knowledge.",
  },
  {
    key: "deadlineConfirmed",
    label: "Deadline confirmed",
    description: "I confirm I can deliver or have the food ready for pickup by the stated deadline.",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

function useCountUp(target: number, durationMs = 600): number {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduce) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, reduce]);

  return value;
}

function formatPickup(iso: string): { absolute: string; relative: string } {
  const d = new Date(iso);
  const absolute = d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const diffMs = d.getTime() - Date.now();
  if (!Number.isFinite(diffMs)) return { absolute, relative: "" };
  const absMs = Math.abs(diffMs);
  const minutes = Math.round(absMs / 60000);
  let rel: string;
  if (minutes < 60) rel = `${minutes}m`;
  else if (minutes < 60 * 24) rel = `${Math.round(minutes / 60)}h`;
  else rel = `${Math.round(minutes / 60 / 24)}d`;
  rel = diffMs >= 0 ? `in ${rel}` : `${rel} ago`;
  return { absolute, relative: rel };
}

export function ConfirmationStep({
  confirmations,
  onSetConfirmation,
  allConfirmed,
  onProceed,
  onBack,
  foodCategory,
  temperatureState,
  packagingState,
  quantity,
  pickupBy,
}: ConfirmationStepProps) {
  const reduce = useReducedMotion();
  const animatedQty = useCountUp(quantity);
  const { absolute, relative } = formatPickup(pickupBy);

  const allConfirmedNow = allConfirmed();
  const wasConfirmedRef = useRef(false);
  useEffect(() => {
    if (allConfirmedNow && !wasConfirmedRef.current) {
      vibrate([10, 40, 10]);
    }
    wasConfirmedRef.current = allConfirmedNow;
  }, [allConfirmedNow]);

  const summaryRows = [
    { icon: Tag, label: "Category", value: foodCategory.replace(/_/g, " ") },
    { icon: Thermometer, label: "Temperature", value: temperatureState.replace(/_/g, " ") },
    { icon: Package, label: "Packaging", value: packagingState.replace(/_/g, " ") },
    { icon: Stack, label: "Quantity", value: `${animatedQty} servings` },
    { icon: CalendarCheck, label: "Pickup by", value: absolute, sub: relative },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <Badge variant="demo">Demo operation</Badge>
        <h2 className="mt-3 font-display text-xl font-bold text-navy">
          Confirm donation
        </h2>
        <p className="mt-1 text-sm text-fog-600">
          Please confirm each item before matching with recipients.
        </p>
      </div>

      <Card variant="bordered">
        <CardContent className="space-y-2">
          {summaryRows.map((row, i) => {
            const Icon = row.icon;
            return (
              <motion.div
                key={row.label}
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE, delay: 0.05 * i }}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-1.5 text-fog-600 font-mono">
                  <Icon size={12} className="text-navy/60" />
                  {row.label}
                </span>
                <span className="flex items-baseline gap-1.5 text-right">
                  <span className="font-medium text-navy capitalize">{row.value}</span>
                  {row.sub && (
                    <span className="font-mono text-[0.5625rem] uppercase tracking-wider text-orange">
                      {row.sub}
                    </span>
                  )}
                </span>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      <div className="space-y-4" role="group" aria-label="Donation confirmations">
        {CONFIRMATION_ITEMS.map((item, i) => (
          <motion.div
            key={item.key}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE, delay: 0.08 + i * 0.04 }}
          >
            <Checkbox
              id={`conf-${item.key}`}
              label={item.label}
              description={item.description}
              checked={confirmations[item.key]}
              onChange={(e) => onSetConfirmation(item.key, e.target.checked)}
            />
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack} className="flex-1">
          Back
        </Button>
        <motion.div
          className="flex-1"
          animate={
            allConfirmed() && !reduce
              ? { boxShadow: ["0 0 0 0 rgba(255,109,58,0.0)", "0 0 0 6px rgba(255,109,58,0.18)", "0 0 0 0 rgba(255,109,58,0.0)"] }
              : { boxShadow: "0 0 0 0 rgba(255,109,58,0.0)" }
          }
          transition={{ duration: 1.4, repeat: allConfirmed() ? Infinity : 0, ease: "easeInOut" }}
          style={{ borderRadius: "var(--radius-box)" }}
        >
          <Button
            onClick={onProceed}
            disabled={!allConfirmed()}
            size="lg"
            className="w-full"
          >
            Match with recipients
            <ShieldCheck size={18} weight="bold" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
