"use client";

import { useCallback, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useDonationWorkflow } from "@/hooks/useDonationWorkflow";
import type { ConvexMutations, WorkflowStep } from "@/hooks/useDonationWorkflow";
import { useImageCapture } from "@/hooks/useImageCapture";
import { convexClient } from "@/lib/convex/client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CaptureStep } from "@/components/workflow/capture-step";
import { AnalysisStep } from "@/components/workflow/analysis-step";
import { ConfirmationStep } from "@/components/workflow/confirmation-step";
import { MatchingStep } from "@/components/workflow/matching-step";
import { DonateProgress } from "@/components/workflow/donate-progress";

const ResultsStep = dynamic(
  () => import("@/components/workflow/results-step").then((m) => ({ default: m.ResultsStep })),
  { ssr: false },
);

const STEP_ORDER: WorkflowStep[] = [
  "idle",
  "capturing",
  "analyzing",
  "editing",
  "confirming",
  "matching",
  "results",
];

function stepIndex(step: WorkflowStep): number {
  const idx = STEP_ORDER.indexOf(step);
  return idx < 0 ? 0 : idx;
}

const EASE = [0.22, 1, 0.36, 1] as const;

function useStepDirection(step: WorkflowStep): number {
  const prevRef = useRef<number>(0);
  const idx = stepIndex(step);
  const dir = idx >= prevRef.current ? 1 : -1;
  prevRef.current = idx;
  return dir;
}

