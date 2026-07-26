"use client";

import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export const convexClient = convexUrl
  ? new ConvexReactClient(convexUrl)
  : null;

export function isConvexAvailable(): boolean {
  return convexClient !== null;
}

export function getConvexUrl(): string | null {
  return convexUrl ?? null;
}