'use client'

import { useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef } from 'react'
import type { SimulateResponse } from '@/app/api/simulate/route'

interface Variables {
  riskTolerance: number   // 1–10
  effortLevel: number     // 1–10
  availableTime: number   // 1–10
}

const SLIDERS = [
  {
    key: 'riskTolerance' as const,
    label: 'Risk Tolerance',
    lo: 'Cautious',
    hi: 'Bold',
    effectA: 'income',
    effectDesc: 'affects income variance',
  },
  {
    key: 'effortLevel' as const,
    label: 'Effort Level',
    lo: 'Coasting',
    hi: 'All-in',
    effectA: 'freedom',
    effectDesc: 'affects long-term benefit',
  },
  {
    key: 'availableTime' as const,
    label: 'Available Time',
    lo: 'Very limited',
    hi: 'Plenty',
    effectA: 'stress',
    effectDesc: 'affects stress & speed',
  },
]

// Apply variable multipliers to a score (0-100 range)
function applyVars(baseScore: number, vars: Variables, type: 'income' | 'stress' | 'freedom'): number {
  const { riskTolerance, effortLevel, availableTime } = vars
  const riskFactor   = (riskTolerance - 5) * 1.5   // ±7.5
  const effortFactor = (effortLevel   - 5) * 1.2   // ±6
  const timeFactor   = (availableTime - 5) * 0.8   // ±4

  let delta = 0
  if (type === 'income')  delta = riskFactor * 0.5 + effortFactor * 0.4 + timeFactor * 0.1
  if (type === 'stress')  delta = -(availableTime - 5) * 2.5 + (riskTolerance - 5) * 1.2
  if (type === 'freedom') delta = timeFactor * 0.6 + effortFactor * 0.3 - (riskTolerance - 5) * 0.5

  return Math.min(100, Math.max(0, Math.round(baseScore + delta)))
}

function BarRow({ label, baseA, baseB, adjA, adjB }: {
  label: string
  baseA: number; baseB: number
  adjA: number; adjB: number
}) {
  const deltaA = adjA - baseA
  const deltaB = adjB - baseB
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-[#555]">{label}</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-xs font-black text-[#FF4757]">{adjA}</span>
            {deltaA !== 0 && (
              <span className={`text-[9px] font-black ${deltaA > 0 ? 'text-[#2ECC71]' : 'text-[#FF4757]'}`}>
                {deltaA > 0 ? `+${deltaA}` : deltaA}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#ddd]">vs</span>
          <div className="flex items-center gap-1">
            <span className="text-xs font-black text-[#1E90FF]">{adjB}</span>
            {deltaB !== 0 && (
              <span className={`text-[9px] font-black ${deltaB > 0 ? 'text-[#2ECC71]' : 'text-[#FF4757]'}`}>
                {deltaB > 0 ? `+${deltaB}` : deltaB}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="h-2 rounded-full bg-[#f0f0eb] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[#FF4757]"
            animate={{ width: `${adjA}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <div className="h-2 rounded-full bg-[#f0f0eb] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[#1E90FF]"
            animate={{ width: `${adjB}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}

export function DecisionVariables({ data }: { data: SimulateResponse }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [vars, setVars] = useState<Variables>({ riskTolerance: 5, effortLevel: 5, availableTime: 5 })

  const t10A = data.optionA.timeline[2]
  const t10B = data.optionB.timeline[2]

  const adjA = {
    income:  applyVars(t10A.income,  vars, 'income'),
    stress:  applyVars(t10A.stress,  vars, 'stress'),
    freedom: applyVars(t10A.freedom, vars, 'freedom'),
  }
  const adjB = {
    income:  applyVars(t10B.income,  vars, 'income'),
    stress:  applyVars(t10B.stress,  vars, 'stress'),
    freedom: applyVars(t10B.freedom, vars, 'freedom'),
  }

  const isModified = vars.riskTolerance !== 5 || vars.effortLevel !== 5 || vars.availableTime !== 5

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
          Interactive Variables
        </div>
        <h2 className="text-2xl font-black text-[#111]">
          What if you{' '}
          <span className="relative inline-block text-[#2ECC71]">
            changed?
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 100 6" preserveAspectRatio="none">
              <path d="M2,4 Q25,1 50,3 Q75,5 98,2" stroke="#2ECC71" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="mt-3 text-sm font-medium text-[#777]">
          Adjust variables below and see how the outcomes shift.
        </p>
      </div>

      <div className="brutal-card p-5">
        {/* Sliders */}
        <div className="space-y-5 mb-6">
          {SLIDERS.map(({ key, label, lo, hi, effectDesc }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-xs font-black text-[#333]">{label}</span>
                  <span className="ml-2 text-[9px] font-medium text-[#ccc]">{effectDesc}</span>
                </div>
                <span className="text-xs font-black tabular-nums text-[#555]">{vars[key]}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={vars[key]}
                onChange={(e) => setVars((v) => ({ ...v, [key]: Number(e.target.value) }))}
                className="w-full h-2 rounded-full cursor-pointer"
                style={{ accentColor: '#2ECC71' }}
              />
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] text-[#ccc] font-medium">{lo}</span>
                <span className="text-[9px] text-[#ccc] font-medium">{hi}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t-2 border-[#f0f0eb] pt-5">
          {/* Path labels */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#aaa]">
              Year 10 outcomes {isModified ? '(adjusted)' : '(base)'}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#FF4757]" />
                <span className="text-[10px] font-black text-[#555] capitalize truncate max-w-[60px]">{data.optionA.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#1E90FF]" />
                <span className="text-[10px] font-black text-[#555] capitalize truncate max-w-[60px]">{data.optionB.label}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <BarRow label="Income"  baseA={t10A.income}  baseB={t10B.income}  adjA={adjA.income}  adjB={adjB.income}  />
            <BarRow label="Stress"  baseA={t10A.stress}  baseB={t10B.stress}  adjA={adjA.stress}  adjB={adjB.stress}  />
            <BarRow label="Freedom" baseA={t10A.freedom} baseB={t10B.freedom} adjA={adjA.freedom} adjB={adjB.freedom} />
          </div>
        </div>

        {/* Reset */}
        <AnimatePresence>
          {isModified && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              onClick={() => setVars({ riskTolerance: 5, effortLevel: 5, availableTime: 5 })}
              className="mt-4 text-[10px] font-bold text-[#ccc] hover:text-[#555] underline underline-offset-2 transition-colors"
            >
              Reset to base simulation
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