function DonatePageContent({ mutations }: { mutations?: ConvexMutations }) {
  const {
    state,
    setImage,
    setTranscript,
    analyzeImage,
    loadFallbackData,
    updateExtraction,
    setZipCode,
    setPickupBy,
    setDonorNotes,
    setConfirmation,
    allConfirmed,
    runMatching,
    reset,
    goToStep,
    hasAudioAsset,
    setHasAudioAsset,
    CATEGORY_LABELS,
    CATEGORY_KEYS,
    TEMP_LABELS,
    TEMP_KEYS,
    PACKAGE_LABELS,
    PACKAGE_KEYS,
  } = useDonationWorkflow();

  const { loadSampleImage } = useImageCapture();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageCapture = useCallback(
    (base64: string, mimeType: string) => {
      setImage(base64, mimeType);
      setImagePreview(`data:${mimeType};base64,${base64}`);
    },
    [setImage],
  );

  const handleSampleLoad = useCallback(async () => {
    try {
      const result = await loadSampleImage();
      return result;
    } catch {
      return null;
    }
  }, [loadSampleImage]);

  const handleAnalyze = useCallback(() => {
    analyzeImage();
  }, [analyzeImage]);

  const handleTranscript = useCallback(
    (transcript: string) => {
      setTranscript(transcript);
      setHasAudioAsset(true);
    },
    [setTranscript, setHasAudioAsset],
  );

  const handleProceedToConfirmations = useCallback(() => {
    goToStep("confirming");
  }, [goToStep]);

  const handleProceedToMatch = useCallback(() => {
    runMatching(mutations);
  }, [runMatching, mutations]);

  const handleMatchingComplete = useCallback(() => {
    goToStep("results");
  }, [goToStep]);

  const handleUseFallback = useCallback(() => {
    loadFallbackData();
  }, [loadFallbackData]);

  const handleBackToEditing = useCallback(() => {
    goToStep("editing");
  }, [goToStep]);

  const isAnalyzing = state.step === "analyzing";
  const direction = useStepDirection(state.step);
  const reduce = useReducedMotion();
  const stepKey =
    state.step === "error" || state.step === "expired" || state.step === "no_match"
      ? state.step
      : STEP_ORDER.includes(state.step)
        ? state.step
        : "idle";

  const enterVariant = (dir: number) =>
    reduce
      ? { opacity: 1, x: 0 }
      : { opacity: 0, x: dir >= 0 ? 24 : -24 };
  const exitVariant = (dir: number) =>
    reduce
      ? { opacity: 0, x: 0 }
      : { opacity: 0, x: dir >= 0 ? -24 : 24 };

  return (
    <div className="min-h-dvh bg-fog safe-area-inset">
      <header className="relative sticky top-0 z-20 border-b border-navy-100 bg-fog/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-navy hover:text-orange transition-colors min-h-[44px]"
            aria-label="Back to home"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">PlateFoward</span>
          </Link>
        </div>
        <DonateProgress step={state.step} />
      </header>

      <main id="donate-main-top" className="mx-auto max-w-lg px-4 py-6 pb-24" role="main" aria-label="Donation workflow">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stepKey}
            initial={enterVariant(direction)}
            animate={{ opacity: 1, x: 0 }}
            exit={exitVariant(direction)}
            transition={{ duration: reduce ? 0 : 0.32, ease: EASE }}
          >
        {state.step === "error" && (
          <motion.div
            className="flex flex-col gap-6"
            role="alert"
            aria-live="assertive"
            initial={reduce ? false : { x: [0, -8, 7, -5, 4, 0] }}
            animate={{ x: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="text-center">
              <Badge variant="error">Error</Badge>
              <h2 className="mt-3 font-display text-xl font-bold text-navy">
                Analysis failed
              </h2>
              <p className="mt-1 text-sm text-fog-600">{state.error}</p>
            </div>

            <Card variant="bordered" className="border-error/30 bg-error-100/30">
              <div className="space-y-1 p-4 font-mono text-xs text-error">
                <p>Error code: {state.errorCode}</p>
                <p>Source: Cerebras API</p>
              </div>
            </Card>

            <div className="flex flex-col gap-3">
              {state.canUseFallback && (
                <Button onClick={handleUseFallback} size="lg" className="w-full">
                  Use sample data instead
                </Button>
              )}
              <Button onClick={handleAnalyze} variant="outline" size="lg" className="w-full">
                Retry analysis
              </Button>
              <Button onClick={reset} variant="ghost" size="lg" className="w-full">
                Start over
              </Button>
            </div>
          </motion.div>
        )}

        {state.step === "expired" && (
          <div className="flex flex-col gap-6 text-center" aria-live="polite">
            <Badge variant="warning">Expired</Badge>
            <h2 className="font-display text-xl font-bold text-navy">
              Pickup deadline passed
            </h2>
            <p className="text-sm text-fog-600">
              The selected pickup time has already passed. Please choose a later time and try again.
            </p>
            <Button onClick={() => goToStep("editing")} variant="secondary" size="lg" className="w-full">
              Go back to edit
            </Button>
            <Button onClick={reset} variant="ghost" size="lg" className="w-full">
              Start over
            </Button>
          </div>
        )}

        {state.step === "no_match" && (
          <div className="flex flex-col gap-6" aria-live="polite">
            <div className="text-center">
              <Badge variant="warning">No match</Badge>
              <h2 className="mt-3 font-display text-xl font-bold text-navy">
                No compatible recipients
              </h2>
              <p className="mt-1 text-sm text-fog-600">
                No recipients can accept your donation based on current availability and requirements.
              </p>
            </div>

            <div className="space-y-2">
              {state.matchResults.map((match) => (
                <Card key={match.recipient.id} variant="bordered" className="border-error/30">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-navy">{match.recipient.name}</h4>
                        <p className="text-xs text-fog-600">{match.recipient.address}</p>
                      </div>
                      <Badge variant="error">No match</Badge>
                    </div>
                    <div className="mt-2 space-y-0.5">
                      {match.failures.map((f) => (
                        <p key={f} className="text-xs text-error font-mono">
                          {f.replace(/_/g, " ")}
                        </p>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={() => goToStep("editing")} variant="secondary" size="lg" className="w-full">
                Edit donation details
              </Button>
              <Button onClick={reset} variant="ghost" size="lg" className="w-full">
                Start over
              </Button>
            </div>
          </div>
        )}

        {state.step === "idle" || state.step === "capturing" ? (
          <Card variant="default">
            <div className="p-6">
              <CaptureStep
                onImageCapture={handleImageCapture}
                onSampleLoad={handleSampleLoad}
                onAnalyze={handleAnalyze}
                onTranscript={handleTranscript}
                onHasAudioAsset={setHasAudioAsset}
                hasImage={!!state.imageBase64}
                imagePreview={imagePreview}
                analyzing={isAnalyzing}
                hasAudioAsset={hasAudioAsset}
              />
            </div>
          </Card>
        ) : null}

        {state.step === "analyzing" && (
          <div className="flex flex-col items-center justify-center gap-4 py-16" role="status" aria-live="polite">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange border-t-transparent" />
            <div className="text-center">
              <h2 className="font-display text-lg font-semibold text-navy">
                Analyzing your food
              </h2>
              <p className="mt-1 text-sm text-fog-600">
                AI is identifying items, quantities, and condition...
              </p>
            </div>
            <div className="trace text-center text-fog-600">
              <p>Model: Gemma 4 (31B)</p>
              <p>JSON schema validation</p>
            </div>
          </div>
        )}

        {state.step === "editing" && state.analysis && (
          <AnalysisStep
            analysis={state.analysis}
            trace={state.trace}
            agentTrace={state.agentTrace}
            foodCategory={state.foodCategory}
            temperatureState={state.temperatureState}
            packagingState={state.packagingState}
            quantity={state.quantity}
            donorZipCode={state.donorZipCode}
            pickupBy={state.pickupBy}
            donorNotes={state.donorNotes}
            categoryLabels={CATEGORY_LABELS}
            categoryKeys={CATEGORY_KEYS}
            tempLabels={TEMP_LABELS}
            tempKeys={TEMP_KEYS}
            packageLabels={PACKAGE_LABELS}
            packageKeys={PACKAGE_KEYS}
            onUpdateExtraction={updateExtraction}
            onSetZipCode={setZipCode}
            onSetPickupBy={setPickupBy}
            onSetDonorNotes={setDonorNotes}
            onProceed={handleProceedToConfirmations}
          />
        )}

        {state.step === "confirming" && (
          <ConfirmationStep
            confirmations={state.confirmations}
            onSetConfirmation={setConfirmation}
            allConfirmed={allConfirmed}
            onProceed={handleProceedToMatch}
            onBack={handleBackToEditing}
            foodCategory={state.foodCategory}
            temperatureState={state.temperatureState}
            packagingState={state.packagingState}
            quantity={state.quantity}
            pickupBy={state.pickupBy}
          />
        )}

        {state.step === "matching" && (
          <MatchingStep onComplete={handleMatchingComplete} />
        )}

        {state.step === "results" && (
          <ResultsStep
            matchResults={state.matchResults}
            donationId={state.donationId}
            publicId={state.publicId}
            offerToken={state.offerToken}
            convexAvailable={state.convexAvailable}
            convexError={state.convexError}
            agentTrace={state.agentTrace}
            foodCategory={state.foodCategory}
            temperatureState={state.temperatureState}
            packagingState={state.packagingState}
            pickupBy={state.pickupBy}
            donorNotes={state.donorNotes}
            analysis={state.analysis}
            quantity={state.quantity}
            onReset={reset}
          />
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-navy-100 bg-fog/90 backdrop-blur-md safe-area-inset">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-2">
          <span className="font-mono text-[0.625rem] text-fog-600">
            PlateFoward
          </span>
          <span className="font-mono text-[0.625rem] text-fog-600">
            Move good food forward
          </span>
        </div>
      </footer>
    </div>
  );
}

function DonatePageConvex() {
  const createDonation = useMutation(api.donations.createDonation);
  const confirmDonation = useMutation(api.donations.confirmDonation);
  const createOffer = useMutation(api.offers.createOffer);

  const mutations: ConvexMutations = {
    createDonation: async (args) => createDonation(args),
    confirmDonation: async (args) => { await confirmDonation(args); },
    createOffer: async (args) => {
      const { token } = await createOffer(args);
      return { token };
    },
  };

  return <DonatePageContent mutations={mutations} />;
}

function DonatePageDemo() {
  return <DonatePageContent />;
}

export default function DonatePage() {
  return convexClient ? <DonatePageConvex /> : <DonatePageDemo />;
}
