"use client"

import React from "react"
import Link from "next/link"
import { Activity, Mic, FileText, ArrowUpRight, ArrowDownRight, ArrowRight, Info } from "lucide-react"

interface StressResult {
  success: boolean
  predictions: {
    physio_probs: number[]
    dass21_probs: number[]
    voice_probs: number[] | null
    fusion_probs: number[]
    fusion_pred: number
    prediction_label: string
    confidence: number
  }
  explanations: {
    physiological: {
      available: boolean
      method: string
      feature_importance: Array<{
        feature: string
        importance: number
        abs_importance: number
      }>
      summary: string
    }
    questionnaire: {
      available: boolean
      method: string
      feature_importance: Array<{
        feature: string
        importance: number
        abs_importance: number
        value: number
      }>
      summary: string
    }
    voice: {
      available: boolean
      method: string
      feature_importance: Array<{
        feature: string
        importance: number
        abs_importance: number
        value: number
      }>
      summary: string
    }
    fusion: {
      available: boolean
      method: string
      modality_contributions: Array<{
        modality: string
        probabilities: number[]
        predicted_class: number
        confidence: number
        entropy: number
        contribution_score: number
      }>
      summary: string
    }
  }
  metadata: {
    physio_windows: number
    physio_features: number
    dass21_values: number[]
    voice_provided: boolean
    modalities_used: string[]
  }
}

interface ResultsProps {
  result: StressResult | null
  isLoading: boolean
}

const LEVELS = ["Low", "Medium", "High"] as const
const LEVEL_BAR = ["bg-sage", "bg-ochre", "bg-clay"]

const LEVEL_STYLES: Record<string, { panel: string; accent: string; note: string }> = {
  low: {
    panel: "bg-sage-soft",
    accent: "text-pine",
    note: "Your signals look fairly settled right now. Keep doing what's working.",
  },
  medium: {
    panel: "bg-ochre-soft",
    accent: "text-ochre-deep",
    note: "There are some signs of strain. A short pause, a walk or a few slow breaths can help.",
  },
  high: {
    panel: "bg-clay-soft",
    accent: "text-clay-deep",
    note: "Several signals point to high stress. Be kind to yourself, and consider talking to someone you trust or a professional.",
  },
}

const pct = (value: number | undefined | null) => `${((value ?? 0) * 100).toFixed(1)}%`

const formatFeatureName = (feature: string) => {
  return feature
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace("Dass21", "DASS-21")
}

