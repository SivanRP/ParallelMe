import { NextRequest, NextResponse } from 'next/server'
import type { SimulateOption } from '@/app/api/simulate/route'

function buildPrompt(decision: string, optionA: string, optionB: string): string {
  return `You are a life simulation engine. The user is deciding between two paths:
Decision: "${decision}"
Path A: "${optionA}"
Path B: "${optionB}"

Your job: reveal a HIDDEN THIRD PATH — a creative hybrid or unexpected alternative that most people never consider.

Rules:
- The third path must be genuinely surprising and non-obvious. Not just "do both" — something specific.
- Example: startup vs finance → "Join a late-stage startup as an early employee" or "Build a micro-SaaS on weekends while working finance"
- Must be realistic, not fantasy
- Tagline must start with "You" and be punchy (max 10 words)
- Milestone titles: 3-5 words, ultra specific
- Metrics: real numbers or specific achievements
- Include one first-person memory per milestone starting with "I still remember..." or "I'll never forget..."

Return ONLY valid JSON:
{
  "label": "Short name for the third path",
  "tagline": "You...",
  "milestones": [
    { "year": 1, "title": "...", "description": "Two vivid sentences.", "memory": "First-person memory from year 1.", "emoji": "...", "metric": "..." },
    { "year": 5, "title": "...", "description": "Two vivid sentences.", "memory": "First-person memory from year 5.", "emoji": "...", "metric": "..." },
    { "year": 10, "title": "...", "description": "Two vivid sentences.", "memory": "First-person memory from year 10.", "emoji": "...", "metric": "..." }
  ],
  "timeline": [
    { "year": 1, "income": 0, "stress": 0, "freedom": 0, "description": "One sentence about year 1 reality." },
    { "year": 5, "income": 0, "stress": 0, "freedom": 0, "description": "One sentence about year 5 reality." },
    { "year": 10, "income": 0, "stress": 0, "freedom": 0, "description": "One sentence about year 10 reality." }
  ],
  "branchEvents": [
    { "year": 3, "prompt": "...", "choiceA": { "label": "...", "outcome": "..." }, "choiceB": { "label": "...", "outcome": "..." } },
    { "year": 7, "prompt": "...", "choiceA": { "label": "...", "outcome": "..." }, "choiceB": { "label": "...", "outcome": "..." } }
  ],
  "thirdPathReason": "One sentence explaining why this hidden path exists and why people miss it."
}`
}

export interface ThirdPathResponse extends SimulateOption {
  thirdPathReason: string
}

export async function POST(req: NextRequest) {
  const { decision, optionA, optionB } = await req.json()
  const key = process.env.GROQ_API_KEY

  if (!key) {
    return NextResponse.json({
      label: 'The Hybrid Path',
      tagline: 'You found the door no one talks about.',
      thirdPathReason: 'Most people see only the two obvious choices. This path lives in the space between them.',
      milestones: [
        { year: 1, title: 'Bridging Both Worlds', description: 'You find a way to extract the best of both options without fully committing to either extreme.', memory: 'I still remember the moment I realized I didn\'t have to choose — I could design my own version of this decision.', emoji: '🌉', metric: 'Best of both' },
        { year: 5, title: 'The Uncommon Advantage', description: 'Five years in, you have skills and perspectives that neither pure path A nor pure path B people possess.', memory: 'I\'ll never forget the meeting where everyone assumed I\'d picked one side. I had quietly built something neither side understood.', emoji: '⚡', metric: 'Unique leverage' },
        { year: 10, title: 'You Wrote Your Own Rules', description: 'A decade later, you\'re operating in a category you essentially invented — part of both worlds, constrained by neither.', memory: 'Looking back, I understood why so few people take this path. It requires tolerating ambiguity longer than most people can stand.', emoji: '🔮', metric: 'Category of one' },
      ],
      timeline: [
        { year: 1, income: 48, stress: 55, freedom: 70, description: 'The hybrid path starts slower but broader.' },
        { year: 5, income: 65, stress: 50, freedom: 75, description: 'Unique positioning starts to compound.' },
        { year: 10, income: 78, stress: 45, freedom: 82, description: 'You operate in a category you designed yourself.' },
      ],
      branchEvents: [
        { year: 3, prompt: 'The hybrid path draws attention — someone wants to pull you fully into one camp.', choiceA: { label: 'Stay hybrid', outcome: 'Harder short-term, but your unique position compounds over the next years.' }, choiceB: { label: 'Commit fully', outcome: 'Faster progress on one track, but you lose the differentiated angle that made you interesting.' } },
        { year: 7, prompt: 'An opportunity appears that only exists because of your hybrid background.', choiceA: { label: 'Seize it', outcome: 'The payoff is real — this moment validates the entire decade of ambiguity you endured.' }, choiceB: { label: 'Wait for something cleaner', outcome: 'The clean opportunity never comes. Hybrid paths reward action, not patience.' } },
      ],
    } satisfies ThirdPathResponse)
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.95,
        max_tokens: 1800,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a creative life simulation engine. Always respond with valid JSON only.' },
          { role: 'user', content: buildPrompt(decision, optionA, optionB) },
        ],
      }),
    })

    if (!res.ok) throw new Error(`Groq ${res.status}`)
    const data = await res.json()
    const parsed = JSON.parse(data.choices[0].message.content)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[third-path] failed:', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
