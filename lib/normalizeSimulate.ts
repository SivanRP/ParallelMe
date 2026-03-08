import type {
  BranchEvent,
  SimulateOption,
  SimulateResponse,
  StoryMilestone,
  TimelinePoint,
} from '@/app/api/simulate/route'

function safeText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function safeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function clampMetric(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function splitDecision(decision: string): { a: string; b: string } {
  const text = decision.trim()
  const separators = [/ vs\.? /i, / versus /i, /\s+or\s+/i, /\s*\/\s*/, /\s*\|\s*/]
  for (const sep of separators) {
    const parts = text.split(sep).map((p) => p.trim()).filter(Boolean)
    if (parts.length >= 2) return { a: parts[0], b: parts.slice(1).join(' or ') }
  }
  return { a: text || 'Path A', b: text ? `Not ${text}` : 'Path B' }
}

function normalizeTimeline(raw: unknown): TimelinePoint[] {
  const rows = Array.isArray(raw) ? raw : []
  const yearTargets = [1, 5, 10]
  const defaults = [
    { income: 45, stress: 55, freedom: 55 },
    { income: 62, stress: 50, freedom: 62 },
    { income: 76, stress: 46, freedom: 68 },
  ]

  return yearTargets.map((year, i) => {
    const point = rows[i] as Partial<TimelinePoint> | undefined
    return {
      year,
      income: clampMetric(safeNumber(point?.income, defaults[i].income)),
      stress: clampMetric(safeNumber(point?.stress, defaults[i].stress)),
      freedom: clampMetric(safeNumber(point?.freedom, defaults[i].freedom)),
      description: safeText(point?.description, `Year ${year}: your life direction sharpens based on this choice.`),
    }
  })
}

function normalizeMilestones(raw: unknown, label: string): StoryMilestone[] {
  const rows = Array.isArray(raw) ? raw : []
  const yearTargets = [1, 5, 10]

  return yearTargets.map((year, i) => {
    const item = rows[i] as Partial<StoryMilestone> | undefined
    return {
      year,
      title: safeText(item?.title, i === 0 ? `Starting ${label}` : i === 1 ? 'Momentum Builds' : 'Decade Outcome'),
      description: safeText(item?.description, `At year ${year}, this path creates concrete tradeoffs in work, relationships, and identity.`),
      memory: safeText(item?.memory, `I still remember how different life felt around year ${year}.`),
      emoji: safeText(item?.emoji, i === 0 ? '🌱' : i === 1 ? '⚡' : '✨'),
      metric: safeText(item?.metric, i === 0 ? 'First key milestone' : i === 1 ? 'Midpoint shift' : '10-year result'),
    }
  })
}

function normalizeBranchEvents(raw: unknown, label: string): BranchEvent[] {
  const rows = Array.isArray(raw) ? raw : []
  const yearTargets = [3, 7]

  return yearTargets.map((year, i) => {
    const item = rows[i] as Partial<BranchEvent> | undefined
    const choiceA = (item?.choiceA ?? {}) as Partial<BranchEvent['choiceA']>
    const choiceB = (item?.choiceB ?? {}) as Partial<BranchEvent['choiceB']>
    return {
      year,
      prompt: safeText(item?.prompt, `A fork appears in year ${year} on the ${label} path.`),
      choiceA: {
        label: safeText(choiceA.label, 'Double down'),
        outcome: safeText(choiceA.outcome, 'You commit harder and accept larger upside and downside swings.'),
      },
      choiceB: {
        label: safeText(choiceB.label, 'Play it safer'),
        outcome: safeText(choiceB.outcome, 'You reduce risk and preserve stability, but may limit long-term upside.'),
      },
    }
  })
}

function normalizeOption(raw: unknown, fallbackLabel: string): SimulateOption {
  const option = (raw ?? {}) as Partial<SimulateOption>
  const label = safeText(option.label, fallbackLabel)
  return {
    label,
    tagline: safeText(option.tagline, `You choose ${label.toLowerCase()}.`),
    milestones: normalizeMilestones(option.milestones, label),
    timeline: normalizeTimeline(option.timeline),
    branchEvents: normalizeBranchEvents(option.branchEvents, label),
  }
}

export function normalizeSimulateResponse(raw: unknown, decisionHint: string): SimulateResponse {
  const input = (raw ?? {}) as Partial<SimulateResponse>
  const decision = safeText(input.decision, decisionHint)
  const split = splitDecision(decision)

  const source =
    input.source === 'groq' || input.source === 'openai' || input.source === 'claude' || input.source === 'mock'
      ? input.source
      : 'mock'

  return {
    decision,
    optionA: normalizeOption(input.optionA, split.a),
    optionB: normalizeOption(input.optionB, split.b),
    source,
    dataInsights: typeof input.dataInsights === 'object' ? input.dataInsights : undefined,
    sourceTrustInsights: typeof input.sourceTrustInsights === 'object' ? input.sourceTrustInsights : undefined,
    _error: typeof input._error === 'string' ? input._error : undefined,
  }
}
