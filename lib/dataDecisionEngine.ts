/**
 * Real-World Data Decision Engine
 *
 * 1. Classifies the decision into a category
 * 2. Fetches LIVE data: BLS unemployment rate + BLS OES occupation wages
 * 3. Loads relevant evidence from the curated research dataset
 * 4. Returns calibration modifiers + evidence for the AI prompt
 */

import researchData from '@/data/research_insights.json'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DecisionCategory =
  | 'career'
  | 'study'
  | 'productivity'
  | 'lifestyle'
  | 'finance'
  | 'general'

export interface PathModifiers {
  income: number    // multiplier, e.g. 1.3 = +30% vs neutral
  stress: number
  freedom: number
}

export interface DataModifiers {
  category: DecisionCategory
  dataSource: string
  optionAModifiers: PathModifiers
  optionBModifiers: PathModifiers
  evidenceA: string[]
  evidenceB: string[]
  liveStats?: {
    unemploymentRate?: number
    occupationA?: OccupationStats
    occupationB?: OccupationStats
  }
}

export interface OccupationStats {
  title: string
  medianAnnualWage: number
  employmentCount: number
  seriesId: string
}

// ─── BLS OES occupation series mapping ───────────────────────────────────────
// Series format: OEU + N (national) + 0000000 (all industries) + SOC_no_hyphen + 00 + data_type
// data_type: 01=employment, 03=median annual wage
// Source: BLS OES national cross-industry data

