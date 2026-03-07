'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useMemo } from 'react'
import type { SimulateResponse, TimelinePoint } from '@/app/api/simulate/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Metric = 'income' | 'stress' | 'freedom'

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function interpolateYear(timeline: TimelinePoint[], year: number, metric: Metric): number {
  const t0 = timeline[0], t1 = timeline[1], t2 = timeline[2]
  if (year <= 1) return t0[metric]
  if (year >= 10) return t2[metric]
  const [from, to, t] = year <= 5
    ? [t0, t1, (year - 1) / 4]
    : [t1, t2, (year - 5) / 5]
  return lerp(from[metric], to[metric], t)
}

function generatePoints(timeline: TimelinePoint[], metric: Metric): number[] {
  return Array.from({ length: 10 }, (_, i) => interpolateYear(timeline, i + 1, metric))
}

// ─── SVG path helpers ─────────────────────────────────────────────────────────

const W = 580
const H = 240
const PAD = { l: 44, r: 32, t: 20, b: 40 }
const IW = W - PAD.l - PAD.r
const IH = H - PAD.t - PAD.b

function toSVG(pts: number[]): { x: number; y: number }[] {
  return pts.map((v, i) => ({
    x: PAD.l + (i / 9) * IW,
    y: PAD.t + (1 - v / 100) * IH,
  }))
}

// Smooth quadratic bezier through points
function smoothPath(svgPts: { x: number; y: number }[]): string {
  if (svgPts.length < 2) return ''
  let d = `M ${svgPts[0].x.toFixed(1)},${svgPts[0].y.toFixed(1)}`
  for (let i = 1; i < svgPts.length - 1; i++) {
    const curr = svgPts[i]
    const next = svgPts[i + 1]
    const mx = ((curr.x + next.x) / 2).toFixed(1)
    const my = ((curr.y + next.y) / 2).toFixed(1)
    d += ` Q ${curr.x.toFixed(1)},${curr.y.toFixed(1)} ${mx},${my}`
  }
  const last = svgPts[svgPts.length - 1]
  d += ` L ${last.x.toFixed(1)},${last.y.toFixed(1)}`
  return d
}

// Area fill path (line + close bottom)
function areaPath(svgPts: { x: number; y: number }[]): string {
  const line = smoothPath(svgPts)
  const bottom = PAD.t + IH
  const last = svgPts[svgPts.length - 1]
  const first = svgPts[0]
  return `${line} L ${last.x.toFixed(1)},${bottom} L ${first.x.toFixed(1)},${bottom} Z`
}

// ─── Metric tabs ──────────────────────────────────────────────────────────────

const TABS: { key: Metric; label: string; emoji: string; desc: string }[] = [
  { key: 'income',  label: 'Income',  emoji: '💰', desc: 'Financial trajectory over the decade' },
  { key: 'stress',  label: 'Stress',  emoji: '🧠', desc: 'Mental load each path puts on you' },
  { key: 'freedom', label: 'Freedom', emoji: '🕊️', desc: 'How much of your life you own' },
]

// ─── Animated line ─────────────────────────────────────────────────────────────

function AnimatedLine({ d, color, gradId, inView, delay = 0 }: {
  d: string
  color: string
  gradId: string
  inView: boolean
  delay?: number
}) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
      transition={{ duration: 1.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    />
  )
}

// Animate an area fill by fading it in after the line finishes
function AnimatedArea({ d, gradId, inView, delay = 0 }: {
  d: string
  gradId: string
  inView: boolean
  delay?: number
}) {
  return (
    <motion.path
      d={d}
      fill={`url(#${gradId})`}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6, delay: delay + 1.6 }}
    />
  )
}

// ─── End label (value badge at end of line) ───────────────────────────────────

function EndLabel({ x, y, value, color, inView, delay = 0 }: {
  x: number; y: number; value: number; color: string; inView: boolean; delay?: number
}) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
      style={{ transformOrigin: `${x}px ${y}px` }}
      transition={{ duration: 0.4, delay: delay + 1.9, ease: 'backOut' }}
    >
      <circle cx={x} cy={y} r={14} fill="white" stroke={color} strokeWidth={2.5} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={9} fontWeight="800" fill={color} fontFamily="system-ui, sans-serif">
        {Math.round(value)}
      </text>
    </motion.g>
  )
}

// ─── Main chart ───────────────────────────────────────────────────────────────

