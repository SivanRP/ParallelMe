'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'
import type { SimulateResponse, UserProfile } from '@/app/api/simulate/route'
import { loadContext } from '@/components/ContextPanel'
import { normalizeSimulateResponse } from '@/lib/normalizeSimulate'

// ─── Status row ───────────────────────────────────────────────────────────────

function StatusRow({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {done ? (
        <CheckCircle2 size={12} className="shrink-0 text-[#2ECC71]" />
      ) : active ? (
        <Loader2 size={12} className="shrink-0 text-[#1E90FF] animate-spin" />
      ) : (
        <div className="h-3 w-3 shrink-0 rounded-full border border-[#9aa0b4]" />
      )}
      <span
        className="text-[11px] font-bold"
        style={{ color: done ? '#1f7a45' : active ? '#232737' : '#7d8398' }}
      >
        {label}
      </span>
    </div>
  )
}

// ─── Step config ─────────────────────────────────────────────────────────────
// Steps visually "complete" at these progress % thresholds

const STEPS = [
  { label: 'Scanning real-world signals', threshold: 20 },
  { label: 'Forging Path A storyline', threshold: 50 },
  { label: 'Forging Path B storyline', threshold: 80 },
  { label: 'Polishing your universe map', threshold: 99 },
]

// ─── Main component ───────────────────────────────────────────────────────────

interface StreamingPanelProps {
  decision: string
  profile?: UserProfile
  onComplete: (data: SimulateResponse) => void
}

export function StreamingPanel({ decision, profile, onComplete }: StreamingPanelProps) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stepDone  = STEPS.map((s) => progress >= s.threshold)
  const activeIdx = stepDone.findIndex((d) => !d)

  useEffect(() => {
    // Guard against React StrictMode double-invocation
    if (fetchedRef.current) return
    fetchedRef.current = true

    // Animate progress independently — slows as it approaches 97%
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 97) return prev
        const increment = Math.max(0.3, (97 - prev) * 0.035)
        return Math.min(97, prev + increment)
      })
    }, 300)

    ;(async () => {
      try {
        const context = loadContext()
        const res = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision, profile, context }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const raw = await res.json()
        const data = normalizeSimulateResponse(raw, decision) as SimulateResponse

        if (timerRef.current) clearInterval(timerRef.current)
        setProgress(100)
        setDone(true)
        setTimeout(() => onComplete(data), 600)
      } catch (err) {
        if (timerRef.current) clearInterval(timerRef.current)
        setError(String(err))
        console.error('[StreamingPanel]', err)
      }
    })()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-[28px] border-2 border-[#111]/15 bg-white shadow-[0_20px_40px_rgba(45,60,102,0.16)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#111]/10 bg-gradient-to-r from-[#fff6cf] via-[#f7faff] to-[#e8f4ff] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#111]/10 bg-white">
            <span className="text-sm">🧪</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#535a70]">
            ParallelMe Forge Lab
          </span>
        </div>
        {!done && (
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#111]/10 bg-white px-2 py-1"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-[#1E90FF]" />
            <span className="text-[9px] font-black text-[#1E90FF]">COOKING</span>
          </motion.div>
        )}
      </div>

      {/* Body */}
      <div className="min-h-[300px] bg-[#f8fbff] px-5 py-5">
        {error ? (
          <div className="rounded-2xl border-2 border-[#ff4757]/25 bg-[#fff5f5] p-4 text-[#FF4757] text-xs space-y-1">
            <p>Simulation failed. Please try again.</p>
            <p className="text-[#8a90a5] break-all text-[10px]">{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="rounded-xl border border-[#111]/10 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#535a70]">
                Decision
              </div>
              <div className="rounded-xl border border-[#111]/10 bg-white px-3 py-1 text-xs font-bold text-[#2b3042]">
                {decision}
              </div>
            </div>

            {/* Status steps */}
            <div className="mb-5 grid gap-2 sm:grid-cols-2">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12 }}
                  className={`rounded-2xl border px-3 py-2 ${
                    stepDone[i]
                      ? 'border-[#2ECC71]/35 bg-[#effff6]'
                      : activeIdx === i
                      ? 'border-[#1E90FF]/35 bg-[#eef6ff]'
                      : 'border-[#111]/10 bg-white'
                  }`}
                >
                  <StatusRow
                    label={step.label}
                    done={stepDone[i]}
                    active={activeIdx === i}
                  />
                </motion.div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#ff4757]/25 bg-[#fff2f4] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#ff4757]/35 bg-[#ff4757] text-xs font-black text-white">A</div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#d73746]">Path A</p>
                </div>
                <motion.div
                  className="h-2 rounded-full bg-[#ffd8de]"
                  animate={{ scaleX: [0.35, 0.75, 0.55] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformOrigin: 'left' }}
                />
              </div>
              <div className="rounded-2xl border border-[#1E90FF]/25 bg-[#edf6ff] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#1E90FF]/35 bg-[#1E90FF] text-xs font-black text-white">B</div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#1E90FF]">Path B</p>
                </div>
                <motion.div
                  className="h-2 rounded-full bg-[#d4e8ff]"
                  animate={{ scaleX: [0.28, 0.78, 0.52] }}
                  transition={{ duration: 1.45, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                  style={{ transformOrigin: 'left' }}
                />
              </div>
            </div>

            <AnimatePresence>
              {!done && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-xs font-semibold text-[#7d8398]"
                >
                  Crafting outcomes with live context and your profile...
                </motion.p>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Progress bar */}
      <div className="bg-white border-t border-[#111]/10 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-[#e8eefc] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: done ? '#2ECC71' : 'linear-gradient(90deg, #1E90FF 0%, #8B5CF6 100%)' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-[10px] font-black text-[#5f6477] shrink-0 w-9 text-right">
            {Math.round(progress)}%
          </span>
        </div>
        <p className="mt-1 text-[10px] font-semibold text-[#7d8398]">
          {done ? 'Simulation complete' : 'Simulating your parallel worlds…'}
        </p>
      </div>
    </motion.div>
  )
}