const BLS_OCCUPATION_SERIES: Record<string, { title: string; wageSeriesId: string }> = {
  // Software & Tech
  software: {
    title: 'Software Developers',
    wageSeriesId: 'OEUN000000000015125200003',
  },
  developer: {
    title: 'Software Developers',
    wageSeriesId: 'OEUN000000000015125200003',
  },
  engineer: {
    title: 'Engineers (General)',
    wageSeriesId: 'OEUN000000000017219900003',
  },
  // Medicine
  doctor: {
    title: 'Physicians',
    wageSeriesId: 'OEUN000000000029106100003',
  },
  physician: {
    title: 'Physicians',
    wageSeriesId: 'OEUN000000000029106100003',
  },
  nurse: {
    title: 'Registered Nurses',
    wageSeriesId: 'OEUN000000000029114100003',
  },
  // Finance
  finance: {
    title: 'Financial Analysts',
    wageSeriesId: 'OEUN000000000013205100003',
  },
  analyst: {
    title: 'Financial Analysts',
    wageSeriesId: 'OEUN000000000013205100003',
  },
  banker: {
    title: 'Financial Managers',
    wageSeriesId: 'OEUN000000000011303100003',
  },
  // Law
  lawyer: {
    title: 'Lawyers',
    wageSeriesId: 'OEUN000000000023101100003',
  },
  attorney: {
    title: 'Lawyers',
    wageSeriesId: 'OEUN000000000023101100003',
  },
  // Education
  teacher: {
    title: 'High School Teachers',
    wageSeriesId: 'OEUN000000000025203100003',
  },
  professor: {
    title: 'Postsecondary Teachers',
    wageSeriesId: 'OEUN000000000025199900003',
  },
  // Creative
  artist: {
    title: 'Fine Artists',
    wageSeriesId: 'OEUN000000000027101300003',
  },
  designer: {
    title: 'Graphic Designers',
    wageSeriesId: 'OEUN000000000027102400003',
  },
  writer: {
    title: 'Writers and Authors',
    wageSeriesId: 'OEUN000000000027304300003',
  },
  musician: {
    title: 'Musicians and Singers',
    wageSeriesId: 'OEUN000000000027202200003',
  },
  'flight attendant': {
    title: 'Flight Attendants',
    wageSeriesId: 'OEUN000000000053203100003',
  },
  'air hostess': {
    title: 'Flight Attendants',
    wageSeriesId: 'OEUN000000000053203100003',
  },
  'cabin crew': {
    title: 'Flight Attendants',
    wageSeriesId: 'OEUN000000000053203100003',
  },
  // Public Safety
  firefighter: {
    title: 'Firefighters',
    wageSeriesId: 'OEUN000000000033201100003',
  },
  police: {
    title: 'Police and Sheriff Patrol Officers',
    wageSeriesId: 'OEUN000000000033305100003',
  },
  officer: {
    title: 'Police and Sheriff Patrol Officers',
    wageSeriesId: 'OEUN000000000033305100003',
  },
  detective: {
    title: 'Detectives and Criminal Investigators',
    wageSeriesId: 'OEUN000000000033302100003',
  },
  paramedic: {
    title: 'EMTs and Paramedics',
    wageSeriesId: 'OEUN000000000029204200003',
  },
  emt: {
    title: 'EMTs and Paramedics',
    wageSeriesId: 'OEUN000000000029204200003',
  },
  // Trades
  electrician: {
    title: 'Electricians',
    wageSeriesId: 'OEUN000000000047211100003',
  },
  plumber: {
    title: 'Plumbers, Pipefitters, and Steamfitters',
    wageSeriesId: 'OEUN000000000047215200003',
  },
  carpenter: {
    title: 'Carpenters',
    wageSeriesId: 'OEUN000000000047203100003',
  },
  welder: {
    title: 'Welders, Cutters, Solderers, and Brazers',
    wageSeriesId: 'OEUN000000000051412100003',
  },
  mechanic: {
    title: 'Automotive Service Technicians and Mechanics',
    wageSeriesId: 'OEUN000000000049302300003',
  },
  // Healthcare
  dentist: {
    title: 'Dentists',
    wageSeriesId: 'OEUN000000000029102100003',
  },
  pharmacist: {
    title: 'Pharmacists',
    wageSeriesId: 'OEUN000000000029105100003',
  },
  veterinarian: {
    title: 'Veterinarians',
    wageSeriesId: 'OEUN000000000029113100003',
  },
  therapist: {
    title: 'Substance Abuse and Mental Health Counselors',
    wageSeriesId: 'OEUN000000000021101400003',
  },
  psychologist: {
    title: 'Psychologists',
    wageSeriesId: 'OEUN000000000019303100003',
  },
  surgeon: {
    title: 'Surgeons',
    wageSeriesId: 'OEUN000000000029106700003',
  },
  'physical therapist': {
    title: 'Physical Therapists',
    wageSeriesId: 'OEUN000000000029112300003',
  },
  'nurse practitioner': {
    title: 'Nurse Practitioners',
    wageSeriesId: 'OEUN000000000029117100003',
  },
  // Tech
  'data scientist': {
    title: 'Data Scientists',
    wageSeriesId: 'OEUN000000000015205100003',
  },
  'product manager': {
    title: 'Computer and Information Systems Managers',
    wageSeriesId: 'OEUN000000000011302100003',
  },
  // Business
  accountant: {
    title: 'Accountants and Auditors',
    wageSeriesId: 'OEUN000000000013201100003',
  },
  'marketing manager': {
    title: 'Marketing Managers',
    wageSeriesId: 'OEUN000000000011202100003',
  },
  'real estate': {
    title: 'Real Estate Sales Agents',
    wageSeriesId: 'OEUN000000000041902200003',
  },
  // Transport
  pilot: {
    title: 'Airline Pilots, Copilots, and Flight Engineers',
    wageSeriesId: 'OEUN000000000053201100003',
  },
  'truck driver': {
    title: 'Heavy and Tractor-Trailer Truck Drivers',
    wageSeriesId: 'OEUN000000000053303200003',
  },
  // Architecture & Social
  architect: {
    title: 'Architects',
    wageSeriesId: 'OEUN000000000017101100003',
  },
  'social worker': {
    title: 'Social Workers',
    wageSeriesId: 'OEUN000000000021102200003',
  },
  // Culinary
  chef: {
    title: 'Chefs and Head Cooks',
    wageSeriesId: 'OEUN000000000035101100003',
  },
}

// ─── BLS live fetch ───────────────────────────────────────────────────────────

async function fetchBLSSeries(seriesIds: string[]): Promise<Record<string, number>> {
  const apiKey = process.env.BLS_API_KEY ?? ''
  const body: Record<string, unknown> = {
    seriesid: seriesIds,
    startyear: String(new Date().getFullYear() - 2),
    endyear: String(new Date().getFullYear()),
  }
  if (apiKey) body.registrationkey = apiKey

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)

  try {
    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) return {}

    const data = await res.json()
    const results: Record<string, number> = {}

    for (const series of (data?.Results?.series ?? [])) {
      const latest = series?.data?.[0]
      if (latest && series.seriesID) {
        const val = parseFloat(latest.value)
        if (!isNaN(val)) results[series.seriesID] = val
      }
    }
    return results
  } catch {
    clearTimeout(timer)
    return {}
  }
}

