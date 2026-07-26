"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Camera,
  Upload,
  ImageSquare,
  Spinner,
  Play,
  Pause,
  Microphone,
  Stop,
  Trash,
  ArrowCounterClockwise,
  Warning,
  MicrophoneSlash,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { vibrate } from "@/lib/haptics";

interface CaptureStepProps {
  onImageCapture: (base64: string, mimeType: string) => void;
  onSampleLoad: () => Promise<{ base64: string; mimeType: string } | null>;
  onAnalyze: () => void;
  onTranscript: (transcript: string) => void;
  onHasAudioAsset?: (hasAsset: boolean) => void;
  hasImage: boolean;
  imagePreview: string | null;
  analyzing: boolean;
  hasAudioAsset: boolean;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const EASE = [0.22, 1, 0.36, 1] as const;

function openImagePicker(capture: boolean, onFile: (file: File) => void) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  if (capture) input.capture = "environment";
  input.style.position = "fixed";
  input.style.opacity = "0";
  input.style.pointerEvents = "none";
  document.body.appendChild(input);

  const cleanup = () => {
    document.body.removeChild(input);
  };

  input.onchange = () => {
    const file = input.files?.[0];
    if (file) onFile(file);
    cleanup();
  };

  input.oncancel = cleanup;
  input.click();
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || result;
      resolve({ base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function CaptureButton({
  onClick,
  icon: Icon,
  label,
  disabled,
  loading,
  ariaLabel,
}: {
  onClick: () => void;
  icon: typeof Camera;
  label: string;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel: string;
}) {
  const reduce = useReducedMotion();
  const [flash, setFlash] = useState(0);

  const handleClick = () => {
    setFlash((n) => n + 1);
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || loading}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      className="flex flex-col items-center justify-center gap-2 rounded-box border-2 border-dashed border-navy-200 bg-surface p-6 transition-colors hover:border-orange hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-orange min-h-[120px] disabled:opacity-40"
      aria-label={ariaLabel}
    >
      <motion.span
        key={flash}
        initial={reduce || flash === 0 ? false : { backgroundColor: "rgba(255,109,58,0.18)" }}
        animate={{ backgroundColor: "rgba(255,109,58,0)" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex h-12 w-12 items-center justify-center rounded-full"
      >
        {loading ? (
          <Spinner size={28} className="animate-spin text-navy" />
        ) : (
          <Icon size={28} className="text-navy" />
        )}
      </motion.span>
      <span className="text-xs font-medium text-navy">{label}</span>
    </motion.button>
  );
}

function Waveform({ isActive }: { isActive: boolean }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className="flex items-center gap-1">
        {[0.4, 0.7, 1, 0.7, 0.4].map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-error"
            style={{ height: `${h * 16}px`, opacity: isActive ? 1 : 0.35 }}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-error"
          animate={
            isActive
              ? { height: [4, 16, 8, 14, 4], opacity: 1 }
              : { height: 4, opacity: 0.35 }
          }
          transition={{
            duration: 0.7,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: i * 0.07,
          }}
        />
      ))}
    </div>
  );
}

export function CaptureStep({
  onImageCapture,
  onSampleLoad,
  onAnalyze,
  onTranscript: _onTranscript,
  onHasAudioAsset,
  hasImage,
  imagePreview,
  analyzing,
  hasAudioAsset: _hasAudioAsset,
}: CaptureStepProps) {
  const [loadingSample, setLoadingSample] = useState(false);
  const reduce = useReducedMotion();

  const {
    state: recorderState,
    error: recorderError,
    recording,
    isPlaying,
    isSupported,
    isReady,
    hasMicPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    playRecording,
    pausePlayback,
    replaceRecording,
    deleteRecording,
    requestPermission,
    durationMs,
  } = useAudioRecorder();

  const hadRecordingRef = useRef(false);
  useEffect(() => {
    if (recording) {
      hadRecordingRef.current = true;
      onHasAudioAsset?.(true);
    } else if (hadRecordingRef.current) {
      hadRecordingRef.current = false;
      onHasAudioAsset?.(false);
    }
  }, [recording, onHasAudioAsset]);

  const onFile = useCallback(
    async (file: File) => {
      try {
        const { base64, mimeType } = await fileToBase64(file);
        onImageCapture(base64, mimeType);
        vibrate(12);
      } catch {
        // Silently ignore - the picker UI stays as-is.
      }
    },
    [onImageCapture],
  );

  const handleCapture = useCallback(() => {
    vibrate(8);
    openImagePicker(true, onFile);
  }, [onFile]);

  const handleUpload = useCallback(() => {
    vibrate(8);
    openImagePicker(false, onFile);
  }, [onFile]);

  const handleSample = useCallback(async () => {
    vibrate(8);
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

  const renderRecorderControls = () => {
    if (!isReady) {
      return (
        <div className="rounded-box border border-navy-200 bg-surface p-4">
          <div className="flex items-start gap-3">
            <Microphone size={20} className="mt-0.5 text-fog-600" />
            <div>
              <p className="text-sm font-medium text-navy">
                Checking microphone...
              </p>
              <p className="text-xs text-fog-600">
                One moment while we verify your browser supports recording.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!isSupported) {
      return (
        <div className="rounded-box border border-navy-200 bg-surface p-4">
          <div className="flex items-start gap-3">
            <MicrophoneSlash size={20} className="mt-0.5 text-fog-600" />
            <div>
              <p className="text-sm font-medium text-navy">
                Microphone not supported
              </p>
              <p className="text-xs text-fog-600">
                Your browser does not support audio recording. You can still
                donate without a voice note.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (recorderState === "error" && recorderError) {
      return (
        <div className="rounded-box border border-error/30 bg-error-100/30 p-4">
          <div className="flex items-start gap-3">
            <Warning size={20} className="mt-0.5 text-error" />
            <div>
              <p className="text-sm font-medium text-navy">
                {recorderError.code === "permission_denied"
                  ? "Microphone access denied"
                  : "Recording error"}
              </p>
              <p className="text-xs text-fog-600">{recorderError.message}</p>
            </div>
          </div>
          <button
            onClick={() => requestPermission()}
            className="mt-3 inline-flex items-center gap-2 rounded-box border border-navy-200 bg-surface px-4 py-2 text-sm font-medium text-navy transition-colors hover:border-orange min-h-[44px]"
          >
            Try again
          </button>
        </div>
      );
    }

    if (recorderState === "recording" || recorderState === "paused") {
      return (
        <div className="rounded-box border border-navy-200 bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-error" />
              </span>
              <Waveform isActive={recorderState === "recording"} />
              <span className="font-mono text-sm text-navy tabular-nums">
                {formatDuration(durationMs)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {recorderState === "recording" ? (
                <button
                  onClick={pauseRecording}
                  className="btn-base min-h-[40px] gap-1 border border-navy-200 bg-surface px-3 text-sm text-navy hover:border-orange"
                  aria-label="Pause recording"
                >
                  <Pause size={16} weight="fill" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="btn-base min-h-[40px] gap-1 border border-navy-200 bg-surface px-3 text-sm text-navy hover:border-orange"
                  aria-label="Resume recording"
                >
                  <Play size={16} weight="fill" />
                  Resume
                </button>
              )}
              <button
                onClick={stopRecording}
                className="btn-base min-h-[40px] gap-1 bg-error px-3 text-sm text-white hover:opacity-90"
                aria-label="Stop recording"
              >
                <Stop size={16} weight="fill" />
                Stop
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (recording && (recorderState === "stopped" || recorderState === "playing")) {
      return (
        <div className="rounded-box border border-navy-200 bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-navy tabular-nums">
              {formatDuration(recording.durationMs)}
            </span>
            <div className="flex items-center gap-2">
              {isPlaying ? (
                <button
                  onClick={pausePlayback}
                  className="btn-base min-h-[40px] gap-1 border border-navy-200 bg-surface px-3 text-sm text-navy hover:border-orange"
                  aria-label="Pause playback"
                >
                  <Pause size={16} weight="fill" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={playRecording}
                  className="btn-base min-h-[40px] gap-1 border border-navy-200 bg-surface px-3 text-sm text-navy hover:border-orange"
                  aria-label="Play recording"
                >
                  <Play size={16} weight="fill" />
                  Play
                </button>
              )}
              <button
                onClick={replaceRecording}
                className="btn-base min-h-[40px] gap-1 border border-navy-200 bg-surface px-3 text-sm text-navy hover:border-orange"
                aria-label="Replace recording"
              >
                <ArrowCounterClockwise size={16} />
                Replace
              </button>
              <button
                onClick={deleteRecording}
                className="btn-base min-h-[40px] gap-1 border border-error/30 bg-error-100 px-3 text-sm text-error hover:bg-error-100/70"
                aria-label="Delete recording"
              >
                <Trash size={16} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 rounded-box border border-navy-200 bg-surface p-4">
        <button
          onClick={() => {
            vibrate(8);
            startRecording();
          }}
          className="btn-base min-h-[48px] w-full gap-2 border-2 border-dashed border-navy-200 bg-surface text-navy hover:border-orange hover:bg-orange-100"
          aria-label="Record a voice note"
        >
          <Microphone size={20} weight="fill" />
          Record voice note
        </button>
        {!hasMicPermission && (
          <p className="text-xs text-fog-600">
            Tap above to request microphone access. Voice notes stay on your
            device and are not sent to any server.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-navy">
          Capture your food
        </h2>
        <p className="mt-1 text-sm text-fog-600">
          Take a photo or upload an image of the food you want to donate.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <CaptureButton
          onClick={handleCapture}
          icon={Camera}
          label="Camera"
          ariaLabel="Take a photo with camera"
        />

        <CaptureButton
          onClick={handleUpload}
          icon={Upload}
          label="Upload"
          ariaLabel="Upload image from device"
        />

        <CaptureButton
          onClick={handleSample}
          icon={ImageSquare}
          label="Sample"
          disabled={false}
          loading={loadingSample}
          ariaLabel="Load sample image"
        />
      </div>

      <AnimatePresence>
        {imagePreview && (
          <motion.div
            key="preview"
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden rounded-box border border-navy-200 bg-surface"
          >
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3 rounded-box border border-navy-200 bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm font-semibold text-navy">
            Voice note (optional)
          </span>
          <span className="font-mono text-[0.625rem] text-fog-600 uppercase tracking-wider">
            Local only
          </span>
        </div>

        {renderRecorderControls()}
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
