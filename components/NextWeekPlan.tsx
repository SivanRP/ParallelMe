'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { SimulateResponse } from '@/app/api/simulate/route'
import { generateNextWeekPlans } from '@/lib/outcomesEngine'

export function NextWeekPlan({ data }: { data: SimulateResponse }) {
  const { planA, planB } = useMemo(() => generateNextWeekPlans(data), [data])
  const [active, setActive] = useState<'A' | 'B'>('A')
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'error'>('idle')
  const plan = active === 'A' ? planA : planB
  const label = active === 'A' ? data.optionA.label : data.optionB.label

  const buildCopyText = () => {
    const text = plan.map((d) => `Day ${d.day}: ${d.title}\n${d.action}`).join('\n\n')
    return `7-Day Plan for ${label}\n\n${text}`
  }

  const fallbackCopy = (text: string) => {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  }

  const copyPlan = async () => {
    const text = buildCopyText()
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        setCopyState('done')
      } else {
        setCopyState(fallbackCopy(text) ? 'done' : 'error')
      }
    } catch {
      setCopyState(fallbackCopy(text) ? 'done' : 'error')
    }
    window.setTimeout(() => setCopyState('idle'), 1500)
  }

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="comic-note px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#5f6477]">One-Click Next Week Plan</span>
        <button onClick={copyPlan} className="comic-chip px-3 py-1 text-xs font-black text-[#111]">
          {copyState === 'done' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy plan'}
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        <button onClick={() => setActive('A')} className={`comic-chip px-3 py-1 text-xs font-black ${active === 'A' ? 'bg-[#FF4757] text-white' : 'bg-white text-[#111]'}`}>Path A</button>
        <button onClick={() => setActive('B')} className={`comic-chip px-3 py-1 text-xs font-black ${active === 'B' ? 'bg-[#1E90FF] text-white' : 'bg-white text-[#111]'}`}>Path B</button>
      </div>

      <div className="comic-card p-4">
        <p className="mb-3 text-sm font-black text-[#111]">This week for: {label}</p>
        <div className="space-y-2">
          {plan.map((item) => (
            <div key={item.day} className="rounded-xl border border-[#111]/10 bg-white p-3">
              <p className="text-xs font-black uppercase tracking-wider text-[#8a90a5]">Day {item.day} · {item.category}</p>
              <p className="mt-0.5 text-sm font-black text-[#111]">{item.title}</p>
              <p className="text-sm text-[#4f556b]">{item.action}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
