"use client"

import React from "react"
import Link from "next/link"
import { Activity, Mic, FileText, ArrowRight, Info } from "lucide-react"

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
      target_class?: string
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
      target_class?: string
      feature_importance: Array<{
        feature: string
        question?: string
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
      attention?: { share_on_recorded_audio: number; peak_times_sec: number[] }
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
        base_weight?: number
        effective_weight?: number
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
    voice_seconds_analysed?: number
    modalities_used: string[]
  }
}

interface ResultsProps {
  result: StressResult | null
  isLoading: boolean
}

const LEVELS = ["Low", "Medium", "High"] as const
const LEVEL_BAR = ["bg-sage", "bg-ochre", "bg-clay"]
const ANSWER_LABELS = ["Never", "Sometimes", "Often", "Almost always"]

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

const SENSOR_LABELS: Record<string, string> = {
  ECG: "Heart signal",
  EDA: "Skin response",
  EMG: "Muscle activity",
  Temp: "Skin temperature",
}

const FEATURE_LABELS: Record<string, string> = {
  mean: "average level",
  std: "variation",
  var: "variation",
  skew: "balance of high and low readings",
  kurtosis: "unusually large or small readings",
  min: "lowest reading",
  max: "highest reading",
  ptp: "range of readings",
  median: "middle reading",
  q25: "lower quarter of readings",
  q75: "upper quarter of readings",
  mean_abs_diff: "average change between readings",
  rms: "overall signal size",
  vlow_power: "very slow pattern strength",
  vlow_rel: "share of very slow patterns",
  low_power: "slow pattern strength",
  low_rel: "share of slow patterns",
  mid_power: "medium-speed pattern strength",
  mid_rel: "share of medium-speed patterns",
  high_power: "fast pattern strength",
  high_rel: "share of fast patterns",
  freq_mean: "average rhythm speed",
  freq_std: "variation in rhythm speed",
  peak_freq: "strongest rhythm speed",
  mean_rr: "average time between heartbeats",
  std_rr: "variation in time between heartbeats",
  rmssd: "change between nearby heartbeats",
  heart_rate: "estimated heartbeats per minute",
}

const MODALITY_LABELS: Record<string, string> = {
  physiological: "Body signals",
  questionnaire: "Your answers",
  voice: "Voice",
}

const pct = (value: number | undefined | null) => `${((value ?? 0) * 100).toFixed(1)}%`

const formatFeatureName = (feature: string) => {
  const [sensor, ...parts] = feature.split("_")
  const sensorLabel = SENSOR_LABELS[sensor] ?? sensor
  const detail = parts.join("_")
  const waveletMatch = detail.match(/^wav_d([1-4])_(mean|std|var|max)$/)

  if (waveletMatch) {
    const speed = ["fastest changes", "fast changes", "slower changes", "slowest changes"][Number(waveletMatch[1]) - 1]
    const measure = waveletMatch[2] === "max" ? "largest size" : waveletMatch[2] === "mean" ? "average level" : "variation"
    return `${sensorLabel}: ${measure} in ${speed}`
  }

  const overallPatternMatch = detail.match(/^wav_a4_(mean|std|var|max)$/)
  if (overallPatternMatch) {
    const measure = overallPatternMatch[1] === "max" ? "largest size" : overallPatternMatch[1] === "mean" ? "average level" : "variation"
    return `${sensorLabel}: ${measure} in the overall pattern`
  }

  return `${sensorLabel}: ${FEATURE_LABELS[detail] ?? detail.replace(/_/g, " ")}`
}

const formatQuestionName = (feature: string) => {
  const questionNumber = feature.match(/Q(\d+)/)?.[1]
  return questionNumber ? `Answer ${questionNumber}` : "Questionnaire answer"
}

const formatAnswer = (value: number) => {
  const label = ANSWER_LABELS[value]
  return label ? `${label} (${value}/3)` : `${value}/3`
}

