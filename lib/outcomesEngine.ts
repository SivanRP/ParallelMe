import type { SimulateOption, SimulateResponse, UserProfile } from '@/app/api/simulate/route'
import type { MetricValue, PathTrustMetrics } from '@/lib/sourceTrustLayer'

export interface PathOutcomeScore {
  key: 'A' | 'B'
  label: string
  expectedValueScore: number | null
  expectedValueUsd: number | null
  salaryBand: string | null
  jobDemand: number | null
  burnoutRisk: number | null
  failureOdds: number | null
  migrationCost: number | null
  hasSufficientData: boolean
  metrics: {
    salaryAnnual: MetricValue
    jobDemand: MetricValue
    burnoutRisk: MetricValue
    failureOdds: MetricValue
    migrationCost: MetricValue
  }
}

export interface DecisionScoreboard {
  pathA: PathOutcomeScore
  pathB: PathOutcomeScore
  winner: 'A' | 'B' | 'tie'
  deltaScore: number | null
}

export interface WeekPlanItem {
  day: number
  title: string
  category: 'calls' | 'applications' | 'experiment' | 'budget' | 'review'
  action: string
}

export interface PointOfNoReturnDimension {
  id: 'career' | 'finance' | 'relationship' | 'location'
  label: string
  safeSwitchYear: number
  reason: string
}

