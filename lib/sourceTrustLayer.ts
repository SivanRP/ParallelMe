import type { DataInsights } from '@/app/api/simulate/route'

export type DecisionDomain =
  | 'career'
  | 'relocation'
  | 'education'
  | 'finance'
  | 'health'
  | 'legal'
  | 'general'

export type MetricConfidence = 'high' | 'medium' | 'low'

export interface MetricValue {
  value: number | null
  unit: string
  source: string
  asOf: string
  confidence: MetricConfidence
  note?: string
}

export interface PathTrustMetrics {
  salaryAnnual: MetricValue
  jobDemand: MetricValue
  burnoutRisk: MetricValue
  failureOdds: MetricValue
  migrationCost: MetricValue
}

export interface SourceTrustInsights {
  domain: DecisionDomain
  strictMode: boolean
  pathA: PathTrustMetrics
  pathB: PathTrustMetrics
  notes: string[]
}

interface BuildArgs {
  decision: string
  optionA: string
  optionB: string
  dataInsights?: DataInsights
}

const today = () => new Date().toISOString().slice(0, 10)

function hasKeyword(text: string, words: string[]): boolean {
  const lower = text.toLowerCase()
  return words.some((w) => lower.includes(w))
}

function domainFromDecision(decision: string): DecisionDomain {
  const t = decision.toLowerCase()
  if (hasKeyword(t, ['rob', 'steal', 'crime', 'illegal', 'fraud', 'drug dealing'])) return 'legal'
  if (hasKeyword(t, ['move', 'abroad', 'relocate', 'city', 'country'])) return 'relocation'
  if (hasKeyword(t, ['study', 'degree', 'phd', 'school', 'university'])) return 'education'
  if (hasKeyword(t, ['invest', 'stock', 'crypto', 'loan', 'debt', 'budget'])) return 'finance'
  if (hasKeyword(t, ['health', 'diet', 'sleep', 'fitness', 'alcohol', 'smoking'])) return 'health'
  if (hasKeyword(t, ['job', 'career', 'startup', 'work', 'founder', 'teacher', 'engineer', 'firefighter', 'police', 'officer', 'paramedic', 'emt', 'nurse', 'doctor', 'dentist', 'pharmacist', 'surgeon', 'therapist', 'psychologist', 'accountant', 'architect', 'pilot', 'chef', 'electrician', 'plumber', 'carpenter', 'mechanic', 'welder', 'detective', 'veterinarian', 'lawyer', 'attorney'])) return 'career'
  return 'general'
}

function metric(
  value: number | null,
  unit: string,
  source: string,
  confidence: MetricConfidence,
  note?: string
): MetricValue {
  return { value, unit, source, confidence, asOf: today(), note }
}

function estimatedDemand(unemploymentRate?: number): number | null {
  if (typeof unemploymentRate !== 'number') return null
  return Math.max(18, Math.min(95, Math.round(100 - unemploymentRate * 12)))
}

export function buildSourceTrustLayer({ decision, optionA, optionB, dataInsights }: BuildArgs): SourceTrustInsights {
  const strictMode = false
  const domain = domainFromDecision(decision)
  const notes: string[] = []

  const path = (label: string, liveWage?: number): PathTrustMetrics => {
    const pathOnly = label.toLowerCase()
    const unemployment = dataInsights?.liveStats?.unemploymentRate
    const demand = estimatedDemand(unemployment)

    const salaryAnnual = liveWage
      ? metric(liveWage, 'usd_year', 'BLS OES occupation median annual wage', 'high')
      : metric(
          null,
          'usd_year',
          'No verified occupation source match',
          'low',
          'Salary estimated from simulation income trajectory.'
        )

    const jobDemand = demand !== null
      ? metric(demand, 'score_0_100', 'BLS CPS unemployment baseline transformed to demand score', 'medium')
      : metric(60, 'score_0_100', 'Fallback demand estimate', 'low')

    const burnoutRisk = metric(
      hasKeyword(pathOnly, ['startup', 'founder', 'finance', 'doctor', 'phd']) ? 72 :
      hasKeyword(pathOnly, ['firefighter', 'paramedic', 'emt', 'nurse', 'police', 'officer']) ? 65 :
      hasKeyword(pathOnly, ['teacher', 'freelance', 'social worker']) ? 58 : 46,
      'score_0_100',
      'Occupational burnout heuristic (feature baseline)',
      'low',
      'Replace with O*NET task-load + schedule intensity adapter for production.'
    )

    const failureOdds = hasKeyword(pathOnly, ['rob', 'crime', 'illegal', 'fraud'])
      ? metric(84, 'percent', 'Legal risk baseline (DOJ/BJS crime outcome heuristic)', 'medium')
      : hasKeyword(pathOnly, ['startup', 'founder', 'freelance', 'artist', 'musician'])
      ? metric(58, 'percent', 'Startup risk baseline', 'low')
      : hasKeyword(pathOnly, ['phd', 'medicine', 'doctor', 'lawyer', 'finance'])
      ? metric(22, 'percent', 'High-credential path baseline', 'low')
      : hasKeyword(pathOnly, ['firefighter', 'police', 'officer', 'teacher', 'nurse'])
      ? metric(18, 'percent', 'Public sector path baseline', 'low')
      : metric(30, 'percent', 'General path failure baseline', 'low')

    const migrationCost = hasKeyword(pathOnly, ['move', 'abroad', 'relocate', 'nyc', 'la', 'tokyo', 'london'])
      ? metric(12000, 'usd_one_time', 'Relocation cost heuristic baseline', 'low')
      : metric(2000, 'usd_one_time', 'Low-mobility transition cost baseline', 'low')

    return { salaryAnnual, jobDemand, burnoutRisk, failureOdds, migrationCost }
  }

  notes.push('Live salary data sourced from BLS OES when occupation mapping exists. Other metrics use simulation trajectory estimates.')
  notes.push('Non-labor domains use conservative heuristics and are clearly labeled.')

  return {
    domain,
    strictMode,
    pathA: path(optionA, dataInsights?.liveStats?.occupationA?.medianAnnualWage),
    pathB: path(optionB, dataInsights?.liveStats?.occupationB?.medianAnnualWage),
    notes,
  }
}

