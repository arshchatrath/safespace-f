"use client"

import { Shield, Zap } from "lucide-react"
import Reveal from "./Reveal"

const signals = [
  {
    title: "Physiological signals",
    description:
      "EDA, ECG, temperature and accelerometry, modelled on the WESAD dataset, to pick up autonomic arousal your mind might not notice yet.",
    tag: "CSV upload",
    dot: "bg-sage",
  },
  {
    title: "Self-assessment",
    description:
      "Seven stress items from the DASS-21 questionnaire add your own account of how things feel, which no sensor can measure.",
    tag: "7 questions",
    dot: "bg-pine",
  },
  {
    title: "Voice analysis",
    description:
      "Emotional cues in speech, such as pitch jitter and harmonic patterns, learned from the RAVDESS and IEMOCAP datasets.",
    tag: "Voice recording",
    dot: "bg-clay",
  },
]

const methods = [
  {
    name: "SHAP",
    detail: "SHapley Additive exPlanations, a game-theory method for estimating feature importance.",
  },
  {
    name: "LIME",
    detail: "Local, interpretable explanations of each individual decision.",
  },
  {
    name: "Integrated Gradients",
    detail: "Attribution for the deep-learning parts of the pipeline.",
  },
]

const stats = [
  { value: "73%+", label: "Detection accuracy" },
  { value: "<100ms", label: "Response latency" },
  { value: "3", label: "Modalities integrated" },
]

export default function AboutSection() {
  return (
    <section id="how-it-works" aria-labelledby="about-heading" className="scroll-mt-16">
      {/* Intro */}
      <div className="mx-auto grid max-w-7xl gap-8 bg-sage-soft/35 px-5 py-14 sm:px-8 lg:grid-cols-12 lg:px-10 lg:py-20">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow">(01) What it is</p>
        </Reveal>
        <div className="lg:col-span-8">
          <Reveal>
            <h2 id="about-heading" className="font-display text-[clamp(1.9rem,3.6vw,3.1rem)] leading-[1.12] tracking-[-0.02em] text-ink">
              Stress isn&rsquo;t one number. SafeSpace listens to your{" "}
              <em className="text-pine">body</em>, your <em className="text-pine">voice</em> and your{" "}
              <em className="text-pine">own words</em>, then reads them together for a fuller picture than any one signal can give.
            </h2>
          </Reveal>
          <div className="mt-9 grid gap-6 sm:grid-cols-2">
            <Reveal delay={100} className="flex gap-4">
              <Shield className="mt-1 h-5 w-5 shrink-0 text-pine" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-ink">Privacy first</h3>
                <p className="mt-1 text-muted-foreground">Edge processing keeps your data secure.</p>
              </div>
            </Reveal>
            <Reveal delay={200} className="flex gap-4">
              <Zap className="mt-1 h-5 w-5 shrink-0 text-pine" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-ink">Real-time</h3>
                <p className="mt-1 text-muted-foreground">Stress levels are estimated as soon as your data arrives.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Three signals */}
      <div className="border-y border-ink/10 bg-ochre-soft/25">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-12 lg:px-10 lg:py-20">
          <div className="lg:col-span-4">
            <Reveal className="lg:sticky lg:top-28">
              <p className="eyebrow">(02) How it works</p>
              <h2 className="mt-5 font-display text-4xl leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl">
                Three signals,
                <br />
                <span className="italic text-pine">one reading.</span>
              </h2>
              <p className="mt-5 max-w-sm text-muted-foreground">
                Each signal is scored by its own model. A late-fusion model then weighs them into a single, explained
                result.
              </p>
            </Reveal>
          </div>

          <ol className="lg:col-span-8">
            {signals.map((signal, i) => (
              <Reveal
                as="li"
                key={signal.title}
                delay={i * 80}
                className="group grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 border-t border-ink/15 py-6 last:border-b sm:grid-cols-[4.5rem_1fr_auto] sm:gap-x-6 sm:py-7"
              >
                <span className="font-display text-4xl leading-none text-ink/25 transition-colors duration-500 group-hover:text-pine sm:text-6xl">
                  <span className={i === 0 ? "text-clay" : i === 1 ? "text-pine" : "text-ochre-deep"}>0{i + 1}</span>
                </span>
                <div>
                  <h3 className="flex items-center gap-3 text-xl font-semibold text-ink sm:text-2xl">
                    <span className={`h-2.5 w-2.5 rounded-full ${signal.dot}`} aria-hidden="true" />
                    {signal.title}
                  </h3>
                  <p className="mt-3 max-w-xl leading-relaxed text-ink/70">{signal.description}</p>
                </div>
                <span className="col-start-2 self-start justify-self-start rounded-full border border-ink/15 px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ink/70 sm:col-start-3">
                  {signal.tag}
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>

      {/* Explainability */}
      <div className="bg-clay-soft/20 px-3 py-7 sm:px-5 sm:py-9 lg:px-6 lg:py-10">
        <div className="grain mx-auto max-w-[90rem] overflow-hidden rounded-[2rem] bg-pine-deep text-paper">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-12 lg:px-10 lg:py-18">
            <Reveal className="lg:col-span-5">
              <p className="eyebrow !text-sage">(03) Explainable by design</p>
              <h2 className="mt-5 font-display text-4xl leading-[1.05] tracking-[-0.02em] sm:text-5xl">
                No black box.
                <span className="mt-1 block italic text-sage">Every reading shows its reasons.</span>
              </h2>
              <p className="mt-6 max-w-md leading-relaxed text-paper/75">
                SafeSpace doesn&rsquo;t just apply explainable AI. It compares techniques to find which best fits a
                system using several kinds of data, so you can see which signals moved your result and by how much.
              </p>
            </Reveal>

            <ul className="lg:col-span-6 lg:col-start-7">
              {methods.map((method, i) => (
                <Reveal
                  as="li"
                  key={method.name}
                  delay={i * 90}
                  className="flex flex-col gap-1 border-t border-paper/15 py-6 sm:flex-row sm:items-baseline sm:gap-8"
                >
                  <span className="font-mono text-xs uppercase tracking-[0.14em] text-sage sm:w-44 sm:shrink-0">{method.name}</span>
                  <span className="text-paper/85">{method.detail}</span>
                </Reveal>
              ))}
            </ul>
          </div>

          <div className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 lg:px-10 lg:pb-14">
            <p className="eyebrow mb-4 !text-paper/60">Research impact</p>
            <dl className="grid grid-cols-1 border-t border-paper/15 sm:grid-cols-3">
              {stats.map((stat, i) => (
                <Reveal
                  key={stat.label}
                  delay={i * 100}
                  className={`py-5 sm:py-6 ${i > 0 ? "border-t border-paper/15 sm:border-l sm:border-t-0 sm:pl-8" : ""}`}
                >
                  <dt className="text-sm text-paper/65">{stat.label}</dt>
                  <dd className="mt-2 font-display text-5xl tracking-[-0.03em] sm:text-6xl">{stat.value}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
