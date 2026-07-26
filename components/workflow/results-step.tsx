"use client";

import { useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  WarningCircle,
  MapPin,
  Clock,
  ArrowDown,
  Trash,
  Link as LinkIcon,
  ArrowRight,
} from "@phosphor-icons/react";
import type { MatchResult, MatchFailure } from "@/lib/domain/types";

interface ResultsStepProps {
  matchResults: MatchResult[];
  donationId: string | null;
  publicId: string | null;
  offerToken: string | null;
  convexAvailable: boolean;
  convexError: string | null;
  onReset: () => void;
}

const FAILURE_LABELS: Record<MatchFailure, string> = {
  safety_incomplete: "Safety information incomplete",
  category_mismatch: "Food category not accepted",
  pickup_unavailable: "Closed on this day",
  service_area_mismatch: "Outside service area",
  closes_before_arrival: "Closes before estimated arrival",
  eta_after_deadline: "ETA exceeds pickup deadline",
  insufficient_demo_capacity: "Demo capacity reached",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getOfferUrl(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/offer/${token}`;
  }
  return `/offer/${token}`;
}

function getStatusUrl(publicId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/status/${publicId}`;
  }
  return `/status/${publicId}`;
}

export function ResultsStep({
  matchResults,
  donationId,
  publicId,
  offerToken,
  convexAvailable,
  convexError,
  onReset,
}: ResultsStepProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const compatible = matchResults.filter((r) => r.compatible);
  const incompatible = matchResults.filter((r) => !r.compatible);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="flex flex-col gap-6" aria-live="polite">
      <div className="text-center">
        <Badge variant="demo">Demo operation</Badge>
        <h2 className="mt-3 font-display text-xl font-bold text-navy">
          Match results
        </h2>
        <p className="mt-1 text-sm text-fog-600">
          {compatible.length > 0
            ? `Found ${compatible.length} compatible recipient${compatible.length !== 1 ? "s" : ""}`
            : "No compatible recipients found"}
        </p>
      </div>

      {!convexAvailable && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm" role="alert">
          <div className="flex items-center gap-2">
            <WarningCircle size={16} weight="fill" />
            <span>Server dispatch unavailable — matches shown locally only.</span>
          </div>
        </div>
      )}

      {publicId && convexAvailable && (
        <div className="text-center">
          <span className="font-mono text-[0.625rem] text-fog-600">Tracking ID</span>
          <p className="font-mono text-xs text-navy">{publicId}</p>
        </div>
      )}

      {offerToken && convexAvailable && (
        <div className="flex justify-center">
          <div className="rounded-box bg-surface p-4 shadow-sm">
            <QRCodeSVG
              value={getOfferUrl(offerToken)}
              size={140}
              level="M"
              bgColor="#FFFFFF"
              fgColor="#1A2B4A"
            />
          </div>
          <div className="ml-4 flex flex-col justify-center gap-2">
            <Badge variant="demo">Offer QR</Badge>
            <p className="font-mono text-[0.625rem] text-fog-600 text-center max-w-xs">
              Scans to {getOfferUrl(offerToken)}
            </p>
          </div>
        </div>
      )}

      {publicId && convexAvailable && (
        <div className="flex justify-center gap-4 text-sm">
          <Link
            href={getStatusUrl(publicId)}
            className="flex items-center gap-1.5 text-orange hover:text-orange/80 transition-colors"
          >
            <ArrowRight size={14} />
            <span>Donor status</span>
          </Link>
          {offerToken && (
            <Link
              href={getOfferUrl(offerToken)}
              className="flex items-center gap-1.5 text-orange hover:text-orange/80 transition-colors"
            >
              <LinkIcon size={14} />
              <span>Recipient status</span>
            </Link>
          )}
        </div>
      )}

      {compatible.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-navy">
            <CheckCircle size={18} className="text-orange" weight="fill" />
            Recommended recipients
          </h3>
          <div className="space-y-3">
            {compatible.map((match) => (
              <Card key={match.recipient.id} variant="elevated">
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-display text-sm font-semibold text-navy">
                        {match.recipient.name}
                      </h4>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-fog-600">
                        <MapPin size={12} />
                        {match.recipient.address}
                      </p>
                    </div>
                    <Badge variant="success">{match.score}</Badge>
                  </div>

                  <div className="flex items-center gap-2 border-t border-navy-100 pt-2">
                    <div className="flex items-center gap-1 text-[0.625rem] font-mono text-fog-600">
                      <Clock size={10} />
                      {match.recipient.operatingHours.length > 0 && (
                        <span>
                          {match.recipient.operatingHours[0].open} -{" "}
                          {match.recipient.operatingHours[0].close}
                        </span>
                      )}
                    </div>
                    {match.recipient.demoOnly && (
                      <Badge variant="demo">Demo</Badge>
                    )}
                    {offerToken && convexAvailable && (
                      <Link
                        href={getOfferUrl(offerToken)}
                        className="flex items-center gap-1 text-[0.625rem] font-mono text-orange hover:text-orange/80"
                        aria-label="View offer"
                      >
                        <ArrowRight size={10} />
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {incompatible.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-navy">
            <XCircle size={18} className="text-error" weight="fill" />
            Unavailable recipients
          </h3>
          <div className="space-y-3">
            {incompatible.map((match) => (
              <Card key={match.recipient.id} variant="bordered" className="border-error/30">
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-display text-sm font-semibold text-navy">
                        {match.recipient.name}
                      </h4>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-fog-600">
                        <MapPin size={12} />
                        {match.recipient.address}
                      </p>
                    </div>
                    <span className="font-mono text-[0.625rem] text-error">No match</span>
                  </div>

                  <div className="space-y-1 border-t border-navy-100 pt-2">
                    {match.failures.map((f) => (
                      <div
                        key={f}
                        className="flex items-center gap-1.5 text-xs text-error"
                      >
                        <WarningCircle size={12} weight="fill" />
                        <span>{FAILURE_LABELS[f]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {match.recipient.demoOnly && (
                      <Badge variant="demo">Demo</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card variant="default" ref={receiptRef}>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-navy">
              Receipt preview
            </h3>
            <Badge variant="demo">Demo</Badge>
          </div>
          <div className="receipt-print space-y-1.5 font-mono text-xs text-navy">
            <p className="text-orange font-semibold">---- PLATEFOWARD ----</p>
            <p>Food Donation Receipt</p>
            <p>{formatDate(new Date().toISOString())}</p>
            {publicId && <p>Tracking ID: {publicId}</p>}
            {!publicId && <p>ID: {donationId || "N/A"}</p>}
            <p className="border-t border-navy-200 pt-1">
              {compatible.length > 0
                ? `Match: ${compatible[0].recipient.name}`
                : "No match found"}
            </p>
            {compatible.length > 0 && (
              <p>Address: {compatible[0].recipient.address}</p>
            )}
            <p className="border-t border-navy-200 pt-1 text-fog-600">
              * This is a demo receipt. Not a tax document.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="w-full"
          >
            <ArrowDown size={16} />
            Print receipt
          </Button>
        </CardContent>
      </Card>

      <Button onClick={onReset} variant="secondary" size="lg" className="w-full">
        <Trash size={18} />
        Start new donation
      </Button>
    </div>
  );
}