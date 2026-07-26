"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  PencilSimple,
  ArrowRight,
  Package,
  Thermometer,
  Tag,
  Minus,
  Plus,
} from "@phosphor-icons/react";
import type { Analysis, TraceInfo } from "@/lib/cerebras";
import type { FoodCategory, TemperatureState, PackagingState } from "@/lib/domain/types";

interface AnalysisStepProps {
  analysis: Analysis;
  trace: TraceInfo | null;
  foodCategory: FoodCategory;
  temperatureState: TemperatureState;
  packagingState: PackagingState;
  quantity: number;
  donorZipCode: string;
  pickupBy: string;
  donorNotes: string;
  categoryLabels: Record<string, string>;
  categoryKeys: FoodCategory[];
  tempLabels: Record<string, string>;
  tempKeys: TemperatureState[];
  packageLabels: Record<string, string>;
  packageKeys: PackagingState[];
  onUpdateExtraction: (field: string, value: string | number) => void;
  onSetZipCode: (zip: string) => void;
  onSetPickupBy: (date: string) => void;
  onSetDonorNotes: (notes: string) => void;
  onProceed: () => void;
}

export function AnalysisStep({
  analysis,
  trace,
  foodCategory,
  temperatureState,
  packagingState,
  quantity,
  donorZipCode,
  pickupBy,
  donorNotes,
  categoryLabels,
  categoryKeys,
  tempLabels,
  tempKeys,
  packageLabels,
  packageKeys,
  onUpdateExtraction,
  onSetZipCode,
  onSetPickupBy,
  onSetDonorNotes,
  onProceed,
}: AnalysisStepProps) {
  const primaryItem = analysis.foodItems[0]?.name ?? categoryLabels[foodCategory];

  return (
    <div className="flex flex-col gap-5">
      <header className="space-y-1.5">
        <h2 className="font-display text-2xl font-bold tracking-tight text-navy text-wrap-balance">
          Review extraction
        </h2>
        <p className="text-sm leading-relaxed text-fog-600 text-pretty">
          Confirm the details below so matching stays accurate. This is a demo review, not a safety certification.
        </p>
      </header>

      {trace && (
        <div className="rounded-box border border-navy-100 bg-navy-100/40 px-3 py-2.5">
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.625rem] text-fog-600">
            <span>{trace.model}</span>
            <span>{trace.timingMs}ms</span>
            <span>{trace.nativeJsonSchema ? "Native schema" : "Repaired schema"}</span>
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-box border border-navy-100 bg-surface p-4 shadow-sm">
        <div>
          <label htmlFor="food-item" className="mb-1.5 block text-sm font-medium text-navy">
            Food item
          </label>
          <div className="relative">
            <input
              id="food-item"
              value={primaryItem}
              readOnly
              className="w-full rounded-box border border-navy-200 bg-surface py-3 pl-4 pr-11 text-sm font-medium text-navy min-h-[44px]"
            />
            <PencilSimple
              size={16}
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-fog-600"
            />
          </div>
          <Select
            label="Food category"
            value={foodCategory}
            onChange={(e) => onUpdateExtraction("foodCategory", e.target.value)}
            options={categoryKeys.map((k) => ({ value: k, label: categoryLabels[k] }))}
            className="mt-3"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-navy">Quantity</span>
            <div className="flex min-h-[44px] items-center justify-between rounded-box border border-navy-200 bg-surface px-2">
              <button
                type="button"
                aria-label="Decrease quantity"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-navy hover:bg-navy-100 disabled:opacity-30"
                disabled={quantity <= 1}
                onClick={() => onUpdateExtraction("quantity", Math.max(1, quantity - 1))}
              >
                <Minus size={16} weight="bold" />
              </button>
              <span className="min-w-[2ch] text-center text-sm font-semibold text-navy">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-navy hover:bg-navy-100"
                onClick={() => onUpdateExtraction("quantity", quantity + 1)}
              >
                <Plus size={16} weight="bold" />
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="temperature" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-navy">
              <Thermometer size={14} className="text-fog-600" />
              Temperature
            </label>
            <Select
              id="temperature"
              value={temperatureState}
              onChange={(e) => onUpdateExtraction("temperatureState", e.target.value)}
              options={tempKeys.map((k) => ({ value: k, label: tempLabels[k] }))}
            />
          </div>
        </div>

        <div>
          <label htmlFor="packaging" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-navy">
            <Package size={14} className="text-fog-600" />
            Packaging
          </label>
          <Select
            id="packaging"
            value={packagingState}
            onChange={(e) => onUpdateExtraction("packagingState", e.target.value)}
            options={packageKeys.map((k) => ({ value: k, label: packageLabels[k] }))}
          />
        </div>

        {analysis.allergens.length > 0 && (
          <div>
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-navy">
              <Tag size={14} className="text-fog-600" />
              Allergens
            </span>
            <div className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-box border border-navy-200 bg-surface px-3 py-2.5">
              {analysis.allergens.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center rounded-md bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs leading-relaxed text-fog-600 text-pretty">
          {analysis.conciseExplanation}
        </p>
      </div>

      <div className="space-y-3 rounded-box border border-navy-100 bg-surface p-4 shadow-sm">
        <Input
          label="Pickup zip (Santa Cruz area)"
          value={donorZipCode}
          onChange={(e) => onSetZipCode(e.target.value)}
          placeholder="95060"
          maxLength={5}
          pattern="[0-9]{5}"
        />

        <Input
          label="Available until"
          type="datetime-local"
          value={pickupBy}
          onChange={(e) => onSetPickupBy(e.target.value)}
        />

        <Textarea
          label="Notes (optional)"
          value={donorNotes}
          onChange={(e) => onSetDonorNotes(e.target.value)}
          placeholder="Any special instructions for pickup..."
          rows={2}
        />
      </div>

      <Button onClick={onProceed} variant="secondary" size="lg" className="w-full">
        Continue to confirmations
        <ArrowRight size={18} weight="bold" />
      </Button>
    </div>
  );
}
