"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import type {
  Analysis,
  AnalyzeResult,
  TraceInfo,
} from "@/lib/cerebras";
import type {
  FoodCategory,
  TemperatureState,
  PackagingState,
  DonationDraft,
  MatchResult,
  SafetyInfo,
  MatchFailure,
} from "@/lib/domain/types";
import { matchDonation } from "@/lib/domain/matcher";
import { SEED_RECIPIENTS } from "@/lib/demo/recipients";
import { isConvexAvailable } from "@/lib/convex/client";

export type WorkflowStep =
  | "idle"
  | "capturing"
  | "analyzing"
  | "editing"
  | "confirming"
  | "matching"
  | "results"
  | "no_match"
  | "expired"
  | "error";

export interface Confirmations {
  prepTimeLogged: boolean;
  refrigerationMaintained: boolean;
  packagingIntact: boolean;
  notPreviouslyServed: boolean;
  allergensReviewed: boolean;
  quantityVerified: boolean;
  deadlineConfirmed: boolean;
}

export interface WorkflowState {
  step: WorkflowStep;
  imageBase64: string | null;
  imageMimeType: string;
  transcript: string | null;
  analysis: Analysis | null;
  trace: TraceInfo | null;
  error: string | null;
  errorCode: string | null;
  canUseFallback: boolean;
  foodCategory: FoodCategory;
  temperatureState: TemperatureState;
  packagingState: PackagingState;
  quantity: number;
  donorZipCode: string;
  pickupBy: string;
  donorNotes: string;
  confirmations: Confirmations;
  matchResults: MatchResult[];
  donationId: Id<"donations"> | string | null;
  publicId: string | null;
  offerToken: string | null;
  convexAvailable: boolean;
  convexError: string | null;
  hasAudioAsset: boolean;
}

export interface ConvexMutations {
  createDonation: (args: {
    foodType: string;
    quantity: number;
    unit: string;
    pickupBy: string;
    location: string;
    notes?: string;
  }) => Promise<{ donationId: Id<"donations">; publicId: string }>;
  confirmDonation: (args: {
    donationId: Id<"donations">;
    confirmedFields: {
      foodType: string;
      quantity: number;
      unit: string;
      pickupBy: string;
      location: string;
      notes?: string;
    };
  }) => Promise<void>;
  createOffer: (args: { donationId: Id<"donations"> }) => Promise<{ token: string }>;
}

type Action =
  | { type: "SET_IMAGE"; base64: string; mimeType: string }
  | { type: "SET_TRANSCRIPT"; transcript: string | null }
  | { type: "START_ANALYSIS" }
  | { type: "ANALYSIS_SUCCESS"; result: Extract<AnalyzeResult, { source: "gemma" }> }
  | { type: "ANALYSIS_ERROR"; error: string; errorCode: string; canUseFallback: boolean }
  | { type: "USE_FALLBACK" }
  | { type: "UPDATE_EXTRACTION"; field: string; value: string | number }
  | { type: "SET_ZIP_CODE"; zip: string }
  | { type: "SET_PICKUP_BY"; date: string }
  | { type: "SET_DONOR_NOTES"; notes: string }
  | { type: "SET_CONFIRMATION"; key: keyof Confirmations; value: boolean }
  | { type: "START_MATCHING" }
  | { type: "MATCH_COMPLETE"; results: MatchResult[]; donationId: string }
  | { type: "CONVEX_DONATION_CREATED"; donationId: Id<"donations">; publicId: string }
  | { type: "CONVEX_DONATION_CONFIRMED" }
  | { type: "CONVEX_OFFER_CREATED"; token: string }
  | { type: "CONVEX_ERROR"; error: string }
  | { type: "CONVEX_AVAILABILITY_CHECK"; available: boolean }
  | { type: "SET_HAS_AUDIO_ASSET"; value: boolean }
  | { type: "RESET" }
  | { type: "GO_TO_STEP"; step: WorkflowStep };

const DEFAULT_CONFIRMATIONS: Confirmations = {
  prepTimeLogged: false,
  refrigerationMaintained: false,
  packagingIntact: false,
  notPreviouslyServed: false,
  allergensReviewed: false,
  quantityVerified: false,
  deadlineConfirmed: false,
};

