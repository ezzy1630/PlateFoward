"use client";

import { useCallback, useRef, useState } from "react";

export interface ImageCaptureResult {
  base64: string;
  mimeType: string;
}

export function useImageCapture() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [capturing, setCapturing] = useState(false);

  const fileToBase64 = useCallback((file: File): Promise<ImageCaptureResult> => {
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
  }, []);

  const captureFromFile = useCallback(
    async (file: File): Promise<ImageCaptureResult> => {
      setCapturing(true);
      try {
        return await fileToBase64(file);
      } finally {
        setCapturing(false);
      }
    },
    [fileToBase64],
  );

  const openFilePicker = useCallback((): Promise<ImageCaptureResult | null> => {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.style.position = "fixed";
      input.style.opacity = "0";
      input.style.pointerEvents = "none";
      document.body.appendChild(input);

      const cleanup = () => {
        document.body.removeChild(input);
      };

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          cleanup();
          resolve(null);
          return;
        }
        try {
          const result = await captureFromFile(file);
          resolve(result);
        } catch {
          resolve(null);
        }
        cleanup();
      };

      input.oncancel = () => {
        cleanup();
        resolve(null);
      };

      input.click();
    });
  }, [captureFromFile]);

  const loadSampleImage = useCallback(async (): Promise<ImageCaptureResult> => {
    const res = await fetch("/demo/wrapped-sandwiches.png");
    const blob = await res.blob();
    return fileToBase64(new File([blob], "sample.png", { type: "image/png" }));
  }, [fileToBase64]);

  return {
    inputRef,
    capturing,
    captureFromFile,
    openFilePicker,
    loadSampleImage,
  };
}
