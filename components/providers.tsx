"use client";

import { ReactNode } from "react";
import { ConvexProvider } from "convex/react";
import { convexClient } from "@/lib/convex/client";

export function Providers({ children }: { children: ReactNode }) {
  if (!convexClient) {
    return <>{children}</>;
  }

  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