const CATEGORY_LABELS: Record<FoodCategory, string> = {
  cold_prepared_food: "Cold Prepared Food",
  baked_goods: "Baked Goods",
  produce: "Produce",
  refrigerated_grocery: "Refrigerated Grocery",
  frozen_grocery: "Frozen Grocery",
  shelf_stable: "Shelf Stable",
};

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as FoodCategory[];

const TEMP_LABELS: Record<TemperatureState, string> = {
  refrigerated: "Refrigerated",
  frozen: "Frozen",
  ambient: "Ambient",
  hot_holding: "Hot Holding",
};

const TEMP_KEYS = Object.keys(TEMP_LABELS) as TemperatureState[];

const PACKAGE_LABELS: Record<PackagingState, string> = {
  sealed: "Sealed",
  open: "Open",
  bulk: "Bulk",
  individual: "Individual",
};

const PACKAGE_KEYS = Object.keys(PACKAGE_LABELS) as PackagingState[];

function mapAnalysisCategory(cat: string): FoodCategory {
  const lowered = cat.toLowerCase().replace(/\s+/g, "_");
  if (CATEGORY_KEYS.includes(lowered as FoodCategory)) {
    return lowered as FoodCategory;
  }
  if (["sandwich", "wrap", "salad", "sandwiches", "wraps", "salads"].includes(lowered)) {
    return "cold_prepared_food";
  }
  if (["bake", "bread", "pastry"].includes(lowered)) {
    return "baked_goods";
  }
  return "cold_prepared_food";
}

function mapAnalysisTemperature(temp: string): TemperatureState {
  const t = temp.toLowerCase();
  if (t.includes("frozen")) return "frozen";
  if (t.includes("hot") || t.includes("warm")) return "hot_holding";
  if (t.includes("ambient") || t.includes("room")) return "ambient";
  return "refrigerated";
}

function mapAnalysisPackaging(pkg: string): PackagingState {
  const p = pkg.toLowerCase();
  if (p.includes("individual") || p.includes("individually")) return "individual";
  if (p.includes("bulk")) return "bulk";
  if (p.includes("open")) return "open";
  return "sealed";
}

