'use client'

import { motion, useInView, useSpring, useTransform, animate } from 'framer-motion'
import { useRef, useMemo, useEffect, useState } from 'react'
import type { SimulateResponse, TimelinePoint } from '@/app/api/simulate/route'

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function interpolateMetric(timeline: TimelinePoint[], year: number, key: 'income' | 'stress' | 'freedom'): number {
  const t0 = timeline[0], t1 = timeline[1], t2 = timeline[2]
  if (year <= 1) return t0[key]
  if (year >= 10) return t2[key]
  const [from, to, t] = year <= 5 ? [t0, t1, (year - 1) / 4] : [t1, t2, (year - 5) / 5]
  return lerp(from[key], to[key], t)
}

function computeScore(timeline: TimelinePoint[], year: number): number {
  const income  = interpolateMetric(timeline, year, 'income')
  const stress  = interpolateMetric(timeline, year, 'stress')
  const freedom = interpolateMetric(timeline, year, 'freedom')
  return Math.round(Math.max(0, Math.min(100, income * 0.35 + freedom * 0.40 - stress * 0.25 + 15)))
}

function CounterNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    const from = prev.current
    prev.current = value
    const ctrl = animate(from, value, {
      duration: 0.55,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => ctrl.stop()
  }, [value])

  return <>{display}</>
}

function ScoreBar({ value, color, label, prevValue }: {
  value: number; color: string; label: string; prevValue: number
}) {
  const trend = value > prevValue ? '↑' : value < prevValue ? '↓' : ''
  const trendColor = value > prevValue ? '#2ECC71' : '#FF4757'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-[#444] uppercase tracking-wide truncate max-w-[120px]">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {trend && (
            <motion.span
              key={`${value}-${trend}`}
              initial={{ opacity: 0, y: trend === '↑' ? 6 : -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[11px] font-black"
              style={{ color: trendColor }}
            >
              {trend}
            </motion.span>
          )}
          <span className="text-sm font-black tabular-nums" style={{ color }}>
            <CounterNumber value={value} />%
          </span>
        </div>
      </div>
      <div className="h-3.5 rounded-full bg-[#f0f0eb] border border-[#e5e5e0] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function ProbabilityZone({ value }: { value: number }) {
  if (value >= 67) return <span className="text-[10px] font-black text-[#2ECC71]">● Thriving</span>
  if (value >= 34) return <span className="text-[10px] font-black text-[#FFD60A]">● Trade-offs</span>
  return <span className="text-[10px] font-black text-[#FF4757]">● Tough road</span>
}

interface ProbabilityDriftProps {
  data: SimulateResponse
  year: number
}

export function ProbabilityDrift({ data, year }: ProbabilityDriftProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const prevYear = useRef(year)

  const scoreA = useMemo(() => computeScore(data.optionA.timeline, year), [data, year])
  const scoreB = useMemo(() => computeScore(data.optionB.timeline, year), [data, year])
  const prevA  = useMemo(() => computeScore(data.optionA.timeline, prevYear.current), [data])
  const prevB  = useMemo(() => computeScore(data.optionB.timeline, prevYear.current), [data])

  useEffect(() => { prevYear.current = year }, [year])

  const diff = scoreA - scoreB
  const leader = Math.abs(diff) > 2 ? (diff > 0 ? data.optionA.label : data.optionB.label) : null
  const leaderColor = diff > 0 ? '#FF4757' : '#1E90FF'

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="mt-10"
    >
      <div className="mb-5 text-center">
        <h2 className="text-2xl font-black text-[#111]">
          Future{' '}
          <span className="relative inline-block text-[#FFD60A]">
            Probability
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 120 6" preserveAspectRatio="none">
              <path d="M2,4 Q30,1 60,3 Q90,5 118,2" stroke="#FFD60A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </span>
          {' '}Drift
        </h2>
        <p className="mt-2 text-sm font-medium text-[#777]">
          Life optimization score — moves live with the timeline slider above
        </p>
      </div>

      <div className="brutal-card p-6">
        {/* Year indicator + leader */}
        <div className="mb-5 flex items-center justify-between">
          <motion.div
            key={Math.round(year)}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 rounded-xl border-2 border-[#111] bg-[#FFD60A] px-3 py-1.5 shadow-[3px_3px_0_#111]"
          >
            <span className="text-xs font-black text-[#111]">Year {Math.round(year)}</span>
          </motion.div>

          {leader ? (
            <motion.div
              key={`${leader}-${Math.abs(diff)}`}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[11px] font-black uppercase tracking-wide"
              style={{ color: leaderColor }}
            >
              {leader} +{Math.abs(diff)} pts ahead
            </motion.div>
          ) : (
            <span className="text-[11px] font-black text-[#aaa] uppercase tracking-wide">Neck and neck</span>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <ScoreBar value={scoreA} color="#FF4757" label={data.optionA.label} prevValue={prevA} />
            <div className="flex justify-end">
              <ProbabilityZone value={scoreA} />
            </div>
          </div>
          <div className="space-y-2">
            <ScoreBar value={scoreB} color="#1E90FF" label={data.optionB.label} prevValue={prevB} />
            <div className="flex justify-end">
              <ProbabilityZone value={scoreB} />
            </div>
          </div>
        </div>

        {/* Trajectory sparkline hint */}
        <div className="mt-5 border-t-2 border-[#f0f0eb] pt-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#aaa] mb-3">Score at each milestone</p>
          <div className="grid grid-cols-3 gap-2">
            {[1, 5, 10].map((yr) => {
              const a = computeScore(data.optionA.timeline, yr)
              const b = computeScore(data.optionB.timeline, yr)
              const active = Math.round(year) === yr
              return (
                <div
                  key={yr}
                  className={`rounded-xl border-2 p-2.5 text-center transition-all ${active ? 'border-[#111] bg-[#FFD60A] shadow-[2px_2px_0_#111]' : 'border-[#eee] bg-white'}`}
                >
                  <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${active ? 'text-[#111]' : 'text-[#aaa]'}`}>
                    Year {yr}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-xs font-black ${active ? 'text-[#FF4757]' : 'text-[#FF4757]/60'}`}>{a}</span>
                    <span className={`text-[9px] ${active ? 'text-[#111]/40' : 'text-[#ddd]'}`}>vs</span>
                    <span className={`text-xs font-black ${active ? 'text-[#1E90FF]' : 'text-[#1E90FF]/60'}`}>{b}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
