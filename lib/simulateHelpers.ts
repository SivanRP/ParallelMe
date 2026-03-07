/**
 * Shared helpers used by both /api/simulate and /api/simulate/stream.
 * Must NOT import from route files (circular dep + Next.js route export restrictions).
 */

import type {
  SimulateResponse,
  StoryMilestone,
  BranchEvent,
  UserProfile,
  DecisionContext,
} from '@/app/api/simulate/route'

// ─── Decision parser ───────────────────────────────────────────────────────────

export function parseDecision(raw: string): { optionA: string; optionB: string } {
  const separators = [/ vs\.? /i, / versus /i, /\s+or\s+/i, /\s*\/\s*/, /\s*\|\s*/, /\s*,\s*/]
  for (const sep of separators) {
    const parts = raw.split(sep)
    if (parts.length >= 2) {
      return { optionA: parts[0].trim(), optionB: parts.slice(1).join(' or ').trim() }
    }
  }
  return { optionA: raw.trim(), optionB: `not ${raw.trim()}` }
}

// ─── Prompt builder ────────────────────────────────────────────────────────────

export function buildPrompt(
  decision: string,
  optionA: string,
  optionB: string,
  profile?: UserProfile,
  context?: DecisionContext,
  dataModifiersBlock?: string
): string {
  return `You are a brutally realistic life simulation engine. Generate two diverging futures for a specific life decision.

Decision: "${decision}"
Path A: "${optionA}"
Path B: "${optionB}"

CRITICAL RULES:
- Be SPECIFIC to these exact paths. Reference real activities, real tradeoffs, real consequences specific to the actual decision given.
- Do NOT use generic phrases like "The First Step", "Building Momentum", "Foundation Set", "Skills Compounding". Every word must be specific to the actual decision.
- Make the contrast between paths dramatic and meaningful.
- Taglines must start with "You" and be punchy (max 10 words).
- Milestone titles must be 3-5 words, specific to the path (e.g. "First Product Ships", "Addiction Takes Hold", "Degree in Hand").
- Metric must be a specific, realistic number or achievement (e.g. "$45K MRR", "2 years sober", "VP of Engineering", "$180K salary").

DARK/DESTRUCTIVE PATH RULES — apply whenever a path involves substance abuse, addiction, illegal activity, self-harm, or other destructive behaviour:
- Do NOT sugarcoat or make destructive paths seem rewarding at year 5 or 10. A drug addiction path does NOT "pay off" — it leads to health collapse, financial ruin, and possible death.
- Income MUST decline severely for addiction/substance abuse paths (year 10 income: 0–12).
- Stress MUST rise to crisis levels (year 10 stress: 90–100).
- Freedom MUST collapse — addiction is a prison (year 10 freedom: 0–12).
- Milestones must name real consequences: withdrawal symptoms, overdose scares, job loss, broken relationships, legal trouble, organ damage.
- Metrics must be brutal and specific: "3rd stint in rehab", "Liver cirrhosis diagnosed", "Evicted at month 8", "Lost custody of kids", "Criminal record".
- Year 5 and Year 10 descriptions must reflect escalating consequences, NOT stability or growth.

Scoring rules:
- income: 0=broke/in debt, 25=survival, 50=comfortable living, 75=well-off, 100=extremely wealthy
- stress: 0=peaceful, 30=low, 50=moderate, 70=high pressure, 90=crisis, 100=breakdown
- freedom: 0=trapped/constrained, 30=limited, 50=some autonomy, 75=mostly free, 100=complete freedom

${dataModifiersBlock ? `${dataModifiersBlock}\n\n` : ''}${context && (context.riskTolerance || context.importance || context.timePressure) ? `DECISION CONTEXT — weight outcomes accordingly:
- Risk tolerance: ${context.riskTolerance ?? 5}/10 (1=very cautious, 10=bold)
- Importance of outcome: ${context.importance ?? 5}/10 (1=low stakes, 10=life-defining)
- Time pressure: ${context.timePressure ?? 5}/10 (1=no rush, 10=urgent)
High importance + high time pressure = more dramatic consequences. High risk tolerance = allow bigger swings in both directions.` : ''}

${profile ? `USER PROFILE — personalize outcomes to this person:
- Risk tolerance: ${profile.risk} (low=conservative stable outcomes, medium=balanced, high=extreme swings either direction)
- Core priority: ${profile.priority} (weight ${profile.priority}-related outcomes more heavily in their story)
- Under pressure: ${profile.pressure} (thrive=they excel at crunch moments, adapt=they pivot well, reflect=they need time which costs them speed)${profile.age ? `\n- Age: ${profile.age} — calibrate career stage, life priorities, and financial starting point accordingly` : ''}${profile.col ? `\n- Cost of living: ${profile.col === 'high' ? 'High (NYC/SF/London tier — $80K feels like survival, $200K+ = comfortable)' : profile.col === 'medium' ? 'Medium (mid-size city — $50K livable, $120K comfortable)' : 'Low (small city/rural — $35K livable, $80K is wealth)'}. Calibrate all income descriptions and financial milestones to this reality.` : ''}
Use this to make the simulation feel personally tailored. A high-risk person on the startup path should have more dramatic highs and lows.` : ''}

BRANCH EVENTS: For each path, generate 2 micro-decisions that occur during the decade at year 3 and year 7. These are real forks that happened within the chosen path. Each has two choices and a short outcome revealing what happened.

Return ONLY valid JSON — no markdown, no explanation:

{
  "optionA": {
    "label": "${optionA}",
    "tagline": "...",
    "milestones": [
      { "year": 1, "title": "...", "description": "Two vivid specific sentences about life at year 1 on this exact path.", "memory": "A first-person past-tense memory from year 1, starting with 'I still remember...' or 'I'll never forget...'. Make it visceral and specific.", "emoji": "...", "metric": "..." },
      { "year": 5, "title": "...", "description": "Two vivid specific sentences about life at year 5 on this exact path.", "memory": "A first-person past-tense memory from year 5. Emotionally charged. Something only this path would produce.", "emoji": "...", "metric": "..." },
      { "year": 10, "title": "...", "description": "Two vivid specific sentences about life at year 10 on this exact path.", "memory": "A first-person past-tense memory from year 10. The weight of the full decade. Could be pride, regret, or wisdom.", "emoji": "...", "metric": "..." }
    ],
    "timeline": [
      { "year": 1, "income": 0, "stress": 0, "freedom": 0, "description": "One specific sentence about financial/life reality at year 1." },
      { "year": 5, "income": 0, "stress": 0, "freedom": 0, "description": "One specific sentence about financial/life reality at year 5." },
      { "year": 10, "income": 0, "stress": 0, "freedom": 0, "description": "One specific sentence about financial/life reality at year 10." }
    ],
    "branchEvents": [
      { "year": 3, "prompt": "A specific crossroads appears on the ${optionA} path at year 3...", "choiceA": { "label": "Short option label", "outcome": "Two sentences describing what this choice led to." }, "choiceB": { "label": "Short option label", "outcome": "Two sentences describing what this choice led to." } },
      { "year": 7, "prompt": "Another fork emerges at year 7 on the ${optionA} path...", "choiceA": { "label": "Short option label", "outcome": "Two sentences describing what this choice led to." }, "choiceB": { "label": "Short option label", "outcome": "Two sentences describing what this choice led to." } }
    ]
  },
  "optionB": {
    "label": "${optionB}",
    "tagline": "...",
    "milestones": [
      { "year": 1, "title": "...", "description": "...", "memory": "First-person memory from year 1 on this path.", "emoji": "...", "metric": "..." },
      { "year": 5, "title": "...", "description": "...", "memory": "First-person memory from year 5 on this path.", "emoji": "...", "metric": "..." },
      { "year": 10, "title": "...", "description": "...", "memory": "First-person memory from year 10 on this path.", "emoji": "...", "metric": "..." }
    ],
    "timeline": [
      { "year": 1, "income": 0, "stress": 0, "freedom": 0, "description": "..." },
      { "year": 5, "income": 0, "stress": 0, "freedom": 0, "description": "..." },
      { "year": 10, "income": 0, "stress": 0, "freedom": 0, "description": "..." }
    ],
    "branchEvents": [
      { "year": 3, "prompt": "...", "choiceA": { "label": "...", "outcome": "..." }, "choiceB": { "label": "...", "outcome": "..." } },
      { "year": 7, "prompt": "...", "choiceA": { "label": "...", "outcome": "..." }, "choiceB": { "label": "...", "outcome": "..." } }
    ]
  }
}`
}

