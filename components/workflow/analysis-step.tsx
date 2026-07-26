"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PencilLine, ArrowRight } from "@phosphor-icons/react";
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
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <Badge variant="demo">Demo operation</Badge>
        <h2 className="mt-3 font-display text-xl font-bold text-navy">
          Review extraction
        </h2>
        <p className="mt-1 text-sm text-fog-600">
          Check and edit what the AI found in your image.
        </p>
      </div>

      {trace && (
        <Card variant="bordered" className="bg-navy-100/50">
          <CardContent className="!p-3">
            <div className="trace space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-navy-600">Model:</span>
                <span className="text-navy">{trace.model}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-navy-600">Timing:</span>
                <span className="text-navy">{trace.timingMs}ms</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-navy-600">Retry:</span>
                <span className="text-navy">{trace.retry ? "Yes" : "No"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-navy-600">JSON schema:</span>
                <span className="text-navy">{trace.nativeJsonSchema ? "Native" : "Repair"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card variant="default">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 border-b border-navy-100 pb-3">
            <PencilLine size={18} className="text-orange" />
            <span className="text-sm font-semibold text-navy">Detected items</span>
          </div>
          {analysis.foodItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between border-b border-navy-50 pb-2 last:border-0 last:pb-0">
              <div>
                <span className="text-sm font-medium text-navy">{item.name}</span>
                <span className="ml-2 font-mono text-[0.625rem] text-fog-600">
                  {item.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-navy">{item.estimatedQuantity}</span>
                <span className="font-mono text-[0.625rem] text-fog-600">
                  {Math.round(item.confidence * 100)}%
                </span>
              </div>
            </div>
          ))}

          <p className="mt-2 text-xs leading-relaxed text-fog-600">
            {analysis.conciseExplanation}
          </p>
        </CardContent>
      </Card>

      <Card variant="default">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 border-b border-navy-100 pb-3">
            <span className="font-mono text-[0.625rem] font-semibold text-orange">Edit</span>
            <span className="text-sm font-semibold text-navy">Donation details</span>
          </div>

          <Select
            label="Food category"
            value={foodCategory}
            onChange={(e) => onUpdateExtraction("foodCategory", e.target.value)}
            options={categoryKeys.map((k) => ({ value: k, label: categoryLabels[k] }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Temperature"
              value={temperatureState}
              onChange={(e) => onUpdateExtraction("temperatureState", e.target.value)}
              options={tempKeys.map((k) => ({ value: k, label: tempLabels[k] }))}
            />
            <Select
              label="Packaging"
              value={packagingState}
              onChange={(e) => onUpdateExtraction("packagingState", e.target.value)}
              options={packageKeys.map((k) => ({ value: k, label: packageLabels[k] }))}
            />
          </div>

          <Input
            label="Quantity (servings)"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => onUpdateExtraction("quantity", parseInt(e.target.value) || 1)}
          />

          {analysis.allergens.length > 0 && (
            <div>
              <span className="text-sm font-medium text-navy">Allergens detected</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {analysis.allergens.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center px-2 py-0.5 font-mono text-[0.625rem] font-medium text-navy bg-navy-100 rounded"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="h-px bg-navy-100" />

          <Input
            label="Your zip code (Santa Cruz area)"
            value={donorZipCode}
            onChange={(e) => onSetZipCode(e.target.value)}
            placeholder="95060"
            maxLength={5}
            pattern="[0-9]{5}"
          />

          <Input
            label="Pickup deadline"
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
        </CardContent>
      </Card>

      <Button onClick={onProceed} size="lg" className="w-full">
        Continue to confirmations
        <ArrowRight size={18} weight="bold" />
      </Button>
    </div>
  );
}
