"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import DinosaurGame from "../components/DinosaurGame"
import MemoryGame from "../components/MemoryGame"

const games = {
  dinosaur: {
    emoji: "🦕",
    title: "Dinosaur Jump",
    subtitle: "Classic endless runner",
    playIntro: "Help the dinosaur jump over obstacles and beat your high score!",
    description:
      "Help our friendly dinosaur jump over obstacles. Perfect for quick stress relief and sharpening your reaction time.",
    traits: ["Reflexes", "Focus", "Fun"],
    duration: "2–5 min",
    panel: "bg-sage-soft",
    accent: "bg-pine text-paper",
  },
  memory: {
    emoji: "🧠",
    title: "Memory Challenge",
    subtitle: "Card-matching brain trainer",
    playIntro: "Test your memory skills and improve cognitive function!",
    description:
      "Exercise your brain with a colourful matching game. Improve focus and memory while you unwind.",
    traits: ["Memory", "Logic", "Calm"],
    duration: "3–7 min",
    panel: "bg-ochre-soft",
    accent: "bg-ink text-paper",
  },
} as const

type GameKey = keyof typeof games

const benefits = [
  { title: "Instant relief", text: "Quick 2–5 minute sessions give your mind a reset." },
  { title: "Brain training", text: "Gentle practice for memory, focus and reaction time." },
  { title: "Mood boost", text: "Light, colourful games designed to lift your spirits." },
]

export default function StressBusterPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)

  if (selectedGame === "dinosaur" || selectedGame === "memory") {
    const game = games[selectedGame as GameKey]
    return (
      <main id="main" className="min-h-screen pb-20 pt-24 sm:pt-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <button
            type="button"
            onClick={() => setSelectedGame(null)}
            className="group mb-8 inline-flex min-h-[44px] items-center gap-2 font-medium text-ink/70 transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            Back to games
          </button>

          <div className="mb-10">
            <h1 className="font-display text-4xl tracking-[-0.02em] text-ink sm:text-5xl">
              <span aria-hidden="true">{game.emoji} </span>
              {game.title}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-ink/70">{game.playIntro}</p>
          </div>

          {selectedGame === "dinosaur" ? <DinosaurGame /> : <MemoryGame />}
        </div>
      </main>
    )
  }

  return (
    <main id="main" className="min-h-screen pb-24 pt-28 sm:pt-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <header className="grid gap-6 border-b border-ink/15 pb-12 lg:grid-cols-12 lg:pb-16">
          <p className="eyebrow lg:col-span-4 lg:pt-4">StressBuster · mini games</p>
          <div className="lg:col-span-8">
            <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.035em] text-ink">
              Take a <span className="italic text-pine">little</span> break.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/70">
              A couple of light games to clear your head between tasks, or after a stress check.
            </p>
            <Link href="/check" className="btn-ghost mt-8">
              Take the stress check
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          {(Object.keys(games) as GameKey[]).map((key, i) => {
            const game = games[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedGame(key)}
                className={`group relative flex flex-col overflow-hidden rounded-[2rem] p-6 text-left transition-transform duration-500 ease-soft motion-safe:hover:-translate-y-1 sm:p-10 ${game.panel} ${
                  i === 0 ? "lg:col-span-7" : "lg:col-span-5"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink/60">{game.subtitle}</span>
                  <span className="font-mono text-xs text-ink/60">{game.duration}</span>
                </div>
                <span
                  className="mt-10 block text-6xl transition-transform duration-500 ease-soft motion-safe:group-hover:-rotate-6 motion-safe:group-hover:scale-110 sm:text-7xl"
                  aria-hidden="true"
                >
                  {game.emoji}
                </span>
                <h2 className="mt-6 font-display text-3xl tracking-[-0.02em] text-ink sm:text-4xl">{game.title}</h2>
                <p className="mt-3 max-w-md leading-relaxed text-ink/75">{game.description}</p>
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                  <ul className="flex flex-wrap gap-2">
                    {game.traits.map((trait) => (
                      <li key={trait} className="rounded-full border border-ink/15 px-3 py-1 text-xs text-ink/70">
                        {trait}
                      </li>
                    ))}
                  </ul>
                  <span className={`btn !min-h-[40px] !py-2 text-sm ${game.accent}`}>
                    Play now
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <section aria-labelledby="why-heading" className="mt-20 grid gap-8 lg:grid-cols-12">
          <h2 id="why-heading" className="font-display text-3xl tracking-[-0.02em] text-ink lg:col-span-4">
            Why play?
          </h2>
          <ul className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
            {benefits.map((benefit, i) => (
              <li key={benefit.title} className="border-t border-ink/15 pt-5">
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                <h3 className="mt-2 font-semibold text-ink">{benefit.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{benefit.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-12 max-w-2xl text-xs text-muted-foreground">
          Research shows that short gaming breaks can reduce cortisol levels, improve mood, and enhance productivity when
          returning to work tasks.
        </p>
      </div>
    </main>
  )
}
