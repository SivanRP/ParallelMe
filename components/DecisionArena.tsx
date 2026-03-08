'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { SimulateResponse } from '@/app/api/simulate/route'

type Vote = 'A' | 'B' | 'tie'

interface ArenaEntry {
  id: string
  name: string
  vote: Vote
  confidence: number
  rationale: string
  createdAt: number
}

function roomFromData(data: SimulateResponse, roomId?: string) {
  if (roomId && roomId.trim()) return roomId.trim()
  return `local_${data.decision}_${data.optionA.label}_${data.optionB.label}`
}

function fallbackKey(room: string) {
  return `arena_local_${room}`
}

interface DecisionArenaProps {
  data: SimulateResponse
  roomId?: string
}

export function DecisionArena({ data, roomId }: DecisionArenaProps) {
  const room = roomFromData(data, roomId)
  const [name, setName] = useState('')
  const [vote, setVote] = useState<Vote>('A')
  const [confidence, setConfidence] = useState(3)
  const [rationale, setRationale] = useState('')
  const [entries, setEntries] = useState<ArenaEntry[]>([])
  const [backend, setBackend] = useState<'supabase' | 'fallback' | 'loading'>('loading')

  const loadFallback = () => {
    try {
      const raw = localStorage.getItem(fallbackKey(room))
      const local = raw ? JSON.parse(raw) as ArenaEntry[] : []
      setEntries(local)
      setBackend('fallback')
    } catch {
      setEntries([])
      setBackend('fallback')
    }
  }

  const loadEntries = async () => {
    try {
      const res = await fetch(`/api/arena?room=${encodeURIComponent(room)}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setEntries(json.entries ?? [])
      setBackend(json.backend === 'supabase' ? 'supabase' : 'fallback')
      if (json.backend !== 'supabase') {
        localStorage.setItem(fallbackKey(room), JSON.stringify(json.entries ?? []))
      }
    } catch {
      loadFallback()
    }
  }

  useEffect(() => {
    loadEntries()
    const t = setInterval(loadEntries, 7000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room])

  const addEntry = async () => {
    if (!name.trim() || !rationale.trim()) return

    const payload = {
      room,
      name: name.trim(),
      vote,
      confidence,
      rationale: rationale.trim(),
    }

    try {
      const res = await fetch('/api/arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const entry = json.entry as ArenaEntry
      const next = [entry, ...entries]
      setEntries(next)
      if (json.backend !== 'supabase') {
        localStorage.setItem(fallbackKey(room), JSON.stringify(next))
      }
      setBackend(json.backend === 'supabase' ? 'supabase' : 'fallback')
    } catch {
      const entry: ArenaEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name: name.trim(),
        vote,
        confidence,
        rationale: rationale.trim(),
        createdAt: Date.now(),
      }
      const next = [entry, ...entries]
      setEntries(next)
      localStorage.setItem(fallbackKey(room), JSON.stringify(next))
      setBackend('fallback')
    }

    setName('')
    setRationale('')
    setConfidence(3)
  }

  const summary = useMemo(() => {
    const a = entries.filter((e) => e.vote === 'A')
    const b = entries.filter((e) => e.vote === 'B')
    const total = entries.length || 1
    const leader: Vote = a.length === b.length ? 'tie' : a.length > b.length ? 'A' : 'B'
    const dissent = entries.filter((e) => e.vote !== leader && leader !== 'tie')
    return {
      total: entries.length,
      aPct: Math.round((a.length / total) * 100),
      bPct: Math.round((b.length / total) * 100),
      tiePct: Math.max(0, 100 - Math.round((a.length / total) * 100) - Math.round((b.length / total) * 100)),
      leader,
      dissent,
    }
  }, [entries])

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className="comic-note px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#5f6477]">Decision Arena (Multiplayer)</span>
        <span className="text-xs font-bold text-[#8a90a5]">Room: {room.slice(0, 18)}...</span>
        <span className={`text-[10px] font-black uppercase tracking-widest ${backend === 'supabase' ? 'text-[#2ECC71]' : 'text-[#FF8C00]'}`}>
          {backend === 'loading' ? 'syncing...' : backend}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="comic-card p-4">
          <p className="mb-2 text-sm font-black text-[#111]">Add a vote</p>
          <div className="space-y-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-xl border border-[#111]/20 bg-white px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button onClick={() => setVote('A')} className={`comic-chip px-3 py-1 text-xs font-black ${vote === 'A' ? 'bg-[#FF4757] text-white' : 'bg-white text-[#111]'}`}>A</button>
              <button onClick={() => setVote('B')} className={`comic-chip px-3 py-1 text-xs font-black ${vote === 'B' ? 'bg-[#1E90FF] text-white' : 'bg-white text-[#111]'}`}>B</button>
              <button onClick={() => setVote('tie')} className={`comic-chip px-3 py-1 text-xs font-black ${vote === 'tie' ? 'bg-[#111] text-white' : 'bg-white text-[#111]'}`}>Tie</button>
            </div>
            <label className="text-xs font-semibold text-[#5f6477]">Confidence: {confidence}/5</label>
            <input type="range" min={1} max={5} value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="w-full" />
            <textarea value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Why this vote?" rows={3} className="w-full rounded-xl border border-[#111]/20 bg-white px-3 py-2 text-sm" />
            <button onClick={addEntry} className="btn-chunky bg-[#111] px-4 py-2 text-sm text-white">Submit vote</button>
          </div>
        </div>

        <div className="comic-card p-4">
          <p className="text-sm font-black text-[#111]">Arena scoreboard</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-[#ffe4e8] p-2"><p className="text-xs font-black">A</p><p className="text-lg font-black">{summary.aPct}%</p></div>
            <div className="rounded-xl bg-[#f3f4f8] p-2"><p className="text-xs font-black">Tie</p><p className="text-lg font-black">{summary.tiePct}%</p></div>
            <div className="rounded-xl bg-[#e6f2ff] p-2"><p className="text-xs font-black">B</p><p className="text-lg font-black">{summary.bPct}%</p></div>
          </div>
          <p className="mt-3 text-sm font-semibold text-[#2b3042]">Consensus: {summary.leader === 'tie' ? 'No consensus' : `Path ${summary.leader}`}</p>
          <p className="text-xs text-[#6a7188]">Votes collected: {summary.total}</p>
          {summary.dissent.length > 0 && (
            <div className="mt-3 rounded-xl border border-[#111]/10 bg-white p-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#8a90a5]">Dissent highlights</p>
              {summary.dissent.slice(0, 2).map((d, i) => (
                <p key={i} className="mt-1 text-xs text-[#4f556b]">{d.name}: \"{d.rationale}\"</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}
