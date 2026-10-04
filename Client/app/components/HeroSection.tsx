"use client"

import { useLayoutEffect, useRef } from "react"
import { gsap } from "gsap"
import Link from "next/link"
import { ArrowRight, ArrowDown } from "lucide-react"

interface HeroSectionProps {
  onLearnMore: () => void
}

const facts = [
  { value: "3", label: "signals read together" },
  { value: "7", label: "short questions" },
  { value: "SHAP + LIME", label: "explanations you can read" },
]

export default function HeroSection({ onLearnMore }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } })
      tl.from(".hero-line", { yPercent: 110, duration: 1.2, stagger: 0.09 })
        .from(".hero-underline", { strokeDashoffset: 320, duration: 1.1, ease: "power2.inOut" }, "-=0.6")
        .from(".hero-fade", { y: 16, opacity: 0, duration: 0.9, stagger: 0.08 }, "-=0.9")
        .from(".hero-visual", { y: 40, opacity: 0, rotate: 1.5, duration: 1.3 }, 0.15)
        .from(".hero-sticker", { scale: 0, rotate: -40, duration: 0.9, ease: "back.out(2)" }, "-=0.6")
    }, heroRef)
    return () => mm.revert()
  }, [])

  return (
    <section ref={heroRef} className="relative overflow-hidden pb-16 pt-28 sm:pt-32 lg:pb-24 lg:pt-36">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:px-10">
        {/* Copy */}
        <div className="flex flex-col justify-center lg:col-span-7">
          <p className="hero-fade eyebrow mb-6 flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-clay" aria-hidden="true" />
            Multimodal stress check
          </p>

          <h1 className="font-display text-[clamp(3rem,8.4vw,6.6rem)] font-normal leading-[0.94] tracking-[-0.035em] text-ink">
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="hero-line block">Understand</span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="hero-line block">your stress,</span>
            </span>
            <span className="block overflow-hidden pb-[0.12em]">
              <span className="hero-line relative inline-block italic text-pine [font-variation-settings:'SOFT'_100]">
                gently.
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 24"
                  preserveAspectRatio="none"
                  className="absolute -bottom-[0.08em] left-0 h-[0.16em] w-full overflow-visible text-clay"
                >
                  <path
                    className="hero-underline"
                    d="M3 15c48-9 96-11 146-7 46 4 92 6 148-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray="320"
                    strokeDashoffset="0"
                  />
                </svg>
              </span>
            </span>
          </h1>

          <p className="hero-fade mt-8 max-w-xl text-lg leading-relaxed text-ink/75 sm:text-xl">
            SafeSpace reads three signals — your body, your voice and your own words — then explains what it found in
            plain language.
          </p>

          <div className="hero-fade mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/check" className="btn-primary group text-base">
              Start the check
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <button type="button" onClick={onLearnMore} className="btn-ghost group text-base">
              How it works
              <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Breathing visual */}
        <div className="lg:col-span-5">
          <BreathingPanel />
        </div>
      </div>

      {/* Fact strip */}
      <div className="mx-auto mt-16 max-w-7xl px-5 sm:px-8 lg:mt-24 lg:px-10">
        <dl className="hero-fade grid grid-cols-1 border-t border-ink/15 sm:grid-cols-3">
          {facts.map((fact, i) => (
            <div
              key={fact.label}
              className={`grid grid-cols-[9rem_1fr] items-baseline gap-4 py-5 sm:block sm:py-6 ${i > 0 ? "border-t border-ink/15 sm:border-l sm:border-t-0 sm:pl-6" : ""}`}
            >
              <dt className="sr-only">{fact.label}</dt>
              <dd className="whitespace-nowrap font-display text-2xl tracking-tight text-ink sm:text-4xl">{fact.value}</dd>
              <dd className="text-sm text-muted-foreground sm:mt-1">{fact.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function BreathingPanel() {
  return (
    <div className="hero-visual relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="grain relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-pine-deep text-paper">
        {/* Signal lines flowing into the orb */}
        <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
          <g fill="none" strokeWidth="1.5" strokeLinecap="round">
            <path className="animate-signal" stroke="#A9C2A4" d="M-10 120 C 80 120, 110 70, 160 150 S 200 230, 200 250" />
            <path
              className="animate-signal"
              stroke="#F6F1E8"
              strokeOpacity="0.7"
              style={{ animationDelay: "-1s" }}
              d="M-10 250 C 40 230, 60 280, 90 250 S 130 220, 150 250 S 180 270, 200 250"
            />
            <path
              className="animate-signal"
              stroke="#D9774B"
              style={{ animationDelay: "-2s" }}
              d="M-10 390 C 90 400, 120 420, 160 350 S 200 270, 200 250"
            />
          </g>
        </svg>

        <span className="absolute left-5 top-[19%] font-mono text-[0.7rem] uppercase tracking-[0.14em] text-sage">Body</span>
        <span className="absolute left-5 top-[45%] font-mono text-[0.7rem] uppercase tracking-[0.14em] text-paper/70">Voice</span>
        <span className="absolute left-5 top-[72%] font-mono text-[0.7rem] uppercase tracking-[0.14em] text-clay">Words</span>

        {/* Orb */}
        <div className="absolute left-1/2 top-1/2 flex aspect-square w-[62%] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-sage/30" />
          <div className="animate-breathe absolute inset-[6%] rounded-full bg-sage/15" />
          <div className="animate-breathe absolute inset-[18%] rounded-full bg-sage/25" style={{ animationDelay: "-0.25s" }} />
          <div className="animate-breathe absolute inset-[30%] rounded-full bg-sage" style={{ animationDelay: "-0.5s" }} />
          <p className="relative grid place-items-center font-display text-lg italic text-pine-deep sm:text-xl" aria-hidden="true">
            <span className="animate-breathe-in col-start-1 row-start-1">breathe in</span>
            <span className="animate-breathe-out col-start-1 row-start-1">breathe out</span>
          </p>
        </div>

        <p className="absolute bottom-6 left-6 right-6 max-w-[16rem] text-sm leading-snug text-paper/70">
          One slow breath while you&rsquo;re here. In for four, out for four.
        </p>
      </div>

      {/* Sticker */}
      <div className="hero-sticker hover-wiggle absolute -right-2 -top-4 grid h-24 w-24 rotate-[-6deg] place-items-center rounded-full bg-clay text-center text-ink shadow-[0_10px_24px_-12px_rgba(23,35,31,0.6)] sm:-right-5 sm:h-28 sm:w-28">
        <span className="font-display text-[0.95rem] leading-tight sm:text-base">
          No sign-up
          <br />
          <span className="italic">needed</span>
        </span>
      </div>
    </div>
  )
}
