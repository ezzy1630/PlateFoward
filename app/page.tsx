import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { WorkflowShowcase } from "@/components/landing/workflow-showcase";
import { MatchingStory } from "@/components/landing/matching-story";
import { FooterCta } from "@/components/landing/footer-cta";

export default function Home() {
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
