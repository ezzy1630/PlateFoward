"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecordingState =
  | "idle"
  | "requesting"
  | "recording"
  | "paused"
  | "stopped"
  | "playing"
  | "error";

export interface AudioRecorderError {
  code: "permission_denied" | "not_supported" | "no_tracks" | "empty_recording" | "unknown";
  message: string;
}

export interface AudioRecording {
  blob: Blob;
  url: string;
  mimeType: string;
  durationMs: number;
}

export interface UseAudioRecorderReturn {
  state: RecordingState;
  error: AudioRecorderError | null;
  recording: AudioRecording | null;
  isPlaying: boolean;
  permissionDenied: boolean;
  isSupported: boolean;
  isReady: boolean;
  hasMicPermission: boolean;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  playRecording: () => void;
  pausePlayback: () => void;
  replaceRecording: () => void;
  deleteRecording: () => void;
  requestPermission: () => Promise<boolean>;
  durationMs: number;
}

function getSupportedMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const types = [
    "audio/webm",
    "audio/webm;codecs=opus",
    "audio/mp4",
    "audio/mp4;codecs=mp4a",
    "audio/ogg",
    "audio/wav",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "audio/webm";
}

function isSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
  return true;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<AudioRecorderError | null>(null);
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [isSupportedState, setIsSupportedState] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopMediaTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseAudioElement = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported()) {
      setError({
        code: "not_supported",
        message: "Your browser does not support microphone recording.",
      });
      setState("error");
      return false;
    }

    try {
      setState("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionDenied(false);
      setHasMicPermission(true);
      setError(null);
      setState("idle");
      return true;
    } catch (err) {
      const isDenied = err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      setPermissionDenied(isDenied);
      setHasMicPermission(false);
      setError({
        code: isDenied ? "permission_denied" : "unknown",
        message: isDenied
          ? "Microphone permission was denied. Please allow access in your browser settings."
          : `Microphone access failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
      setState("error");
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (state === "recording" || state === "requesting") return;
    if (mediaRecorderRef.current || recording) {
      clearRecording();
    }

    setError(null);

    if (!isSupported()) {
      setError({
        code: "not_supported",
        message: "Your browser does not support microphone recording.",
      });
      setState("error");
      return;
    }

    try {
      setState("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionDenied(false);
      setHasMicPermission(true);

      const mimeType = getSupportedMimeType() || "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      mediaStreamRef.current = stream;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstart = () => {
        setState("recording");
        startTimeRef.current = Date.now();
        durationRef.current = 0;
        setDurationMs(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          durationRef.current = Date.now() - startTimeRef.current;
          setDurationMs(durationRef.current);
        }, 100);
      };

      recorder.onstop = () => {
        clearTimer();
        const finalDuration = Date.now() - startTimeRef.current;
        setDurationMs(finalDuration);

        if (chunksRef.current.length === 0) {
          setError({
            code: "empty_recording",
            message: "No audio was captured. Please try again.",
          });
          setState("error");
          stopMediaTracks();
          return;
        }

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecording({ blob, url, mimeType, durationMs: finalDuration });
        setState("stopped");
        stopMediaTracks();
      };

      recorder.onerror = () => {
        clearTimer();
        setError({
          code: "unknown",
          message: "A recording error occurred. Please try again.",
        });
        setState("error");
        stopMediaTracks();
      };

      recorder.start(100);
    } catch (err) {
      const isDenied = err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      setPermissionDenied(isDenied);
      setHasMicPermission(false);
      setError({
        code: isDenied ? "permission_denied" : "unknown",
        message: isDenied
          ? "Microphone permission was denied. Please allow access in your browser settings."
          : `Could not start recording: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
      setState("error");
      stopMediaTracks();
    }
  }, [state, clearTimer, stopMediaTracks]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.pause();
        setState("paused");
        clearTimer();
        durationRef.current = Date.now() - startTimeRef.current;
        setDurationMs(durationRef.current);
      } catch {
        // ignore
      }
    }
  }, [clearTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      try {
        mediaRecorderRef.current.resume();
        setState("recording");
        startTimeRef.current = Date.now() - durationRef.current;
        timerRef.current = setInterval(() => {
          durationRef.current = Date.now() - startTimeRef.current;
          setDurationMs(durationRef.current);
        }, 100);
      } catch {
        // ignore
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const playRecording = useCallback(() => {
    if (!recording) return;
    releaseAudioElement();
    const audio = new Audio(recording.url);
    audioRef.current = audio;
    audio.onplay = () => {
      setIsPlaying(true);
      setState("playing");
    };
    audio.onended = () => {
      setIsPlaying(false);
      setState("stopped");
    };
    audio.onpause = () => {
      setIsPlaying(false);
      setState("stopped");
    };
    audio.onerror = () => {
      setIsPlaying(false);
      setState("stopped");
    };
    audio.play().catch(() => {
      setIsPlaying(false);
      setState("stopped");
    });
  }, [recording, releaseAudioElement]);

  const pausePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  useEffect(() => {
    setIsSupportedState(isSupported());
    setIsReady(true);
  }, []);

  const clearRecording = useCallback(() => {
    releaseAudioElement();
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.onstart = null;
        mediaRecorderRef.current.onerror = null;
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }
    stopMediaTracks();
    if (recording?.url) {
      URL.revokeObjectURL(recording.url);
    }
    setRecording(null);
    setDurationMs(0);
    setError(null);
    setState("idle");
  }, [recording, releaseAudioElement, stopMediaTracks]);

  const replaceRecording = clearRecording;
  const deleteRecording = clearRecording;

  useEffect(() => {
    return () => {
      clearTimer();
      stopMediaTracks();
      releaseAudioElement();
      if (recording?.url) {
        URL.revokeObjectURL(recording.url);
      }
    };
  }, [clearTimer, stopMediaTracks, releaseAudioElement, recording]);

  return {
    state,
    error,
    recording,
    isPlaying,
    permissionDenied,
    isSupported: isSupportedState,
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
  };
}
