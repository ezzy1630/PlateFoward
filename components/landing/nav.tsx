"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";

export function Nav() {
  const handleHowItWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById("how-it-works");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className="sticky top-0 z-50 flex h-16 items-center border-b border-navy/8 bg-fog/95 backdrop-blur-sm"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 md:px-8">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-[-0.02em] text-navy"
        >
          PlateFoward
        </Link>

        <div className="flex items-center gap-2.5 md:gap-5">
          <span className="hidden rounded-full border border-navy/15 px-2.5 py-1 font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-fog-600 sm:inline-block">
            Santa Cruz demo
          </span>

          <a
            href="#how-it-works"
            onClick={handleHowItWorks}
            className="hidden font-mono text-[0.6875rem] font-medium text-navy/70 transition-colors hover:text-navy sm:inline md:text-xs"
          >
            How it works
          </a>

          <Link
            href="/donate"
            className="btn-base min-h-[36px] bg-orange px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 active:scale-[0.98] md:min-h-[40px] md:px-5 md:py-2.5 md:text-sm"
          >
            <span className="md:hidden">Donate</span>
            <span className="hidden md:inline">New donation</span>
            <ArrowRight size={14} weight="bold" className="md:hidden" />
            <ArrowRight size={16} weight="bold" className="hidden md:block" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
