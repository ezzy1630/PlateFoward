import type { Analysis } from "./schema";

export interface TraceInfo {
  model: string;
  timingMs: number;
  retry: boolean;
  nativeJsonSchema: boolean;
}

export interface SuccessResult {
  source: "gemma";
  analysis: Analysis;
  trace: TraceInfo;
}

export interface ErrorResult {
  source: "error";
  canUseFallback: true;
  errorCode: string;
}

export type AnalyzeResult = SuccessResult | ErrorResult;

export interface AnalyzeImageParams {
  imageBase64: string;
  mimeType?: string;
  transcript?: string;
}
