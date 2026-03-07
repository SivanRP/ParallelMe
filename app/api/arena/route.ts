import { NextRequest, NextResponse } from 'next/server'

type Vote = 'A' | 'B' | 'tie'

interface ArenaEntry {
  id: string
  name: string
  vote: Vote
  confidence: number
  rationale: string
  createdAt: number
}

declare global {
  // eslint-disable-next-line no-var
  var __arenaFallbackStore: Record<string, ArenaEntry[]> | undefined
}

const fallbackStore = global.__arenaFallbackStore ?? (global.__arenaFallbackStore = {})

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return { url, serviceKey }
}

async function getSupabaseEntries(room: string): Promise<ArenaEntry[]> {
  const cfg = supabaseConfig()
  if (!cfg) return []
  const res = await fetch(
    `${cfg.url}/rest/v1/arena_votes?room=eq.${encodeURIComponent(room)}&select=id,name,vote,confidence,rationale,created_at&order=created_at.desc`,
    {
      headers: {
        apikey: cfg.serviceKey,
        Authorization: `Bearer ${cfg.serviceKey}`,
      },
      cache: 'no-store',
    }
  )
  if (!res.ok) throw new Error(`Supabase GET ${res.status}`)
  const rows = await res.json()
  return (rows ?? []).map((r: any) => ({
    id: String(r.id),
    name: String(r.name ?? 'Unknown'),
    vote: (r.vote ?? 'tie') as Vote,
    confidence: Number(r.confidence ?? 3),
    rationale: String(r.rationale ?? ''),
    createdAt: new Date(r.created_at ?? Date.now()).getTime(),
  }))
}

async function insertSupabaseEntry(room: string, entry: Omit<ArenaEntry, 'id' | 'createdAt'>): Promise<ArenaEntry> {
  const cfg = supabaseConfig()
  if (!cfg) throw new Error('Supabase not configured')
  const res = await fetch(`${cfg.url}/rest/v1/arena_votes`, {
    method: 'POST',
    headers: {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      room,
      name: entry.name,
      vote: entry.vote,
      confidence: entry.confidence,
      rationale: entry.rationale,
    }),
  })
  if (!res.ok) throw new Error(`Supabase POST ${res.status}`)
  const rows = await res.json()
  const r = rows?.[0]
  return {
    id: String(r?.id ?? Date.now()),
    name: String(r?.name ?? entry.name),
    vote: (r?.vote ?? entry.vote) as Vote,
    confidence: Number(r?.confidence ?? entry.confidence),
    rationale: String(r?.rationale ?? entry.rationale),
    createdAt: new Date(r?.created_at ?? Date.now()).getTime(),
  }
}

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get('room')?.trim()
  if (!room) return NextResponse.json({ error: 'room is required' }, { status: 400 })

  try {
    const cfg = supabaseConfig()
    if (cfg) {
      const entries = await getSupabaseEntries(room)
      return NextResponse.json({ entries, backend: 'supabase' })
    }
    const entries = fallbackStore[room] ?? []
    return NextResponse.json({ entries, backend: 'fallback' })
  } catch (err) {
    console.error('[arena][GET]', err)
    const entries = fallbackStore[room] ?? []
    return NextResponse.json({ entries, backend: 'fallback' })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const room = String(body.room ?? '').trim()
  const name = String(body.name ?? '').trim().slice(0, 60)
  const vote = String(body.vote ?? 'tie') as Vote
  const confidence = Number(body.confidence ?? 3)
  const rationale = String(body.rationale ?? '').trim().slice(0, 420)

  if (!room || !name || !rationale) {
    return NextResponse.json({ error: 'room, name, rationale are required' }, { status: 400 })
  }
  if (!['A', 'B', 'tie'].includes(vote)) {
    return NextResponse.json({ error: 'invalid vote' }, { status: 400 })
  }

  const payload = {
    name,
    vote,
    confidence: Math.max(1, Math.min(5, confidence)),
    rationale,
  } as Omit<ArenaEntry, 'id' | 'createdAt'>

  try {
    const cfg = supabaseConfig()
    if (cfg) {
      const saved = await insertSupabaseEntry(room, payload)
      return NextResponse.json({ entry: saved, backend: 'supabase' })
    }

    const entry: ArenaEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      ...payload,
      createdAt: Date.now(),
    }
    fallbackStore[room] = [entry, ...(fallbackStore[room] ?? [])].slice(0, 250)
    return NextResponse.json({ entry, backend: 'fallback' })
  } catch (err) {
    console.error('[arena][POST]', err)
    const entry: ArenaEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      ...payload,
      createdAt: Date.now(),
    }
    fallbackStore[room] = [entry, ...(fallbackStore[room] ?? [])].slice(0, 250)
    return NextResponse.json({ entry, backend: 'fallback' })
  }
}

