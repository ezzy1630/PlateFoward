"use client";

import { useCallback, useState, useRef, useEffect } from "react";
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
  Trash,
  Link as LinkIcon,
  ArrowRight,
  CopySimple,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { vibrate } from "@/lib/haptics";
import type { MatchResult, MatchFailure } from "@/lib/domain/types";
import type { AgentTrace as AgentTraceModel } from "@/lib/agent-trace/types";
import type { Analysis } from "@/lib/cerebras";
import { AgentTrace } from "./agent-trace";
import { PickupSummary } from "./pickup-summary";

interface ResultsStepProps {
  matchResults: MatchResult[];
  donationId: string | null;
  publicId: string | null;
  offerToken: string | null;
  convexAvailable: boolean;
  convexError: string | null;
  agentTrace: AgentTraceModel;
  foodCategory: string;
  temperatureState: string;
  packagingState: string;
  pickupBy: string;
  donorNotes: string;
  analysis: Analysis | null;
  quantity: number;
  onReset: () => void;
}

const FAILURE_LABELS: Record<MatchFailure, string> = {
  safety_incomplete: "Safety information incomplete",
  category_mismatch: "Food category not accepted",
  pickup_unavailable: "Closed on this day",
  service_area_mismatch: "Outside service area",
  closes_before_arrival: "Closes before estimated arrival",
  eta_after_deadline: "ETA exceeds pickup deadline",
  insufficient_demo_capacity: "Recipient capacity reached",
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

const EASE = [0.22, 1, 0.36, 1] as const;

function AnimatedQR({ value }: { value: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="relative rounded-box bg-surface p-4 shadow-sm"
      initial={reduce ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 20 }}
    >
      <QRCodeSVG value={value} size={140} level="M" bgColor="#FFFFFF" fgColor="#1A2B4A" />
      {!reduce && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-4 overflow-hidden rounded"
        >
          <motion.span
            className="absolute inset-x-0 h-[2px] bg-orange/60"
            initial={{ top: "0%" }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      )}
    </motion.div>
  );
}

function CopyableId({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group inline-flex items-center gap-1.5 font-mono text-xs text-navy hover:text-orange transition-colors"
      aria-label={`${label}: ${value}. Click to copy.`}
    >
      <span className="font-mono text-[0.625rem] text-fog-600 uppercase tracking-wider">
        {label}
      </span>
      <span className="font-mono text-xs text-navy">{value}</span>
      <motion.span
        animate={copied ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.25 }}
        className="inline-flex items-center"
      >
        <CopySimple size={12} className={copied ? "text-success" : "text-fog-600"} />
      </motion.span>
      {copied && (
        <motion.span
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-[0.5625rem] uppercase tracking-wider text-success"
        >
          Copied
        </motion.span>
      )}
    </button>
  );
}

export function ResultsStep({
  matchResults,
  donationId,
  publicId,
  offerToken,
  convexAvailable,
  convexError,
  agentTrace,
  foodCategory,
  temperatureState,
  packagingState,
  pickupBy,
  donorNotes,
  analysis,
  quantity,
  onReset,
}: ResultsStepProps) {
  const compatible = matchResults.filter((r) => r.compatible);
  const incompatible = matchResults.filter((r) => !r.compatible);
  const reduce = useReducedMotion();

  useEffect(() => {
    vibrate(compatible.length > 0 ? [10, 30, 10, 30, 20] : [20, 30, 20]);
  }, [compatible.length]);

  return (
    <div className="flex flex-col gap-6" aria-live="polite">
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-navy">
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
          <CopyableId label="Tracking ID" value={publicId} />
        </div>
      )}

      {offerToken && convexAvailable && (
        <div className="flex justify-center">
          <AnimatedQR value={getOfferUrl(offerToken)} />
          <motion.div
            className="ml-4 flex flex-col justify-center gap-2"
            initial={reduce ? false : { opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: EASE, delay: 0.15 }}
          >
            <Badge variant="warning">Offer QR</Badge>
            <p className="font-mono text-[0.625rem] text-fog-600 text-center max-w-xs">
              Scans to {getOfferUrl(offerToken)}
            </p>
          </motion.div>
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

      <AgentTrace trace={agentTrace} />

      {compatible.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-navy">
            <CheckCircle size={18} className="text-orange" weight="fill" />
            Recommended recipients
          </h3>
          <div className="space-y-3">
            {compatible.map((match, i) => (
              <motion.div
                key={match.recipient.id}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.05 + i * 0.08 }}
              >
              <Card variant="elevated">
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
              </motion.div>
            ))}
          </div>

          <PickupSummary
            publicId={publicId}
            donationId={donationId}
            recipientName={compatible[0].recipient.name}
            recipientAddress={compatible[0].recipient.address}
            items={
              analysis
                ? analysis.foodItems.map((item) => ({
                    name: item.name,
                    quantity: item.estimatedQuantity,
                    unit: "servings",
                  }))
                : [
                    {
                      name: `Donation (${foodCategory.replace(/_/g, " ")})`,
                      quantity,
                      unit: "servings",
                    },
                  ]
            }
            foodCategory={foodCategory.replace(/_/g, " ")}
            temperature={temperatureState}
            packaging={packagingState}
            allergens={analysis?.allergens ?? []}
            pickupDeadline={pickupBy}
            donorPickupInstructions={donorNotes}
            offerStatus={offerToken ? "offered" : "pending"}
            demoOnly={!convexAvailable}
            offerUrl={offerToken ? getOfferUrl(offerToken) : undefined}
          />
        </div>
      )}

      {incompatible.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-navy">
            <XCircle size={18} className="text-error" weight="fill" />
            Unavailable recipients
          </h3>
          <div className="space-y-3">
            {incompatible.map((match, i) => (
              <motion.div
                key={match.recipient.id}
                initial={reduce ? false : { opacity: 0, x: [-6, 6, -3, 3, 0] }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  opacity: { duration: 0.35, ease: EASE, delay: 0.08 + i * 0.08 },
                  x: { duration: 0.4 },
                }}
              >
              <Card variant="bordered" className="border-error/30">
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
                </CardContent>
              </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <Card variant="default">
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-navy">
              Receipt preview
            </h3>
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
              * Confirmation summary. Coordinate pickup with recipient.
            </p>
          </div>
        </CardContent>
      </Card>

      <ResetButton onReset={onReset} />
    </div>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const requestReset = () => {
    setConfirming(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setConfirming(false), 4000);
  };

  const confirmReset = () => {
    if (timer.current) clearTimeout(timer.current);
    setConfirming(false);
    onReset();
  };

  const keep = () => {
    if (timer.current) clearTimeout(timer.current);
    setConfirming(false);
  };

  if (!confirming) {
    return (
      <Button onClick={requestReset} variant="secondary" size="lg" className="w-full">
        <Trash size={18} />
        Start new donation
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button onClick={confirmReset} variant="danger" size="lg" className="flex-1">
        <Trash size={18} />
        Confirm clear
      </Button>
      <Button onClick={keep} variant="ghost" size="lg">
        Keep
      </Button>
    </div>
  );
}