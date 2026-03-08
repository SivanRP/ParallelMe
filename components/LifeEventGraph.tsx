'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useMemo } from 'react'
import type { SimulateResponse } from '@/app/api/simulate/route'

const W = 700
const H = 500
const CX = W / 2
const CY = H / 2
const R1 = 105  // milestone ring radius
const R2 = 210  // branch event ring radius
const R3 = 295  // consequence ring radius

function polar(angleDeg: number, r: number, cx = CX, cy = CY) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

// Path A: upper half (-170 → -10), Path B: lower half (10 → 170)
const MILESTONE_ANGLES_A = [-150, -90, -30]
const MILESTONE_ANGLES_B = [ 150,  90,  30]
const BRANCH_ANGLES_A    = [-170, -130, -70, -10]
const BRANCH_ANGLES_B    = [ 170,  130,  70,  10]
const CONSEQUENCE_SPREAD = 18

interface NodeProps {
  x: number; y: number; r: number
  fill: string; stroke: string
  emoji?: string; label?: string
  inView: boolean; delay?: number
  labelBelow?: boolean
}

function Node({ x, y, r, fill, stroke, emoji, label, inView, delay = 0, labelBelow = false }: NodeProps) {
  return (
    <g>
      <motion.circle
        cx={x} cy={y} r={r}
        fill={fill} stroke={stroke} strokeWidth={2.5}
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        style={{ transformOrigin: `${x}px ${y}px` }}
        transition={{ delay, duration: 0.4, ease: 'backOut' }}
      />
      {emoji && (
        <motion.text
          x={x} y={y + 1}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={r * 0.9}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: delay + 0.15 }}
        >
          {emoji}
        </motion.text>
      )}
      {label && (
        <motion.text
          x={x} y={labelBelow ? y + r + 11 : y - r - 8}
          textAnchor="middle"
          fontSize={8.5} fontWeight="800" fill="#333" fontFamily="system-ui, sans-serif"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: delay + 0.2 }}
        >
          {label.length > 12 ? label.slice(0, 11) + '…' : label}
        </motion.text>
      )}
    </g>
  )
}

function GlowLine({ x1, y1, x2, y2, color, inView, delay = 0, dashed = false }: {
  x1: number; y1: number; x2: number; y2: number
  color: string; inView: boolean; delay?: number; dashed?: boolean
}) {
  return (
    <motion.line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color} strokeWidth={1.8}
      strokeOpacity={0.5}
      strokeDasharray={dashed ? '4,3' : undefined}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={inView ? { pathLength: 1, opacity: 1 } : {}}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
    />
  )
}

interface LifeEventGraphProps {
  data: SimulateResponse
}

