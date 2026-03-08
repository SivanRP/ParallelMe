'use client'

import { motion } from 'framer-motion'
import type { SimulateResponse } from '@/app/api/simulate/route'
import { detectPointOfNoReturn } from '@/lib/outcomesEngine'

export function PointOfNoReturn({ data }: { data: SimulateResponse }) {
  const result = detectPointOfNoReturn(data)
  const urgencyColor = result.urgency === 'high' ? '#FF4757' : result.urgency === 'medium' ? '#FF8C00' : '#2ECC71'

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="mb-3 flex items-center gap-2">
        <span className="comic-note px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#5f6477]">Point of No Return Detector</span>
        <span className="text-xs font-bold" style={{ color: urgencyColor }}>Urgency: {result.urgency.toUpperCase()}</span>
      </div>

      <div className="comic-card p-4">
        <p className="text-sm font-black text-[#111]">Latest safe switch window: <span style={{ color: urgencyColor }}>Before Year {result.latestSafeSwitchYear}</span></p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {result.dimensions.map((d) => (
            <div key={d.id} className="rounded-xl border border-[#111]/10 bg-white p-3">
              <p className="text-xs font-black uppercase tracking-wider text-[#8a90a5]">{d.label}</p>
              <p className="text-sm font-black text-[#111]">Safe switch by Year {d.safeSwitchYear}</p>
              <p className="text-xs text-[#4f556b]">{d.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