export function LifeArcChart({ data }: { data: SimulateResponse }) {
  const [metric, setMetric] = useState<Metric>('income')
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const { ptsA, ptsB, svgA, svgB, lineA, lineB, areaA, areaB } = useMemo(() => {
    const ptsA = generatePoints(data.optionA.timeline, metric)
    const ptsB = generatePoints(data.optionB.timeline, metric)
    const svgA = toSVG(ptsA)
    const svgB = toSVG(ptsB)
    return {
      ptsA, ptsB, svgA, svgB,
      lineA: smoothPath(svgA),
      lineB: smoothPath(svgB),
      areaA: areaPath(svgA),
      areaB: areaPath(svgB),
    }
  }, [data, metric])

  const endA = svgA[svgA.length - 1]
  const endB = svgB[svgB.length - 1]
  const activeTab = TABS.find((t) => t.key === metric)!

  // Y-axis grid values
  const gridLines = [0, 25, 50, 75, 100]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="mt-10"
    >
      {/* Section header */}
      <div className="mb-5 text-center">
        <h2 className="text-2xl font-black text-[#111]">
          Life{' '}
          <span className="relative inline-block">
            Trajectory
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 120 6" preserveAspectRatio="none">
              <path d="M2,4 Q30,1 60,3 Q90,5 118,2" stroke="#FF4757" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </svg>
          </span>
        </h2>
        <p className="mt-2 text-sm font-medium text-[#777]">{activeTab.desc}</p>
      </div>

      <div className="brutal-card p-5 overflow-hidden">
        {/* Tabs */}
        <div className="mb-5 flex gap-2 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMetric(tab.key)}
              className={`flex items-center gap-1.5 rounded-xl border-2 px-3.5 py-1.5 text-xs font-black transition-all duration-150 ${
                metric === tab.key
                  ? 'border-[#111] bg-[#111] text-white shadow-[2px_2px_0_#111]'
                  : 'border-[#ddd] bg-white text-[#555] hover:border-[#111]'
              }`}
            >
              <span>{tab.emoji}</span> {tab.label}
            </button>
          ))}

          {/* Legend */}
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-6 rounded-full bg-[#FF4757]" />
              <span className="text-[11px] font-bold text-[#444] capitalize truncate max-w-[80px]">{data.optionA.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-6 rounded-full bg-[#1E90FF]" />
              <span className="text-[11px] font-bold text-[#444] capitalize truncate max-w-[80px]">{data.optionB.label}</span>
            </div>
          </div>
        </div>

        {/* SVG chart */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[320px]" style={{ height: 240 }}>
            <defs>
              <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF4757" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#FF4757" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E90FF" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#1E90FF" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            {gridLines.map((v) => {
              const y = PAD.t + (1 - v / 100) * IH
              return (
                <g key={v}>
                  <line x1={PAD.l} y1={y} x2={PAD.l + IW} y2={y} stroke="#e5e5e0" strokeWidth={1} strokeDasharray={v === 50 ? '4,3' : '2,3'} />
                  <text x={PAD.l - 6} y={y + 1} textAnchor="end" dominantBaseline="middle"
                    fontSize={8} fill="#bbb" fontFamily="monospace">
                    {v}
                  </text>
                </g>
              )
            })}

            {/* X-axis year labels */}
            {[1, 3, 5, 7, 10].map((yr) => {
              const x = PAD.l + ((yr - 1) / 9) * IW
              return (
                <g key={yr}>
                  <line x1={x} y1={PAD.t} x2={x} y2={PAD.t + IH} stroke="#f0f0eb" strokeWidth={1} />
                  <text x={x} y={PAD.t + IH + 14} textAnchor="middle"
                    fontSize={9} fill="#aaa" fontWeight="700" fontFamily="system-ui, sans-serif">
                    Yr {yr}
                  </text>
                </g>
              )
            })}

            {/* Area fills (behind lines) */}
            <AnimatedArea d={areaA} gradId="gradA" inView={inView} delay={0} />
            <AnimatedArea d={areaB} gradId="gradB" inView={inView} delay={0.15} />

            {/* Lines */}
            <AnimatedLine d={lineB} color="#1E90FF" gradId="gradB" inView={inView} delay={0.15} />
            <AnimatedLine d={lineA} color="#FF4757" gradId="gradA" inView={inView} delay={0} />

            {/* Milestone dots at Year 1, 5, 10 */}
            {[0, 4, 9].map((i) => (
              <g key={i}>
                <motion.circle
                  cx={svgA[i].x} cy={svgA[i].y} r={4}
                  fill="#FF4757" stroke="white" strokeWidth={2}
                  initial={{ scale: 0 }} animate={inView ? { scale: 1 } : { scale: 0 }}
                  style={{ transformOrigin: `${svgA[i].x}px ${svgA[i].y}px` }}
                  transition={{ delay: 0.2 + i * 0.1 + 1.6, ease: 'backOut', duration: 0.3 }}
                />
                <motion.circle
                  cx={svgB[i].x} cy={svgB[i].y} r={4}
                  fill="#1E90FF" stroke="white" strokeWidth={2}
                  initial={{ scale: 0 }} animate={inView ? { scale: 1 } : { scale: 0 }}
                  style={{ transformOrigin: `${svgB[i].x}px ${svgB[i].y}px` }}
                  transition={{ delay: 0.35 + i * 0.1 + 1.6, ease: 'backOut', duration: 0.3 }}
                />
              </g>
            ))}

            {/* End labels */}
            <EndLabel x={endA.x} y={endA.y} value={ptsA[9]} color="#FF4757" inView={inView} delay={0} />
            <EndLabel x={endB.x} y={endB.y} value={ptsB[9]} color="#1E90FF" inView={inView} delay={0.15} />
          </svg>
        </div>

        {/* Year 10 delta callout */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 2.2, duration: 0.4 }}
          className="mt-3 flex items-center justify-center gap-3"
        >
          {(() => {
            const finalA = Math.round(ptsA[9])
            const finalB = Math.round(ptsB[9])
            const diff = Math.abs(finalA - finalB)
            const leader = finalA > finalB ? 'A' : 'B'
            const leaderColor = leader === 'A' ? '#FF4757' : '#1E90FF'
            const loserColor = leader === 'A' ? '#1E90FF' : '#FF4757'
            if (diff < 3) {
              return <span className="text-xs font-black text-[#aaa] uppercase tracking-widest">Year 10 — essentially tied</span>
            }
            return (
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#111] bg-[#111] px-4 py-1.5 shadow-[2px_2px_0_#111]">
                <span className="text-xs font-black" style={{ color: leaderColor }}>Path {leader}</span>
                <span className="text-xs text-white opacity-50">leads by</span>
                <span className="text-xs font-black text-[#FFD60A]">{diff} pts</span>
                <span className="text-xs text-white opacity-50">at Year 10</span>
              </div>
            )
          })()}
        </motion.div>
      </div>
    </motion.div>
  )
}