const Results: React.FC<ResultsProps> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-ink/10 bg-card px-6 py-16 text-center">
        <div className="relative h-20 w-20" aria-hidden="true">
          <div className="animate-breathe absolute inset-0 rounded-full bg-sage/30" />
          <div className="animate-breathe absolute inset-4 rounded-full bg-sage" style={{ animationDelay: "-0.4s" }} />
        </div>
        <h3 className="mt-6 font-display text-2xl text-ink">Analyzing your data</h3>
        <p className="mt-2 max-w-md text-muted-foreground">
          Processing physiological signals, voice patterns and questionnaire responses…
        </p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-3xl border-[1.5px] border-dashed border-ink/15 px-6 py-10 sm:flex-row sm:items-center sm:px-8">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-muted">
          <Activity className="h-5 w-5 text-ink/50" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-semibold text-ink">Ready when you are</h3>
          <p className="mt-1 text-muted-foreground">
            Complete the required steps and press <span className="font-medium text-ink">Analyze stress level</span>. Your
            reading and its explanation will appear here.
          </p>
        </div>
      </div>
    )
  }

  const { predictions, explanations, metadata } = result
  const label = predictions.prediction_label ?? ""
  const levelKey = label.toLowerCase() === "moderate" ? "medium" : label.toLowerCase()
  const style = LEVEL_STYLES[levelKey] ?? {
    panel: "bg-muted",
    accent: "text-ink",
    note: "",
  }
  const dassTotal = metadata.dass21_values.reduce((a, b) => a + b, 0)

  const modalities = [
    {
      name: "Physiological",
      icon: Activity,
      probs: predictions.physio_probs,
      meta: `${metadata.physio_windows} windows analyzed`,
    },
    {
      name: "Questionnaire",
      icon: FileText,
      probs: predictions.dass21_probs,
      meta: `Total score: ${dassTotal}/21`,
    },
    {
      name: "Voice",
      icon: Mic,
      probs: predictions.voice_probs,
      meta: metadata.voice_provided ? "Voice data provided" : "Voice data not provided",
    },
  ]

  const physioFactors = explanations?.physiological
  const questionnaireFactors = explanations?.questionnaire
  const fusion = explanations?.fusion
  const voiceFactors = explanations?.voice

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main reading */}
        <div className={`grain overflow-hidden rounded-3xl p-6 sm:p-8 lg:col-span-5 ${style.panel}`}>
          <p className="eyebrow">Predicted stress level</p>
          <p className={`mt-4 font-display text-[clamp(3.5rem,9vw,6rem)] leading-[0.9] tracking-[-0.04em] ${style.accent}`}>
            {label}
          </p>
          <p className="mt-4 text-ink/70">
            <span className="font-semibold text-ink">{pct(predictions.confidence)}</span> confidence
          </p>

          <div className="mt-8">
            <p className="mb-3 text-sm font-semibold text-ink">Prediction probabilities</p>
            <ProbabilityBar probs={predictions.fusion_probs} large />
            <dl className="mt-3 grid grid-cols-3 gap-2">
              {LEVELS.map((level, index) => (
                <div key={level}>
                  <dt className="flex items-center gap-1.5 text-xs text-ink/60">
                    <span className={`h-2 w-2 rounded-full ${LEVEL_BAR[index]}`} aria-hidden="true" />
                    {level}
                  </dt>
                  <dd className="mt-0.5 font-display text-xl text-ink sm:text-2xl">{pct(predictions.fusion_probs[index])}</dd>
                </div>
              ))}
            </dl>
          </div>

          {style.note && <p className="mt-8 border-t border-ink/10 pt-6 leading-relaxed text-ink/80">{style.note}</p>}
          {(levelKey === "medium" || levelKey === "high") && (
            <Link href="/stressbuster" className="link-draw mt-4 inline-flex items-center gap-2 font-semibold text-ink">
              Take a break with StressBuster
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        {/* By signal */}
        <div className="rounded-3xl border border-ink/10 bg-card p-6 sm:p-8 lg:col-span-7">
          <h3 className="font-display text-2xl text-ink">By signal</h3>
          <p className="mt-1 text-sm text-muted-foreground">How each model read your data before fusion.</p>
          <ul className="mt-6 divide-y divide-ink/10 border-t border-ink/10">
            {modalities.map((modality) => {
              const Icon = modality.icon
              return (
                <li key={modality.name} className="py-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2.5 font-semibold text-ink">
                      <Icon className="h-4 w-4 text-pine" aria-hidden="true" />
                      {modality.name}
                    </span>
                    <span className="text-right text-xs text-muted-foreground">{modality.meta}</span>
                  </div>
                  {modality.probs ? (
                    <>
                      <div className="mt-3">
                        <ProbabilityBar probs={modality.probs} />
                      </div>
                      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                        {LEVELS.map((level, index) => (
                          <div key={level} className="flex gap-1.5">
                            <dt className="text-muted-foreground">{level}</dt>
                            <dd className="font-semibold tabular-nums text-ink">{pct(modality.probs?.[index])}</dd>
                          </div>
                        ))}
                      </dl>
                    </>
                  ) : (
                    <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Info className="h-4 w-4" aria-hidden="true" />
                      Default distribution used
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Explanations */}
      {explanations && (
        <div className="rounded-3xl border border-ink/10 bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-2xl text-ink">Why this result</h3>
            <p className="eyebrow">AI explanations</p>
          </div>

          <div className="mt-6 grid gap-8 md:grid-cols-2 lg:gap-10">
            {fusion?.available && (
              <div>
                <h4 className="font-semibold text-ink">Fusion analysis</h4>
                <p className="mt-2 leading-relaxed text-ink/75">{fusion.summary}</p>
              </div>
            )}

            {physioFactors?.available && physioFactors.feature_importance.length > 0 && (
              <div>
                <h4 className="font-semibold text-ink">Key physiological factors</h4>
                <p className="mt-2 leading-relaxed text-ink/75">{physioFactors.summary}</p>
                <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                  {physioFactors.feature_importance.slice(0, 5).map((feature, index) => {
                    const increases = feature.importance > 0
                    return (
                      <li key={index} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span className="text-ink">{formatFeatureName(feature.feature)}</span>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 text-xs ${increases ? "text-clay-deep" : "text-pine"}`}
                        >
                          {increases ? (
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {increases ? "Increases stress" : "Decreases stress"}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {questionnaireFactors?.available && questionnaireFactors.feature_importance.length > 0 && (
              <div>
                <h4 className="font-semibold text-ink">Questionnaire insights</h4>
                <p className="mt-2 leading-relaxed text-ink/75">{questionnaireFactors.summary}</p>
                <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                  {questionnaireFactors.feature_importance.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="text-ink">{formatFeatureName(feature.feature)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">Score: {feature.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {voiceFactors?.available && voiceFactors.feature_importance.length > 0 && (
              <div>
                <h4 className="font-semibold text-ink">Voice analysis insights</h4>
                <p className="mt-2 leading-relaxed text-ink/75">{voiceFactors.summary}</p>
                <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                  {voiceFactors.feature_importance.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="text-ink">{formatFeatureName(feature.feature)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{pct(feature.value)} probability</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-3xl bg-muted/60 p-6 sm:p-8">
        <h3 className="font-semibold text-ink">Analysis details</h3>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
          <Detail label="Physiological windows" value={metadata.physio_windows} />
          <Detail label="Features extracted" value={metadata.physio_features} />
          <Detail label="Modalities used" value={metadata.modalities_used.filter(Boolean).join(", ")} />
          <Detail label="DASS-21 total score" value={`${dassTotal}/21`} />
          <Detail label="Voice data" value={metadata.voice_provided ? "Provided" : "Not provided"} />
          <Detail label="Analysis time" value={new Date().toLocaleTimeString()} />
        </dl>
      </div>

      <p className="text-sm text-muted-foreground">
        SafeSpace is a research prototype. This reading is an estimate, not a medical diagnosis.
      </p>
    </div>
  )
}

function ProbabilityBar({ probs, large = false }: { probs: number[]; large?: boolean }) {
  return (
    <div className={`flex w-full gap-0.5 overflow-hidden rounded-full bg-ink/10 ${large ? "h-3" : "h-2"}`} aria-hidden="true">
      {LEVELS.map((level, index) => (
        <div
          key={level}
          className={`${LEVEL_BAR[index]} h-full transition-[width] duration-700 ease-soft`}
          style={{ width: `${Math.max(0, (probs?.[index] ?? 0) * 100)}%` }}
        />
      ))}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  )
}

export default Results
