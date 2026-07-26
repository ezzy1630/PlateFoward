"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LANDING_RECIPIENTS = [
  "Second Harvest Food Bank Santa Cruz County",
  "Grey Bears",
  "St. Francis Soup Kitchen",
] as const;

export function FooterCta() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const cta = sectionRef.current?.querySelector(".cta-block");
      if (!cta) return;
      gsap.from(cta, {
        scrollTrigger: {
          trigger: cta,
          start: "top 82%",
          toggleActions: "play none none none",
        },
        y: 24,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="bg-navy py-20 md:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
        {/* CTA block */}
        <div className="cta-block">
          <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-fog text-balance md:text-4xl">
            Ready to move good food forward?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-fog/65 text-pretty md:text-[0.9375rem]">
            Try the full donation workflow. Photograph food, match with Santa
            Cruz County recipients, and generate an offer token.
          </p>

          <Link
            href="/donate"
            className="btn-base mx-auto mt-8 inline-flex min-h-[52px] bg-orange px-9 py-4 text-[0.9375rem] font-semibold text-white hover:bg-orange-600 active:scale-[0.98]"
          >
            Start a donation
            <ArrowRight size={20} weight="bold" />
          </Link>
        </div>

        {/* Recipients */}
        <div className="mt-14">
          <p className="mb-3 font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.16em] text-fog/35">
            Recipient organizations
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {LANDING_RECIPIENTS.map((name) => (
              <span
                key={name}
                className="inline-flex items-center rounded-full border border-fog/12 px-3 py-1.5 font-mono text-[0.625rem] font-medium text-fog/50"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <footer className="mt-16 border-t border-fog/8 pt-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 text-center md:flex-row md:px-8">
          <span className="font-mono text-[0.625rem] text-fog/45">
            PlateFoward
          </span>
          <span className="font-mono text-[0.625rem] text-fog/45">
            Move good food forward
          </span>
        </div>
      </footer>
    </section>
  );
}
