"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Camera, SealCheck, Truck, MapPin } from "@phosphor-icons/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const steps = [
  {
    icon: Camera,
    label: "Capture",
    description:
      "Photograph your surplus food. AI identifies items, quantity, and condition.",
  },
  {
    icon: SealCheck,
    label: "Confirm",
    description:
      "Verify packaging, timing, and allergen details before anything is offered.",
  },
  {
    icon: MapPin,
    label: "Match",
    description:
      "The matcher ranks demo recipients by category, window, and proximity.",
  },
  {
    icon: Truck,
    label: "Deliver",
    description:
      "Hand off with a demo offer code and follow status through pickup.",
  },
];

export function EvidenceSequence() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const cards = cardsRef.current;
      if (!cards) return;

      const cardElements = Array.from(
        cards.querySelectorAll<HTMLElement>(".evidence-card"),
      );
      if (cardElements.length === 0) return;

      gsap.set(cardElements, { opacity: 0, y: 24, scale: 0.97 });
      gsap.set(cardElements[0], { opacity: 1, y: 0, scale: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: pinRef.current,
          start: "top top",
          end: "+=220%",
          scrub: 0.85,
          anticipatePin: 1,
          pinSpacing: true,
        },
        defaults: { ease: "power2.inOut" },
      });

      cardElements.forEach((card, i) => {
        if (i === 0) return;
        tl.to(
          cardElements[i - 1],
          { opacity: 0.28, y: -12, scale: 0.96, duration: 0.45 },
          "+=0.15",
        ).to(
          card,
          { opacity: 1, y: 0, scale: 1, duration: 0.5 },
          "<",
        );
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-fog py-20 md:py-24"
      aria-labelledby="how-it-works-heading"
    >
      <div ref={pinRef} className="flex min-h-dvh items-center justify-center">
        <div className="w-full max-w-3xl px-4 md:px-8">
          <div className="mb-10 text-center md:mb-14">
            <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-orange">
              How it works
            </span>
            <h2
              id="how-it-works-heading"
              className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-navy text-balance md:text-4xl"
            >
              Surplus to service in four moves
            </h2>
          </div>

          <div ref={cardsRef} className="relative mx-auto min-h-[200px] max-w-xl md:min-h-[220px]">
            {steps.map((step, i) => (
              <article
                key={step.label}
                className="evidence-card absolute inset-x-0 top-0 rounded-box border border-navy-100 bg-surface p-6 shadow-[0_12px_40px_-24px_rgba(26,43,74,0.45)] md:p-8"
                style={{ zIndex: steps.length - i }}
              >
                <div className="flex items-start gap-4 md:gap-5">
                  <div className="-ml-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 ring-4 ring-fog md:-ml-2">
                    <step.icon size={22} className="text-orange" weight="regular" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-mono text-[0.625rem] font-semibold text-fog-600">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-display text-lg font-semibold text-navy md:text-xl">
                        {step.label}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-fog-600 text-pretty md:text-[0.9375rem]">
                      {step.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <noscript>
            <ol className="mx-auto mt-8 max-w-xl space-y-4">
              {steps.map((step, i) => (
                <li
                  key={step.label}
                  className="rounded-box border border-navy-100 bg-surface p-5"
                >
                  <p className="font-display text-base font-semibold text-navy">
                    {String(i + 1).padStart(2, "0")} {step.label}
                  </p>
                  <p className="mt-1 text-sm text-fog-600">{step.description}</p>
                </li>
              ))}
            </ol>
          </noscript>
        </div>
      </div>
    </section>
  );
}
