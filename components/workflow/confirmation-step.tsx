"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ArrowRight } from "@phosphor-icons/react";
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
          <div className="flex items-center justify-between text-xs">
            <span className="text-fog-600 font-mono">Category</span>
            <span className="font-medium text-navy capitalize">{foodCategory.replace(/_/g, " ")}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-fog-600 font-mono">Temperature</span>
            <span className="font-medium text-navy capitalize">{temperatureState.replace(/_/g, " ")}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-fog-600 font-mono">Packaging</span>
            <span className="font-medium text-navy capitalize">{packagingState.replace(/_/g, " ")}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-fog-600 font-mono">Quantity</span>
            <span className="font-medium text-navy">{quantity} servings</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-fog-600 font-mono">Pickup by</span>
            <span className="font-medium text-navy">
              {new Date(pickupBy).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4" role="group" aria-label="Donation confirmations">
        {CONFIRMATION_ITEMS.map((item) => (
          <Checkbox
            key={item.key}
            id={`conf-${item.key}`}
            label={item.label}
            description={item.description}
            checked={confirmations[item.key]}
            onChange={(e) => onSetConfirmation(item.key, e.target.checked)}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={onProceed}
          disabled={!allConfirmed()}
          size="lg"
          className="flex-1"
        >
          Match with recipients
          <ShieldCheck size={18} weight="bold" />
        </Button>
      </div>
    </div>
  );
}
