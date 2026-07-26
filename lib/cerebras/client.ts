import { AnalysisSchema, type Analysis } from "./schema";
import type { AnalyzeImageParams, AnalyzeResult } from "./types";

const CEREBRAS_ENDPOINT = "https://api.cerebras.ai/v1/chat/completions";
const MODEL = "gemma-4-31b";
const TIMEOUT_MS = 5_000;
const REPAIR_DELAY_MS = 2_000;

const JSON_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "food_analysis",
    strict: true,
    schema: {
      type: "object",
      properties: {
        foodItems: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              category: { type: "string" },
              estimatedQuantity: { type: "number" },
              confidence: { type: "number" },
            },
            required: ["name", "category", "estimatedQuantity", "confidence"],
            additionalProperties: false,
          },
        },
        temperatureState: { type: "string" },
        packagingState: { type: "string" },
        pickupRequired: { type: "boolean" },
        availableUntil: { type: "string" },
        allergens: { type: "array", items: { type: "string" } },
        missingInformation: { type: "array", items: { type: "string" } },
        conciseExplanation: { type: "string" },
      },
      required: [
        "foodItems",
        "temperatureState",
        "packagingState",
        "pickupRequired",
        "availableUntil",
        "allergens",
        "missingInformation",
        "conciseExplanation",
      ],
      additionalProperties: false,
    },
  },
};

function buildMessages(
  imageBase64: string,
  mimeType: string,
  transcript?: string,
): Array<{ role: string; content: unknown }> {
  const content: Array<Record<string, unknown>> = [
    {
      type: "image_url",
      image_url: { url: `data:${mimeType};base64,${imageBase64}` },
    },
  ];
  if (transcript) {
    content.push({ type: "text", text: transcript });
  }
  return [
    {
      role: "system",
      content:
        "You are a food analysis assistant. Analyze the food in the image and return a JSON object with food items, temperature state, packaging state, pickup requirements, availability, allergens, missing information, and a concise explanation.",
    },
    { role: "user", content },
  ];
}

function buildRepairMessages(
  imageBase64: string,
  mimeType: string,
  transcript?: string,
): Array<{ role: string; content: unknown }> {
  const content: Array<Record<string, unknown>> = [
    {
      type: "image_url",
      image_url: { url: `data:${mimeType};base64,${imageBase64}` },
    },
    {
      type: "text",
      text: transcript
        ? `Analyze this food image and return valid JSON. Additional info: ${transcript}`
        : "Analyze this food image and return valid JSON.",
    },
  ];
  return [
    {
      role: "system",
      content:
        "You are a food analysis assistant. Respond with valid JSON only. No markdown, no code fences, no extra text. The JSON must match: { foodItems: [{ name, category, estimatedQuantity, confidence }], temperatureState, packagingState, pickupRequired, availableUntil, allergens: string[], missingInformation: string[], conciseExplanation }.",
    },
    { role: "user", content },
  ];
}

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timeout),
  );
}

async function attemptRequest(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  transcript: string | undefined,
  repair: boolean,
): Promise<Analysis | null> {
  const messages = repair
    ? buildRepairMessages(imageBase64, mimeType, transcript)
    : buildMessages(imageBase64, mimeType, transcript);

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    response_format: repair ? { type: "json_object" } : JSON_SCHEMA,
    max_tokens: 1024,
    temperature: repair ? 0.2 : 0.1,
  };

  let response: Response;
  try {
    response = await fetchWithTimeout(
      CEREBRAS_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      },
      TIMEOUT_MS,
    );
  } catch {
    return null;
  }

  if (!response.ok) return null;

  let data: Record<string, unknown>;
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }

  const choices = data?.choices as Array<Record<string, unknown>> | undefined;
  const msg = choices?.[0]?.message as Record<string, unknown> | undefined;
  const content = msg?.content as string | undefined;

  if (!content) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  const validated = AnalysisSchema.safeParse(parsed);
  return validated.success ? validated.data : null;
}

export async function analyzeImage(
  params: AnalyzeImageParams,
): Promise<AnalyzeResult> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    return { source: "error", canUseFallback: true, errorCode: "MISSING_API_KEY" };
  }

  const mimeType = params.mimeType || "image/jpeg";
  const startTime = Date.now();

  const firstAttempt = new Promise<Analysis | null>((resolve) => {
    attemptRequest(
      params.imageBase64,
      mimeType,
      apiKey,
      params.transcript,
      false,
    ).then(resolve, () => resolve(null));
  });

  const repairTimer = new Promise<{ kind: "timer" }>((resolve) =>
    setTimeout(() => resolve({ kind: "timer" }), REPAIR_DELAY_MS),
  );

  // Race the first attempt against the repair-delay timer.
  const raceResult = await Promise.race([
    firstAttempt.then((r) => ({ kind: "first", value: r })),
    repairTimer,
  ]);

  if (raceResult.kind === "first") {
    if (raceResult.value) {
      return {
        source: "gemma",
        analysis: raceResult.value,
        trace: {
          model: MODEL,
          timingMs: Date.now() - startTime,
          retry: false,
          nativeJsonSchema: true,
        },
      };
    }
    // First attempt finished with no value - fall through to repair.
    return await runRepair(params, mimeType, apiKey, startTime);
  }

  // Timer fired before the first attempt resolved. Run repair in parallel
  // with the still-pending first attempt. Whichever resolves non-null first
  // wins; if both resolve null, surface ANALYSIS_FAILED.
  const repairPromise = attemptRequest(
    params.imageBase64,
    mimeType,
    apiKey,
    params.transcript,
    true,
  ).catch(() => null);

  const [firstVal, repairVal] = await Promise.all([firstAttempt, repairPromise]);

  if (firstVal) {
    return {
      source: "gemma",
      analysis: firstVal,
      trace: {
        model: MODEL,
        timingMs: Date.now() - startTime,
        retry: false,
        nativeJsonSchema: true,
      },
    };
  }

  if (repairVal) {
    return {
      source: "gemma",
      analysis: repairVal,
      trace: {
        model: MODEL,
        timingMs: Date.now() - startTime,
        retry: true,
        nativeJsonSchema: false,
      },
    };
  }

  return { source: "error", canUseFallback: true, errorCode: "ANALYSIS_FAILED" };
}

async function runRepair(
  params: AnalyzeImageParams,
  mimeType: string,
  apiKey: string,
  startTime: number,
): Promise<AnalyzeResult> {
  const repairVal = await attemptRequest(
    params.imageBase64,
    mimeType,
    apiKey,
    params.transcript,
    true,
  ).catch(() => null);

  if (repairVal) {
    return {
      source: "gemma",
      analysis: repairVal,
      trace: {
        model: MODEL,
        timingMs: Date.now() - startTime,
        retry: true,
        nativeJsonSchema: false,
      },
    };
  }

  return { source: "error", canUseFallback: true, errorCode: "ANALYSIS_FAILED" };
}
