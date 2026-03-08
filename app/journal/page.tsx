'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Trash2, RotateCcw, BookOpen } from 'lucide-react'
import { getJournal, deleteFromJournal, formatDate } from '@/lib/journal'
import type { JournalEntry } from '@/lib/journal'

function ScoreBadge({ score, color }: { score: number; color: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-black" style={{ color }}>{score}</p>
      <div className="h-1.5 w-10 rounded-full bg-[#f0f0eb] overflow-hidden mt-1">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, score)}%`, background: color }} />
      </div>
    </div>
  )
}

function EntryCard({ entry, onDelete, onRerun }: {
  entry: JournalEntry
  onDelete: (id: string) => void
  onRerun: (decision: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ ease: [0.34, 1.56, 0.64, 1], duration: 0.4 }}
      className="brutal-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b-2 border-[#f0f0eb]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#aaa] mb-1">
              {formatDate(entry.timestamp)}
            </p>
            <p className="text-base font-black text-[#111] leading-snug">{entry.decision}</p>
          </div>
          {entry.chosenPath && (
            <div
              className="shrink-0 h-8 w-8 rounded-xl border-2 border-[#111] flex items-center justify-center text-sm font-black text-white shadow-[2px_2px_0_#111]"
              style={{ background: entry.chosenPath === 'A' ? '#FF4757' : '#1E90FF' }}
            >
              {entry.chosenPath}
            </div>
          )}
        </div>
      </div>

      {/* Options + scores */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`rounded-xl border-2 p-3 ${entry.winner === 'A' ? 'border-[#FF4757] bg-[#FFF5F5]' : 'border-[#eee] bg-white'}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-4 w-4 rounded-md border border-[#111] bg-[#FF4757] text-[8px] font-black text-white flex items-center justify-center">A</div>
              <p className="text-[10px] font-black text-[#555] capitalize truncate">{entry.optionA}</p>
            </div>
            <ScoreBadge score={entry.scoreA} color="#FF4757" />
          </div>
          <div className={`rounded-xl border-2 p-3 ${entry.winner === 'B' ? 'border-[#1E90FF] bg-[#F0F6FF]' : 'border-[#eee] bg-white'}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-4 w-4 rounded-md border border-[#111] bg-[#1E90FF] text-[8px] font-black text-white flex items-center justify-center">B</div>
              <p className="text-[10px] font-black text-[#555] capitalize truncate">{entry.optionB}</p>
            </div>
            <ScoreBadge score={entry.scoreB} color="#1E90FF" />
          </div>
        </div>

        {/* Winner label */}
        <div className="flex items-center gap-2 mb-4">
          {entry.winner === 'tie' ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-[#aaa]">Closely matched</span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: entry.winner === 'A' ? '#FF4757' : '#1E90FF' }}>
              Path {entry.winner} had the edge
            </span>
          )}
          <span className="text-[9px] text-[#ddd] font-medium uppercase">{entry.source}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.96, x: 2, y: 2 }}
            onClick={() => onRerun(entry.decision)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#111] bg-[#111] px-3 py-2 text-xs font-black text-white shadow-[3px_3px_0_#555] hover:shadow-[1px_1px_0_#555] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          >
            <RotateCcw size={11} />
            Re-run simulation
          </motion.button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-xl border-2 border-[#eee] p-2 text-[#ccc] hover:border-[#FF4757] hover:text-[#FF4757] transition-all"
            >
              <Trash2 size={14} />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDelete(entry.id)}
                className="rounded-lg border-2 border-[#FF4757] bg-[#FF4757] px-2 py-1.5 text-[10px] font-black text-white"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border-2 border-[#eee] px-2 py-1.5 text-[10px] font-black text-[#aaa]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function JournalPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setEntries(getJournal())
    setLoaded(true)
  }, [])

  const handleDelete = (id: string) => {
    setEntries(deleteFromJournal(id))
  }

  const handleRerun = (decision: string) => {
    router.push(`/simulate?decision=${encodeURIComponent(decision)}`)
  }

  return (
    <main className="min-h-screen bg-[#FAFAF7] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">

        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/')}
          className="mb-8 inline-flex items-center gap-2 rounded-xl border-2 border-[#111] bg-white px-4 py-2 text-sm font-black text-[#111] shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
        >
          <ArrowLeft size={14} /> Home
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#111] bg-[#FFD60A] px-4 py-1.5 text-xs font-black text-[#111] shadow-[3px_3px_0_#111] mb-4">
            <BookOpen size={12} /> Decision Journal
          </div>
          <h1 className="text-4xl font-black text-[#111] leading-tight">
            Your{' '}
            <span className="relative inline-block text-[#FF4757]">
              Decisions
              <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 120 6" preserveAspectRatio="none">
                <path d="M2,4 Q30,1 60,3 Q90,5 118,2" stroke="#FF4757" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mt-3 text-sm font-medium text-[#777]">
            Every simulation you've saved. Re-run any of them in one click.
          </p>
        </motion.div>

        {/* Empty state */}
        {loaded && entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="brutal-card p-10 text-center"
          >
            <div className="text-4xl mb-4 font-black text-[#eee]">—</div>
            <p className="text-base font-black text-[#555]">Nothing saved yet.</p>
            <p className="text-sm font-medium text-[#aaa] mt-1">
              After a simulation, hit "Save to Journal" to capture it here.
            </p>
            <motion.button
              whileTap={{ scale: 0.97, x: 2, y: 2 }}
              onClick={() => router.push('/')}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-[#111] bg-[#111] px-5 py-2.5 text-sm font-black text-white shadow-[4px_4px_0_#555]"
            >
              Simulate a decision
            </motion.button>
          </motion.div>
        )}

        {/* Entry list */}
        {entries.length > 0 && (
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#aaa]">
              {entries.length} saved decision{entries.length !== 1 ? 's' : ''}
            </p>
            <AnimatePresence mode="popLayout">
              {entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDelete}
                  onRerun={handleRerun}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  )
}
