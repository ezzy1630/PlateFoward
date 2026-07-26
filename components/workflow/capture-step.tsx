"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { Camera, Upload, ImageSquare, Spinner, Play, Pause, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CaptureStepProps {
  onImageCapture: (base64: string, mimeType: string) => void;
  onSampleLoad: () => Promise<{ base64: string; mimeType: string } | null>;
  onAnalyze: () => void;
  onTranscript: (transcript: string) => void;
  hasImage: boolean;
  imagePreview: string | null;
  analyzing: boolean;
  hasAudioAsset: boolean;
}

const SAMPLE_TRANSCRIPT =
  "We have about thirty individually wrapped turkey and vegetarian sandwiches. They have stayed refrigerated and need pickup by six thirty tonight.";

export function CaptureStep({
  onImageCapture,
  onSampleLoad,
  onAnalyze,
  onTranscript,
  hasImage,
  imagePreview,
  analyzing,
  hasAudioAsset: _hasAudioAsset,
}: CaptureStepProps) {
  const [loadingSample, setLoadingSample] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const [transcriptReady, setTranscriptReady] = useState(false);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlaySample = useCallback(() => {
    if (audioState === "playing" && audioRef.current) {
      audioRef.current.pause();
      setAudioState("paused");
      return;
    }

    if (audioState === "paused" && audioRef.current) {
      audioRef.current.play().then(() => setAudioState("playing")).catch(() => setAudioState("idle"));
      return;
    }

    if (!transcriptReady) {
      onTranscript(SAMPLE_TRANSCRIPT);
      setTranscriptReady(true);
    }

    setAudioState("loading");
    const audio = new Audio("/demo/sample-donation.m4a");
    audioRef.current = audio;

    audio.oncanplaythrough = () => {
      audio.play().then(() => setAudioState("playing")).catch(() => setAudioState("idle"));
    };
    audio.onended = () => setAudioState("idle");
    audio.onerror = () => setAudioState("idle");

    audio.load();
  }, [audioState, transcriptReady, onTranscript]);

  const handleCapture = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    document.body.appendChild(input);

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1] || result;
        onImageCapture(base64, file.type || "image/jpeg");
      };
      reader.readAsDataURL(file);
      document.body.removeChild(input);
    };

    input.oncancel = () => {
      document.body.removeChild(input);
    };

    input.click();
  }, [onImageCapture]);

  const handleUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    document.body.appendChild(input);

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1] || result;
        onImageCapture(base64, file.type || "image/jpeg");
      };
      reader.readAsDataURL(file);
      document.body.removeChild(input);
    };

    input.oncancel = () => {
      document.body.removeChild(input);
    };

    input.click();
  }, [onImageCapture]);

  const handleSample = useCallback(async () => {
    setLoadingSample(true);
    try {
      const result = await onSampleLoad();
      if (result) {
        onImageCapture(result.base64, result.mimeType);
      }
    } finally {
      setLoadingSample(false);
    }
  }, [onSampleLoad, onImageCapture]);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <Badge variant="demo">Demo operation</Badge>
        <h2 className="mt-3 font-display text-xl font-bold text-navy">
          Capture your food
        </h2>
        <p className="mt-1 text-sm text-fog-600">
          Take a photo or upload an image of the food you want to donate.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={handleCapture}
          className="flex flex-col items-center justify-center gap-2 rounded-box border-2 border-dashed border-navy-200 bg-surface p-6 transition-colors hover:border-orange hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-orange min-h-[120px]"
          aria-label="Take a photo with camera"
        >
          <Camera size={28} className="text-navy" />
          <span className="text-xs font-medium text-navy">Camera</span>
        </button>

        <button
          onClick={handleUpload}
          className="flex flex-col items-center justify-center gap-2 rounded-box border-2 border-dashed border-navy-200 bg-surface p-6 transition-colors hover:border-orange hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-orange min-h-[120px]"
          aria-label="Upload image from device"
        >
          <Upload size={28} className="text-navy" />
          <span className="text-xs font-medium text-navy">Upload</span>
        </button>

        <button
          onClick={handleSample}
          disabled={loadingSample}
          className="flex flex-col items-center justify-center gap-2 rounded-box border-2 border-dashed border-navy-200 bg-surface p-6 transition-colors hover:border-orange hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-orange min-h-[120px] disabled:opacity-40"
          aria-label="Load sample image"
        >
          {loadingSample ? (
            <Spinner size={28} className="animate-spin text-navy" />
          ) : (
            <ImageSquare size={28} className="text-navy" />
          )}
          <span className="text-xs font-medium text-navy">Sample</span>
        </button>
      </div>

      {imagePreview && (
        <div className="overflow-hidden rounded-box border border-navy-200 bg-surface">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={imagePreview}
              alt="Captured food image preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
              unoptimized
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-fog-600 font-mono">Image captured</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[0.625rem] font-semibold uppercase tracking-wider text-orange bg-orange-100 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-orange" />
              Demo
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlaySample}
            disabled={audioState === "loading"}
            className={`flex items-center gap-2 rounded-box border-2 px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${
              transcriptReady
                ? "border-success bg-success-100 text-success"
                : audioState === "playing" || audioState === "paused"
                  ? "border-orange bg-orange-100 text-orange"
                  : "border-navy-200 bg-surface text-navy hover:border-orange"
            } disabled:opacity-40`}
            aria-label={
              transcriptReady
                ? "Sample transcript loaded. Tap to play or pause audio."
                : audioState === "playing"
                  ? "Pause sample voice note"
                  : audioState === "paused"
                    ? "Resume sample voice note"
                    : "Play sample voice note and load transcript"
            }
          >
            {transcriptReady ? (
              <Check size={18} weight="fill" />
            ) : audioState === "playing" ? (
              <Pause size={18} weight="fill" />
            ) : (
              <Play size={18} weight="fill" />
            )}
            {transcriptReady
              ? "Transcript loaded"
              : audioState === "loading"
                ? "Loading..."
                : audioState === "playing"
                  ? "Playing sample..."
                  : audioState === "paused"
                    ? "Paused"
                    : "Play sample voice note"}
          </button>
          <span className="font-mono text-[0.625rem] text-fog-600">Optional</span>
        </div>
        <p className="text-xs text-fog-600">
          {transcriptReady
            ? "Sample transcript loaded for demo."
            : "Plays a demo audio note and loads a sample transcript."}
        </p>
      </div>

      <Button
        onClick={onAnalyze}
        disabled={!hasImage || analyzing}
        loading={analyzing}
        size="lg"
        className="w-full"
      >
        {analyzing ? "Analyzing..." : "Analyze food"}
      </Button>
    </div>
  );
}