const formatVoiceFeatureName = (feature: string) => {
  const level = feature.match(/^Voice_(Low|Medium|High)_Stress_Probability$/)?.[1]
  return level ? `${level} stress score` : "Voice score"
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
          Reading your body data, voice and questionnaire answers.
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
  const dassTotal = metadata.dass21_values.reduce((total, value) => total + value, 0)

  const modalities = [
    {
      name: "Body signals",
      icon: Activity,
      probs: predictions.physio_probs,
      meta: `${metadata.physio_windows} time segments checked`,
    },
    {
      name: "Your answers",
      icon: FileText,
      probs: predictions.dass21_probs,
      meta: `Answer total: ${dassTotal}/21`,
    },
    {
      name: "Voice",
      icon: Mic,
      probs: predictions.voice_probs,
      meta: metadata.voice_seconds_analysed ? `${metadata.voice_seconds_analysed.toFixed(1)} s of audio analysed` : "Voice recording",
    },
  ]

  const physioFactors = explanations?.physiological
  const questionnaireFactors = explanations?.questionnaire
  const fusion = explanations?.fusion
  const voiceFactors = explanations?.voice
  const voiceLeader = voiceFactors?.feature_importance[0]

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className={`grain overflow-hidden rounded-3xl p-6 sm:p-8 lg:col-span-5 ${style.panel}`}>
          <p className="eyebrow">Estimated stress level</p>
          <p className={`mt-4 font-display text-[clamp(3.5rem,9vw,6rem)] leading-[0.9] tracking-[-0.04em] ${style.accent}`}>
            {label}
          </p>
          <p className="mt-4 text-ink/70">
            <span className="font-semibold text-ink">{pct(predictions.confidence)}</span> top combined score
          </p>
          <p className="mt-1 text-xs text-ink/55">This is not a measure of how often the model is correct.</p>

          <div className="mt-8">
            <p className="mb-3 text-sm font-semibold text-ink">Scores for each stress level</p>
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
            <Link href="/stress-buster" className="link-draw mt-4 inline-flex items-center gap-2 font-semibold text-ink">
              Take a break with StressBuster
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        <div className="rounded-3xl border border-ink/10 bg-card p-6 sm:p-8 lg:col-span-7">
          <h3 className="font-display text-2xl text-ink">Scores by input</h3>
          <p className="mt-1 text-sm text-muted-foreground">Each input gets its own scores before we combine them.</p>
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
                      Scores unavailable for this input.
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {explanations && (
        <div className="rounded-3xl border border-ink/10 bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-2xl text-ink">Why this result</h3>
            <p className="eyebrow">How it was estimated</p>
          </div>

          <div className="mt-6 grid gap-8 md:grid-cols-2 lg:gap-10">
            {fusion?.available && (
              <div>
                <h4 className="font-semibold text-ink">How we combined the scores</h4>
                <p className="mt-2 leading-relaxed text-ink/75">
                  Body signals start with a weight of 60%, your answers 25% and voice 15%. Each weight is then scaled by how
                  clear that input&rsquo;s top score is. Share of the final estimate:
                </p>
                <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                  {fusion.modality_contributions.map((contribution) => (
                    <li key={contribution.modality} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="text-ink">{MODALITY_LABELS[contribution.modality] ?? contribution.modality}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{pct(contribution.contribution_score)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {physioFactors?.available && physioFactors.feature_importance.length > 0 && (
              <div>
                <h4 className="font-semibold text-ink">Body-signal patterns</h4>
                <p className="mt-2 leading-relaxed text-ink/75">
                  The body-signal model leaned toward {physioFactors.target_class ?? "its estimate"}. These patterns moved
                  it most. They help explain the estimate, but do not prove what caused it.
                </p>
                <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                  {physioFactors.feature_importance.slice(0, 5).map((feature, index) => (
                    <li key={index} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="text-ink">{formatFeatureName(feature.feature)}</span>
                      <Direction value={feature.importance} target={physioFactors.target_class} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {questionnaireFactors?.available && questionnaireFactors.feature_importance.length > 0 && (
              <div>
                <h4 className="font-semibold text-ink">Answers related to this estimate</h4>
                <p className="mt-2 leading-relaxed text-ink/75">
                  Compared with an average respondent, these answers moved the questionnaire model most
                  {questionnaireFactors.target_class ? ` (it leaned toward ${questionnaireFactors.target_class})` : ""}.
                </p>
                <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                  {questionnaireFactors.feature_importance.slice(0, 3).map((feature, index) => (
                    <li key={index} className="py-2.5 text-sm">
                      <span className="block text-ink">{feature.question ?? formatQuestionName(feature.feature)}</span>
                      <span className="mt-0.5 flex justify-between gap-3 text-xs text-muted-foreground">
                        {formatAnswer(feature.value)}
                        <Direction value={feature.importance} target={questionnaireFactors.target_class} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {voiceFactors?.available && voiceFactors.feature_importance.length > 0 && (
              <div>
                <h4 className="font-semibold text-ink">Voice scores</h4>
                <p className="mt-2 leading-relaxed text-ink/75">
                  The highest score was {voiceLeader ? formatVoiceFeatureName(voiceLeader.feature).replace(" stress score", "") : "not available"}. These scores come from sound patterns, not the meaning of your words.
                  {voiceFactors.attention &&
                    ` ${pct(voiceFactors.attention.share_on_recorded_audio)} of the model's attention was on your recording.`}
                </p>
                <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                  {voiceFactors.feature_importance.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="text-ink">{formatVoiceFeatureName(feature.feature)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{pct(feature.value)} score</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-muted/60 p-6 sm:p-8">
        <h3 className="font-semibold text-ink">Analysis details</h3>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
          <Detail label="Body-data segments" value={metadata.physio_windows} />
          <Detail label="Signal summaries per segment" value={metadata.physio_features} />
          <Detail label="Inputs included" value={metadata.modalities_used.filter(Boolean).join(", ")} />
          <Detail label="Questionnaire total" value={`${dassTotal}/21`} />
          <Detail
            label="Voice analysed"
            value={metadata.voice_seconds_analysed ? `${metadata.voice_seconds_analysed.toFixed(1)} s` : "Provided"}
          />
          <Detail label="Analysis time" value={new Date().toLocaleTimeString()} />
        </dl>
      </div>

      <p className="text-sm text-muted-foreground">
        SafeSpace is a research prototype. This reading is an estimate, not a medical diagnosis.
      </p>
    </div>
  )
}

function Direction({ value, target }: { value: number; target?: string }) {
  const toward = value >= 0
  return (
    <span className="shrink-0 text-xs text-muted-foreground">
      {toward ? "↑ toward" : "↓ away from"} {target ?? "estimate"}
    </span>
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
