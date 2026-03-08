'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useMemo } from 'react'
import type { SimulateResponse } from '@/app/api/simulate/route'

// ─── Geometry helpers ──────────────────────────────────────────────────────

const AXES = ['Income', 'Freedom', 'Stress'] as const
type Axis = (typeof AXES)[number]

const ANGLES: Record<Axis, number> = {
  Income: -90,
  Freedom: 150,
  Stress: 30,
}

const CX = 140
const CY = 130
const R = 100

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) }
}

function toPoints(income: number, stress: number, freedom: number) {
  const vals: Record<Axis, number> = { Income: income, Stress: stress, Freedom: freedom }
  return AXES.map((axis) => {
    const r = (vals[axis] / 100) * R
    return polar(ANGLES[axis], r)
  })
}

function pointsToPath(pts: { x: number; y: number }[]) {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + ' Z'
}

const GRID_RINGS = [25, 50, 75, 100]

function GridRing({ pct }: { pct: number }) {
  const pts = AXES.map((axis) => polar(ANGLES[axis], (pct / 100) * R))
  return <path d={pointsToPath(pts)} fill="none" stroke="#e5e5e0" strokeWidth={1.5} />
}

// ─── Animated polygon ──────────────────────────────────────────────────────

interface PolygonProps {
  income: number
  stress: number
  freedom: number
  color: string
  fillColor: string
  inView: boolean
  delay?: number
}

