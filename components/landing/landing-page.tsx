"use client";

import { Nav } from "./nav";
import { Hero } from "./hero";
import { WorkflowShowcase } from "./workflow-showcase";
import { MatchingStory } from "./matching-story";
import { FooterCta } from "./footer-cta";

export function LandingPage() {
  return (
    <main className="min-h-dvh bg-fog">
      <Nav />
      <Hero />
      <WorkflowShowcase />
      <MatchingStory />
      <FooterCta />
    </main>
  );
}
