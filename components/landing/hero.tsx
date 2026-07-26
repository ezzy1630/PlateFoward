"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const children = copyRef.current?.children;
      if (!children) return;
      gsap.from(children, {
        y: 28,
        opacity: 0,
        duration: 0.75,
        stagger: 0.1,
        ease: "power3.out",
      });
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="relative grid grid-cols-1 overflow-hidden md:min-h-[calc(100dvh-64px)] md:grid-cols-[52fr_48fr]"
    >
      {/* Left: copy block */}
      <div
        ref={copyRef}
        className="z-10 flex flex-col justify-center px-5 pb-12 pt-20 md:px-10 md:pb-20 md:pt-16 lg:px-14"
      >
        <h1 className="max-w-[14ch] font-display text-[2.75rem] font-bold leading-[1.04] tracking-[-0.03em] text-navy sm:text-5xl md:text-[3.25rem] lg:text-6xl">
          Move good food forward.
        </h1>

        <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-fog-600 text-pretty md:mt-6 md:text-[0.9375rem]">
          AI-powered surplus food matching for Santa Cruz County. Connect extra
          meals with food banks and shelters in minutes.
        </p>

        <div className="mt-7 flex items-center gap-4 md:mt-9">
          <Link
            href="/donate"
            className="btn-base min-h-[48px] bg-orange px-7 py-3.5 text-sm font-semibold text-white hover:bg-orange-600 active:scale-[0.98] md:min-h-[52px] md:px-8 md:py-4 md:text-[0.9375rem]"
          >
            Start a donation
            <ArrowRight size={18} weight="bold" className="md:hidden" />
            <ArrowRight size={20} weight="bold" className="hidden md:block" />
          </Link>
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-fog-600">
            Santa Cruz County
          </span>
        </div>
      </div>

      {/* Right: full-bleed image with diagonal seam */}
      <div className="relative order-first h-[35vh] w-full overflow-hidden md:order-none md:h-full">
        <div className="absolute inset-0 md:[clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)]">
          <Image
            src="/demo/wrapped-sandwiches.png"
            alt="Freshly wrapped sandwiches prepared for donation"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 48vw"
            priority
          />
          {/* Warm gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy/20 via-transparent to-orange/15" />
        </div>
      </div>
    </section>
  );
}
