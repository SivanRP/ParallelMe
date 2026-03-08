import type { SimulateResponse } from '@/app/api/simulate/route'

const SHARE_KEY = 'parallelme_shares'
const MAX_SHARES = 25

interface ShareEntry {
  data: SimulateResponse
  timestamp: number
}

function getAll(): Record<string, ShareEntry> {
  try {
    const raw = localStorage.getItem(SHARE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(shares: Record<string, ShareEntry>) {
  // Prune to MAX_SHARES most recent
  const keys = Object.keys(shares).sort((a, b) => shares[b].timestamp - shares[a].timestamp)
  const pruned: Record<string, ShareEntry> = {}
  keys.slice(0, MAX_SHARES).forEach((k) => { pruned[k] = shares[k] })
  localStorage.setItem(SHARE_KEY, JSON.stringify(pruned))
}

export function saveShare(data: SimulateResponse): string {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  const shares = getAll()
  shares[id] = { data, timestamp: Date.now() }
  writeAll(shares)
  return id
}

export function loadShare(id: string): SimulateResponse | null {
  try {
    return getAll()[id]?.data ?? null
  } catch {
    return null
  }
}
