import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeImage } from "@/lib/cerebras/client";
import { sampleAnalysis } from "@/lib/cerebras/fixtures";
import { AnalysisSchema } from "@/lib/cerebras/schema";

const MOCK_KEY = "sk-test-12345";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubEnv("CEREBRAS_API_KEY", MOCK_KEY);
});

function makeResponse(
  content: unknown,
  overrides?: { status?: number; ok?: boolean },
) {
  const { status = 200, ok = true } = overrides ?? {};
  const body = JSON.stringify({
    choices: [{ message: { content: JSON.stringify(content) } }],
  });
  return new Response(body, {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("analyzeImage", () => {
  it("returns analysis on successful response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(makeResponse(sampleAnalysis));

    const result = await analyzeImage({
      imageBase64: "abcd1234",
      mimeType: "image/jpeg",
    });

    expect(result.source).toBe("gemma");
    if (result.source === "gemma") {
      expect(result.analysis).toEqual(sampleAnalysis);
      expect(result.trace.retry).toBe(false);
      expect(result.trace.nativeJsonSchema).toBe(true);
      expect(result.trace.model).toBe("gemma-4-31b");
      expect(result.trace.timingMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("repairs invalid JSON on retry attempt", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      const content =
        callCount === 1
          ? "not valid json at all"
          : sampleAnalysis;
      return Promise.resolve(makeResponse(content));
    });

    const result = await analyzeImage({
      imageBase64: "abcd1234",
      mimeType: "image/jpeg",
    });

    expect(result.source).toBe("gemma");
    if (result.source === "gemma") {
      expect(result.analysis).toEqual(sampleAnalysis);
      expect(result.trace.retry).toBe(true);
      expect(result.trace.nativeJsonSchema).toBe(false);
    }
    expect(callCount).toBe(2);
  });

  it("repairs schema mismatch on retry attempt", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      const content =
        callCount === 1
          ? { wrong: "shape", items: [] }
          : sampleAnalysis;
      return Promise.resolve(makeResponse(content));
    });

    const result = await analyzeImage({
      imageBase64: "abcd1234",
      mimeType: "image/jpeg",
    });

    expect(result.source).toBe("gemma");
    if (result.source === "gemma") {
      expect(result.analysis).toEqual(sampleAnalysis);
      expect(result.trace.retry).toBe(true);
    }
    expect(callCount).toBe(2);
  });

  it("returns fallback error when both attempts fail", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response("{}", { status: 500, headers: { "content-type": "application/json" } }),
      );

    const result = await analyzeImage({
      imageBase64: "abcd1234",
      mimeType: "image/jpeg",
    });

    expect(result.source).toBe("error");
    if (result.source === "error") {
      expect(result.canUseFallback).toBe(true);
      expect(result.errorCode).toBe("ANALYSIS_FAILED");
    }
  });

  it("returns error when CEREBRAS_API_KEY is not set", async () => {
    vi.stubEnv("CEREBRAS_API_KEY", undefined);

    const result = await analyzeImage({
      imageBase64: "abcd1234",
      mimeType: "image/jpeg",
    });

    expect(result.source).toBe("error");
    if (result.source === "error") {
      expect(result.canUseFallback).toBe(true);
      expect(result.errorCode).toBe("MISSING_API_KEY");
    }
  });

  it("handles missing content in response gracefully", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: {} }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await analyzeImage({
      imageBase64: "abcd1234",
      mimeType: "image/jpeg",
    });

    expect(result.source).toBe("error");
  });

  it("validates sampleAnalysis against schema", () => {
    const parsed = AnalysisSchema.safeParse(sampleAnalysis);
    expect(parsed.success).toBe(true);
  });
});
