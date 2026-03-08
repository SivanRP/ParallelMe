'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import type { SimulateResponse } from '@/app/api/simulate/route'

const W = 620
const H = 280
const OX = 70   // origin X
const OY = H / 2 // origin Y
const TRACK_A_Y = OY - 72
const TRACK_B_Y = OY + 72

function yearX(yr: number) {
  return OX + ((yr - 1) / 9) * (W - OX - 40)
}

interface RippleTimelineProps {
  data: SimulateResponse
}

export function RippleTimeline({ data }: RippleTimelineProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const evA = data.optionA.milestones
  const evB = data.optionB.milestones

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
          Decision{' '}
          <span className="relative inline-block text-[#FF8C00]">
            Ripple
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 80 6" preserveAspectRatio="none">
              <path d="M2,4 Q20,1 40,3 Q60,5 78,2" stroke="#FF8C00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="mt-2 text-sm font-medium text-[#777]">One decision. A decade of cascading consequences.</p>
      </div>

      <div className="brutal-card p-4 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[500px]" style={{ height: H }}>

          {/* Expanding ripple rings from origin */}
          {[1, 2, 3].map((i) => (
            <motion.circle
              key={i}
              cx={OX} cy={OY}
              fill="none"
              stroke="#FFD60A"
              strokeWidth={2.5 - i * 0.5}
              initial={{ r: 0, opacity: 0.9 }}
              animate={inView ? { r: i * 60, opacity: 0 } : {}}
              transition={{
                duration: 2,
                delay: i * 0.35,
                repeat: Infinity,
                repeatDelay: 1.2,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Origin node */}
          <motion.circle
            cx={OX} cy={OY} r={24}
            fill="#FFD60A" stroke="#111" strokeWidth={2.5}
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            style={{ transformOrigin: `${OX}px ${OY}px` }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'backOut' }}
          />
          <text x={OX} y={OY - 4} textAnchor="middle" dominantBaseline="middle"
            fontSize={7} fontWeight="900" fill="#111" fontFamily="system-ui">YOU
          </text>
          <text x={OX} y={OY + 6} textAnchor="middle" dominantBaseline="middle"
            fontSize={6} fontWeight="700" fill="#111" fontFamily="system-ui">DECIDE
          </text>

          {/* Divergence lines from origin to first nodes */}
          <motion.line
            x1={OX + 22} y1={OY - 6}
            x2={yearX(1)} y2={TRACK_A_Y}
            stroke="#FF4757" strokeWidth={2} strokeOpacity={0.5} strokeDasharray="6,3"
            initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.5 }}
          />
          <motion.line
            x1={OX + 22} y1={OY + 6}
            x2={yearX(1)} y2={TRACK_B_Y}
            stroke="#1E90FF" strokeWidth={2} strokeOpacity={0.5} strokeDasharray="6,3"
            initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.6 }}
          />

          {/* Track A spine */}
          <motion.line
            x1={yearX(1)} y1={TRACK_A_Y}
            x2={yearX(10)} y2={TRACK_A_Y}
            stroke="#FF4757" strokeWidth={2} strokeOpacity={0.25}
            initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.8 }}
          />

          {/* Track B spine */}
          <motion.line
            x1={yearX(1)} y1={TRACK_B_Y}
            x2={yearX(10)} y2={TRACK_B_Y}
            stroke="#1E90FF" strokeWidth={2} strokeOpacity={0.25}
            initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.9 }}
          />

          {/* Path A milestones */}
          {evA.map((ev, i) => {
            const x = yearX(ev.year)
            const y = TRACK_A_Y
            return (
              <g key={`a${i}`}>
                {/* Impact drop-line */}
                <motion.line
                  x1={x} y1={y - 14} x2={x} y2={y - 28}
                  stroke="#FF4757" strokeWidth={1.5} strokeOpacity={0.4}
                  initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
                  transition={{ duration: 0.4, delay: 1.1 + i * 0.25 }}
                />
                {/* Node */}
                <motion.circle
                  cx={x} cy={y} r={17}
                  fill="white" stroke="#FF4757" strokeWidth={2.5}
                  initial={{ scale: 0 }}
                  animate={inView ? { scale: 1 } : {}}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                  transition={{ delay: 1.1 + i * 0.25, duration: 0.35, ease: 'backOut' }}
                />
                <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={13}>
                  {ev.emoji}
                </text>
                {/* Year label above */}
                <text x={x} y={y - 32} textAnchor="middle"
                  fontSize={8} fontWeight="800" fill="#FF4757" fontFamily="system-ui">
                  Yr {ev.year}
                </text>
                {/* Title below node */}
                <text x={x} y={y + 24} textAnchor="middle"
                  fontSize={7} fontWeight="700" fill="#FF4757" fontFamily="system-ui">
                  {ev.title.split(' ').slice(0, 2).join(' ')}
                </text>
              </g>
            )
          })}

          {/* Path B milestones */}
          {evB.map((ev, i) => {
            const x = yearX(ev.year)
            const y = TRACK_B_Y
            return (
              <g key={`b${i}`}>
                <motion.line
                  x1={x} y1={y + 14} x2={x} y2={y + 28}
                  stroke="#1E90FF" strokeWidth={1.5} strokeOpacity={0.4}
                  initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
                  transition={{ duration: 0.4, delay: 1.2 + i * 0.25 }}
                />
                <motion.circle
                  cx={x} cy={y} r={17}
                  fill="white" stroke="#1E90FF" strokeWidth={2.5}
                  initial={{ scale: 0 }}
                  animate={inView ? { scale: 1 } : {}}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                  transition={{ delay: 1.2 + i * 0.25, duration: 0.35, ease: 'backOut' }}
                />
                <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={13}>
                  {ev.emoji}
                </text>
                <text x={x} y={y + 32} textAnchor="middle"
                  fontSize={8} fontWeight="800" fill="#1E90FF" fontFamily="system-ui">
                  Yr {ev.year}
                </text>
                <text x={x} y={y - 24} textAnchor="middle"
                  fontSize={7} fontWeight="700" fill="#1E90FF" fontFamily="system-ui">
                  {ev.title.split(' ').slice(0, 2).join(' ')}
                </text>
              </g>
            )
          })}

          {/* Path labels at right end */}
          <text x={W - 10} y={TRACK_A_Y} textAnchor="end"
            fontSize={9} fontWeight="900" fill="#FF4757" fontFamily="system-ui">
            PATH A
          </text>
          <text x={W - 10} y={TRACK_B_Y} textAnchor="end"
            fontSize={9} fontWeight="900" fill="#1E90FF" fontFamily="system-ui">
            PATH B
          </text>

          {/* Centre dividing line */}
          <line x1={OX + 30} y1={OY} x2={W - 30} y2={OY}
            stroke="#f0f0eb" strokeWidth={1} strokeDasharray="6,4" />
        </svg>
      </div>
    </motion.div>
  )
}
