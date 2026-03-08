'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import type { SimulateResponse, SimulateOption } from '@/app/api/simulate/route'

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function fullLifeStats(opt: SimulateOption) {
  const t0 = opt.timeline[0], t1 = opt.timeline[1], t2 = opt.timeline[2]
  // Extrapolate to ~age 70 (another 30 years after decade, regressing toward 50)
  const extrapolate = (v: number) => Math.round(lerp(v, 50, 0.35))
  const finalIncome  = extrapolate(t2.income)
  const finalStress  = extrapolate(t2.stress)
  const finalFreedom = extrapolate(t2.freedom)

  const peakIncome  = Math.max(t0.income, t1.income, t2.income)
  const peakStress  = Math.max(t0.stress, t1.stress, t2.stress)
  const score       = Math.round(t2.income * 0.35 + t2.freedom * 0.40 - t2.stress * 0.25 + 15)

  const arcWord =
    score >= 70 ? 'Flourishing' :
    score >= 50 ? 'Resilient'   :
    score >= 35 ? 'Complicated' :
                  'Turbulent'

  const legacyLine =
    score >= 70 ? 'You built something worth leaving behind.'       :
    score >= 50 ? 'You carried the weight — and made it count.'     :
    score >= 35 ? 'The story was messy, but it was undeniably yours.' :
                  'You paid a price most people won\'t admit to.'

  return { finalIncome, finalStress, finalFreedom, peakIncome, peakStress, score, arcWord, legacyLine }
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-black">
        <span className="uppercase tracking-widest text-[#888]">{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-[#f0f0eb] overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }} whileInView={{ width: `${value}%` }}
          viewport={{ once: true }} transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function PathDossier({ opt, isA }: { opt: SimulateOption; isA: boolean }) {
  const color   = isA ? '#FF4757' : '#1E90FF'
  const badge   = isA ? 'A' : 'B'
  const bgLight = isA ? '#FFF5F5' : '#F0F6FF'
  const stats   = fullLifeStats(opt)

  const AGES = [
    { age: 'Birth',    event: 'You arrive in the world.' },
    { age: 'Year 0',   event: `You face the decision: ${opt.label}.` },
    { age: 'Year 1',   event: opt.milestones[0]?.title ?? '—' },
    { age: 'Year 5',   event: opt.milestones[1]?.title ?? '—' },
    { age: 'Year 10',  event: opt.milestones[2]?.title ?? '—' },
    { age: '~Year 40', event: `Life arc: ${stats.arcWord}.` },
    { age: '~Year 70', event: stats.legacyLine },
    { age: 'The End',  event: '.' },
  ]

  return (
    <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: color, boxShadow: `4px 4px 0 ${color}` }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b-2" style={{ borderColor: color, background: bgLight }}>
        <div className="h-10 w-10 rounded-xl border-2 border-[#111] flex items-center justify-center font-black text-white shadow-[3px_3px_0_#111]"
          style={{ background: color, fontSize: 18 }}>
          {badge}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#888]">Path {badge} — Life File</p>
          <p className="text-base font-black text-[#111] capitalize">{opt.label}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#aaa]">Life Score</p>
          <p className="text-2xl font-black" style={{ color }}>{stats.score}</p>
        </div>
      </div>

      <div className="p-5 space-y-5" style={{ background: bgLight }}>
        {/* Timeline */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#aaa] mb-3">Life Timeline</p>
          <div className="space-y-2">
            {AGES.map(({ age, event }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-3 w-3 rounded-full border-2 mt-0.5 shrink-0"
                    style={{ borderColor: color, background: i === 0 || i === AGES.length - 1 ? color : 'white' }} />
                  {i < AGES.length - 1 && <div className="w-0.5 h-4 mt-0.5" style={{ background: `${color}40` }} />}
                </div>
                <div className="pb-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#aaa]">{age} </span>
                  <span className={`text-xs font-semibold ${i === AGES.length - 1 ? 'text-[#aaa] italic' : 'text-[#333]'}`}>
                    {event}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#aaa] mb-3">Full-life projections</p>
          <div className="space-y-2.5">
            <StatBar label="Income trajectory"  value={stats.finalIncome}  color={color} />
            <StatBar label="Stress load"        value={stats.finalStress}  color={color} />
            <StatBar label="Freedom retained"   value={stats.finalFreedom} color={color} />
          </div>
        </div>

        {/* Peak stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border-2 p-3 text-center bg-white" style={{ borderColor: `${color}40` }}>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#aaa] mb-1">Peak Income</p>
            <p className="text-xl font-black" style={{ color }}>{stats.peakIncome}</p>
          </div>
          <div className="rounded-xl border-2 p-3 text-center bg-white" style={{ borderColor: `${color}40` }}>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#aaa] mb-1">Peak Stress</p>
            <p className="text-xl font-black" style={{ color }}>{stats.peakStress}</p>
          </div>
        </div>

        {/* Legacy line */}
        <div className="rounded-xl border-2 border-[#111] bg-white px-4 py-3 text-center shadow-[3px_3px_0_#111]">
          <p className="text-[9px] font-black uppercase tracking-widest text-[#aaa] mb-1">Final verdict</p>
          <p className="text-sm font-black" style={{ color }}>{stats.arcWord}</p>
          <p className="text-xs text-[#555] font-medium mt-1">{stats.legacyLine}</p>
        </div>
      </div>
    </div>
  )
}

interface LifeSummaryReportProps {
  data: SimulateResponse
}

export function LifeSummaryReport({ data }: LifeSummaryReportProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55 }}
      className="mt-12"
    >
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#111] bg-[#FFD60A] px-4 py-1.5 text-xs font-black text-[#111] shadow-[3px_3px_0_#111] mb-4">
          📋 Life Dossier
        </div>
        <h2 className="text-2xl font-black text-[#111]">
          From Decision to{' '}
          <span className="relative inline-block text-[#FF4757]">
            Death
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 55 6" preserveAspectRatio="none">
              <path d="M2,4 Q13,1 27,3 Q41,5 53,2" stroke="#FF4757" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="mt-3 text-sm font-medium text-[#777] max-w-sm mx-auto">
          Both paths projected across an entire lifetime.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PathDossier opt={data.optionA} isA={true} />
        <PathDossier opt={data.optionB} isA={false} />
      </div>

      {/* Bottom stamp */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        className="mt-6 text-center"
      >
        <div className="inline-flex items-center gap-3 rounded-full border-2 border-dashed border-[#ddd] px-6 py-2.5">
          <span className="text-lg">⏳</span>
          <p className="text-xs font-black text-[#888]">
            Projections are illustrative. Your actual mileage will vary — dramatically.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
