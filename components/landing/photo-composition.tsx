"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function PhotoComposition() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const tiles = rootRef.current?.querySelectorAll(".comp-tile");
      if (!tiles?.length) return;
      gsap.from(tiles, {
        y: 28,
        opacity: 0,
        duration: 0.85,
        stagger: 0.08,
        ease: "power3.out",
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-xl px-4 md:max-w-2xl md:px-8">
      <div className="grid grid-cols-5 grid-rows-[minmax(140px,28vw)_minmax(140px,28vw)_minmax(72px,14vw)] gap-2.5 sm:gap-3 md:gap-4">
        <div className="comp-tile relative col-span-3 row-span-2 overflow-hidden rounded-box">
          <Image
            src="/demo/wrapped-sandwiches.png"
            alt="Freshly wrapped sandwiches prepared for donation"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 60vw, 420px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/35 via-transparent to-transparent" />
        </div>

        <div className="comp-tile relative col-span-2 row-span-2 overflow-hidden rounded-box bg-navy-800">
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-3 py-5 text-center sm:px-5">
            <span className="font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.22em] text-orange sm:text-[0.625rem]">
              Santa Cruz County
            </span>
            <span className="mt-2 font-display text-[1.65rem] font-bold leading-[0.95] tracking-[-0.02em] text-fog sm:mt-3 sm:text-3xl md:text-4xl">
              Food
              <br />
              Rescue
            </span>
            <div className="mt-3 h-px w-10 bg-orange/70 sm:mt-4 sm:w-12" />
            <p className="mt-3 font-mono text-[0.625rem] text-fog/70 sm:mt-4">
              Surplus to service
            </p>
          </div>
        </div>

        <div className="comp-tile relative col-span-2 overflow-hidden rounded-box bg-orange-100">
          <div className="flex h-full items-center justify-center gap-1.5 px-2">
            <span className="font-display text-xl font-bold tracking-tight text-orange sm:text-2xl">
              AI
            </span>
            <span className="font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-orange/80 sm:text-[0.625rem]">
              Matching
            </span>
          </div>
        </div>

        <div className="comp-tile relative col-span-3 overflow-hidden rounded-box bg-[#DCE8F2]">
          <div className="flex h-full items-center justify-center px-3">
            <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-navy/70 sm:text-xs">
              Demo tracking
            </span>
          </div>
        </div>
      </div>

      <div className="comp-tile mt-3 flex justify-center sm:mt-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-navy px-3.5 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-orange" aria-hidden />
          <span className="font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-fog sm:text-[0.625rem]">
            Demo operation
          </span>
        </span>
      </div>
    </div>
  );
}
