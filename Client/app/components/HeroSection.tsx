"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import Link from "next/link"
import { ArrowRight, ArrowDown } from "lucide-react"

interface HeroSectionProps {
  onLearnMore: () => void
}

const facts = [
  { value: "3", label: "signals read together" },
  { value: "7", label: "short questions" },
  { value: "SHAP", label: "explanations with every result" },
]

export default function HeroSection({ onLearnMore }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null)
  const [waveMotionEnabled, setWaveMotionEnabled] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateWaveMotion = () => setWaveMotionEnabled(!mediaQuery.matches)

    updateWaveMotion()
    mediaQuery.addEventListener("change", updateWaveMotion)
    return () => mediaQuery.removeEventListener("change", updateWaveMotion)
  }, [])

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } })
      tl.from(".hero-line", { yPercent: 110, duration: 1.2, stagger: 0.09 })
        .from(".hero-underline", { strokeDashoffset: 320, duration: 1.1, ease: "power2.inOut" }, "-=0.6")
        .from(".hero-fade", { y: 16, opacity: 0, duration: 0.9, stagger: 0.08 }, "-=0.9")
        .from(".hero-visual", { y: 40, opacity: 0, rotate: 1.5, duration: 1.3 }, 0.15)
    }, heroRef)
    return () => mm.revert()
  }, [])

  return (
    <section ref={heroRef} className="relative isolate overflow-hidden pb-12 pt-24 sm:pt-28 lg:pb-6 lg:pt-[5.5rem]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[72%] overflow-hidden sm:h-[78%]" aria-hidden="true">
        <svg className="absolute -left-[5%] bottom-0 h-full w-[110%]" viewBox="-120 0 1680 600" preserveAspectRatio="none">
          <g className="hero-wave-back">
            <path d="M-120 194 C40 142 220 142 370 210 S660 276 820 220 S1150 145 1320 208 S1500 260 1560 220 V600 H-120 Z" fill="#A9C2A4" fillOpacity=".20">
              {waveMotionEnabled && (
                <animate
                  attributeName="d"
                  values="M-120 194 C40 142 220 142 370 210 S660 276 820 220 S1150 145 1320 208 S1500 260 1560 220 V600 H-120 Z;M-120 220 C40 264 220 284 370 228 S660 166 820 224 S1150 284 1320 230 S1500 176 1560 216 V600 H-120 Z;M-120 194 C40 152 220 122 370 202 S660 292 820 236 S1150 138 1320 200 S1500 282 1560 224 V600 H-120 Z;M-120 194 C40 142 220 142 370 210 S660 276 820 220 S1150 145 1320 208 S1500 260 1560 220 V600 H-120 Z"
                  keyTimes="0;0.33;0.66;1"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"
                  calcMode="spline"
                  dur="15s"
                  repeatCount="indefinite"
                />
              )}
            </path>
          </g>
          <g className="hero-wave-mid">
            <path d="M-120 310 C40 270 220 278 370 330 S660 380 820 324 S1150 270 1320 334 S1500 374 1560 320 V600 H-120 Z" fill="#D9774B" fillOpacity=".09">
              {waveMotionEnabled && (
                <animate
                  attributeName="d"
                  values="M-120 310 C40 270 220 278 370 330 S660 380 820 324 S1150 270 1320 334 S1500 374 1560 320 V600 H-120 Z;M-120 338 C40 372 220 392 370 342 S660 282 820 340 S1150 390 1320 340 S1500 286 1560 336 V600 H-120 Z;M-120 310 C40 286 220 260 370 314 S660 396 820 338 S1150 256 1320 320 S1500 396 1560 312 V600 H-120 Z;M-120 310 C40 270 220 278 370 330 S660 380 820 324 S1150 270 1320 334 S1500 374 1560 320 V600 H-120 Z"
                  keyTimes="0;0.33;0.66;1"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"
                  calcMode="spline"
                  dur="19s"
                  begin="-6s"
                  repeatCount="indefinite"
                />
              )}
            </path>
          </g>
          <g className="hero-wave-line hero-wave-line-ochre">
            <path d="M-120 383 C60 343 210 346 370 390 S660 430 820 384 S1150 330 1320 378 S1500 412 1560 370" fill="none" stroke="#D9A63E" strokeOpacity=".48" strokeWidth="3">
              {waveMotionEnabled && (
                <animate
                  attributeName="d"
                  values="M-120 383 C60 343 210 346 370 390 S660 430 820 384 S1150 330 1320 378 S1500 412 1560 370;M-120 405 C60 422 210 420 370 374 S660 342 820 396 S1150 438 1320 390 S1500 350 1560 402;M-120 383 C60 350 210 332 370 380 S660 442 820 400 S1150 322 1320 370 S1500 430 1560 380;M-120 383 C60 343 210 346 370 390 S660 430 820 384 S1150 330 1320 378 S1500 412 1560 370"
                  keyTimes="0;0.33;0.66;1"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"
                  calcMode="spline"
                  dur="13s"
                  begin="-3s"
                  repeatCount="indefinite"
                />
              )}
            </path>
          </g>
          <g className="hero-wave-line hero-wave-line-pine">
            <path d="M-120 434 C60 410 220 418 380 450 S670 470 830 426 S1160 386 1330 430 S1500 456 1560 428" fill="none" stroke="#2C5A4B" strokeOpacity=".20" strokeWidth="2">
              {waveMotionEnabled && (
                <animate
                  attributeName="d"
                  values="M-120 434 C60 410 220 418 380 450 S670 470 830 426 S1160 386 1330 430 S1500 456 1560 428;M-120 450 C60 470 220 462 380 426 S670 400 830 448 S1160 478 1330 438 S1500 408 1560 444;M-120 434 C60 402 220 398 380 440 S670 482 830 444 S1160 372 1330 420 S1500 472 1560 432;M-120 434 C60 410 220 418 380 450 S670 470 830 426 S1160 386 1330 430 S1500 456 1560 428"
                  keyTimes="0;0.33;0.66;1"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"
                  calcMode="spline"
                  dur="17s"
                  begin="-9s"
                  repeatCount="indefinite"
                />
              )}
            </path>
          </g>
        </svg>
      </div>
      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-10">
        {/* Copy */}
        <div className="flex flex-col justify-center lg:col-span-7">
          <p className="hero-fade eyebrow mb-6 flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-clay" aria-hidden="true" />
            Multimodal stress check
          </p>

          <h1 className="font-display text-[clamp(3rem,7vw,5.5rem)] font-normal leading-[0.94] tracking-[-0.035em] text-ink">
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="hero-line block">Understand</span>
            </span>
            <span className="block overflow-hidden pb-[0.18em]">
              <span className="hero-line block">your stress,</span>
            </span>
            <span className="block overflow-hidden pb-[0.18em]">
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

          <p className="hero-fade mt-8 max-w-xl text-lg leading-relaxed text-ink/75 sm:text-xl lg:mt-5 lg:text-lg">
            SafeSpace reads three signals: your body, your voice and your own words. Then it explains what it found in
            plain language.
          </p>

          <div className="hero-fade mt-10 flex flex-col gap-3 sm:flex-row sm:items-center lg:mt-6">
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
      <div className="relative z-10 mx-auto mt-10 max-w-7xl px-5 sm:px-8 lg:mt-4 lg:px-10">
        <dl className="hero-fade grid grid-cols-1 border-t border-ink/15 sm:grid-cols-3">
          {facts.map((fact, i) => (
            <div
              key={fact.label}
              className={`grid grid-cols-[9rem_1fr] items-baseline gap-4 py-5 sm:block sm:py-6 lg:py-3 ${i > 0 ? "border-t border-ink/15 sm:border-l sm:border-t-0 sm:pl-6" : ""}`}
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
  const [isBreathing, setIsBreathing] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener("change", updatePreference)
    return () => mediaQuery.removeEventListener("change", updatePreference)
  }, [])

  return (
    <div className="hero-visual relative mx-auto w-full max-w-md lg:max-w-[22rem]">
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
        <span className="absolute left-5 top-[73%] font-mono text-[0.7rem] uppercase tracking-[0.14em] text-clay">Words</span>

        {/* Orb */}
        <div className="absolute left-1/2 top-1/2 flex aspect-square w-[62%] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-sage/30" />
          <div className={`absolute inset-[6%] rounded-full bg-sage/15 ${isBreathing ? "animate-breathe" : "scale-[0.86]"}`} />
          <div className={`absolute inset-[18%] rounded-full bg-sage/25 ${isBreathing ? "animate-breathe" : "scale-[0.86]"}`} style={{ animationDelay: "-0.25s" }} />
          <div className={`absolute inset-[30%] rounded-full bg-sage ${isBreathing ? "animate-breathe" : "scale-[0.86]"}`} style={{ animationDelay: "-0.5s" }} />
          <p className="relative grid place-items-center font-display text-lg italic text-pine-deep sm:text-xl" aria-hidden="true">
            {isBreathing ? (
              <>
                <span className="animate-breathe-in col-start-1 row-start-1">breathe in</span>
                <span className="animate-breathe-out col-start-1 row-start-1">breathe out</span>
              </>
            ) : (
              <span>your pace</span>
            )}
          </p>
        </div>

        <p className="absolute left-6 right-6 top-6 z-10 max-w-[17rem] text-sm leading-snug text-paper/75">
          {isBreathing
            ? prefersReducedMotion
              ? "Breathe in slowly, then breathe out at your own pace."
              : "Follow the circle. In for four, out for four."
            : "A short breathing pause, whenever you want one."}
        </p>

        <button
          type="button"
          aria-pressed={isBreathing}
          onClick={() => setIsBreathing((active) => !active)}
          className="absolute bottom-5 left-6 inline-flex min-h-11 items-center justify-center rounded-full bg-sage px-4 py-2 text-sm font-semibold text-pine-deep transition-colors hover:bg-paper focus-visible:outline-paper"
        >
          {isBreathing ? "Pause guide" : "Start breathing guide"}
        </button>
      </div>

    </div>
  )
}