export function LifeEventGraph({ data }: LifeEventGraphProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const milestonesA = data.optionA.milestones.slice(0, 3)
  const milestonesB = data.optionB.milestones.slice(0, 3)
  const branchA     = data.optionA.branchEvents?.slice(0, 2) ?? []
  const branchB     = data.optionB.branchEvents?.slice(0, 2) ?? []

  // Build milestone nodes
  const mNodesA = useMemo(() => MILESTONE_ANGLES_A.map((a, i) => ({
    ...polar(a, R1),
    angle: a,
    m: milestonesA[i],
  })), [milestonesA])

  const mNodesB = useMemo(() => MILESTONE_ANGLES_B.map((a, i) => ({
    ...polar(a, R1),
    angle: a,
    m: milestonesB[i],
  })), [milestonesB])

  // Build branch event nodes
  const bNodesA = useMemo(() => BRANCH_ANGLES_A.map((a, i) => ({
    ...polar(a, R2),
    angle: a,
    ev: branchA[i % branchA.length],
  })), [branchA])

  const bNodesB = useMemo(() => BRANCH_ANGLES_B.map((a, i) => ({
    ...polar(a, R2),
    angle: a,
    ev: branchB[i % branchB.length],
  })), [branchB])

  // Consequence nodes (derived from branch event outcomes)
  const consNodesA = useMemo(() => bNodesA.slice(0, 3).map((b, i) => {
    const spread = (i - 1) * CONSEQUENCE_SPREAD
    return polar(b.angle + spread, R3)
  }), [bNodesA])

  const consNodesB = useMemo(() => bNodesB.slice(0, 3).map((b, i) => {
    const spread = (i - 1) * CONSEQUENCE_SPREAD
    return polar(b.angle - spread, R3)
  }), [bNodesB])

  const DELAY_BASE = 0.3

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55 }}
      className="mt-12"
    >
      <div className="mb-5 text-center">
        <h2 className="text-2xl font-black text-[#111]">
          Life{' '}
          <span className="relative inline-block text-[#FF8C00]">
            Event Graph
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 110 6" preserveAspectRatio="none">
              <path d="M2,4 Q27,1 55,3 Q82,5 108,2" stroke="#FF8C00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="mt-2 text-sm font-medium text-[#777]">
          One decision → hundreds of downstream consequences
        </p>
      </div>

      <div className="brutal-card p-3 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px]" style={{ height: Math.round(H * 0.75) }}>
          <defs>
            <radialGradient id="legGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFD60A" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FFD60A" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Background glow at center */}
          <circle cx={CX} cy={CY} r={R1 - 10} fill="url(#legGlow)" />

          {/* Ring guides */}
          {[R1, R2, R3].map((r, i) => (
            <circle key={i} cx={CX} cy={CY} r={r}
              fill="none" stroke="#f0f0eb" strokeWidth={1} strokeDasharray="3,5" />
          ))}

          {/* ── Lines: center → milestones ── */}
          {mNodesA.map((n, i) => (
            <GlowLine key={`cma${i}`} x1={CX} y1={CY} x2={n.x} y2={n.y}
              color="#FF4757" inView={inView} delay={DELAY_BASE + i * 0.08} />
          ))}
          {mNodesB.map((n, i) => (
            <GlowLine key={`cmb${i}`} x1={CX} y1={CY} x2={n.x} y2={n.y}
              color="#1E90FF" inView={inView} delay={DELAY_BASE + i * 0.08} />
          ))}

          {/* ── Lines: milestones → branch events ── */}
          {mNodesA.map((mn, mi) =>
            bNodesA.slice(mi * 1, mi * 1 + 2).map((bn, bi) => (
              <GlowLine key={`mba${mi}${bi}`} x1={mn.x} y1={mn.y} x2={bn.x} y2={bn.y}
                color="#FF4757" inView={inView} delay={DELAY_BASE + 0.4 + (mi + bi) * 0.07} dashed />
            ))
          )}
          {mNodesB.map((mn, mi) =>
            bNodesB.slice(mi * 1, mi * 1 + 2).map((bn, bi) => (
              <GlowLine key={`mbb${mi}${bi}`} x1={mn.x} y1={mn.y} x2={bn.x} y2={bn.y}
                color="#1E90FF" inView={inView} delay={DELAY_BASE + 0.4 + (mi + bi) * 0.07} dashed />
            ))
          )}

          {/* ── Lines: branch events → consequences ── */}
          {bNodesA.slice(0, 3).map((bn, i) => (
            <GlowLine key={`bca${i}`} x1={bn.x} y1={bn.y} x2={consNodesA[i].x} y2={consNodesA[i].y}
              color="#FF4757" inView={inView} delay={DELAY_BASE + 0.75 + i * 0.07} dashed />
          ))}
          {bNodesB.slice(0, 3).map((bn, i) => (
            <GlowLine key={`bcb${i}`} x1={bn.x} y1={bn.y} x2={consNodesB[i].x} y2={consNodesB[i].y}
              color="#1E90FF" inView={inView} delay={DELAY_BASE + 0.75 + i * 0.07} dashed />
          ))}

          {/* ── Consequence nodes (outer ring) ── */}
          {consNodesA.map((n, i) => (
            <Node key={`ca${i}`} {...n} r={9} fill="#FF4757" stroke="white"
              inView={inView} delay={DELAY_BASE + 1.0 + i * 0.06} />
          ))}
          {consNodesB.map((n, i) => (
            <Node key={`cb${i}`} {...n} r={9} fill="#1E90FF" stroke="white"
              inView={inView} delay={DELAY_BASE + 1.0 + i * 0.06} />
          ))}

          {/* ── Branch event nodes (middle ring) ── */}
          {bNodesA.map((n, i) => (
            <Node key={`ba${i}`} {...n} r={14} fill="white" stroke="#FF4757"
              emoji={n.ev?.year === 3 ? '🔀' : '⚡'}
              inView={inView} delay={DELAY_BASE + 0.65 + i * 0.07} />
          ))}
          {bNodesB.map((n, i) => (
            <Node key={`bb${i}`} {...n} r={14} fill="white" stroke="#1E90FF"
              emoji={n.ev?.year === 3 ? '🔀' : '⚡'}
              inView={inView} delay={DELAY_BASE + 0.65 + i * 0.07} />
          ))}

          {/* ── Milestone nodes (inner ring) ── */}
          {mNodesA.map((n, i) => (
            <Node key={`ma${i}`} {...n} r={20} fill="#FF4757" stroke="white"
              emoji={n.m?.emoji ?? '🌱'}
              label={`Yr ${n.m?.year}`}
              labelBelow={n.y < CY}
              inView={inView} delay={DELAY_BASE + 0.25 + i * 0.1} />
          ))}
          {mNodesB.map((n, i) => (
            <Node key={`mb${i}`} {...n} r={20} fill="#1E90FF" stroke="white"
              emoji={n.m?.emoji ?? '🔑'}
              label={`Yr ${n.m?.year}`}
              labelBelow={n.y > CY}
              inView={inView} delay={DELAY_BASE + 0.25 + i * 0.1} />
          ))}

          {/* ── Centre decision node ── */}
          <motion.circle cx={CX} cy={CY} r={36} fill="#FFD60A" stroke="#111" strokeWidth={3}
            filter="url(#glow)"
            initial={{ scale: 0 }} animate={inView ? { scale: 1 } : {}}
            style={{ transformOrigin: `${CX}px ${CY}px` }}
            transition={{ duration: 0.6, ease: 'backOut' }}
          />
          <motion.text x={CX} y={CY - 7} textAnchor="middle" dominantBaseline="middle"
            fontSize={9} fontWeight="900" fill="#111" fontFamily="system-ui"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.3 }}
          >
            YOUR
          </motion.text>
          <motion.text x={CX} y={CY + 5} textAnchor="middle" dominantBaseline="middle"
            fontSize={9} fontWeight="900" fill="#111" fontFamily="system-ui"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.35 }}
          >
            DECISION
          </motion.text>

          {/* Path labels */}
          {[
            { x: CX - R1 - 30, y: CY - 30, label: 'PATH A', color: '#FF4757' },
            { x: CX + R1 + 30, y: CY + 30, label: 'PATH B', color: '#1E90FF' },
          ].map(({ x, y, label, color }) => (
            <motion.text key={label} x={x} y={y} textAnchor="middle"
              fontSize={10} fontWeight="900" fill={color} fontFamily="system-ui"
              initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}
            >
              {label}
            </motion.text>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-5 mt-3 pt-3 border-t-2 border-[#f0f0eb]">
          {[
            { color: '#FF4757', label: `Path A — ${data.optionA.label}` },
            { color: '#1E90FF', label: `Path B — ${data.optionB.label}` },
            { color: '#FFD60A', label: 'Your Decision' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border-2 border-[#111]" style={{ background: color }} />
              <span className="text-[11px] font-bold text-[#555]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