function Polygon({ income, stress, freedom, color, fillColor, inView, delay = 0 }: PolygonProps) {
  const pts = toPoints(income, stress, freedom)
  const d = pointsToPath(pts)
  return (
    <motion.path
      d={d}
      fill={fillColor}
      stroke={color}
      strokeWidth={2.5}
      strokeLinejoin="round"
      initial={{ opacity: 0, scale: 0 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
      style={{ transformOrigin: `${CX}px ${CY}px` }}
      transition={{ duration: 0.8, delay, ease: [0.34, 1.56, 0.64, 1] }}
    />
  )
}

function AxisDots({ income, stress, freedom, color, inView, delay = 0 }: {
  income: number; stress: number; freedom: number; color: string; inView: boolean; delay?: number
}) {
  const pts = toPoints(income, stress, freedom)
  return (
    <>
      {pts.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill={color}
          stroke="white"
          strokeWidth={2}
          initial={{ opacity: 0, scale: 0 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          style={{ transformOrigin: `${p.x}px ${p.y}px` }}
          transition={{ duration: 0.4, delay: delay + 0.6 + i * 0.08, ease: 'backOut' }}
        />
      ))}
    </>
  )
}

// ─── Year tabs ────────────────────────────────────────────────────────────────

const YEAR_OPTIONS = [1, 5, 10] as const
type Year = (typeof YEAR_OPTIONS)[number]

function YearTabs({ selected, onChange }: { selected: Year; onChange: (y: Year) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border-2 border-[#111] bg-white p-1 shadow-[3px_3px_0px_#111]">
      {YEAR_OPTIONS.map((y) => (
        <button
          key={y}
          onClick={() => onChange(y)}
          className={`relative px-4 py-1.5 rounded-lg text-xs font-black transition-all duration-150 ${
            selected === y
              ? 'bg-[#111] text-white'
              : 'text-[#666] hover:text-[#111]'
          }`}
        >
          Year {y}
        </button>
      ))}
    </div>
  )
}

// ─── Score pill ────────────────────────────────────────────────────────────────

function ScorePill({ label, valA, valB }: { label: string; valA: number; valB: number }) {
  const diff = valA - valB
  return (
    <div className="flex flex-col items-center gap-1 min-w-[72px]">
      <span className="text-[9px] font-black uppercase tracking-widest text-[#aaa]">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-black text-[#FF4757]">{valA}</span>
        <span className="text-[10px] text-[#ccc]">vs</span>
        <span className="text-sm font-black text-[#1E90FF]">{valB}</span>
      </div>
      <span className={`text-[10px] font-black ${
        diff > 0 ? 'text-[#FF4757]' : diff < 0 ? 'text-[#1E90FF]' : 'text-[#aaa]'
      }`}>
        {diff > 0 ? `A +${diff}` : diff < 0 ? `B +${Math.abs(diff)}` : 'Tied'}
      </span>
    </div>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────

export function ComparisonChart({ data }: { data: SimulateResponse }) {
  const [year, setYear] = useState<Year>(5)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const getMetrics = (option: SimulateResponse['optionA'], y: Year) =>
    option.timeline.find((t) => t.year === y) ?? option.timeline[option.timeline.length - 1]

  const a = useMemo(() => getMetrics(data.optionA, year), [data, year])
  const b = useMemo(() => getMetrics(data.optionB, year), [data, year])

  const axisLabelPositions = AXES.map((axis) => ({
    axis,
    ...polar(ANGLES[axis], R + 20),
  }))

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="mt-10"
    >
      <div className="mb-5 flex flex-col items-center gap-3 text-center">
        <h2 className="text-2xl font-black text-[#111]">
          Head-to-Head <span className="shimmer-text">Comparison</span>
        </h2>
        <p className="text-sm font-medium text-[#777] max-w-sm">
          How the two paths stack up across every dimension.
        </p>
        <YearTabs selected={year} onChange={setYear} />
      </div>

      <div className="mx-auto max-w-md brutal-card p-6">
        {/* SVG radar */}
        <svg viewBox="0 0 280 270" className="w-full overflow-visible">
          {GRID_RINGS.map((pct) => <GridRing key={pct} pct={pct} />)}

          {/* Spokes */}
          {AXES.map((axis) => {
            const tip = polar(ANGLES[axis], R)
            return (
              <line
                key={axis}
                x1={CX} y1={CY}
                x2={tip.x.toFixed(2)} y2={tip.y.toFixed(2)}
                stroke="#e0e0db"
                strokeWidth={1.5}
              />
            )
          })}

          {/* Ring % labels */}
          {GRID_RINGS.map((pct) => {
            const pt = polar(ANGLES.Income, (pct / 100) * R)
            return (
              <text key={pct} x={pt.x + 5} y={pt.y - 3} fontSize={7} fill="#bbb" fontFamily="monospace">
                {pct}
              </text>
            )
          })}

          {/* Path B (cyan) */}
          {b && (
            <>
              <Polygon income={b.income} stress={b.stress} freedom={b.freedom}
                color="#1E90FF" fillColor="rgba(30,144,255,0.12)" inView={inView} delay={0.1} />
              <AxisDots income={b.income} stress={b.stress} freedom={b.freedom}
                color="#1E90FF" inView={inView} delay={0.1} />
            </>
          )}

          {/* Path A (coral) */}
          {a && (
            <>
              <Polygon income={a.income} stress={a.stress} freedom={a.freedom}
                color="#FF4757" fillColor="rgba(255,71,87,0.12)" inView={inView} delay={0} />
              <AxisDots income={a.income} stress={a.stress} freedom={a.freedom}
                color="#FF4757" inView={inView} delay={0} />
            </>
          )}

          <circle cx={CX} cy={CY} r={3} fill="#111" />

          {/* Axis labels */}
          {axisLabelPositions.map(({ axis, x, y }) => (
            <text
              key={axis}
              x={x} y={y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={10} fontWeight="800" fill="#333"
              fontFamily="system-ui, sans-serif"
            >
              {axis}
            </text>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-[#FF4757] border border-[#FF4757]" />
            <span className="text-[11px] font-bold text-[#444] capitalize">{data.optionA.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-[#1E90FF] border border-[#1E90FF]" />
            <span className="text-[11px] font-bold text-[#444] capitalize">{data.optionB.label}</span>
          </div>
        </div>

        {/* Score pills */}
        {a && b && (
          <div className="mt-5 flex items-start justify-around border-t-2 border-[#f0f0eb] pt-4">
            <ScorePill label="Income" valA={a.income} valB={b.income} />
            <div className="h-10 w-0.5 bg-[#eee] self-center" />
            <ScorePill label="Stress" valA={a.stress} valB={b.stress} />
            <div className="h-10 w-0.5 bg-[#eee] self-center" />
            <ScorePill label="Freedom" valA={a.freedom} valB={b.freedom} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
