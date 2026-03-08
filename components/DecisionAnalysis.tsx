'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useMemo } from 'react'
import type { SimulateResponse } from '@/app/api/simulate/route'

// ─── Client-side metric derivation from existing timeline data ────────────────

function deriveMetrics(opt: SimulateResponse['optionA']) {
  const t = opt.timeline
  const [t0, t1, t2] = [t[0], t[1], t[2]]

  // Time Efficiency — how strong the early payoff is
  const timeEfficiency = Math.min(10, Math.max(1,
    Math.round((t0.income * 0.5 + t0.freedom * 0.3 + (100 - t0.stress) * 0.2) / 10)
  ))

  // Long-term Benefit — year-10 composite score
  const longTermBenefit = Math.min(10, Math.max(1,
    Math.round((t2.income * 0.45 + t2.freedom * 0.35 + (100 - t2.stress) * 0.2) / 10)
  ))

  // Stress Impact — avg stress across all years (higher = worse)
  const avgStress = (t0.stress + t1.stress + t2.stress) / 3
  const stressImpact = Math.min(10, Math.max(1, Math.round(avgStress / 10)))

  // Success Likelihood — upward income trend + strong year-10 outcomes
  const incomeTrend = t2.income - t0.income
  const successLikelihood = Math.min(10, Math.max(1,
    Math.round((t2.income * 0.55 + Math.max(0, incomeTrend) * 0.3 + t2.freedom * 0.15) / 10)
  ))

  // Opportunity Cost — what you give up (lower freedom + lower income = high opp cost)
  const opportunityCost = Math.min(10, Math.max(1,
    11 - Math.round((t2.freedom * 0.5 + t2.income * 0.3 + (100 - avgStress) * 0.2) / 10)
  ))

  return { timeEfficiency, longTermBenefit, stressImpact, successLikelihood, opportunityCost }
}

// ─── Bar cell ─────────────────────────────────────────────────────────────────

function MetricCell({ value, color, wins }: { value: number; color: string; wins: boolean }) {
  return (
    <td className="px-4 py-3 text-center">
      <div className="flex flex-col items-center gap-1.5">
        <span className={`text-sm font-black tabular-nums ${wins ? '' : 'text-[#bbb]'}`}
          style={wins ? { color } : {}}>
          {value}/10
          {wins && <span className="ml-1 text-[9px]">✓</span>}
        </span>
        <div className="h-1.5 w-14 rounded-full bg-[#f0f0eb] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: wins ? color : '#ddd' }}
            initial={{ width: 0 }}
            whileInView={{ width: `${value * 10}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </td>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DecisionAnalysis({ data }: { data: SimulateResponse }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const mA = useMemo(() => deriveMetrics(data.optionA), [data])
  const mB = useMemo(() => deriveMetrics(data.optionB), [data])

  const METRICS = [
    { label: 'Time Efficiency',      a: mA.timeEfficiency,    b: mB.timeEfficiency,    higherBetter: true  },
    { label: 'Long-term Benefit',    a: mA.longTermBenefit,   b: mB.longTermBenefit,   higherBetter: true  },
    { label: 'Stress Impact',        a: mA.stressImpact,      b: mB.stressImpact,      higherBetter: false },
    { label: 'Success Likelihood',   a: mA.successLikelihood, b: mB.successLikelihood, higherBetter: true  },
    { label: 'Opportunity Cost',     a: mA.opportunityCost,   b: mB.opportunityCost,   higherBetter: false },
  ]

  const scoreA = METRICS.reduce((s, m) => s + (m.higherBetter ? m.a : 10 - m.a), 0)
  const scoreB = METRICS.reduce((s, m) => s + (m.higherBetter ? m.b : 10 - m.b), 0)
  const leader = scoreA > scoreB + 2 ? 'A' : scoreB > scoreA + 2 ? 'B' : null

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55 }}
      className="mt-12"
    >
      {/* Header */}
      <div className="mb-5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#111] bg-white px-4 py-1.5 text-xs font-black text-[#111] shadow-[3px_3px_0_#111] mb-4">
          Decision Analysis
        </div>
        <h2 className="text-2xl font-black text-[#111]">
          Path{' '}
          <span className="relative inline-block text-[#FF8C00]">
            Breakdown
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 130 6" preserveAspectRatio="none">
              <path d="M2,4 Q32,1 65,3 Q98,5 128,2" stroke="#FF8C00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="mt-3 text-sm font-medium text-[#777]">
          Five dimensions. One decision.
        </p>
      </div>

      <div className="brutal-card overflow-hidden">
        <table className="w-full">
          {/* Column headers */}
          <thead>
            <tr className="border-b-2 border-[#f0f0eb]">
              <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#aaa] w-[40%]">
                Metric
              </th>
              <th className="px-4 py-3">
                <div className="flex items-center justify-center gap-1.5">
                  <div className="h-5 w-5 rounded-lg border-2 border-[#111] bg-[#FF4757] text-[10px] font-black text-white flex items-center justify-center shrink-0">A</div>
                  <span className="text-[10px] font-black text-[#555] capitalize truncate max-w-[80px]">{data.optionA.label}</span>
                </div>
              </th>
              <th className="px-4 py-3">
                <div className="flex items-center justify-center gap-1.5">
                  <div className="h-5 w-5 rounded-lg border-2 border-[#111] bg-[#1E90FF] text-[10px] font-black text-white flex items-center justify-center shrink-0">B</div>
                  <span className="text-[10px] font-black text-[#555] capitalize truncate max-w-[80px]">{data.optionB.label}</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {METRICS.map(({ label, a, b, higherBetter }, i) => {
              const aWins = higherBetter ? a > b : a < b
              const bWins = higherBetter ? b > a : b < a
              return (
                <motion.tr
                  key={label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="border-b border-[#f5f5f0] last:border-0"
                >
                  <td className="px-5 py-3 text-[11px] font-black text-[#555] uppercase tracking-wider">
                    {label}
                    <span className="block text-[9px] font-medium text-[#ccc] normal-case tracking-normal mt-0.5">
                      {higherBetter ? 'higher is better' : 'lower is better'}
                    </span>
                  </td>
                  <MetricCell value={a} color="#FF4757" wins={aWins} />
                  <MetricCell value={b} color="#1E90FF" wins={bWins} />
                </motion.tr>
              )
            })}
          </tbody>
        </table>

        {/* Summary footer */}
        <div className="border-t-2 border-[#f0f0eb] px-5 py-3 bg-[#FAFAF7]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#aaa]">Overall score</p>
              {leader && (
                <p className="text-xs font-black mt-0.5" style={{ color: leader === 'A' ? '#FF4757' : '#1E90FF' }}>
                  Path {leader} has the edge
                </p>
              )}
              {!leader && <p className="text-xs font-black text-[#aaa] mt-0.5">Closely matched</p>}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#FF4757]/60">Path A</p>
                <p className="text-xl font-black text-[#FF4757]">{scoreA}</p>
              </div>
              <span className="text-[#ddd] font-black">vs</span>
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#1E90FF]/60">Path B</p>
                <p className="text-xl font-black text-[#1E90FF]">{scoreB}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