async function fetchLiveOccupationStats(text: string): Promise<OccupationStats | undefined> {
  const lower = text.toLowerCase()

  // Find matching occupation series
  let match: { title: string; wageSeriesId: string } | undefined
  for (const [kw, occ] of Object.entries(BLS_OCCUPATION_SERIES)) {
    if (lower.includes(kw)) {
      match = occ
      break
    }
  }
  if (!match) return undefined

  const values = await fetchBLSSeries([match.wageSeriesId])
  const wage = values[match.wageSeriesId]
  if (!wage) return undefined

  return {
    title: match.title,
    medianAnnualWage: wage,
    employmentCount: 0,
    seriesId: match.wageSeriesId,
  }
}

// ─── Category classifier ──────────────────────────────────────────────────────

function classifyDecision(decision: string): DecisionCategory {
  const lower = decision.toLowerCase()

  const scores: Record<DecisionCategory, number> = {
    career: ['job', 'career', 'work', 'salary', 'hire', 'company', 'startup', 'business', 'office', 'remote', 'freelance', 'software', 'engineer', 'developer', 'doctor', 'lawyer', 'finance', 'banking', 'artist', 'teacher', 'design', 'quit', 'resign', 'firefighter', 'police', 'officer', 'paramedic', 'emt', 'nurse', 'dentist', 'pharmacist', 'surgeon', 'therapist', 'psychologist', 'accountant', 'architect', 'pilot', 'chef', 'electrician', 'plumber', 'carpenter', 'mechanic', 'welder', 'detective', 'veterinarian'].filter(k => lower.includes(k)).length,
    study: ['study', 'learn', 'course', 'university', 'degree', 'school', 'education', 'exam', 'bootcamp', 'masters', 'phd', 'mooc', 'recall', 'flashcard', 'reading'].filter(k => lower.includes(k)).length,
    productivity: ['productivity', 'focus', 'schedule', 'routine', 'work from home', 'time', 'habit', 'morning', 'workflow', 'pomodoro', 'blocking'].filter(k => lower.includes(k)).length,
    lifestyle: ['health', 'fitness', 'exercise', 'gym', 'diet', 'travel', 'move', 'relocate', 'relationship', 'drug', 'alcohol', 'smoking', 'sleep', 'marriage', 'dating', 'vegan', 'keto', 'family', 'kids', 'baby', 'abroad'].filter(k => lower.includes(k)).length,
    finance: ['invest', 'money', 'financial', 'stock', 'crypto', 'savings', 'budget', 'real estate', 'property', 'debt', 'loan', 'retirement'].filter(k => lower.includes(k)).length,
    general: 0,
  }

  const top = (Object.entries(scores) as [DecisionCategory, number][]).sort((a, b) => b[1] - a[1])[0]
  return top[1] > 0 ? top[0] : 'general'
}

// ─── Research dataset lookup ──────────────────────────────────────────────────

type ResearchEntry = {
  keywords: string[]
  income_modifier: number
  stress_modifier: number
  freedom_modifier: number
  evidence: string[]
}

function findBestMatch(text: string, section: Record<string, ResearchEntry>): ResearchEntry | null {
  const lower = text.toLowerCase()
  let best: ResearchEntry | null = null
  let bestScore = 0

  for (const entry of Object.values(section)) {
    const score = entry.keywords.filter(kw => lower.includes(kw)).length
    if (score > bestScore) { bestScore = score; best = entry }
  }
  return bestScore > 0 ? best : null
}

const ALL_SECTIONS = ['career', 'lifestyle', 'study', 'productivity', 'finance']
const NEUTRAL: PathModifiers = { income: 1.0, stress: 1.0, freedom: 1.0 }
const GENERAL_EVIDENCE = [
  'Research shows deliberate decisions with clear evaluation criteria lead to 30% higher long-term satisfaction.',
  'People who simulate outcomes before deciding report significantly fewer regrets at 5-year follow-up.',
  'The quality of a decision process predicts outcomes better than luck in 80% of life scenarios studied.',
]

