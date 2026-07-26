"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";

gsap.registerPlugin(useGSAP);

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(eyebrowRef.current, {
        y: 16,
        opacity: 0,
        duration: 0.7,
      })
        .from(
          headlineRef.current,
          {
            y: 36,
            opacity: 0,
            duration: 0.95,
          },
          "-=0.35",
        )
        .from(
          ctaRef.current,
          {
            y: 18,
            opacity: 0,
            duration: 0.6,
          },
          "-=0.35",
        );
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="relative z-10 flex w-full flex-col items-center justify-center overflow-hidden px-4 py-16 md:py-20"
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src="/demo/wrapped-sandwiches.png"
          alt=""
          fill
          className="object-cover object-center opacity-[0.22]"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-fog/75 via-fog/55 to-fog/90" />
      </div>

      <p
        ref={eyebrowRef}
        className="mb-5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-orange"
      >
        Coastal food rescue
      </p>

      <h1
        ref={headlineRef}
        className="max-w-[14ch] text-center font-display text-[2.75rem] font-bold leading-[1.02] tracking-[-0.03em] text-navy text-balance sm:text-5xl md:text-6xl lg:text-7xl"
      >
        Move good food forward.
      </h1>

      <div
        ref={ctaRef}
        className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:gap-5"
      >
        <Link
          href="/donate"
          className="btn-base min-h-[52px] min-w-[180px] bg-orange px-8 py-4 text-base text-white hover:bg-orange-600 active:bg-orange-600"
        >
          Start a donation
          <ArrowRight size={20} weight="bold" />
        </Link>
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-fog-600">
          Demo only
        </span>
      </div>
    </div>
  );
}
