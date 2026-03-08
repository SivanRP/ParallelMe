'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useMemo } from 'react'
import type { SimulateResponse, TimelinePoint } from '@/app/api/simulate/route'

const NODES = [
  { key: 'wealth',    label: 'Wealth',   emoji: '💰', angle: -90  },
  { key: 'joy',       label: 'Joy',      emoji: '😊', angle: -18  },
  { key: 'clarity',   label: 'Clarity',  emoji: '🧠', angle:  54  },
  { key: 'bonds',     label: 'Bonds',    emoji: '🤝', angle:  126 },
  { key: 'freedom',   label: 'Freedom',  emoji: '🕊️', angle:  198 },
] as const

type NodeKey = typeof NODES[number]['key']

const CX = 150, CY = 155, R = 95

function polar(deg: number, r: number) {
  const rad = (deg * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function interpolate(timeline: TimelinePoint[], year: number, key: 'income' | 'stress' | 'freedom') {
  const t0 = timeline[0], t1 = timeline[1], t2 = timeline[2]
  if (year <= 1) return t0[key]
  if (year >= 10) return t2[key]
  const [from, to, t] = year <= 5 ? [t0, t1, (year - 1) / 4] : [t1, t2, (year - 5) / 5]
  return lerp(from[key], to[key], t)
}

function deriveNodes(timeline: TimelinePoint[], year: number): Record<NodeKey, number> {
  const inc  = interpolate(timeline, year, 'income')
  const st   = interpolate(timeline, year, 'stress')
  const free = interpolate(timeline, year, 'freedom')
  return {
    wealth:  inc,
    joy:     Math.max(0, free * 0.55 + (100 - st) * 0.45),
    clarity: Math.max(0, (100 - st) * 0.65 + inc * 0.35),
    bonds:   Math.max(0, free * 0.45 + (100 - st) * 0.35 + inc * 0.20),
    freedom: free,
  }
}

function Constellation({ metrics, color, gradId, inView, delay = 0 }: {
  metrics: Record<NodeKey, number>
  color: string
  gradId: string
  inView: boolean
  delay?: number
}) {
  const points = NODES.map((n) => polar(n.angle, (metrics[n.key] / 100) * R))
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'

  return (
    <>
      <motion.path
        d={d}
        fill={`url(#${gradId})`}
        stroke="none"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: delay + 0.5, duration: 0.6 }}
      />
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ delay, duration: 1.4, ease: 'easeOut' }}
      />
      {/* Glowing spoke lines from centre */}
      {points.map((p, i) => (
        <motion.line
          key={i}
          x1={CX} y1={CY} x2={p.x} y2={p.y}
          stroke={color}
          strokeWidth={1}
          strokeOpacity={0.3}
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ delay: delay + 0.3 + i * 0.06, duration: 0.6 }}
        />
      ))}
      {/* Node dots */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x} cy={p.y} r={6}
          fill={color}
          stroke="white"
          strokeWidth={2.5}
          initial={{ scale: 0, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          style={{ transformOrigin: `${p.x}px ${p.y}px` }}
          transition={{ delay: delay + 0.7 + i * 0.07, duration: 0.35, ease: 'backOut' }}
        />
      ))}
    </>
  )
}

interface ConstellationMapProps {
  data: SimulateResponse
  year?: number
}

export function ConstellationMap({ data, year = 10 }: ConstellationMapProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const metricsA = useMemo(() => deriveNodes(data.optionA.timeline, year), [data, year])
  const metricsB = useMemo(() => deriveNodes(data.optionB.timeline, year), [data, year])

  const ringPts = (pct: number) =>
    NODES.map((n) => polar(n.angle, (pct / 100) * R))
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55 }}
      className="mt-10"
    >
      <div className="mb-5 text-center">
        <h2 className="text-2xl font-black text-[#111]">
          Life{' '}
          <span className="relative inline-block text-[#2ECC71]">
            Constellation
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 140 6" preserveAspectRatio="none">
              <path d="M2,4 Q35,1 70,3 Q105,5 138,2" stroke="#2ECC71" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="mt-2 text-sm font-medium text-[#777]">Each path leaves a unique signature across every dimension of life</p>
      </div>

      <div className="brutal-card p-6 max-w-sm mx-auto">
        <svg viewBox="0 0 300 310" className="w-full overflow-visible">
          <defs>
            <radialGradient id="cgA" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF4757" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#FF4757" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cgB" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1E90FF" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#1E90FF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background glow ring */}
          <circle cx={CX} cy={CY} r={R + 12} fill="url(#cgA)" />

          {/* Grid rings */}
          {[25, 50, 75, 100].map((pct) => (
            <path key={pct} d={ringPts(pct)} fill="none"
              stroke="#e8e8e3"
              strokeWidth={pct === 50 ? 1.5 : 1}
              strokeDasharray={pct === 50 ? '4,3' : '2,4'}
            />
          ))}

          {/* Ring % labels */}
          {[25, 50, 75].map((pct) => {
            const pt = polar(NODES[0].angle, (pct / 100) * R)
            return (
              <text key={pct} x={pt.x + 6} y={pt.y - 2}
                fontSize={7} fill="#ccc" fontFamily="monospace">{pct}</text>
            )
          })}

          {/* Constellations — B behind A */}
          <Constellation metrics={metricsB} color="#1E90FF" gradId="cgB" inView={inView} delay={0.15} />
          <Constellation metrics={metricsA} color="#FF4757" gradId="cgA" inView={inView} delay={0} />

          {/* Centre dot */}
          <circle cx={CX} cy={CY} r={4} fill="#111" />

          {/* Axis labels */}
          {NODES.map((n) => {
            const pos = polar(n.angle, R + 26)
            return (
              <text key={n.key} x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={9.5} fontWeight="800" fill="#333" fontFamily="system-ui, sans-serif"
              >
                {n.emoji} {n.label}
              </text>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-1 border-t-2 border-[#f0f0eb] pt-4">
          {[
            { label: data.optionA.label, color: '#FF4757' },
            { label: data.optionB.label, color: '#1E90FF' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[11px] font-bold text-[#444] capitalize">{label}</span>
            </div>
          ))}
        </div>

        {/* Score grid */}
        <div className="mt-4 grid grid-cols-5 gap-1">
          {NODES.map((n) => {
            const a = Math.round(metricsA[n.key])
            const b = Math.round(metricsB[n.key])
            const winsA = a > b, winsB = b > a
            return (
              <div key={n.key} className="text-center">
                <p className="text-sm mb-0.5">{n.emoji}</p>
                <p className={`text-[10px] font-black ${winsA ? 'text-[#FF4757]' : 'text-[#ccc]'}`}>{a}</p>
                <p className={`text-[10px] font-black ${winsB ? 'text-[#1E90FF]' : 'text-[#ccc]'}`}>{b}</p>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
