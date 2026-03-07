import { NextRequest, NextResponse } from 'next/server'
import type { StoryMilestone, TimelinePoint } from '@/app/api/simulate/route'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BranchRequest {
  decision: string
  pathLabel: string           // e.g. "pursue art full-time"
  branchYear: number          // 3 or 7
  choiceLabel: string         // e.g. "Double down on your niche"
  choiceOutcome: string       // the outcome text already generated
  originalMilestones: StoryMilestone[]
  originalTimeline: TimelinePoint[]
}

export interface BranchResult {
  milestones: StoryMilestone[]   // only the years AFTER the branch
  timeline: TimelinePoint[]      // only the years AFTER the branch
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildBranchPrompt(req: BranchRequest): string {
  const remainingYears = req.branchYear === 3 ? [5, 10] : [10]

  const originalContext = req.originalMilestones
    .filter(m => m.year <= req.branchYear)
    .map(m => `Year ${m.year}: ${m.title} — ${m.description}`)
    .join('\n')

  const yearsStr = remainingYears.join(' and ')

  return `You are continuing a life simulation. A person chose this life path:

Decision: "${req.decision}"
Path chosen: "${req.pathLabel}"

The first ${req.branchYear} years played out like this:
${originalContext}

At year ${req.branchYear}, they faced a fork and chose: "${req.choiceLabel}"
What that choice immediately led to: "${req.choiceOutcome}"

Now generate the realistic long-term consequences of this specific branch choice for year${remainingYears.length > 1 ? 's' : ''} ${yearsStr}.

CRITICAL RULES:
- The output must flow naturally from the branch choice, NOT from the original path trajectory.
- Be brutally specific. No generic phrases like "Building Momentum" or "Skills Compounding".
- Milestone titles must be 3-5 words, specific to what this branch choice actually changed.
- Metrics must be specific numbers or achievements (e.g. "$82K salary", "Promoted to senior", "Third startup fails").
- Memories must be first-person, emotionally specific, starting with "I still remember..." or "I'll never forget...".
- Income/stress/freedom scores must reflect whether this branch choice was wise or costly.

Return ONLY valid JSON — no markdown, no explanation:

${remainingYears.length === 2 ? `{
  "milestones": [
    { "year": 5, "title": "...", "description": "Two vivid specific sentences about life at year 5 after this branch.", "memory": "First-person memory from year 5, emotionally charged.", "emoji": "...", "metric": "..." },
    { "year": 10, "title": "...", "description": "Two vivid specific sentences about life at year 10 after this branch.", "memory": "First-person memory from year 10, the weight of the full decade.", "emoji": "...", "metric": "..." }
  ],
  "timeline": [
    { "year": 5, "income": 0, "stress": 0, "freedom": 0, "description": "One specific sentence about financial/life reality at year 5." },
    { "year": 10, "income": 0, "stress": 0, "freedom": 0, "description": "One specific sentence about financial/life reality at year 10." }
  ]
}` : `{
  "milestones": [
    { "year": 10, "title": "...", "description": "Two vivid specific sentences about life at year 10 after this branch.", "memory": "First-person memory from year 10, the weight of the full decade.", "emoji": "...", "metric": "..." }
  ],
  "timeline": [
    { "year": 10, "income": 0, "stress": 0, "freedom": 0, "description": "One specific sentence about financial/life reality at year 10." }
  ]
}`}`
}

// ─── Groq call ────────────────────────────────────────────────────────────────

async function callGroq(prompt: string): Promise<BranchResult> {
  const apiKey = process.env.GROQ_API_KEY!
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']

  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          temperature: 0.85,
          max_tokens: 1800,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are a life simulation engine. Always respond with valid JSON only. No markdown.' },
            { role: 'user', content: prompt },
          ],
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        if (res.status === 429 && model === models[0]) {
          console.warn('[branch] 70b rate-limited, trying 8b-instant')
          continue
        }
        throw new Error(`Groq ${res.status}: ${err}`)
      }

      const data = await res.json()
      const content: string = data.choices[0].message.content.trim()
      const json = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      return JSON.parse(json) as BranchResult
    } catch (err) {
      if (model === models[models.length - 1]) throw err
    }
  }

  throw new Error('All models failed')
}

// ─── Mock fallback ────────────────────────────────────────────────────────────

function mockBranchResult(req: BranchRequest): BranchResult {
  const remainingYears = req.branchYear === 3 ? [5, 10] : [10]
  return {
    milestones: remainingYears.map(year => ({
      year,
      title: `Year ${year} — Branch Path`,
      description: `After choosing "${req.choiceLabel}" at year ${req.branchYear}, the path diverged significantly. This choice compounded over ${year - req.branchYear} years in ways both expected and surprising.`,
      memory: `I still remember the moment I chose "${req.choiceLabel}". By year ${year}, it had changed everything I thought I knew about this path.`,
      emoji: year === 5 ? '⚡' : '✦',
      metric: `${year - req.branchYear} years on this branch`,
    })),
    timeline: remainingYears.map(year => ({
      year,
      income: year === 5 ? 55 : 68,
      stress: year === 5 ? 58 : 50,
      freedom: year === 5 ? 60 : 70,
      description: `Year ${year}: the consequences of the year-${req.branchYear} branch choice have fully materialized.`,
    })),
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as BranchRequest

    if (!body.decision || !body.pathLabel || !body.choiceLabel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const prompt = buildBranchPrompt(body)

    if (process.env.GROQ_API_KEY) {
      try {
        const result = await callGroq(prompt)
        return NextResponse.json(result)
      } catch (err) {
        console.error('[branch] Groq failed:', err)
        return NextResponse.json(mockBranchResult(body))
      }
    }

    return NextResponse.json(mockBranchResult(body))
  } catch (err) {
    console.error('[branch] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
