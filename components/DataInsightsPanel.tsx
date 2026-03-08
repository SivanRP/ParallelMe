'use client'

import { motion } from 'framer-motion'
import { Database, TrendingUp, FileText, ExternalLink } from 'lucide-react'
import type { DataInsights, LiveOccupationStat } from '@/app/api/simulate/route'

const CATEGORY_LABELS: Record<string, string> = {
  career: 'Career & Work',
  study: 'Learning & Education',
  productivity: 'Productivity & Focus',
  lifestyle: 'Health & Lifestyle',
  finance: 'Finance & Investing',
  general: 'Life Decision',
}

const CATEGORY_COLORS: Record<string, string> = {
  career: '#1E90FF',
  study: '#FF4757',
  productivity: '#FFD60A',
  lifestyle: '#2ECC71',
  finance: '#FF6B35',
  general: '#888',
}

// ─── Live wage card ───────────────────────────────────────────────────────────

function WageCard({
  occ,
  pathLetter,
  pathColor,
  pathLabel,
}: {
  occ: LiveOccupationStat
  pathLetter: 'A' | 'B'
  pathColor: string
  pathLabel: string
}) {
  const formatted = occ.medianAnnualWage.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      className="rounded-2xl border-2 border-[#111] bg-white shadow-[3px_3px_0_#111] overflow-hidden"
    >
      {/* colored top stripe */}
      <div className="h-1.5" style={{ background: pathColor }} />
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="h-5 w-5 rounded-md border-2 border-[#111] flex items-center justify-center text-[9px] font-black text-white shadow-[1px_1px_0_#111]"
            style={{ background: pathColor }}
          >
            {pathLetter}
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-[#aaa]">{pathLabel}</p>
        </div>

        {/* Big wage number */}
        <p className="text-2xl font-black text-[#111] leading-none tabular-nums">{formatted}</p>
        <p className="text-[10px] font-bold text-[#888] mt-0.5">median annual wage</p>

        <p className="text-xs font-black text-[#333] mt-2">{occ.title}</p>

        {/* BLS citation */}
        <div className="mt-2 flex items-center gap-1">
          <ExternalLink size={8} className="text-[#bbb]" />
          <p className="text-[8px] font-mono text-[#bbb]">BLS OES · {occ.seriesId}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Unemployment bar ─────────────────────────────────────────────────────────

function UnemploymentBar({ rate }: { rate: number }) {
  const trend = rate < 4 ? { label: 'Strong', color: '#2ECC71' } : rate < 6 ? { label: 'Moderate', color: '#FFD60A' } : { label: 'Weak', color: '#FF4757' }
  const pct = Math.min(100, (rate / 10) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-xl border border-[#eee] bg-[#FAFAF7] px-4 py-3"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={10} className="text-[#888]" />
          <p className="text-[9px] font-black uppercase tracking-widest text-[#888]">U.S. Unemployment Rate</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black text-[#111]">{rate}%</span>
          <span
            className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider"
            style={{ background: trend.color + '22', color: trend.color }}
          >
            {trend.label} market
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#eee] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="h-full rounded-full"
          style={{ background: trend.color }}
        />
      </div>
      <p className="mt-1 text-[8px] font-mono text-[#bbb]">Source: BLS CPS · Series LNS14000000 · Live</p>
    </motion.div>
  )
}

// ─── Evidence pill ────────────────────────────────────────────────────────────

function EvidencePill({ text, index }: { text: string; index: number }) {
  const isLiveBLS = text.startsWith('Live BLS') || text.startsWith('BLS OES')
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex items-start gap-2 py-2 border-b border-[#f0f0eb] last:border-0"
    >
      <div
        className="shrink-0 mt-0.5 h-3.5 w-3.5 rounded-full border flex items-center justify-center"
        style={
          isLiveBLS
            ? { background: '#e6fff2', borderColor: '#2ECC71' }
            : { background: '#f8f8f5', borderColor: '#ddd' }
        }
      >
        <span className="text-[7px] font-black" style={{ color: isLiveBLS ? '#1a7a3e' : '#888' }}>
          {isLiveBLS ? '★' : index + 1}
        </span>
      </div>
      <p className="text-[11px] font-medium text-[#444] leading-snug">{text}</p>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DataInsightsPanelProps {
  insights: DataInsights
  optionALabel: string
  optionBLabel: string
}

export function DataInsightsPanel({
  insights,
  optionALabel,
  optionBLabel,
}: DataInsightsPanelProps) {
  const catColor = CATEGORY_COLORS[insights.category] ?? '#888'
  const catLabel = CATEGORY_LABELS[insights.category] ?? insights.category
  const isBLS = insights.dataSource.includes('BLS')
  const hasOccWages = insights.liveStats?.occupationA || insights.liveStats?.occupationB

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      className="mt-10 brutal-card overflow-hidden"
    >
      {/* Header */}
      <div className="border-b-2 border-[#f0f0eb] px-5 py-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div
              className="h-9 w-9 rounded-xl border-2 border-[#111] flex items-center justify-center shrink-0 shadow-[2px_2px_0_#111]"
              style={{ background: catColor }}
            >
              <Database size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#aaa] mb-0.5">
                Real-World Evidence Layer
              </p>
              <h3 className="text-xl font-black text-[#111]">Data Used in This Simulation</h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div
              className="rounded-full border-2 border-[#111] px-3 py-1 text-[10px] font-black shadow-[2px_2px_0_#111]"
              style={{ background: catColor, color: '#fff' }}
            >
              {catLabel}
            </div>
            {isBLS && (
              <div className="rounded-full border border-[#2ECC71] bg-[#f0fff4] px-2.5 py-1 text-[9px] font-black text-[#1a7a3e] uppercase tracking-widest flex items-center gap-1">
                <TrendingUp size={9} /> Live BLS Data
              </div>
            )}
          </div>
        </div>

        <p className="mt-2 text-xs font-medium text-[#888]">
          The AI was calibrated with these statistics before generating your simulation.
          {isBLS && ' Includes live U.S. Bureau of Labor Statistics data.'}
        </p>
      </div>

      {/* Live BLS wage cards — only if we have real numbers */}
      {hasOccWages && (
        <div className="px-5 pt-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-[#aaa] mb-3">Live BLS Occupation Wages</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {insights.liveStats?.occupationA && (
              <WageCard
                occ={insights.liveStats.occupationA}
                pathLetter="A"
                pathColor="#FF4757"
                pathLabel={optionALabel}
              />
            )}
            {insights.liveStats?.occupationB && (
              <WageCard
                occ={insights.liveStats.occupationB}
                pathLetter="B"
                pathColor="#1E90FF"
                pathLabel={optionBLabel}
              />
            )}
          </div>
        </div>
      )}

      {/* Unemployment bar — only if available */}
      {insights.liveStats?.unemploymentRate !== undefined && (
        <div className="px-5 pt-4">
          <UnemploymentBar rate={insights.liveStats.unemploymentRate} />
        </div>
      )}

      {/* Two-column evidence */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-[#f0f0eb] border-t-2 border-[#f0f0eb]">
        {/* Path A */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-lg border-2 border-[#111] bg-[#FF4757] flex items-center justify-center text-[10px] font-black text-white shadow-[2px_2px_0_#111]">
              A
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#aaa]">Research · Path A</p>
              <p className="text-xs font-black text-[#111] truncate max-w-[160px]">{optionALabel}</p>
            </div>
            <FileText size={12} className="text-[#ddd] ml-auto" />
          </div>
          {insights.evidenceA.length > 0 ? (
            insights.evidenceA.map((ev, i) => <EvidencePill key={i} text={ev} index={i} />)
          ) : (
            <p className="text-xs text-[#bbb] font-medium">No specific research match — using general reasoning.</p>
          )}
        </div>

        {/* Path B */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-lg border-2 border-[#111] bg-[#1E90FF] flex items-center justify-center text-[10px] font-black text-white shadow-[2px_2px_0_#111]">
              B
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#aaa]">Research · Path B</p>
              <p className="text-xs font-black text-[#111] truncate max-w-[160px]">{optionBLabel}</p>
            </div>
            <FileText size={12} className="text-[#ddd] ml-auto" />
          </div>
          {insights.evidenceB.length > 0 ? (
            insights.evidenceB.map((ev, i) => <EvidencePill key={i} text={ev} index={i} />)
          ) : (
            <p className="text-xs text-[#bbb] font-medium">No specific research match — using general reasoning.</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-[#f0f0eb] px-5 py-3 bg-[#FAFAF7] flex items-center justify-between flex-wrap gap-2">
        <p className="text-[9px] font-medium text-[#bbb] uppercase tracking-widest">
          Source: {insights.dataSource}
        </p>
        <p className="text-[9px] font-medium text-[#bbb]">
          Evidence injected into AI prompt as calibration constraints
        </p>
      </div>
    </motion.div>
  )
}
