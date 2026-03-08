'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'

export interface DecisionContext {
  riskTolerance: number   // 1–10
  importance: number      // 1–10
  timePressure: number    // 1–10
}

const CONTEXT_KEY = 'parallelme_context'

export function saveContext(ctx: DecisionContext) {
  try { sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx)) } catch {}
}

export function loadContext(): DecisionContext | null {
  try {
    const raw = sessionStorage.getItem(CONTEXT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

const SLIDERS = [
  { key: 'riskTolerance' as const, label: 'Risk Tolerance',        lo: 'Cautious',   hi: 'Bold'          },
  { key: 'importance'    as const, label: 'Importance of Outcome', lo: 'Low stakes', hi: 'Life-changing' },
  { key: 'timePressure'  as const, label: 'Time Pressure',         lo: 'No rush',    hi: 'Very urgent'   },
]

interface ContextPanelProps {
  onChange?: (ctx: DecisionContext) => void
}

export function ContextPanel({ onChange }: ContextPanelProps) {
  const [open, setOpen] = useState(false)
  const [ctx, setCtx] = useState<DecisionContext>({ riskTolerance: 5, importance: 7, timePressure: 5 })

  // Load saved context on mount
  useEffect(() => {
    const saved = loadContext()
    if (saved) setCtx(saved)
  }, [])

  const update = (key: keyof DecisionContext, value: number) => {
    const next = { ...ctx, [key]: value }
    setCtx(next)
    saveContext(next)
    onChange?.(next)
  }

  const hasCustom = ctx.riskTolerance !== 5 || ctx.importance !== 7 || ctx.timePressure !== 5

  return (
    <div className="w-full mt-2 mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#7d8398] hover:text-[#232737] transition-colors group"
      >
        <SlidersHorizontal size={11} className="group-hover:text-[#FF4757] transition-colors" />
        Add context
        {hasCustom && (
          <span className="rounded-full bg-[#FF4757] h-1.5 w-1.5 ml-0.5" />
        )}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex">
          <ChevronDown size={11} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-2xl border-2 border-[#111]/12 bg-white/90 p-4 space-y-4 shadow-[0_8px_18px_rgba(45,60,102,0.1)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#9aa0b4]">
                Optional — helps the AI tailor your simulation
              </p>

              {SLIDERS.map(({ key, label, lo, hi }) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-black text-[#232737]">{label}</span>
                    <span className="text-xs font-black tabular-nums" style={{
                      color: ctx[key] >= 8 ? '#FF4757' : ctx[key] <= 3 ? '#1E90FF' : '#888'
                    }}>
                      {ctx[key]}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={ctx[key]}
                    onChange={(e) => update(key, Number(e.target.value))}
                    className="w-full h-2 rounded-full cursor-pointer accent-[#FF4757]"
                    style={{ accentColor: '#FF4757' }}
                  />
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[9px] text-[#9aa0b4] font-medium">{lo}</span>
                    <span className="text-[9px] text-[#9aa0b4] font-medium">{hi}</span>
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  const reset = { riskTolerance: 5, importance: 7, timePressure: 5 }
                  setCtx(reset)
                  saveContext(reset)
                  onChange?.(reset)
                }}
                className="text-[10px] font-bold text-[#9aa0b4] hover:text-[#4f556b] underline underline-offset-2 transition-colors"
              >
                Reset to defaults
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
