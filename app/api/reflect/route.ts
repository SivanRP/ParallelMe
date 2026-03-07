import { NextRequest, NextResponse } from 'next/server'

export interface ReflectRequest {
  decision: string
  optionA: string
  optionB: string
  question: string
  metricsA: { income: number; stress: number; freedom: number }
  metricsB: { income: number; stress: number; freedom: number }
}

export interface ReflectResponse {
  responseA: string
  responseB: string
}

function buildPrompt(req: ReflectRequest): string {
  return `You are two different future versions of a person, each having lived a decade along different paths after a major decision.

THE DECISION: "${req.decision}"

FUTURE SELF A lived: "${req.optionA}"
Their life after 10 years — Income: ${req.metricsA.income}/100, Stress: ${req.metricsA.stress}/100, Freedom: ${req.metricsA.freedom}/100

FUTURE SELF B lived: "${req.optionB}"
Their life after 10 years — Income: ${req.metricsB.income}/100, Stress: ${req.metricsB.stress}/100, Freedom: ${req.metricsB.freedom}/100

The person is asking both future selves: "${req.question}"

Write each future self's authentic response. Be:
- Brutally honest about the REAL consequences of their path (don't sugarcoat dark paths)
- Personal and emotional — speak as that person, with their regrets, joys, hard-won wisdom
- Specific to THEIR metrics (high stress → they feel it, low freedom → they miss it)
- 2-4 sentences max per response. Raw, conversational tone. No corporate speak.
- If a path involved destructive choices (addiction, crime, self-destruction), that future self must reflect the weight of it — they are not inspiring, they are warning.

Return ONLY valid JSON, exactly:
{
  "responseA": "...",
  "responseB": "..."
}`
}

async function callGroq(prompt: string): Promise<ReflectResponse | null> {
  const key = process.env.GROQ_API_KEY
  if (!key) return null
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.85,
        max_tokens: 512,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a life simulation engine. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) return null
    const json = await res.json()
    const text = json.choices?.[0]?.message?.content
    if (!text) return null
    return JSON.parse(text) as ReflectResponse
  } catch {
    return null
  }
}

async function callAnthropic(prompt: string): Promise<ReflectResponse | null> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return null
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return null
    const json = await res.json()
    const text = json.content?.[0]?.text
    if (!text) return null
    const match = text.match(/\{[\s\S]*\}/)
    return match ? (JSON.parse(match[0]) as ReflectResponse) : null
  } catch {
    return null
  }
}

function mockReflect(req: ReflectRequest): ReflectResponse {
  const aWon = req.metricsA.income + req.metricsA.freedom - req.metricsA.stress >
                req.metricsB.income + req.metricsB.freedom - req.metricsB.stress

  return {
    responseA: aWon
      ? `Honestly? It wasn't easy — there were months I questioned everything. But sitting here now, with what I've built, I wouldn't trade it. The question you're asking already tells me you already know the answer.`
      : `I'd be lying if I said I don't have regrets. Some things I gained, sure — but I gave up more than I expected. If I could go back, I'd at least go in with eyes wide open. The cost was real.`,
    responseB: !aWon
      ? `There were hard years. But I found something on this path that I think the other version of me is still searching for. It's not glamorous, but it's mine.`
      : `Some days are fine. Other days I wonder what the other version of me looks like right now. I made my choice — I just didn't fully understand what I was trading away until it was too late.`,
  }
}

export async function POST(req: NextRequest) {
  const body: ReflectRequest = await req.json()
  const prompt = buildPrompt(body)

  const result =
    (await callGroq(prompt)) ??
    (await callAnthropic(prompt)) ??
    mockReflect(body)

  return NextResponse.json(result)
}