export interface PointOfNoReturnResult {
  latestSafeSwitchYear: number
  urgency: 'low' | 'medium' | 'high'
  dimensions: PointOfNoReturnDimension[]
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function scoreToAnnualUsd(score: number, col?: UserProfile['col']): number {
  const base = 23000 + score * 1700
  const mul = col === 'high' ? 1.45 : col === 'medium' ? 1.12 : 0.9
  return Math.round(clamp(base * mul, 22000, 220000))
}

function hasKeyword(text: string, words: string[]): boolean {
  const t = text.toLowerCase()
  return words.some((w) => t.includes(w))
}

function migrationCost(label: string): number {
  const text = label.toLowerCase()
  if (hasKeyword(text, ['move', 'abroad', 'nyc', 'la', 'tokyo', 'london'])) return 12000
  return 2000
}

function failureOdds(label: string): number {
  const text = label.toLowerCase()
  if (hasKeyword(text, ['startup', 'founder', 'freelance', 'band', 'artist', 'musician'])) return 0.58
  if (hasKeyword(text, ['medicine', 'phd', 'doctor', 'lawyer', 'finance'])) return 0.22
  if (hasKeyword(text, ['firefighter', 'police', 'officer', 'teacher', 'nurse'])) return 0.18
  return 0.30
}

function jobDemandFromData(input: SimulateResponse['dataInsights'] | undefined, key: 'A' | 'B'): number {
  const unemployment = input?.liveStats?.unemploymentRate
  let demand = unemployment ? clamp(100 - unemployment * 12, 28, 90) : 62
  const evidence = key === 'A' ? input?.evidenceA ?? [] : input?.evidenceB ?? []
  const joined = evidence.join(' ').toLowerCase()
  if (hasKeyword(joined, ['grow', 'growth', 'demand', 'higher wage', 'up'])) demand += 8
  if (hasKeyword(joined, ['decline', 'risk', 'down', 'volatile'])) demand -= 8
  return clamp(Math.round(demand), 18, 95)
}

function salaryBand(annual: number): string {
  if (annual < 45000) return '$'
  if (annual < 85000) return '$$'
  if (annual < 140000) return '$$$'
  return '$$$$'
}

function fallbackMetric(
  value: number | null,
  unit: string,
  source: string,
  confidence: MetricValue['confidence'],
  note?: string
): MetricValue {
  return {
    value,
    unit,
    source,
    confidence,
    asOf: new Date().toISOString().slice(0, 10),
    note,
  }
}

function trustMetricsForPath(data: SimulateResponse, key: 'A' | 'B'): PathTrustMetrics {
  const trust = key === 'A' ? data.sourceTrustInsights?.pathA : data.sourceTrustInsights?.pathB
  const option = key === 'A' ? data.optionA : data.optionB
  const t = option.timeline

  if (trust) {
    if (trust.salaryAnnual.value === null) {
      const timelineSalary = scoreToAnnualUsd(t[2].income)
      return {
        ...trust,
        salaryAnnual: fallbackMetric(timelineSalary, 'usd_year', 'Model estimate (simulation income trajectory)', 'low'),
      }
    }
    return trust
  }

  const annual = scoreToAnnualUsd(t[2].income)
  const demand = jobDemandFromData(data.dataInsights, key)
  const failOdds = Math.round(failureOdds(option.label) * 100)
  const moveCost = migrationCost(option.label)
  const burnout = clamp(Math.round(((t[0].stress + t[1].stress + t[2].stress) / 3) * 0.9), 0, 100)

  return {
    salaryAnnual: fallbackMetric(annual, 'usd_year', 'Model estimate (no direct live match)', 'low'),
    jobDemand: fallbackMetric(demand, 'score_0_100', 'Derived from labor trend baseline', 'low'),
    burnoutRisk: fallbackMetric(burnout, 'score_0_100', 'Occupational burnout heuristic baseline', 'low'),
    failureOdds: fallbackMetric(failOdds, 'percent', 'General path failure heuristic baseline', 'low'),
    migrationCost: fallbackMetric(moveCost, 'usd_one_time', 'Relocation heuristic baseline', 'low'),
  }
}

function pathScore(
  data: SimulateResponse,
  key: 'A' | 'B',
  profile?: UserProfile
): PathOutcomeScore {
  const option = key === 'A' ? data.optionA : data.optionB
  const t = option.timeline
  const income = (t[0].income + t[1].income + t[2].income) / 3
  const stress = (t[0].stress + t[1].stress + t[2].stress) / 3
  const freedom = (t[0].freedom + t[1].freedom + t[2].freedom) / 3
  const metrics = trustMetricsForPath(data, key)
  const annual = metrics.salaryAnnual.value
  const demand = metrics.jobDemand.value
  const burnoutRisk = metrics.burnoutRisk.value
  const failurePct = metrics.failureOdds.value
  const moveCost = metrics.migrationCost.value

  const annualWithCol = annual !== null
    ? Math.round(annual * (profile?.col === 'high' ? 1.12 : profile?.col === 'low' ? 0.95 : 1))
    : null

  const failFraction = failurePct !== null ? clamp(failurePct / 100, 0, 1) : null
  const evUsd = annualWithCol !== null && failFraction !== null && moveCost !== null
    ? Math.round(annualWithCol * (1 - failFraction * 0.35) - moveCost / 2)
    : null

  const evScore =
    demand !== null && burnoutRisk !== null && failFraction !== null
      ? clamp(
          Math.round(
            income * 0.34 +
            freedom * 0.28 +
            demand * 0.2 -
            stress * 0.22 -
            burnoutRisk * 0.1 -
            failFraction * 25
          ),
          0,
          100
        )
      : null

  return {
    key,
    label: option.label,
    expectedValueScore: evScore,
    expectedValueUsd: evUsd,
    salaryBand: annualWithCol !== null ? salaryBand(annualWithCol) : null,
    jobDemand: demand,
    burnoutRisk,
    failureOdds: failurePct,
    migrationCost: moveCost,
    hasSufficientData: evScore !== null && evUsd !== null,
    metrics,
  }
}

export function computeDecisionScoreboard(data: SimulateResponse, profile?: UserProfile): DecisionScoreboard {
  const pathA = pathScore(data, 'A', profile)
  const pathB = pathScore(data, 'B', profile)
  const a = pathA.expectedValueScore
  const b = pathB.expectedValueScore

  if (a === null && b === null) {
    return { pathA, pathB, winner: 'tie', deltaScore: null }
  }
  if (a !== null && b === null) {
    return { pathA, pathB, winner: 'A', deltaScore: null }
  }
  if (a === null && b !== null) {
    return { pathA, pathB, winner: 'B', deltaScore: null }
  }

  const delta = (a ?? 0) - (b ?? 0)
  return {
    pathA,
    pathB,
    winner: Math.abs(delta) < 3 ? 'tie' : delta > 0 ? 'A' : 'B',
    deltaScore: Math.abs(delta),
  }
}

function inferTrack(option: SimulateOption, decision: string): 'career' | 'education' | 'relocation' | 'founder' | 'general' {
  const t = `${decision} ${option.label}`.toLowerCase()
  if (hasKeyword(t, ['startup', 'founder', 'build', 'business'])) return 'founder'
  if (hasKeyword(t, ['study', 'exam', 'degree', 'school', 'university', 'medicine', 'phd'])) return 'education'
  if (hasKeyword(t, ['move', 'abroad', 'relocate', 'city', 'country'])) return 'relocation'
  if (hasKeyword(t, ['job', 'career', 'work', 'finance', 'engineer', 'doctor', 'teacher'])) return 'career'
  return 'general'
}

function planForPath(option: SimulateOption, decision: string): WeekPlanItem[] {
  const pathLabel = option.label
  const track = inferTrack(option, decision)
  const y1 = option.timeline[0]
  const stressHigh = y1.stress >= 70
  const incomeLow = y1.income <= 45
  const freedomLow = y1.freedom <= 45

  const day3Action =
    track === 'founder'
      ? 'Ship one landing page + one outreach campaign and get 5 real responses.'
      : track === 'education'
      ? 'Book 2 tutoring/study sessions and complete 3 timed practice blocks.'
      : track === 'career'
      ? 'Submit 5 targeted applications and 5 direct referral messages.'
      : track === 'relocation'
      ? 'Build a move checklist: visa docs, housing shortlist, and employer/contact list.'
      : 'Run 3 concrete experiments that create measurable signal by Friday.'

  const day4Action =
    incomeLow || track === 'founder'
      ? 'Build a strict runway model: cash on hand, monthly burn, and a hard stop-loss date.'
      : track === 'relocation'
      ? 'Model one-time move costs + first-90-day budget with buffer.'
      : 'Set a weekly budget and a minimum savings floor before doubling down.'

  const day5Action =
    freedomLow
      ? 'Eliminate one commitment that traps your schedule; reclaim a protected 2-hour block daily.'
      : stressHigh
      ? 'Run a stress test day: cap workload, log triggers, and remove the top stress driver.'
      : 'Complete a 4-hour execution sprint that produces a visible deliverable.'

  return [
    {
      day: 1,
      category: 'review',
      title: 'Define success in writing',
      action: `Write one page: why "${pathLabel}" wins for "${decision}", and what must be true by day 30.`,
    },
    {
      day: 2,
      category: 'calls',
      title: 'Run two reality-check calls',
      action:
        track === 'education'
          ? 'Talk to 2 people who already cleared this path. Ask what they would do in week one.'
          : track === 'founder'
          ? 'Call 2 founders in this space. Ask for one customer shortcut and one fatal mistake to avoid.'
          : `Call 2 people already living "${pathLabel}". Ask for one hard truth and one shortcut.`,
    },
    {
      day: 3,
      category: 'applications',
      title: 'Make three concrete bets',
      action: day3Action,
    },
    {
      day: 4,
      category: 'budget',
      title: 'Build a survival budget',
      action: day4Action,
    },
    {
      day: 5,
      category: 'experiment',
      title: 'Ship a tiny test',
      action: day5Action,
    },
    {
      day: 6,
      category: 'calls',
      title: 'Public commitment checkpoint',
      action: 'Share your chosen path with a mentor/friend and ask them to hold you accountable.',
    },
    {
      day: 7,
      category: 'review',
      title: 'Decide continue / pivot / stop',
      action: 'Score the week (0-10) on energy, results, and risk. Pick next week’s direction.',
    },
  ]
}

export function generateNextWeekPlans(data: SimulateResponse): { planA: WeekPlanItem[]; planB: WeekPlanItem[] } {
  return {
    planA: planForPath(data.optionA, data.decision),
    planB: planForPath(data.optionB, data.decision),
  }
}

export function detectPointOfNoReturn(data: SimulateResponse): PointOfNoReturnResult {
  const decisionText = data.decision.toLowerCase()
  const divergenceIncome = Math.abs(data.optionA.timeline[2].income - data.optionB.timeline[2].income)
  const divergenceFreedom = Math.abs(data.optionA.timeline[2].freedom - data.optionB.timeline[2].freedom)
  const dimensions: PointOfNoReturnDimension[] = [
    {
      id: 'career',
      label: 'Career lock-in',
      safeSwitchYear: clamp(Math.round(6 - divergenceIncome / 20), 2, 7),
      reason: 'Role specialization compounds quickly after repeated promotions and skill-path choices.',
    },
    {
      id: 'finance',
      label: 'Financial lock-in',
      safeSwitchYear: clamp(Math.round(7 - divergenceIncome / 18), 2, 8),
      reason: 'Lifestyle and obligations harden once income trajectory and fixed costs diverge.',
    },
    {
      id: 'relationship',
      label: 'Relationship lock-in',
      safeSwitchYear: hasKeyword(decisionText, ['marry', 'date', 'kids', 'family']) ? 3 : 6,
      reason: 'Major commitments increase switching friction and emotional cost.',
    },
    {
      id: 'location',
      label: 'Location lock-in',
      safeSwitchYear: hasKeyword(decisionText, ['move', 'abroad', 'nyc', 'la', 'tokyo', 'london']) ? 2 : 5,
      reason: 'Housing, social networks, and immigration constraints reduce flexibility over time.',
    },
  ]

  const latest = Math.min(...dimensions.map((d) => d.safeSwitchYear))
  const urgency: PointOfNoReturnResult['urgency'] =
    latest <= 2 ? 'high' : latest <= 4 ? 'medium' : 'low'

  // Slightly increase urgency when lifestyle divergence is extreme
  if (divergenceFreedom > 25 && urgency === 'low') {
    return { latestSafeSwitchYear: latest, urgency: 'medium', dimensions }
  }

  return { latestSafeSwitchYear: latest, urgency, dimensions }
}
