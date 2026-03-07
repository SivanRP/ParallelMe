import { NextRequest, NextResponse } from 'next/server'
import { getDataModifiers, formatModifiersForPrompt } from '@/lib/dataDecisionEngine'
import { parseDecision, buildPrompt, generateMockFutures } from '@/lib/simulateHelpers'
import { withTimeout } from '@/lib/withTimeout'
import { buildSourceTrustLayer, type SourceTrustInsights } from '@/lib/sourceTrustLayer'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimelinePoint {
  year: number
  income: number    // 0–100
  stress: number    // 0–100
  freedom: number   // 0–100
  description: string
}

export interface StoryMilestone {
  year: number
  title: string
  description: string
  memory: string  // first-person recollection, e.g. "I still remember the night..."
  emoji: string
  metric: string
}

export interface BranchEvent {
  year: number
  prompt: string
  choiceA: { label: string; outcome: string }
  choiceB: { label: string; outcome: string }
}

export interface SimulateOption {
  label: string
  tagline: string
  milestones: StoryMilestone[]
  timeline: TimelinePoint[]
  branchEvents: BranchEvent[]
}

export interface UserProfile {
  risk: 'low' | 'medium' | 'high'
  priority: 'wealth' | 'creativity' | 'freedom'
  pressure: 'thrive' | 'adapt' | 'reflect'
  age?: '20s' | '30s' | '40s' | '50s+'
  col?: 'high' | 'medium' | 'low'   // cost-of-living tier
}

export interface DecisionContext {
  riskTolerance?: number   // 1–10
  importance?: number      // 1–10
  timePressure?: number    // 1–10
}

export interface LiveOccupationStat {
  title: string
  medianAnnualWage: number
  seriesId: string
}

export interface DataInsights {
  category: string
  dataSource: string
  evidenceA: string[]
  evidenceB: string[]
  liveStats?: {
    unemploymentRate?: number
    occupationA?: LiveOccupationStat
    occupationB?: LiveOccupationStat
  }
}

export interface SimulateResponse {
  decision: string
  optionA: SimulateOption
  optionB: SimulateOption
  source: 'claude' | 'openai' | 'groq' | 'mock'
  dataInsights?: DataInsights
  sourceTrustInsights?: SourceTrustInsights
  _error?: string   // dev-only: surfaces the actual AI error when falling back to mock
}

// ─── Groq ─────────────────────────────────────────────────────────────────────

