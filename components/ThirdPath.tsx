'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronDown, GitBranch } from 'lucide-react'
import type { SimulateResponse } from '@/app/api/simulate/route'
import type { ThirdPathResponse } from '@/app/api/third-path/route'

const COLOR = '#2ECC71'
const BG    = '#F0FFF4'

function MilestoneBlock({ m, index }: { m: ThirdPathResponse['milestones'][number]; index: number }) {
  const [open, setOpen] = useState(index === 0)
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.09, duration: 0.4 }}
      className="rounded-2xl border-2 overflow-hidden"
      style={{ borderColor: COLOR }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left"
        style={{ background: open ? BG : 'white' }}
      >
        <span className="text-2xl shrink-0">{m.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: COLOR }}>Year {m.year}</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full border" style={{ color: COLOR, borderColor: COLOR }}>
              {m.metric}
            </span>
          </div>
          <p className="text-sm font-black text-[#111] truncate">{m.title}</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-[#aaa]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1" style={{ background: BG }}>
              <p className="text-xs font-medium text-[#444] leading-relaxed mb-3">{m.description}</p>
              {m.memory && (
                <div className="rounded-xl border-l-4 pl-3 pr-2 py-2" style={{ borderColor: COLOR, background: 'white' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: COLOR }}>Memory</p>
                  <p className="text-xs italic font-medium text-[#444] leading-relaxed">"{m.memory}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface ThirdPathProps {
  data: SimulateResponse
}

export function ThirdPath({ data }: ThirdPathProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'revealed'>('idle')
  const [thirdPath, setThirdPath] = useState<ThirdPathResponse | null>(null)

  const reveal = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/third-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: data.decision ?? '',
          optionA: data.optionA.label,
          optionB: data.optionB.label,
        }),
      })
      const json: ThirdPathResponse = await res.json()
      setThirdPath(json)
      setStatus('revealed')
    } catch {
      setStatus('idle')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55 }}
      className="mt-12"
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#2ECC71] bg-[#F0FFF4] px-4 py-1.5 text-xs font-black text-[#2ECC71] shadow-[2px_2px_0_#2ECC71] mb-4">
          <GitBranch size={12} /> Hidden Path
        </div>
        <h2 className="text-2xl font-black text-[#111]">
          The{' '}
          <span className="relative inline-block text-[#2ECC71]">
            Third Path
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 100 6" preserveAspectRatio="none">
              <path d="M2,4 Q25,1 50,3 Q75,5 98,2" stroke="#2ECC71" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="mt-3 text-sm font-medium text-[#777] max-w-sm mx-auto">
          Most people only see two options. The AI found a third.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div key="idle" className="text-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97, x: 3, y: 3 }}
              onClick={reveal}
              className="btn-chunky inline-flex items-center gap-3 px-8 py-4 text-base font-black text-white"
              style={{ background: '#2ECC71', boxShadow: '4px 4px 0 #1a8a4a' }}
            >
              <Sparkles size={18} />
              Reveal the Third Path
            </motion.button>
            <p className="mt-3 text-xs font-bold text-[#aaa]">
              {data.optionA.label} vs {data.optionB.label} — what are they both missing?
            </p>
          </motion.div>
        )}

        {status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
              className="h-10 w-10 rounded-full border-4 border-[#2ECC71]/20 border-t-[#2ECC71]"
            />
            <p className="text-sm font-black text-[#555]">AI is searching for the hidden path…</p>
          </motion.div>
        )}

        {status === 'revealed' && thirdPath && (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ease: [0.34, 1.56, 0.64, 1], duration: 0.5 }}
          >
            {/* Path header card */}
            <div
              className="rounded-2xl border-2 p-6 mb-6"
              style={{ borderColor: COLOR, boxShadow: `5px 5px 0 ${COLOR}`, background: BG }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="h-12 w-12 shrink-0 rounded-xl border-2 border-[#111] flex items-center justify-center text-xl font-black text-white shadow-[3px_3px_0_#111]"
                  style={{ background: COLOR }}
                >
                  C
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: COLOR }}>Path C — Hidden Option</p>
                  <p className="text-xl font-black text-[#111] capitalize mb-1">{thirdPath.label}</p>
                  <p className="text-sm font-medium text-[#555]">{thirdPath.tagline}</p>
                </div>
              </div>

              {thirdPath.thirdPathReason && (
                <div className="mt-4 rounded-xl border border-[#2ECC71]/30 bg-white px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#2ECC71] mb-1">Why most people miss this</p>
                  <p className="text-xs font-medium text-[#555] leading-relaxed">{thirdPath.thirdPathReason}</p>
                </div>
              )}
            </div>

            {/* Milestones */}
            <div className="space-y-3">
              {thirdPath.milestones?.map((m, i) => (
                <MilestoneBlock key={m.year} m={m} index={i} />
              ))}
            </div>

            {/* Mini metrics */}
            {thirdPath.timeline && (
              <div className="mt-5 brutal-card p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#aaa] mb-3">Year 10 projection</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['income', 'stress', 'freedom'] as const).map((key) => {
                    const val = thirdPath.timeline[2]?.[key] ?? 0
                    return (
                      <div key={key} className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#aaa] mb-1">{key}</p>
                        <div className="h-2 rounded-full bg-[#f0f0eb] overflow-hidden mb-1">
                          <div className="h-full rounded-full" style={{ width: `${val}%`, background: COLOR }} />
                        </div>
                        <p className="text-xs font-black" style={{ color: COLOR }}>{val}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
