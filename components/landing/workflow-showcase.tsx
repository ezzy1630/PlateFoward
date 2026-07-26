"use client";

import { useState, useRef, useCallback } from "react";
import {
  Camera,
  ImageSquare,
  Brain,
  PencilLine,
  ShieldCheck,
  Handshake,
  CheckCircle,
  ArrowRight,
  QrCode,
  MapPin,
  XCircle,
} from "@phosphor-icons/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

/* ------------------------------------------------------------------ */
/*  Demo data (honest seed values only)                                */
/* ------------------------------------------------------------------ */

const DEMO_RECIPIENTS = [
  {
    name: "Second Harvest Food Bank Santa Cruz County",
    address: "800 Ohlone Parkway, Watsonville",
    score: 125,
    compatible: true,
  },
  {
    name: "Grey Bears",
    address: "2710 Chanticleer Avenue, Santa Cruz",
    score: 98,
    compatible: true,
  },
  {
    name: "St. Francis Soup Kitchen",
    address: "205 Mora Street, Santa Cruz",
    score: 72,
    compatible: false,
    reason: "Demo rule marked this recipient incompatible",
  },
] as const;

const STAGES = [
  {
    id: "capture",
    label: "Capture",
    icon: Camera,
    description:
      "Photograph surplus food or load the demo sample. The AI analyzes the image to extract item details.",
  },
  {
    id: "analyze",
    label: "Analyze",
    icon: Brain,
    description:
      "Demo AI identifies items, quantity, and condition from the image. For this demo: 30 individually wrapped turkey and vegetarian sandwiches.",
  },
  {
    id: "review",
    label: "Review",
    icon: PencilLine,
    description:
      "Review and edit the demo AI extraction. Adjust category, temperature, packaging, quantity, zip code, and pickup deadline.",
  },
  {
    id: "confirm",
    label: "Confirm",
    icon: ShieldCheck,
    description:
      "Confirm safety details: prep time, refrigeration, packaging, allergens, quantity, and deadline. All fields must be verified before matching.",
  },
  {
    id: "match",
    label: "Match",
    icon: Handshake,
    description:
      "The matcher evaluates demo recipients against the donation. Compatible recipients are scored and ranked. Incompatible ones show why.",
  },
  {
    id: "results",
    label: "Results",
    icon: CheckCircle,
    description:
      "A demo offer token and QR code is generated for the top match. If the first recipient declines, the demo offer reroutes to the next best match.",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Tab panel content per stage                                       */
/* ------------------------------------------------------------------ */

function CapturePanel() {
  const [sampleLoaded, setSampleLoaded] = useState(false);

  return (
    <div className="space-y-4">
      {sampleLoaded ? (
        <div className="flex flex-col items-center gap-3 rounded-box border border-navy-100 bg-surface p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <CheckCircle size={28} className="text-orange" weight="fill" />
          </div>
          <span className="text-sm font-semibold text-navy">
            Sample loaded: 30 wrapped sandwiches
          </span>
          <span className="text-xs text-fog-600">
            Demo image ready for AI analysis. Switch to the Analyze tab to see
            results.
          </span>
        </div>
      ) : (
        <button
          onClick={() => setSampleLoaded(true)}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-box border-2 border-dashed border-navy-200 bg-surface p-8 transition-colors hover:border-orange hover:bg-orange-100 min-h-[120px]"
          aria-label="Load sample image of wrapped sandwiches"
        >
          <ImageSquare size={32} className="text-navy" />
          <span className="text-sm font-semibold text-navy">
            Load sample image
          </span>
          <span className="text-xs text-fog-600">
            30 wrapped sandwiches, ready for demo analysis
          </span>
        </button>
      )}
      <p className="text-xs text-fog-600">
        Load the demo sample to see how the AI identifies items, quantities,
        and condition from a food photograph.
      </p>
    </div>
  );
}

function AnalyzePanel() {
  return (
    <div className="space-y-4">
      <div className="rounded-box border border-navy-100 bg-surface p-4">
        <div className="flex items-center gap-2 border-b border-navy-100 pb-3">
          <Brain size={18} className="text-orange" />
          <span className="text-sm font-semibold text-navy">
            Demo detection results
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {[
            { name: "Turkey sandwiches (wrapped)", qty: 15 },
            { name: "Vegetarian sandwiches (wrapped)", qty: 15 },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between border-b border-navy-50 pb-2 last:border-0 last:pb-0"
            >
              <span className="text-sm font-medium text-navy">
                {item.name}
              </span>
              <span className="text-sm text-navy">{item.qty}</span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-fog-600">
          Two types of individually wrapped sandwiches detected, 30 total
          servings. Temperature appears refrigerated, packaging is sealed.
        </p>
      </div>
    </div>
  );
}

function ReviewPanel() {
  return (
    <div className="space-y-4">
      <div className="rounded-box border border-navy-100 bg-surface p-4">
        <div className="space-y-3">
          {[
            { label: "Category", value: "Cold prepared food" },
            { label: "Temperature", value: "Refrigerated" },
            { label: "Packaging", value: "Sealed" },
            { label: "Quantity", value: "30 servings" },
            { label: "Zip code", value: "95060" },
            { label: "Pickup by", value: "Today, 6:30 PM" },
          ].map((field) => (
            <div
              key={field.label}
              className="flex items-center justify-between text-xs"
            >
              <span className="font-medium text-navy">{field.label}</span>
              <span className="font-mono text-[0.6875rem] text-fog-600">
                {field.value}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-fog-600">
        Every AI-extracted field is editable. The donor can correct the
        category, adjust quantity, set the pickup deadline, and add notes
        before confirming.
      </p>
    </div>
  );
}

function ConfirmPanel() {
  const checks = [
    "Prep time logged",
    "Refrigeration maintained",
    "Packaging intact",
    "Not previously served",
    "Allergens reviewed",
    "Quantity verified",
    "Deadline confirmed",
  ];
  return (
    <div className="space-y-3">
      {checks.map((label) => (
        <label
          key={label}
          className="flex cursor-pointer items-center gap-3 rounded-box border border-navy-100 bg-surface p-3 transition-colors hover:border-orange/40"
        >
          <input
            type="checkbox"
            defaultChecked
            tabIndex={-1}
            className="h-4 w-4 rounded accent-orange"
          />
          <span className="text-sm font-medium text-navy">{label}</span>
        </label>
      ))}
      <p className="text-xs text-fog-600">
        Safety confirmations must all be checked before the demo donation
        enters the matching queue.
      </p>
    </div>
  );
}

function MatchPanel() {
  return (
    <div className="space-y-3">
      {DEMO_RECIPIENTS.map((r) => (
        <div
          key={r.name}
          className={`rounded-box border p-4 ${
            r.compatible
              ? "border-navy-100 bg-surface"
              : "border-error/25 bg-error-100/30"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="font-display text-sm font-semibold text-navy">
                {r.name}
              </h4>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-fog-600">
                <MapPin size={12} />
                {r.address}
              </p>
            </div>
            {r.compatible ? (
              <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 font-mono text-[0.625rem] font-semibold text-orange">
                Score {r.score}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-error-100 px-2 py-0.5 font-mono text-[0.625rem] font-semibold text-error">
                <XCircle size={10} weight="fill" /> No match
              </span>
            )}
          </div>
          {!r.compatible && (
            <p className="mt-2 text-xs text-error">{r.reason}</p>
          )}
        </div>
      ))}
      <p className="text-xs text-fog-600">
        Three demo recipients evaluated. Two compatible (Second Harvest, Grey
        Bears), one incompatible under the demo rules (St. Francis).
      </p>
    </div>
  );
}

function ResultsPanel() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 rounded-box border border-navy-100 bg-surface p-5 md:flex-row">
        <div className="rounded-box bg-white p-3 shadow-sm">
          <div className="flex h-[100px] w-[100px] items-center justify-center rounded bg-white">
            <QrCode size={60} weight="regular" className="text-navy" />
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 font-mono text-[0.625rem] font-semibold text-orange">
            Demo offer token
          </span>
          <p className="mt-2 text-sm font-semibold text-navy">
            Offer sent to Second Harvest Food Bank
          </p>
          <p className="mt-1 text-xs text-fog-600">
            The recipient scans the QR code to accept or decline. If declined
            within the window, the demo offer automatically reroutes to Grey
            Bears.
          </p>
        </div>
      </div>
      <p className="text-xs text-fog-600">
        Each demo offer includes a unique token, expiration window, and status
        tracking. Declines trigger automatic rerouting.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main WorkflowShowcase component                                    */
/* ------------------------------------------------------------------ */

export function WorkflowShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabListRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const panels = [
    <CapturePanel key="capture" />,
    <AnalyzePanel key="analyze" />,
    <ReviewPanel key="review" />,
    <ConfirmPanel key="confirm" />,
    <MatchPanel key="match" />,
    <ResultsPanel key="results" />,
  ];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const next = (activeIndex + dir + STAGES.length) % STAGES.length;
        setActiveIndex(next);
        const btn = tabListRef.current?.children[next] as HTMLElement;
        btn?.focus();
      }
    },
    [activeIndex],
  );

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-surface py-20 md:py-28"
      aria-label="How PlateFoward works"
    >
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        {/* Section heading */}
        <div className="mb-10 text-center md:mb-14">
          <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-navy text-balance md:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-fog-600 text-pretty md:text-[0.9375rem]">
            Six stages from surplus food to matched recipient. Click through
            each stage or use arrow keys to navigate.
          </p>
        </div>

        {/* Tab buttons */}
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Workflow stages"
          onKeyDown={handleKeyDown}
          className="mb-8 flex gap-1 overflow-x-auto rounded-box border border-navy-100 bg-navy-100/40 p-1 md:grid md:grid-cols-6 md:overflow-visible"
        >
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const active = i === activeIndex;
            return (
              <button
                key={stage.id}
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${stage.id}`}
                id={`tab-${stage.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveIndex(i)}
                className={`flex shrink-0 items-center gap-2 rounded-[11px] px-3 py-2.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.08em] transition-colors md:flex-col md:gap-1 md:px-2 md:py-3 md:text-[0.5625rem] md:tracking-[0.1em] ${
                  active
                    ? "bg-white text-orange shadow-sm"
                    : "text-fog-600 hover:text-navy"
                }`}
              >
                <Icon
                  size={18}
                  weight={active ? "fill" : "regular"}
                  className="md:hidden"
                />
                <Icon
                  size={16}
                  weight={active ? "fill" : "regular"}
                  className="hidden md:block"
                />
                <span className="hidden sm:inline">{stage.label}</span>
                <span className="sm:hidden">{stage.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active panel */}
        <div
          role="tabpanel"
          id={`panel-${STAGES[activeIndex].id}`}
          aria-labelledby={`tab-${STAGES[activeIndex].id}`}
          className="min-h-[240px] rounded-box border border-navy-100 bg-fog/60 p-5 md:p-7"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={STAGES[activeIndex].id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="mb-4 flex items-center gap-2">
                {(() => {
                  const Icon = STAGES[activeIndex].icon;
                  return (
                    <Icon
                      size={20}
                      className="text-orange"
                      weight="fill"
                    />
                  );
                })()}
                <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-fog-600">
                  {STAGES[activeIndex].label}
                </span>
              </div>
              <p className="mb-5 text-sm leading-relaxed text-navy text-pretty">
                {STAGES[activeIndex].description}
              </p>
              {panels[activeIndex]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile: next/prev controls */}
        <div className="mt-4 flex items-center justify-between md:hidden">
          <button
            onClick={() =>
              setActiveIndex(
                (activeIndex - 1 + STAGES.length) % STAGES.length,
              )
            }
            className="btn-base min-h-[40px] gap-1 border border-navy-200 bg-surface px-4 py-2 text-xs font-medium text-navy hover:border-orange"
            aria-label="Previous stage"
          >
            <ArrowRight size={14} className="rotate-180" />
            {STAGES[(activeIndex - 1 + STAGES.length) % STAGES.length].label}
          </button>
          <span className="font-mono text-[0.625rem] text-fog-600">
            {activeIndex + 1} / {STAGES.length}
          </span>
          <button
            onClick={() =>
              setActiveIndex((activeIndex + 1) % STAGES.length)
            }
            className="btn-base min-h-[40px] gap-1 border border-navy-200 bg-surface px-4 py-2 text-xs font-medium text-navy hover:border-orange"
            aria-label="Next stage"
          >
            {STAGES[(activeIndex + 1) % STAGES.length].label}
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Start donation CTA */}
        <div className="mt-10 text-center">
          <a
            href="/donate"
            className="btn-base inline-flex min-h-[48px] bg-orange px-8 py-3.5 text-[0.9375rem] font-semibold text-white hover:bg-orange-600 active:scale-[0.98]"
          >
            Try the full workflow
            <ArrowRight size={18} weight="bold" />
          </a>
        </div>
      </div>
    </section>
  );
}
