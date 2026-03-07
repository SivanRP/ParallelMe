import { NextRequest } from 'next/server'
import { getDataModifiers, formatModifiersForPrompt } from '@/lib/dataDecisionEngine'
import { parseDecision, buildPrompt, generateMockFutures } from '@/lib/simulateHelpers'
import { withTimeout } from '@/lib/withTimeout'
import type { SimulateResponse, DataInsights, UserProfile, DecisionContext } from '@/app/api/simulate/route'
import { buildSourceTrustLayer, type SourceTrustInsights } from '@/lib/sourceTrustLayer'

// ─── SSE helpers ──────────────────────────────────────────────────────────────

type StreamEvent =
  | { type: 'status'; phase: string; message: string }
  | { type: 'data_ready'; dataInsights: DataInsights }
  | { type: 'token'; token: string; total: number }
  | { type: 'complete'; result: SimulateResponse }
  | { type: 'error'; message: string }

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json()
  const decision: string = (body.decision ?? '').trim()
  const profile: UserProfile | undefined = body.profile
  const context: DecisionContext | undefined = body.context

  if (!decision) {
    return new Response('{"error":"decision is required"}', { status: 400 })
  }

  const { optionA, optionB } = parseDecision(decision)
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(ctrl) {
      const send = (event: StreamEvent) => {
        ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      let dataInsights: DataInsights | undefined
      let sourceTrustInsights: SourceTrustInsights | undefined

      try {
        // ── Phase 1: Real-world data ─────────────────────────────────────
        send({ type: 'status', phase: 'data', message: 'Fetching live economic data…' })

        try {
          const mods = await withTimeout(
            getDataModifiers(decision, optionA, optionB),
            1200,
            'Data modifiers timed out'
          )
          const modBlock = formatModifiersForPrompt(mods)

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

          send({ type: 'data_ready', dataInsights })
          sourceTrustInsights = buildSourceTrustLayer({ decision, optionA, optionB, dataInsights })

          // Build prompt with modifiers
          const prompt = buildPrompt(decision, optionA, optionB, profile, context, modBlock)
          await streamGroq(prompt, decision, dataInsights, sourceTrustInsights, send)
        } catch (dataErr) {
          console.error('[stream] Data engine failed:', dataErr)
          send({ type: 'status', phase: 'data', message: 'Research database loaded' })
          sourceTrustInsights = buildSourceTrustLayer({ decision, optionA, optionB, dataInsights })
          const prompt = buildPrompt(decision, optionA, optionB, profile, context)
          await streamGroq(prompt, decision, dataInsights, sourceTrustInsights, send)
        }
      } catch (err) {
        const msg = String(err)
        console.error('[stream] Fatal error:', msg)
        send({ type: 'error', message: msg })
        const mock = generateMockFutures(optionA, optionB)
        send({
          type: 'complete',
          result: { ...mock, decision, dataInsights, sourceTrustInsights, source: 'mock', _error: `Stream: ${msg}` },
        })
      }

      ctrl.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// ─── Groq streaming ───────────────────────────────────────────────────────────

async function streamGroq(
  prompt: string,
  decision: string,
  dataInsights: DataInsights | undefined,
  sourceTrustInsights: SourceTrustInsights | undefined,
  send: (e: StreamEvent) => void
) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    const { optionA, optionB } = parseDecision(decision)
    const mock = generateMockFutures(optionA, optionB)
    send({ type: 'complete', result: { ...mock, decision, dataInsights, sourceTrustInsights, source: 'mock' } })
    return
  }

  send({ type: 'status', phase: 'generating', message: 'Simulating your parallel worlds…' })

  // Try 70b first, fall back to 8b on 429
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
  let groqRes: Response | null = null

  for (const model of models) {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        max_tokens: 4000,
        stream: true,
        messages: [
          { role: 'system', content: 'You are a life simulation engine. Always respond with valid JSON only. No markdown.' },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (r.ok) {
      groqRes = r
      console.log(`[stream] Model: ${model}`)
      break
    }
    if (r.status === 429 && model === models[0]) {
      send({ type: 'status', phase: 'generating', message: 'Rate limit hit — switching model…' })
      continue
    }
    throw new Error(`Groq ${r.status}: ${await r.text()}`)
  }

  if (!groqRes?.body) throw new Error('No Groq response body')

  // ── Read SSE chunks from Groq ────────────────────────────────────────────
  const reader = groqRes.body.getReader()
  const decoder = new TextDecoder()
  let accumulated = ''
  let sseBuffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    sseBuffer += decoder.decode(value, { stream: true })
    const lines = sseBuffer.split('\n')
    sseBuffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (raw === '[DONE]') continue

      try {
        const chunk = JSON.parse(raw)
        const token: string = chunk.choices?.[0]?.delta?.content ?? ''
        if (token) {
          accumulated += token
          send({ type: 'token', token, total: accumulated.length })
        }
      } catch { /* skip malformed chunk */ }
    }
  }

  // ── Parse final JSON ──────────────────────────────────────────────────────
  const clean = accumulated
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim()

  const parsed = JSON.parse(clean) as Omit<SimulateResponse, 'decision' | 'source' | 'dataInsights' | '_error'>
  send({ type: 'complete', result: { ...parsed, decision, dataInsights, sourceTrustInsights, source: 'groq' } })
}
