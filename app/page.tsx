import { Hero } from "@/components/landing/hero";
import { PhotoComposition } from "@/components/landing/photo-composition";
import { EvidenceSequence } from "@/components/landing/evidence-sequence";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

const DEMO_RECIPIENTS = [
  "Second Harvest",
  "Grey Bears",
  "Pajaro Valley Loaves & Fishes",
  "Valley Churches United",
  "St. Francis Kitchen",
] as const;

export default function Home() {
  return (
    <main className="min-h-dvh bg-fog">
      <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-orange/[0.06] blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-[360px] w-[360px] rounded-full bg-navy/[0.05] blur-3xl" />
        </div>

        <div className="relative z-10 flex w-full flex-col items-center gap-12 pb-12 pt-16 md:gap-16 md:pb-16 md:pt-24">
          <PhotoComposition />
          <Hero />
        </div>
      </section>

      <EvidenceSequence />

      <section className="bg-navy py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
          <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-orange">
            Demo operation
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.02em] text-fog text-balance md:text-4xl">
            Built for Santa Cruz County
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-fog/70 text-pretty">
            PlateFoward is a demonstration of surplus food matching for coastal
            communities. Not a real food safety, regulatory, compliance, or
            logistics platform.
          </p>

          <div className="mt-8">
            <p className="mb-3 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-fog/45">
              Demo recipient names
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {DEMO_RECIPIENTS.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center rounded-full border border-fog/15 px-3 py-1 font-mono text-[0.625rem] font-medium text-fog/55"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          <Link
            href="/donate"
            className="btn-base mx-auto mt-10 min-h-[48px] bg-orange px-7 py-3.5 text-sm text-white hover:bg-orange-600"
          >
            Start a donation
            <ArrowRight size={18} weight="bold" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-navy-100 bg-fog py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 text-center md:flex-row md:px-8">
          <span className="font-mono text-[0.625rem] text-fog-600">
            PlateFoward Demo
          </span>
          <span className="font-mono text-[0.625rem] text-fog-600">
            Not a real food rescue operation
          </span>
        </div>
      </footer>
    </main>
  );
}