// ─── Mock fallback ─────────────────────────────────────────────────────────────

export function generateMockFutures(optionA: string, optionB: string): Omit<SimulateResponse, 'decision'> {
  const makeMilestones = (label: string, isA: boolean): StoryMilestone[] => [
    {
      year: 1,
      title: isA ? `Starting ${label.slice(0, 18)}` : `First year: ${label.slice(0, 18)}`,
      description: `You commit fully to ${label.toLowerCase()}. The early days are disorienting but you begin to find your footing on this new path.`,
      memory: `I still remember the exact moment it all became real — the first day I was fully committed to ${label.toLowerCase()}. I had no idea how much it would change me.`,
      emoji: isA ? '🌱' : '🔑',
      metric: isA ? 'Day 1 in the books' : 'Foundation laid',
    },
    {
      year: 5,
      title: 'Five Years Deep',
      description: `Half a decade of ${label.toLowerCase()} has left marks you didn't expect. You've built habits, scars, and skills specific to this road.`,
      memory: `I'll never forget the fifth anniversary. I sat with a coffee and actually counted everything I'd gained and lost. The number didn't add up the way I expected.`,
      emoji: '⚡',
      metric: 'Significant shift',
    },
    {
      year: 10,
      title: 'A Decade Later',
      description: `Ten years of ${label.toLowerCase()} has defined who you are. The path has become your identity, for better or worse.`,
      memory: `Looking back from year ten, I finally understood what that first choice actually cost me — and what it gave me. The two were inseparable.`,
      emoji: '✨',
      metric: 'Life fully shaped',
    },
  ]

  const makeBranchEvents = (label: string): BranchEvent[] => [
    {
      year: 3,
      prompt: `Three years into ${label.toLowerCase()}, an unexpected opportunity appears. How do you respond?`,
      choiceA: { label: 'Double down', outcome: `You committed harder. It paid off in unexpected ways but cost you balance and rest for the next two years.` },
      choiceB: { label: 'Hedge your bets', outcome: `You kept one foot in another door. The security felt good until you realized it slowed your progress significantly.` },
    },
    {
      year: 7,
      prompt: `Year 7: The path has forked again. A major shift is possible — do you take it?`,
      choiceA: { label: 'Embrace the change', outcome: `The pivot was terrifying but it unlocked a version of this path you hadn't imagined. Year 10 looks very different because of it.` },
      choiceB: { label: 'Stay the course', outcome: `You held firm. The consistency compounded — but you'll always wonder what the other road looked like.` },
    },
  ]

  return {
    optionA: {
      label: optionA,
      tagline: `You chose to ${optionA.toLowerCase()}.`,
      milestones: makeMilestones(optionA, true),
      timeline: [
        { year: 1, income: 40, stress: 60, freedom: 55, description: `The first year on the "${optionA}" path is disorienting but formative.` },
        { year: 5, income: 60, stress: 55, freedom: 65, description: `Five years in, the consequences of this choice are becoming very clear.` },
        { year: 10, income: 75, stress: 50, freedom: 72, description: `A decade later, this choice has permanently shaped who you are.` },
      ],
      branchEvents: makeBranchEvents(optionA),
    },
    optionB: {
      label: optionB,
      tagline: `You chose to ${optionB.toLowerCase()}.`,
      milestones: makeMilestones(optionB, false),
      timeline: [
        { year: 1, income: 55, stress: 40, freedom: 48, description: `The first year of "${optionB}" brings its own set of tradeoffs.` },
        { year: 5, income: 70, stress: 50, freedom: 58, description: `Five years into this path — some regrets, many wins.` },
        { year: 10, income: 80, stress: 48, freedom: 65, description: `Ten years later, you are unmistakably the product of this decision.` },
      ],
      branchEvents: makeBranchEvents(optionB),
    },
    source: 'mock',
  }
}