function findResearchModifiers(text: string, category: DecisionCategory): { modifiers: PathModifiers; evidence: string[] } {
  const rd = researchData as Record<string, Record<string, ResearchEntry>>

  const primaryMap: Record<DecisionCategory, string[]> = {
    career: ['career', 'lifestyle', 'finance'],
    study: ['study', 'career', 'productivity'],
    productivity: ['productivity', 'study', 'career'],
    lifestyle: ['lifestyle', 'career', 'finance'],
    finance: ['finance', 'career', 'lifestyle'],
    general: ALL_SECTIONS,
  }

  const seen = new Set<string>()
  const searchOrder = [...primaryMap[category], ...ALL_SECTIONS].filter(s => {
    if (seen.has(s)) return false; seen.add(s); return true
  })

  for (const sectionKey of searchOrder) {
    const section = rd[sectionKey]
    if (!section) continue
    const match = findBestMatch(text, section)
    if (match) {
      return {
        modifiers: { income: match.income_modifier, stress: match.stress_modifier, freedom: match.freedom_modifier },
        evidence: match.evidence.slice(),
      }
    }
  }
  return { modifiers: { ...NEUTRAL }, evidence: GENERAL_EVIDENCE.slice() }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getDataModifiers(
  decision: string,
  optionA: string,
  optionB: string
): Promise<DataModifiers> {
  const category = classifyDecision(decision)

  // Fire all live BLS fetches in parallel — each has its own 4s timeout
  const [unemploymentData, occAData, occBData] = await Promise.all([
    fetchBLSSeries(['LNS14000000']).catch(() => ({} as Record<string, number>)),
    fetchLiveOccupationStats(optionA).catch(() => undefined),
    fetchLiveOccupationStats(optionB).catch(() => undefined),
  ])

  const unemploymentRate = unemploymentData['LNS14000000']
  const hasLive = unemploymentRate !== undefined || occAData !== undefined || occBData !== undefined

  // Research-based modifiers (synchronous, always works)
  const { modifiers: modA, evidence: evA } = findResearchModifiers(optionA, category)
  const { modifiers: modB, evidence: evB } = findResearchModifiers(optionB, category)

  // Prepend live BLS data to evidence if available
  if (unemploymentRate !== undefined) {
    const trend = unemploymentRate < 4 ? 'strong' : unemploymentRate < 6 ? 'moderate' : 'weak'
    const blsLine = `Live BLS data: U.S. unemployment rate ${unemploymentRate}% — ${trend} job market conditions.`
    evA.unshift(blsLine)
    evB.unshift(blsLine)
  }

  if (occAData) {
    evA.unshift(`BLS OES: ${occAData.title} median annual wage $${occAData.medianAnnualWage.toLocaleString()} (live BLS series ${occAData.seriesId}).`)
    // Adjust income modifier based on live wage vs national median ($59,000)
    const wageRatio = occAData.medianAnnualWage / 59000
    modA.income = Math.min(2.0, Math.max(0.4, modA.income * Math.sqrt(wageRatio)))
  }

  if (occBData) {
    evB.unshift(`BLS OES: ${occBData.title} median annual wage $${occBData.medianAnnualWage.toLocaleString()} (live BLS series ${occBData.seriesId}).`)
    const wageRatio = occBData.medianAnnualWage / 59000
    modB.income = Math.min(2.0, Math.max(0.4, modB.income * Math.sqrt(wageRatio)))
  }

  return {
    category,
    dataSource: hasLive ? 'BLS API (Live) + Research Database' : 'Parallel Me Research Database',
    optionAModifiers: modA,
    optionBModifiers: modB,
    evidenceA: evA.slice(0, 4),
    evidenceB: evB.slice(0, 4),
    liveStats: {
      unemploymentRate,
      occupationA: occAData,
      occupationB: occBData,
    },
  }
}

// ─── Format for prompt injection ──────────────────────────────────────────────

export function formatModifiersForPrompt(mods: DataModifiers): string {
  const fmt = (m: PathModifiers) =>
    `income×${m.income.toFixed(2)}, stress×${m.stress.toFixed(2)}, freedom×${m.freedom.toFixed(2)}`

  return [
    `DATA CALIBRATION [${mods.dataSource}]:`,
    `Path A (${fmt(mods.optionAModifiers)}): ${mods.evidenceA.slice(0, 2).join(' | ')}`,
    `Path B (${fmt(mods.optionBModifiers)}): ${mods.evidenceB.slice(0, 2).join(' | ')}`,
    `Apply modifiers as relative score anchors. income×1.3 = score ~30% higher than neutral for this dimension.`,
    `DARK PATH RULES override all modifiers.`,
  ].join('\n')
}