async function groqRequest(
  model: string,
  prompt: string,
  apiKey: string
): Promise<{ content: string; tokens: number }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.85,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a life simulation engine. Always respond with valid JSON only. No markdown, no explanation.' },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq ${res.status}: ${err}`)
    }

    const data = await res.json()
    return {
      content: data.choices[0].message.content.trim(),
      tokens: data.usage?.total_tokens ?? 0,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

async function callGroq(
  decision: string,
  optionA: string,
  optionB: string,
  profile?: UserProfile,
  context?: DecisionContext,
  dataModifiersBlock?: string
): Promise<SimulateResponse> {
  const apiKey = process.env.GROQ_API_KEY!
  const prompt = buildPrompt(decision, optionA, optionB, profile, context, dataModifiersBlock)

  // Try the high-quality 70b model first; if rate-limited (429) fall to fast 8b model
  let content: string
  try {
    const r = await groqRequest('llama-3.3-70b-versatile', prompt, apiKey)
    content = r.content
    console.log(`[groq] 70b · ${r.tokens} tokens`)
  } catch (err) {
    const msg = String(err)
    if (
      msg.includes('429') ||
      msg.includes('rate') ||
      msg.includes('limit') ||
      msg.includes('AbortError') ||
      msg.toLowerCase().includes('aborted')
    ) {
      console.warn('[groq] 70b unavailable/slow — falling back to 8b-instant')
      const r = await groqRequest('llama-3.1-8b-instant', prompt, apiKey)
      content = r.content
      console.log(`[groq] 8b fallback · ${r.tokens} tokens`)
    } else {
      throw err
    }
  }

  const json = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  const parsed = JSON.parse(json)
  return { ...parsed, source: 'groq' } as SimulateResponse
}

// ─── Anthropic ────────────────────────────────────────────────────────────────

async function callAnthropic(
  decision: string,
  optionA: string,
  optionB: string
): Promise<SimulateResponse> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: buildPrompt(decision, optionA, optionB) }],
    }),
  })

  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`)
  const data = await res.json()
  const text: string = data.content[0].text.trim()
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  const parsed = JSON.parse(json)

  return { ...parsed, source: 'claude' } as SimulateResponse
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────

async function callOpenAI(
  decision: string,
  optionA: string,
  optionB: string
): Promise<SimulateResponse> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a life simulation engine. Always respond with valid JSON only.' },
        { role: 'user', content: buildPrompt(decision, optionA, optionB) },
      ],
    }),
  })

  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)
  const data = await res.json()
  const parsed = JSON.parse(data.choices[0].message.content)
  return { ...parsed, source: 'openai' } as SimulateResponse
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const decision: string = (body.decision ?? '').trim()
    const profile: UserProfile | undefined = body.profile ?? undefined
    const context: DecisionContext | undefined = body.context ?? undefined

    if (!decision) {
      return NextResponse.json({ error: 'decision is required' }, { status: 400 })
    }

    const { optionA, optionB } = parseDecision(decision)

    let dataInsights: DataInsights | undefined
    let sourceTrustInsights: SourceTrustInsights | undefined
    const withDecision = (r: Omit<SimulateResponse, 'decision'>) => ({
      ...r,
      decision,
      dataInsights,
      sourceTrustInsights,
    })

    // Fetch real-world data modifiers — max 2s BLS wait built into engine
    let dataModifiersBlock: string | undefined
    try {
      const mods = await withTimeout(
        getDataModifiers(decision, optionA, optionB),
        1200,
        'Data modifiers timed out'
      )
      dataModifiersBlock = formatModifiersForPrompt(mods)
      dataInsights = {
        category: mods.category,
        dataSource: mods.dataSource,
        evidenceA: mods.evidenceA,
        evidenceB: mods.evidenceB,
        liveStats: mods.liveStats ? {
          unemploymentRate: mods.liveStats.unemploymentRate,
          occupationA: mods.liveStats.occupationA ? {
            title: mods.liveStats.occupationA.title,
            medianAnnualWage: mods.liveStats.occupationA.medianAnnualWage,
            seriesId: mods.liveStats.occupationA.seriesId,
          } : undefined,
          occupationB: mods.liveStats.occupationB ? {
            title: mods.liveStats.occupationB.title,
            medianAnnualWage: mods.liveStats.occupationB.medianAnnualWage,
            seriesId: mods.liveStats.occupationB.seriesId,
          } : undefined,
        } : undefined,
      }
    } catch (err) {
      console.error('[simulate] Data engine failed, continuing without modifiers:', err)
    }
    sourceTrustInsights = buildSourceTrustLayer({ decision, optionA, optionB, dataInsights })

    if (process.env.GROQ_API_KEY) {
      try {
        const result = await callGroq(decision, optionA, optionB, profile, context, dataModifiersBlock)
        return NextResponse.json(withDecision(result))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[simulate] Groq failed:', msg)
        const mock = generateMockFutures(optionA, optionB)
        return NextResponse.json({ ...withDecision(mock), _error: `Groq: ${msg}` })
      }
    }

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const result = await callAnthropic(decision, optionA, optionB)
        return NextResponse.json(withDecision(result))
      } catch (err) {
        console.error('[simulate] Anthropic failed, falling back:', err)
      }
    }

    if (process.env.OPENAI_API_KEY) {
      try {
        const result = await callOpenAI(decision, optionA, optionB)
        return NextResponse.json(withDecision(result))
      } catch (err) {
        console.error('[simulate] OpenAI failed, falling back:', err)
      }
    }

    return NextResponse.json(withDecision(generateMockFutures(optionA, optionB)))
  } catch (err) {
    console.error('[simulate] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
