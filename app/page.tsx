"use client";

import dynamic from "next/dynamic";

// Workaround: motion/react + React 19 can fail during Next.js static page
// collection with `createContext is not a function`. Loading the landing page
// only on the client avoids the SSR/static phase issue while preserving the
// existing landing UI and animations.
const LandingPage = dynamic(
  () => import("@/components/landing/landing-page").then((mod) => mod.LandingPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-dvh items-center justify-center bg-fog">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-fog-300 border-t-orange" />
      </div>
    ),
  },
);

export default function Home() {
  return <LandingPage />;
}
