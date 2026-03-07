/**
 * Decision Graph Knowledge Engine
 *
 * Generates a causal consequence graph for a life decision using Groq/Llama.
 * Output is a directed graph: Decision → Immediate → Secondary → Long-term.
 *
 * Max 15 nodes, 20 edges per graph to keep rendering fast.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string
  label: string
  level: 0 | 1 | 2 | 3   // 0=decision, 1=immediate, 2=secondary, 3=long-term
  explanation: string      // shown in click popup
}

export interface GraphEdge {
  source: string
  target: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphResponse {
  graphA: GraphData
  graphB: GraphData
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildGraphPrompt(decision: string, optionA: string, optionB: string): string {
  return `Generate causal consequence graphs for two paths of a life decision.

Decision: "${decision}"
Path A: "${optionA}"
Path B: "${optionB}"

Rules:
- Level 0: The decision node itself (1 node per path, id = "root_a" or "root_b")
- Level 1: 3 immediate effects (first 1-2 years)
- Level 2: 3-4 secondary effects (years 2-5, caused by level-1 effects)
- Level 3: 3 long-term outcomes (year 5+, caused by level-2 effects)
- Max 11 nodes per graph, max 15 edges per graph
- Each node needs a 1-sentence explanation grounded in real-world evidence
- Node labels: 2-5 words, specific and vivid (not generic)
- Edges connect causes to effects; multiple level-2 nodes can share level-3 causes
- IDs must be unique strings (snake_case), prefixed "a_" for Path A and "b_" for Path B

Return ONLY valid JSON, no markdown:

{
  "graphA": {
    "nodes": [
      {"id": "root_a", "label": "${optionA}", "level": 0, "explanation": "The starting point."},
      {"id": "a_...", "label": "...", "level": 1, "explanation": "Real-world evidence for why this effect occurs."},
      {"id": "a_...", "label": "...", "level": 2, "explanation": "..."},
      {"id": "a_...", "label": "...", "level": 3, "explanation": "..."}
    ],
    "edges": [
      {"source": "root_a", "target": "a_..."},
      {"source": "a_...", "target": "a_..."}
    ]
  },
  "graphB": {
    "nodes": [
      {"id": "root_b", "label": "${optionB}", "level": 0, "explanation": "The starting point."},
      {"id": "b_...", "label": "...", "level": 1, "explanation": "..."},
      {"id": "b_...", "label": "...", "level": 2, "explanation": "..."},
      {"id": "b_...", "label": "...", "level": 3, "explanation": "..."}
    ],
    "edges": [
      {"source": "root_b", "target": "b_..."},
      {"source": "b_...", "target": "b_..."}
    ]
  }
}`
}

// ─── Groq call ────────────────────────────────────────────────────────────────

async function callGroqForGraph(
  decision: string,
  optionA: string,
  optionB: string
): Promise<GraphResponse> {
  const apiKey = process.env.GROQ_API_KEY!

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a causal reasoning engine. Generate precise, evidence-based causal graphs for life decisions. Always respond with valid JSON only.',
        },
        { role: 'user', content: buildGraphPrompt(decision, optionA, optionB) },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq graph error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const text: string = data.choices[0].message.content.trim()
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(json) as GraphResponse
}

// ─── Fallback mock graph ──────────────────────────────────────────────────────

function buildMockGraph(option: string, prefix: 'a' | 'b'): GraphData {
  const p = prefix
  const rootId = `root_${p}`

  const nodes: GraphNode[] = [
    { id: rootId, label: option, level: 0, explanation: 'The decision you are evaluating.' },
    { id: `${p}_time`, label: 'Time reallocation', level: 1, explanation: 'Every choice redirects hours, energy, and attention.' },
    { id: `${p}_network`, label: 'New relationships', level: 1, explanation: 'Social circles reshape based on the environment this path creates.' },
    { id: `${p}_identity`, label: 'Identity shift', level: 1, explanation: 'What we do daily becomes who we are — this path rewires self-concept.' },
    { id: `${p}_skills`, label: 'Skill accumulation', level: 2, explanation: 'Time investment compounds into expertise — 10,000-hour principle applies.' },
    { id: `${p}_opportunities`, label: 'New doors open', level: 2, explanation: 'Relationships built create serendipitous opportunities unavailable elsewhere.' },
    { id: `${p}_stress`, label: 'Stress pattern forms', level: 2, explanation: 'Each path has a characteristic stress profile that becomes the baseline.' },
    { id: `${p}_financial`, label: 'Financial trajectory', level: 3, explanation: 'The compounding of skills, time, and opportunities defines your economic arc.' },
    { id: `${p}_wellbeing`, label: 'Long-term wellbeing', level: 3, explanation: 'Alignment (or misalignment) between daily life and values determines satisfaction.' },
    { id: `${p}_legacy`, label: 'Lasting impact', level: 3, explanation: 'What remains at the decade mark — relationships, achievements, and who you became.' },
  ]

  const edges: GraphEdge[] = [
    { source: rootId, target: `${p}_time` },
    { source: rootId, target: `${p}_network` },
    { source: rootId, target: `${p}_identity` },
    { source: `${p}_time`, target: `${p}_skills` },
    { source: `${p}_network`, target: `${p}_opportunities` },
    { source: `${p}_identity`, target: `${p}_stress` },
    { source: `${p}_skills`, target: `${p}_financial` },
    { source: `${p}_opportunities`, target: `${p}_financial` },
    { source: `${p}_opportunities`, target: `${p}_wellbeing` },
    { source: `${p}_stress`, target: `${p}_wellbeing` },
    { source: `${p}_financial`, target: `${p}_legacy` },
    { source: `${p}_wellbeing`, target: `${p}_legacy` },
  ]

  return { nodes, edges }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateDecisionGraphs(
  decision: string,
  optionA: string,
  optionB: string
): Promise<GraphResponse> {
  if (!process.env.GROQ_API_KEY) {
    return {
      graphA: buildMockGraph(optionA, 'a'),
      graphB: buildMockGraph(optionB, 'b'),
    }
  }

  try {
    const result = await callGroqForGraph(decision, optionA, optionB)
    // Enforce size limits
    return {
      graphA: {
        nodes: result.graphA.nodes.slice(0, 15),
        edges: result.graphA.edges.slice(0, 20),
      },
      graphB: {
        nodes: result.graphB.nodes.slice(0, 15),
        edges: result.graphB.edges.slice(0, 20),
      },
    }
  } catch (err) {
    console.error('[decisionGraphEngine] Groq failed, using mock:', err)
    return {
      graphA: buildMockGraph(optionA, 'a'),
      graphB: buildMockGraph(optionB, 'b'),
    }
  }
}
