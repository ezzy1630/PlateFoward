"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Camera,
  Microphone,
  Play,
  Pause,
  Spinner,
  Scan,
  LockSimple,
  ImageSquare,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

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
  const [audioProgress, setAudioProgress] = useState(0);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || audioState !== "playing") return;

    const sync = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setAudioProgress(audio.currentTime / audio.duration);
      }
    };

    audio.addEventListener("timeupdate", sync);
    return () => audio.removeEventListener("timeupdate", sync);
  }, [audioState]);

  const openFilePicker = useCallback(
    (capture: boolean) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      if (capture) input.capture = "environment";
      input.style.position = "fixed";
      input.style.opacity = "0";
      input.style.pointerEvents = "none";
      document.body.appendChild(input);

      input.onchange = () => {
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
    },
    [onImageCapture],
  );

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
    audio.onended = () => {
      setAudioState("idle");
      setAudioProgress(0);
    };
    audio.onerror = () => setAudioState("idle");

    audio.load();
  }, [audioState, transcriptReady, onTranscript]);

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

  const progressLabel = transcriptReady
    ? "0:30 / 0:30"
    : audioState === "playing" || audioState === "paused"
      ? `${Math.floor(audioProgress * 30)
          .toString()
          .padStart(1, "0")}:00 / 0:30`.replace(/^(\d):/, "0:$1:")
      : "0:00 / 0:30";

  return (
    <div className="flex flex-col gap-5">
      <header className="space-y-1.5">
        <h2 className="font-display text-2xl font-bold tracking-tight text-navy text-wrap-balance">
          Create donation
        </h2>
        <p className="text-sm leading-relaxed text-fog-600 text-pretty">
          Share surplus food. We will help it reach someone who needs it.
        </p>
      </header>

      <div className="overflow-hidden rounded-box border border-navy-100 bg-surface shadow-sm">
        <button
          type="button"
          onClick={() => openFilePicker(true)}
          className="relative block aspect-[4/3] w-full overflow-hidden bg-navy-100 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
          aria-label={imagePreview ? "Retake food photo" : "Take a photo of the food"}
        >
          {imagePreview ? (
            <Image
              src={imagePreview}
              alt="Captured food preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-navy-100 to-navy-200/60">
              <Camera size={36} className="text-navy/50" />
              <span className="text-sm font-medium text-navy/70">Tap to photograph food</span>
            </div>
          )}
          <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-navy/80 text-fog shadow-sm backdrop-blur-sm">
            <Camera size={18} weight="bold" />
          </span>
        </button>

        <div className="flex items-center gap-2 border-t border-navy-100 px-3 py-2">
          <button
            type="button"
            onClick={() => openFilePicker(false)}
            className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-navy hover:bg-navy-100"
          >
            Upload
          </button>
          <div className="h-4 w-px bg-navy-100" aria-hidden />
          <button
            type="button"
            onClick={handleSample}
            disabled={loadingSample}
            className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-navy hover:bg-navy-100 disabled:opacity-40"
            aria-label="Load sample image"
          >
            {loadingSample ? (
              <Spinner size={14} className="animate-spin" />
            ) : (
              <ImageSquare size={14} />
            )}
            Sample
          </button>
        </div>
      </div>

      <div className="rounded-box border border-navy-100 bg-surface px-3 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange">
            <Microphone size={18} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-navy">
              {transcriptReady ? "Voice note ready" : "Add a voice note (optional)"}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-100">
                <div
                  className="h-full rounded-full bg-orange transition-[width] duration-150"
                  style={{
                    width: transcriptReady
                      ? "100%"
                      : `${Math.max(audioProgress * 100, audioState === "playing" ? 4 : 0)}%`,
                  }}
                />
              </div>
              <span className="shrink-0 font-mono text-[0.625rem] text-fog-600">
                {progressLabel}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePlaySample}
            disabled={audioState === "loading"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-navy-200 bg-surface text-navy hover:border-orange hover:text-orange disabled:opacity-40"
            aria-label={
              audioState === "playing"
                ? "Pause sample voice note"
                : "Play sample voice note"
            }
          >
            {audioState === "loading" ? (
              <Spinner size={16} className="animate-spin" />
            ) : audioState === "playing" ? (
              <Pause size={16} weight="fill" />
            ) : (
              <Play size={16} weight="fill" />
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-fog-600">
          Demo note loads a sample transcript for analysis.
        </p>
      </div>

      <Button
        onClick={onAnalyze}
        disabled={!hasImage || analyzing}
        loading={analyzing}
        variant="secondary"
        size="lg"
        className="w-full"
      >
        <Scan size={18} weight="bold" />
        {analyzing ? "Analyzing..." : "Analyze donation"}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-fog-600">
        <LockSimple size={12} weight="fill" />
        Your details are private and never shared publicly.
      </p>
    </div>
  );
}
