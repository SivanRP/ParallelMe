import { NextRequest, NextResponse } from 'next/server'
import { generateDecisionGraphs } from '@/lib/decisionGraphEngine'
import type { GraphResponse } from '@/lib/decisionGraphEngine'

export type { GraphResponse }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const decision: string = (body.decision ?? '').trim()
    const optionA: string = (body.optionA ?? '').trim()
    const optionB: string = (body.optionB ?? '').trim()

    if (!decision || !optionA || !optionB) {
      return NextResponse.json(
        { error: 'decision, optionA, and optionB are required' },
        { status: 400 }
      )
    }

    const result = await generateDecisionGraphs(decision, optionA, optionB)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[graph] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
