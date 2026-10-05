"use client"

import { useEffect, useRef, useState } from "react"
import { Check } from "lucide-react"
import type { AnalysisProgress as Progress, AnalysisStage } from "./analysis"

// Each stage owns a slice of the bar, sized roughly by how long it takes on a CPU server.
// The bar only enters a slice when the server reports that stage, so it never runs ahead of the work.
const STEPS: { stage: AnalysisStage; label: string; end: number }[] = [
  { stage: "uploading", label: "Uploading your data", end: 15 },
  { stage: "physiological", label: "Reading body signals", end: 30 },
  { stage: "questionnaire", label: "Scoring your answers", end: 38 },
  { stage: "voice", label: "Listening to your voice", end: 80 },
  { stage: "fusion", label: "Combining the three results", end: 84 },
  { stage: "explanations", label: "Explaining the result", end: 97 },
]

export interface ProgressView {
  value: number
  label: string
  /** index into STEPS of the current step; STEPS.length when done */
  stepIndex: number
}

function stepIndexOf(stage: AnalysisStage) {
  if (stage === "done") return STEPS.length
  if (stage === "queued") return 1
  return STEPS.findIndex((step) => step.stage === stage)
}

/** Turns server progress events into a smoothly moving percentage. */
export function useProgressView(progress: Progress | null): ProgressView | null {
  const [value, setValue] = useState(0)
  const stageStartedAt = useRef(0)
  const stage = progress?.stage
  const uploadFraction = progress?.uploadFraction ?? 0

  useEffect(() => {
    stageStartedAt.current = performance.now()
  }, [stage])

  useEffect(() => {
    if (!stage) {
      setValue(0)
      return
    }
    const index = stepIndexOf(stage)
    const start = index === 0 ? 0 : STEPS[Math.min(index, STEPS.length) - 1].end

    if (stage === "done") {
      setValue(100)
      return
    }
    if (stage === "uploading") {
      // uploadFraction 0 marks a new analysis, so the bar restarts from empty.
      setValue((previous) => (uploadFraction === 0 ? 0 : Math.max(previous, STEPS[0].end * uploadFraction)))
      return
    }
    if (stage === "queued") {
      setValue((previous) => Math.max(previous, start))
      return
    }

    // Within a stage, ease toward 90% of its slice; the next server event moves it on.
    const end = STEPS[index].end
    const tick = () => {
      const elapsed = (performance.now() - stageStartedAt.current) / 1000
      const target = start + (end - start) * 0.9 * (1 - Math.exp(-elapsed / 0.8))
      setValue((previous) => Math.max(previous, target))
    }
    tick()
    const timer = window.setInterval(tick, 100)
    return () => window.clearInterval(timer)
  }, [stage, uploadFraction])

  if (!stage) return null
  const stepIndex = stepIndexOf(stage)
  const label =
    stage === "done"
      ? "Done"
      : stage === "queued"
        ? "Waiting for another analysis to finish"
        : STEPS[stepIndex].label
  return { value: Math.round(value), label, stepIndex }
}

function Bar({ view, tone }: { view: ProgressView; tone: "dark" | "light" }) {
  return (
    <div
      role="progressbar"
      aria-label="Analysis progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={view.value}
      aria-valuetext={`${view.value}% — ${view.label}`}
      className={`h-2 overflow-hidden rounded-full ${tone === "dark" ? "bg-paper/15" : "bg-ink/10"}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ease-out ${tone === "dark" ? "bg-sage" : "bg-pine"}`}
        style={{ width: `${view.value}%` }}
      />
    </div>
  )
}

/** One-line bar for the summary panel next to the Analyze button. */
export function CompactProgress({ view }: { view: ProgressView }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-paper/80">{view.label}…</span>
        <span className="font-mono tabular-nums text-paper/60">{view.value}%</span>
      </div>
      <Bar view={view} tone="dark" />
    </div>
  )
}

/** Bar plus the list of steps, shown in the results area while analysing. */
export function DetailedProgress({ view }: { view: ProgressView }) {
  return (
    <div className="w-full max-w-md text-left">
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-ink">{view.label}…</span>
        <span className="font-mono tabular-nums text-muted-foreground">{view.value}%</span>
      </div>
      <Bar view={view} tone="light" />
      <ol className="mt-5 space-y-2 text-sm">
        {STEPS.map((step, index) => {
          const done = index < view.stepIndex
          const current = index === view.stepIndex
          return (
            <li key={step.stage} className={`flex items-center gap-3 ${done || current ? "text-ink" : "text-ink/40"}`}>
              <span
                aria-hidden="true"
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                  done ? "border-pine bg-pine text-paper" : current ? "border-pine" : "border-ink/20"
                }`}
              >
                {done ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : current ? (
                  <span className="h-2 w-2 rounded-full bg-pine motion-safe:animate-pulse" />
                ) : null}
              </span>
              {step.label}
              <span className="sr-only">{done ? "(done)" : current ? "(in progress)" : "(waiting)"}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
