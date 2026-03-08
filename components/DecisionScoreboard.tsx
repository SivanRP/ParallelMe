'use client'

import { motion } from 'framer-motion'
import type { SimulateResponse } from '@/app/api/simulate/route'
import { computeDecisionScoreboard } from '@/lib/outcomesEngine'
import { useUserProfile } from '@/components/OnboardingModal'

function fmtCurrency(value: number | null) {
  return value === null ? 'N/A' : `$${value.toLocaleString()}`
}

function fmtScore(value: number | null, unit: string) {
  if (value === null) return 'N/A'
  return `${value}${unit}`
}

function PathCard({
  title,
  color,
  score,
  isWinner,
}: {
  title: string
  color: string
  score: ReturnType<typeof computeDecisionScoreboard>['pathA']
  isWinner: boolean
}) {
  return (
    <div className={`comic-card p-4 ${isWinner ? 'ring-2 ring-offset-2 ring-[#111]' : ''}`} style={{ background: '#fff' }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="comic-chip px-2 py-1 text-[10px] font-black" style={{ background: color, color: '#111' }}>
          {title}
        </span>
        <span className="text-sm font-black text-[#111]">EV {score.expectedValueScore ?? 'N/A'}</span>
      </div>
      <p className="text-sm font-black text-[#111] capitalize">{score.label}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-[#2b3042]">
        <p>Expected yearly: <span className="font-black">{fmtCurrency(score.expectedValueUsd)}</span></p>
        <p>Salary band: <span className="font-black">{score.salaryBand ?? 'N/A'}</span></p>
        <p>Job demand: <span className="font-black">{fmtScore(score.jobDemand, '/100')}</span></p>
        <p>Burnout risk: <span className="font-black">{fmtScore(score.burnoutRisk, '/100')}</span></p>
        <p>Failure odds: <span className="font-black">{fmtScore(score.failureOdds, '%')}</span></p>
        <p>Migration cost: <span className="font-black">{fmtCurrency(score.migrationCost)}</span></p>
      </div>
      <div className="mt-3 grid gap-1 text-[10px] font-bold uppercase tracking-wider text-[#6e7489]">
        <p>Salary source: {score.metrics.salaryAnnual.source} · {score.metrics.salaryAnnual.confidence}</p>
        <p>Demand source: {score.metrics.jobDemand.source} · {score.metrics.jobDemand.confidence}</p>
        {score.metrics.salaryAnnual.note ? <p className="normal-case tracking-normal">{score.metrics.salaryAnnual.note}</p> : null}
      </div>
    </div>
  )
}

export function DecisionScoreboard({ data }: { data: SimulateResponse }) {
  const { profile } = useUserProfile()
  const board = computeDecisionScoreboard(data, profile ?? undefined)

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="mb-3 flex items-center gap-2">
        <span className="comic-note px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#5f6477]">Real Decision Scoreboard</span>
        <span className="text-xs font-bold text-[#8a90a5]">Actionable + measurable outcomes</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PathCard
          title="Path A"
          color="#ffd4da"
          score={board.pathA}
          isWinner={board.winner === 'A'}
        />
        <PathCard
          title="Path B"
          color="#d6ecff"
          score={board.pathB}
          isWinner={board.winner === 'B'}
        />
      </div>

      <div className="mt-4 comic-note p-3">
        <p className="text-sm font-black text-[#111]">
          Verdict: {board.winner === 'tie' ? 'Too close to call' : `Path ${board.winner} leads`}
          {board.deltaScore !== null ? ` · Delta ${board.deltaScore} EV points` : ' · Insufficient verified data for an EV delta'}
        </p>
        {data.sourceTrustInsights?.notes?.length ? (
          <p className="mt-2 text-xs font-semibold text-[#5f6477]">{data.sourceTrustInsights.notes[0]}</p>
        ) : null}
      </div>
    </motion.section>
  )
}
