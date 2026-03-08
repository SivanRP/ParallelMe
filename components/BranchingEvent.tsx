'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { BranchEvent, StoryMilestone, TimelinePoint } from '@/app/api/simulate/route'
import type { BranchResult } from '@/app/api/branch/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreBadge({ label, value }: { label: string; value: number }) {
  const color = label === 'stress'
    ? value > 65 ? '#FF4757' : value > 40 ? '#FFD60A' : '#2ECC71'
    : value > 65 ? '#2ECC71' : value > 40 ? '#FFD60A' : '#FF4757'

  const Icon = label === 'stress'
    ? value > 65 ? TrendingUp : value < 40 ? TrendingDown : Minus
    : value > 65 ? TrendingUp : value < 40 ? TrendingDown : Minus

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-[#eee] bg-white px-2.5 py-1.5">
      <Icon size={10} style={{ color }} />
      <span className="text-[9px] font-black uppercase tracking-widest text-[#aaa]">{label}</span>
      <span className="text-xs font-black" style={{ color }}>{value}</span>
    </div>
  )
}

// ─── Regenerated milestone card ────────────────────────────────────────────────

function RegeneratedMilestone({
  milestone,
  timelinePoint,
  color,
  index,
}: {
  milestone: StoryMilestone
  timelinePoint?: TimelinePoint
  color: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.12, ease: [0.34, 1.56, 0.64, 1], duration: 0.5 }}
      className="rounded-2xl border-2 border-[#111] bg-white shadow-[3px_3px_0_#111] overflow-hidden"
    >
      {/* Colored top bar */}
      <div className="h-1" style={{ background: color }} />

      <div className="p-4">
        {/* Year + emoji */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div
              className="rounded-lg border-2 border-[#111] px-2 py-0.5 text-[9px] font-black shadow-[1px_1px_0_#111]"
              style={{ background: color, color: '#fff' }}
            >
              YEAR {milestone.year}
            </div>
            <span className="text-base">{milestone.emoji}</span>
          </div>
          {timelinePoint && (
            <div className="flex items-center gap-1">
              <ScoreBadge label="income" value={timelinePoint.income} />
              <ScoreBadge label="stress" value={timelinePoint.stress} />
            </div>
          )}
        </div>

        {/* Title */}
        <p className="text-sm font-black text-[#111] leading-tight mb-1.5">{milestone.title}</p>

        {/* Description */}
        <p className="text-[11px] font-medium text-[#555] leading-relaxed mb-2.5">{milestone.description}</p>

        {/* Memory — italicized first-person */}
        <div className="rounded-xl border border-[#f0f0eb] bg-[#FAFAF7] px-3 py-2">
          <p className="text-[10px] font-medium text-[#777] italic leading-snug">"{milestone.memory}"</p>
        </div>

        {/* Metric */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
          <p className="text-[10px] font-black text-[#333]">{milestone.metric}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Single branch event card ──────────────────────────────────────────────────

interface BranchingEventCardProps {
  event: BranchEvent
  pathLabel: string
  color: string
  decision: string
  originalMilestones: StoryMilestone[]
  originalTimeline: TimelinePoint[]
}

export function BranchingEventCard({
  event,
  pathLabel,
  color,
  decision,
  originalMilestones,
  originalTimeline,
}: BranchingEventCardProps) {
  const [chosen, setChosen] = useState<'A' | 'B' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [branchResult, setBranchResult] = useState<BranchResult | null>(null)
  const bgTint = color === '#FF4757' ? '#FFF5F5' : '#F0F6FF'

  async function handleChoose(choice: 'A' | 'B') {
    if (chosen) return  // locked once chosen
    setChosen(choice)
    setIsLoading(true)
    setBranchResult(null)

    const choiceData = choice === 'A' ? event.choiceA : event.choiceB

    try {
      const res = await fetch('/api/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          pathLabel,
          branchYear: event.year,
          choiceLabel: choiceData.label,
          choiceOutcome: choiceData.outcome,
          originalMilestones,
          originalTimeline,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as BranchResult
      setBranchResult(data)
    } catch (err) {
      console.error('[BranchingEvent] fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const chosenData = chosen === 'A' ? event.choiceA : chosen === 'B' ? event.choiceB : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      className="mt-4"
    >
      <div
        className="rounded-2xl border-2 p-5"
        style={{ borderColor: color, boxShadow: `4px 4px 0 ${color}20`, background: bgTint }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2"
            style={{ borderColor: color, background: 'white' }}
          >
            <GitBranch size={12} style={{ color }} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>
              Year {event.year} — Branch Moment
            </p>
            <p className="text-[11px] font-bold text-[#777]">{pathLabel} path</p>
          </div>
        </div>

        <p className="text-sm font-black text-[#111] mb-4 leading-snug">{event.prompt}</p>

        {/* Choice buttons — locked after selection */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {([
            { key: 'A' as const, data: event.choiceA },
            { key: 'B' as const, data: event.choiceB },
          ] as const).map(({ key, data }) => {
            const isChosen = chosen === key
            const isOther = chosen !== null && chosen !== key

            return (
              <motion.button
                key={key}
                whileTap={!chosen ? { scale: 0.96, x: 2, y: 2 } : {}}
                onClick={() => handleChoose(key)}
                disabled={!!chosen}
                className={`rounded-xl border-2 p-3 text-left transition-all duration-200 ${
                  isChosen
                    ? 'translate-x-[2px] translate-y-[2px] shadow-none'
                    : isOther
                    ? 'opacity-35 scale-[0.97] border-[#eee] bg-white cursor-not-allowed'
                    : 'border-[#ddd] bg-white hover:border-[#111] hover:shadow-[3px_3px_0_#111] cursor-pointer'
                }`}
                style={isChosen ? { borderColor: color, background: color + '15', boxShadow: 'none' } : {}}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-black text-[#111]">{data.label}</p>
                  {isChosen && (
                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full" style={{ background: color, color: '#fff' }}>
                      chosen
                    </span>
                  )}
                </div>
                {!chosen && (
                  <p className="text-[10px] text-[#aaa] font-medium">Tap to simulate →</p>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Result section */}
        <AnimatePresence mode="wait">
          {chosen && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Immediate outcome */}
              <div
                className="rounded-xl border-2 p-3.5 mb-4"
                style={{ borderColor: color, background: 'white' }}
              >
                <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color }}>
                  Immediate outcome
                </p>
                <p className="text-sm font-semibold text-[#222] leading-relaxed">
                  {chosenData?.outcome}
                </p>
              </div>

              {/* Loading state */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 rounded-xl border border-[#eee] bg-white px-4 py-3"
                >
                  <Loader2 size={14} className="animate-spin shrink-0" style={{ color }} />
                  <div>
                    <p className="text-xs font-black text-[#111]">Simulating your new future…</p>
                    <p className="text-[10px] font-medium text-[#aaa]">
                      Re-running years {event.year + 1}–10 based on this choice
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Regenerated milestones */}
              {branchResult && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-[#eee]" />
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
                      Your new timeline after this choice
                    </p>
                    <div className="h-px flex-1 bg-[#eee]" />
                  </div>

                  <div className="space-y-3">
                    {branchResult.milestones.map((milestone, i) => {
                      const tp = branchResult.timeline.find(t => t.year === milestone.year)
                      return (
                        <RegeneratedMilestone
                          key={milestone.year}
                          milestone={milestone}
                          timelinePoint={tp}
                          color={color}
                          index={i}
                        />
                      )
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setChosen(null)
                      setBranchResult(null)
                    }}
                    className="mt-3 text-[10px] font-black text-[#aaa] hover:text-[#111] underline underline-offset-2 transition-colors"
                  >
                    ← Try the other path
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Branch events list ────────────────────────────────────────────────────────

interface BranchEventsProps {
  branchEvents: BranchEvent[]
  pathLabel: string
  color: string
  decision: string
  originalMilestones: StoryMilestone[]
  originalTimeline: TimelinePoint[]
}

export function BranchEvents({
  branchEvents,
  pathLabel,
  color,
  decision,
  originalMilestones,
  originalTimeline,
}: BranchEventsProps) {
  if (!branchEvents?.length) return null

  return (
    <div className="mt-5 space-y-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#aaa] mb-2 px-1">
        Branch moments — choose and see your future change
      </p>
      {branchEvents.map((ev) => (
        <BranchingEventCard
          key={ev.year}
          event={ev}
          pathLabel={pathLabel}
          color={color}
          decision={decision}
          originalMilestones={originalMilestones}
          originalTimeline={originalTimeline}
        />
      ))}
    </div>
  )
}