function generateId(): string {
  return `don-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function getDefaultPickup(): string {
  const d = new Date();
  d.setHours(d.getHours() + 4);
  if (d.getHours() > 20) {
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
  }
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function computeQuantity(analysis: Analysis): number {
  const total = analysis.foodItems.reduce((s, f) => s + f.estimatedQuantity, 0);
  return Math.max(1, Math.round(total));
}

function isPickupExpired(pickupBy: string): boolean {
  const now = new Date();
  const deadline = new Date(pickupBy);
  return deadline <= now;
}

function buildDonationDraft(state: WorkflowState): DonationDraft {
  const safetyInfo: SafetyInfo = {
    temperatureLogged: state.confirmations.refrigerationMaintained,
    packagingIntact: state.confirmations.packagingIntact,
    handlerCertified: state.confirmations.prepTimeLogged,
  };

  return {
    id: generateId(),
    donorName: "Demo Donor",
    donorZipCode: state.donorZipCode,
    foodCategory: state.foodCategory,
    quantity: state.quantity,
    packagingState: state.packagingState,
    temperatureState: state.temperatureState,
    safetyInfo,
    pickupBy: state.pickupBy,
    donorNotes: state.donorNotes || undefined,
    createdAt: new Date().toISOString(),
  };
}

const initialState: WorkflowState = {
  step: "idle",
  imageBase64: null,
  imageMimeType: "image/jpeg",
  transcript: null,
  analysis: null,
  trace: null,
  error: null,
  errorCode: null,
  canUseFallback: false,
  foodCategory: "cold_prepared_food",
  temperatureState: "refrigerated",
  packagingState: "sealed",
  quantity: 1,
  donorZipCode: "95060",
  pickupBy: getDefaultPickup(),
  donorNotes: "",
  confirmations: { ...DEFAULT_CONFIRMATIONS },
  matchResults: [],
  donationId: null,
  publicId: null,
  offerToken: null,
  convexAvailable: false,
  convexError: null,
  hasAudioAsset: false,
};

function workflowReducer(state: WorkflowState, action: Action): WorkflowState {
  switch (action.type) {
    case "SET_IMAGE":
      return { ...state, imageBase64: action.base64, imageMimeType: action.mimeType, step: "capturing" };

    case "SET_TRANSCRIPT":
      return { ...state, transcript: action.transcript };

    case "START_ANALYSIS":
      return { ...state, step: "analyzing", error: null, errorCode: null };

    case "ANALYSIS_SUCCESS": {
      const a = action.result.analysis;
      return {
        ...state,
        step: "editing",
        analysis: a,
        trace: action.result.trace,
        error: null,
        errorCode: null,
        foodCategory: a.foodItems[0]?.category
          ? mapAnalysisCategory(a.foodItems[0].category)
          : "cold_prepared_food",
        temperatureState: mapAnalysisTemperature(a.temperatureState),
        packagingState: mapAnalysisPackaging(a.packagingState),
        quantity: computeQuantity(a),
        pickupBy: getDefaultPickup(),
      };
    }

    case "ANALYSIS_ERROR":
      return {
        ...state,
        step: "error",
        error: action.error,
        errorCode: action.errorCode,
        canUseFallback: action.canUseFallback,
      };

    case "USE_FALLBACK": {
      const { sampleAnalysis } = require("@/lib/cerebras/fixtures");
      const sample = sampleAnalysis as Analysis;
      return {
        ...state,
        step: "editing",
        analysis: sample,
        trace: {
          model: "fallback",
          timingMs: 0,
          retry: false,
          nativeJsonSchema: false,
        },
        error: null,
        errorCode: null,
        foodCategory: "cold_prepared_food",
        temperatureState: "refrigerated",
        packagingState: "sealed",
        quantity: computeQuantity(sample),
        pickupBy: getDefaultPickup(),
        transcript: null,
      };
    }

    case "UPDATE_EXTRACTION": {
      if (action.field === "foodCategory") {
        return { ...state, foodCategory: action.value as FoodCategory };
      }
      if (action.field === "temperatureState") {
        return { ...state, temperatureState: action.value as TemperatureState };
      }
      if (action.field === "packagingState") {
        return { ...state, packagingState: action.value as PackagingState };
      }
      if (action.field === "quantity") {
        return { ...state, quantity: action.value as number };
      }
      return state;
    }

    case "SET_ZIP_CODE":
      return { ...state, donorZipCode: action.zip };

    case "SET_PICKUP_BY":
      return { ...state, pickupBy: action.date };

    case "SET_DONOR_NOTES":
      return { ...state, donorNotes: action.notes };

    case "SET_CONFIRMATION":
      return {
        ...state,
        confirmations: { ...state.confirmations, [action.key]: action.value },
      };

    case "START_MATCHING": {
      if (isPickupExpired(state.pickupBy)) {
        return { ...state, step: "expired" };
      }
      return { ...state, step: "matching", convexError: null };
    }

    case "MATCH_COMPLETE": {
      return {
        ...state,
        step: action.results.some((r) => r.compatible) ? "results" : "no_match",
        matchResults: action.results,
        donationId: action.donationId,
      };
    }

    case "CONVEX_DONATION_CREATED":
      return { ...state, donationId: action.donationId, publicId: action.publicId, convexError: null };

    case "CONVEX_DONATION_CONFIRMED":
      return { ...state, convexError: null };

    case "CONVEX_OFFER_CREATED":
      return { ...state, offerToken: action.token, convexError: null };

    case "CONVEX_ERROR":
      return { ...state, convexError: action.error };

    case "CONVEX_AVAILABILITY_CHECK":
      return { ...state, convexAvailable: action.available };

    case "SET_HAS_AUDIO_ASSET":
      return { ...state, hasAudioAsset: action.value };

    case "RESET":
      return { ...initialState, convexAvailable: state.convexAvailable };

    case "GO_TO_STEP":
      return { ...state, step: action.step };

    default:
      return state;
  }
}

export function useDonationWorkflow() {
  const [state, dispatch] = useReducer(workflowReducer, initialState);
  const analyzingRef = useRef(false);
  const convexAvailableRef = useRef(isConvexAvailable());

  useEffect(() => {
    const available = isConvexAvailable();
    convexAvailableRef.current = available;
    dispatch({ type: "CONVEX_AVAILABILITY_CHECK", available });
  }, []);

  const setImage = useCallback((base64: string, mimeType: string) => {
    dispatch({ type: "SET_IMAGE", base64, mimeType });
  }, []);

  const setTranscript = useCallback((transcript: string | null) => {
    dispatch({ type: "SET_TRANSCRIPT", transcript });
  }, []);

  const analyzeImage = useCallback(async () => {
    if (!state.imageBase64 || analyzingRef.current) return;
    analyzingRef.current = true;
    dispatch({ type: "START_ANALYSIS" });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: state.imageBase64,
          mimeType: state.imageMimeType,
          transcript: state.transcript || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        dispatch({
          type: "ANALYSIS_ERROR",
          error: err.error || `Server error (${res.status})`,
          errorCode: err.errorCode || `HTTP_${res.status}`,
          canUseFallback: err.canUseFallback ?? true,
        });
        return;
      }

      const result: AnalyzeResult = await res.json();
      if (result.source === "gemma") {
        dispatch({ type: "ANALYSIS_SUCCESS", result });
      } else {
        dispatch({
          type: "ANALYSIS_ERROR",
          error: "Analysis service unavailable",
          errorCode: result.errorCode || "UNAVAILABLE",
          canUseFallback: result.canUseFallback,
        });
      }
    } catch (e) {
      dispatch({
        type: "ANALYSIS_ERROR",
        error: e instanceof Error ? e.message : "Network error",
        errorCode: "NETWORK_ERROR",
        canUseFallback: true,
      });
    } finally {
      analyzingRef.current = false;
    }
  }, [state.imageBase64, state.imageMimeType, state.transcript]);

  const loadFallbackData = useCallback(() => {
    dispatch({ type: "USE_FALLBACK" });
  }, []);

  const updateExtraction = useCallback((field: string, value: string | number) => {
    dispatch({ type: "UPDATE_EXTRACTION", field, value });
  }, []);

  const setZipCode = useCallback((zip: string) => {
    dispatch({ type: "SET_ZIP_CODE", zip });
  }, []);

  const setPickupBy = useCallback((date: string) => {
    dispatch({ type: "SET_PICKUP_BY", date });
  }, []);

  const setDonorNotes = useCallback((notes: string) => {
    dispatch({ type: "SET_DONOR_NOTES", notes });
  }, []);

  const setConfirmation = useCallback((key: keyof Confirmations, value: boolean) => {
    dispatch({ type: "SET_CONFIRMATION", key, value });
  }, []);

  const allConfirmed = useCallback((): boolean => {
    return Object.values(state.confirmations).every(Boolean);
  }, [state.confirmations]);

  const runMatching = useCallback(async (mutations?: ConvexMutations) => {
    dispatch({ type: "START_MATCHING" });

    const donation = buildDonationDraft(state);
    const results = matchDonation(donation, SEED_RECIPIENTS, {
      now: new Date(),
      etaMinutes: 30,
    });

    dispatch({ type: "MATCH_COMPLETE", results, donationId: donation.id });

    if (!convexAvailableRef.current || !mutations) {
      dispatch({ type: "CONVEX_ERROR", error: "Demo mode - donation not saved to server" });
      return;
    }

    try {
      const { donationId, publicId } = await mutations.createDonation({
        foodType: donation.foodCategory.replace(/_/g, " "),
        quantity: donation.quantity,
        unit: "servings",
        pickupBy: donation.pickupBy,
        location: donation.donorZipCode,
        notes: donation.donorNotes,
      });
      dispatch({ type: "CONVEX_DONATION_CREATED", donationId, publicId });

      await mutations.confirmDonation({
        donationId,
        confirmedFields: {
          foodType: donation.foodCategory.replace(/_/g, " "),
          quantity: donation.quantity,
          unit: "servings",
          pickupBy: donation.pickupBy,
          location: donation.donorZipCode,
          notes: donation.donorNotes,
        },
      });
      dispatch({ type: "CONVEX_DONATION_CONFIRMED" });

      const { token } = await mutations.createOffer({ donationId });
      dispatch({ type: "CONVEX_OFFER_CREATED", token });
    } catch {
      dispatch({ type: "CONVEX_ERROR", error: "Unable to complete donation in server" });
    }
  }, [
    state.confirmations,
    state.donorZipCode,
    state.foodCategory,
    state.quantity,
    state.packagingState,
    state.temperatureState,
    state.pickupBy,
    state.donorNotes,
  ]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const goToStep = useCallback((step: WorkflowStep) => {
    dispatch({ type: "GO_TO_STEP", step });
  }, []);

  const setHasAudioAsset = useCallback((value: boolean) => {
    dispatch({ type: "SET_HAS_AUDIO_ASSET", value });
  }, []);

  const hasAudioAsset = state.hasAudioAsset;

  return {
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
  };
}