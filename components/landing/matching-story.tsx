"use client";

import { useRef } from "react";
import {
  Brain,
  QrCode,
  ArrowsClockwise,
  MapPin,
} from "@phosphor-icons/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STORY_STEPS = [
  {
    icon: Brain,
    title: "AI identifies the food",
    body: "The donor photographs 30 wrapped sandwiches. The demo AI extracts item names, quantities, temperature state, and packaging condition from the image.",
    accent: "Demo image analysis",
  },
  {
    icon: MapPin,
    title: "Matcher ranks recipients",
    body: "Three demo recipients in Santa Cruz County are scored against the donation. Compatibility depends on category, window, and proximity.",
    accent: "Demo scoring",
  },
  {
    icon: QrCode,
    title: "QR handoff and tracking",
    body: "A demo offer token is generated with a scannable QR code. The recipient accepts or declines within the pickup window.",
    accent: "Demo offer token",
  },
  {
    icon: ArrowsClockwise,
    title: "Decline reroutes the offer",
    body: "If the first recipient cannot accept, the demo offer automatically reroutes to the next best match. The donor is notified and the new recipient receives an updated QR token.",
    accent: "Demo rerouting",
  },
];

export function MatchingStory() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const steps = sectionRef.current?.querySelectorAll(".story-step");
      if (!steps?.length) return;

      steps.forEach((step) => {
        gsap.from(step, {
          scrollTrigger: {
            trigger: step,
            start: "top 88%",
            toggleActions: "play none none none",
          },
          y: 20,
          opacity: 0,
          duration: 0.55,
          ease: "power3.out",
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-fog py-24 md:py-32"
      aria-label="How AI matching and rerouting works"
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.1fr] md:gap-16 lg:gap-20">
          {/* Left column: heading, intro, disclaimer */}
          <div className="flex flex-col">
            <span className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-fog-600">
              The process
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.02em] text-navy text-balance md:text-4xl">
              AI-powered, human-centered
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-fog-600 text-pretty md:text-[0.9375rem]">
              Computer vision identifies the food. A matcher ranks recipients.
              QR codes handle the handoff. Declines trigger automatic rerouting.
            </p>

            <div className="mt-auto hidden pt-10 md:block">
              <span className="inline-block rounded-full border border-navy/10 px-3.5 py-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-fog-600">
                Demo operation - not a live matching service
              </span>
            </div>
          </div>

          {/* Right column: vertical step sequence */}
          <div className="flex flex-col">
            {STORY_STEPS.map((step, i) => {
              const Icon = step.icon;
              const num = String(i + 1).padStart(2, "0");
              return (
                <article
                  key={step.title}
                  className="story-step grid grid-cols-[3rem_1fr] items-start gap-5 md:grid-cols-[3.5rem_1fr] md:gap-6"
                >
                  {/* Step number */}
                  <span className="pt-0.5 font-display text-[2rem] font-bold leading-none tracking-[-0.03em] text-orange md:text-[2.5rem]">
                    {num}
                  </span>

                  {/* Step content */}
                  <div className="min-w-0 pb-8 md:pb-10">
                    <div className="flex items-center gap-3">
                      <Icon size={18} className="text-orange" weight="fill" />
                      <h3 className="font-display text-base font-semibold text-navy md:text-lg">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-fog-600 text-pretty md:text-[0.9375rem]">
                      {step.body}
                    </p>
                    <span className="mt-3 inline-block font-mono text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-orange md:mt-4">
                      {step.accent}
                    </span>
                  </div>

                  {/* Hairline rule between steps */}
                  {i < STORY_STEPS.length - 1 && (
                    <div className="col-span-2 h-px bg-navy-100" />
                  )}
                </article>
              );
            })}

            {/* Mobile disclaimer */}
            <div className="mt-4 md:hidden">
              <span className="inline-block rounded-full border border-navy/10 px-3.5 py-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-fog-600">
                Demo operation - not a live matching service
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
