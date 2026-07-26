"use client";

import { useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Printer,
  Download,
  MapPin,
  Clock,
  Thermometer,
  Package,
  WarningCircle,
  CheckCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildPickupJson,
  buildPickupFilename,
  downloadJson,
} from "@/lib/pickup-summary/builder";
import type { PickupSummaryInput } from "@/lib/pickup-summary/types";

interface PickupSummaryProps extends PickupSummaryInput {}

export function PickupSummary(input: PickupSummaryProps) {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownload = useCallback(() => {
    const json = buildPickupJson(input);
    const filename = buildPickupFilename(input.publicId);
    downloadJson(json, filename);
  }, [input]);

  const json = buildPickupJson(input);

  return (
    <Card variant="default" className="print:border-0 print:shadow-none">
      <CardContent className="space-y-5">
        <div
          className="pickup-summary-print space-y-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-semibold text-navy print:text-xl">
                Pickup summary
              </h3>
              <p className="font-mono text-xs text-fog-600">
                Tracking ID: {input.publicId ?? input.donationId ?? "pending"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <span className="font-mono text-[0.625rem] text-fog-600 uppercase tracking-wider">
                Recipient
              </span>
              <p className="text-sm font-semibold text-navy">
                {input.recipientName}
              </p>
              <p className="flex items-start gap-1.5 text-sm text-fog-600">
                <MapPin size={14} className="mt-0.5" />
                {input.recipientAddress}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[0.625rem] text-fog-600 uppercase tracking-wider">
                Pickup deadline
              </span>
              <p className="flex items-center gap-1.5 text-sm text-navy">
                <Clock size={14} />
                {new Date(input.pickupDeadline).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-mono text-[0.625rem] text-fog-600 uppercase tracking-wider">
              Food items
            </span>
            <ul className="divide-y divide-navy-100 rounded-box border border-navy-100 bg-surface">
              {input.items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="text-sm text-navy">{item.name}</span>
                  <span className="font-mono text-sm text-fog-600">
                    {item.quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <span className="font-mono text-[0.625rem] text-fog-600 uppercase tracking-wider">
                Temperature
              </span>
              <p className="flex items-center gap-1.5 text-sm text-navy">
                <Thermometer size={14} />
                {input.temperature}
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-[0.625rem] text-fog-600 uppercase tracking-wider">
                Packaging
              </span>
              <p className="flex items-center gap-1.5 text-sm text-navy">
                <Package size={14} />
                {input.packaging}
              </p>
            </div>
          </div>

          {input.allergens.length > 0 && (
            <div className="space-y-1">
              <span className="font-mono text-[0.625rem] text-fog-600 uppercase tracking-wider">
                Allergen notes
              </span>
              <p className="text-sm text-navy">
                {input.allergens.join(", ")}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <span className="font-mono text-[0.625rem] text-fog-600 uppercase tracking-wider">
              Donor pickup instructions
            </span>
            <p className="text-sm text-navy">
              {input.donorPickupInstructions || "No additional instructions."}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-box bg-navy-100/50 p-3">
            {input.offerStatus === "accepted" ? (
              <CheckCircle size={18} className="text-success" weight="fill" />
            ) : (
              <WarningCircle size={18} className="text-orange" weight="fill" />
            )}
            <span className="text-sm font-medium text-navy">
              Offer status: {input.offerStatus}
            </span>
          </div>

          {input.offerUrl && (
            <div className="flex flex-col items-center gap-3 rounded-box border border-navy-100 bg-surface p-4 print:hidden">
              <QRCodeSVG
                value={input.offerUrl}
                size={120}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#1A2B4A"
              />
              <span className="font-mono text-[0.625rem] text-fog-600 text-center">
                {input.offerUrl}
              </span>
            </div>
          )}

          <p className="rounded-box bg-orange-100 p-3 text-xs text-navy print:bg-transparent print:p-0">
            Confirm all pickup details directly with the recipient before
            handoff.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 print:hidden">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="w-full"
          >
            <Printer size={16} />
            Print
          </Button>
          <Button onClick={handleDownload} className="w-full">
            <Download size={16} />
            Download JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
