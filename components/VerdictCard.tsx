'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import type { SimulateResponse } from '@/app/api/simulate/route'
import type { UserProfile } from '@/components/OnboardingModal'

interface VerdictCardProps {
  data: SimulateResponse
  profile?: UserProfile | null
}

function avg(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

// Weight scoring by user priority
function getWeights(priority?: UserProfile['priority']) {
  if (priority === 'wealth')     return { income: 0.55, freedom: 0.25, stress: 0.20 }
  if (priority === 'creativity') return { income: 0.25, freedom: 0.50, stress: 0.25 }
  if (priority === 'freedom')    return { income: 0.20, freedom: 0.60, stress: 0.20 }
  return { income: 0.35, freedom: 0.40, stress: 0.25 }
}

function overallScore(option: SimulateResponse['optionA'], weights: ReturnType<typeof getWeights>) {
  const incomes  = option.timeline.map((t) => t.income)
  const freedoms = option.timeline.map((t) => t.freedom)
  const stresses = option.timeline.map((t) => t.stress)
  return avg(incomes) * weights.income + avg(freedoms) * weights.freedom - avg(stresses) * weights.stress
}

function buildRecommendation(
  winner: 'A' | 'B' | 'tie',
  data: SimulateResponse,
  profile: UserProfile | null | undefined,
  diff: number
): string {
  const winLabel = winner === 'A' ? data.optionA.label : winner === 'B' ? data.optionB.label : null

  if (winner === 'tie') {
    if (profile?.risk === 'high') return `Both paths score within ${diff} points — but you're wired for boldness. Lean into whichever one scares you more.`
    if (profile?.risk === 'low')  return `Both paths are closely matched. Given your careful nature, the more stable option is your safest bet.`
    return `This is genuinely close. The right choice depends on what you're willing to bet a decade on.`
  }

  const priorityLine =
    profile?.priority === 'wealth'     ? `Your priority is financial power — and ${winLabel} delivers stronger income across the decade.` :
    profile?.priority === 'creativity' ? `You value creative legacy above money. ${winLabel} gives you more autonomy to build something meaningful.` :
    profile?.priority === 'freedom'    ? `Freedom is your north star. ${winLabel} keeps you more in control of your time and life.` :
    `Across income, freedom, and stress — ${winLabel} comes out ahead.`

  const pressureLine =
    profile?.pressure === 'thrive'  ? `You thrive under pressure, which is exactly what this path demands.` :
    profile?.pressure === 'adapt'   ? `You adapt well — the inevitable rough patches on this path won't break you.` :
    profile?.pressure === 'reflect' ? `This path has slower-burn rewards that suit your reflective style.` :
    ''

  const colLine =
    profile?.col === 'high' ? ` In your city, the income edge matters more than the numbers suggest.` :
    profile?.col === 'low'  ? ` In your area, even the lower income numbers go further than they look.` :
    ''

  return `${priorityLine}${pressureLine ? ` ${pressureLine}` : ''}${colLine} ${diff < 8 ? 'The margin is narrow — both paths are viable.' : 'The lead is clear.'}`
}

export function VerdictCard({ data, profile }: VerdictCardProps) {
  const weights = useMemo(() => getWeights(profile?.priority), [profile?.priority])
  const scoreA = overallScore(data.optionA, weights)
  const scoreB = overallScore(data.optionB, weights)

  const dispA = Math.round(scoreA)
  const dispB = Math.round(scoreB)
  const diff = Math.abs(dispA - dispB)

  const winner: 'A' | 'B' | 'tie' = diff < 3 ? 'tie' : scoreA > scoreB ? 'A' : 'B'
  const winnerLabel = winner === 'A' ? data.optionA.label : winner === 'B' ? data.optionB.label : null

  const categories = useMemo(() => {
    const avgMetric = (opt: SimulateResponse['optionA'], key: 'income' | 'stress' | 'freedom') =>
      Math.round(avg(opt.timeline.map((t) => t[key])))

    const aIncome   = avgMetric(data.optionA, 'income')
    const bIncome   = avgMetric(data.optionB, 'income')
    const aStress   = avgMetric(data.optionA, 'stress')
    const bStress   = avgMetric(data.optionB, 'stress')
    const aFreedom  = avgMetric(data.optionA, 'freedom')
    const bFreedom  = avgMetric(data.optionB, 'freedom')

    return [
      {
        label: 'Income',
        emoji: '$',
        weight: Math.round(weights.income * 100),
        winner: aIncome > bIncome + 3 ? 'A' as const : bIncome > aIncome + 3 ? 'B' as const : 'tie' as const,
        scoreA: aIncome,
        scoreB: bIncome,
      },
      {
        label: 'Stress',
        emoji: '~',
        weight: Math.round(weights.stress * 100),
        winner: aStress < bStress - 3 ? 'A' as const : bStress < aStress - 3 ? 'B' as const : 'tie' as const,
        scoreA: aStress,
        scoreB: bStress,
      },
      {
        label: 'Freedom',
        emoji: '★',
        weight: Math.round(weights.freedom * 100),
        winner: aFreedom > bFreedom + 3 ? 'A' as const : bFreedom > aFreedom + 3 ? 'B' as const : 'tie' as const,
        scoreA: aFreedom,
        scoreB: bFreedom,
      },
    ]
  }, [data, weights])

  const winnerCounts = {
    A: categories.filter((c) => c.winner === 'A').length,
    B: categories.filter((c) => c.winner === 'B').length,
  }

  const recommendation = useMemo(
    () => buildRecommendation(winner, data, profile, diff),
    [winner, data, profile, diff]
  )

  const weightLabel =
    profile?.priority === 'wealth'     ? 'Weighted for wealth' :
    profile?.priority === 'creativity' ? 'Weighted for creativity' :
    profile?.priority === 'freedom'    ? 'Weighted for freedom' :
    'Equal weighting'

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
      className="mt-10"
    >
      <div className="mb-5 flex flex-col items-center gap-1 text-center">
        <h2 className="text-2xl font-black text-[#111]">
          The <span className="shimmer-text">Verdict</span>
        </h2>
        <p className="text-sm font-medium text-[#777]">
          {profile?.priority
            ? `Scored based on your priorities · ${weightLabel}`
            : 'Based on income, freedom, and stress across 10 years.'}
        </p>
      </div>

      <div className="brutal-card p-6">
        {/* Winner banner */}
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          {winner === 'tie' ? (
            <>
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl border-2 border-[#111] bg-[#f5f5f0] shadow-[3px_3px_0_#111] text-2xl font-black text-[#111]">
                =
              </div>
              <div>
                <p className="text-xl font-black text-[#111]">It's basically a tie</p>
                <p className="text-sm text-[#666] mt-0.5">Both paths score within 3 points of each other.</p>
              </div>
            </>
          ) : (
            <>
              <div className={`inline-flex items-center justify-center h-14 w-14 rounded-2xl border-2 border-[#111] shadow-[3px_3px_0_#111] text-sm font-black text-white ${winner === 'A' ? 'bg-[#FF4757]' : 'bg-[#1E90FF]'}`}>
                WIN
              </div>
              <div>
                <div
                  className={`inline-block mb-2 px-4 py-1.5 rounded-full text-sm font-black border-2 ${
                    winner === 'A'
                      ? 'bg-[#FFE8EA] border-[#FF4757] text-[#FF4757]'
                      : 'bg-[#DCF0FF] border-[#1E90FF] text-[#1E90FF]'
                  }`}
                >
                  Path {winner} wins
                </div>
                <p className="text-xl font-black text-[#111] capitalize">{winnerLabel}</p>
                <p className="text-sm text-[#666] mt-0.5">
                  Scores {dispA > dispB ? dispA : dispB} vs {dispA > dispB ? dispB : dispA} — a {diff}-point lead over a decade.
                </p>
              </div>
            </>
          )}
        </div>

        {/* AI recommendation */}
        <div className={`mb-5 rounded-2xl border-2 px-4 py-3.5 ${
          winner === 'A' ? 'border-[#FF4757] bg-[#FFF8F8]' :
          winner === 'B' ? 'border-[#1E90FF] bg-[#F0F8FF]' :
          'border-[#ddd] bg-[#f9f9f6]'
        }`}>
          <p className="text-[9px] font-black uppercase tracking-widest text-[#aaa] mb-1.5">
            {profile ? 'Personalized recommendation' : 'Simulation verdict'}
          </p>
          <p className="text-sm font-medium text-[#333] leading-relaxed">{recommendation}</p>
        </div>

        {/* Divider */}
        <div className="section-divider mb-5" />

        {/* Category breakdown */}
        <div className="grid grid-cols-3 gap-3">
          {categories.map((cat) => {
            const aWins = cat.winner === 'A'
            const bWins = cat.winner === 'B'
            const tied  = cat.winner === 'tie'
            return (
              <div
                key={cat.label}
                className={`rounded-2xl border-2 p-4 text-center ${
                  aWins
                    ? 'border-[#FF4757] bg-[#FFE8EA]'
                    : bWins
                    ? 'border-[#1E90FF] bg-[#DCF0FF]'
                    : 'border-[#ddd] bg-[#f5f5f0]'
                }`}
              >
                <div className="text-lg font-black mb-1" style={{ color: aWins ? '#FF4757' : bWins ? '#1E90FF' : '#bbb' }}>{cat.emoji}</div>
                <p className="text-[11px] font-black uppercase tracking-wider text-[#555] mb-0.5">
                  {cat.label}
                </p>
                <p className="text-[9px] font-mono text-[#aaa] mb-2">{cat.weight}% weight</p>
                <div className="flex items-center justify-between text-xs font-black">
                  <span className={aWins ? 'text-[#FF4757]' : 'text-[#999]'}>{cat.scoreA}</span>
                  <span className="text-[#ccc] font-medium">vs</span>
                  <span className={bWins ? 'text-[#1E90FF]' : 'text-[#999]'}>{cat.scoreB}</span>
                </div>
                <p className={`mt-1.5 text-[10px] font-black uppercase tracking-widest ${
                  aWins ? 'text-[#FF4757]' : bWins ? 'text-[#1E90FF]' : 'text-[#aaa]'
                }`}>
                  {tied ? 'Tied' : `Path ${cat.winner}`}
                </p>
              </div>
            )
          })}
        </div>

        {/* Scoreline */}
        <div className="mt-5 flex items-center justify-between rounded-2xl border-2 border-[#111] bg-[#FAFAF7] px-5 py-3 shadow-[3px_3px_0_#111]">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-0.5">Path A</p>
            <p className="text-2xl font-black text-[#FF4757]">{dispA}</p>
            <p className="text-[9px] text-[#888] mt-0.5">{winnerCounts.A} categor{winnerCounts.A === 1 ? 'y' : 'ies'}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#aaa] mb-0.5">overall</p>
            <p className="text-lg font-black text-[#ddd]">vs</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-0.5">Path B</p>
            <p className="text-2xl font-black text-[#1E90FF]">{dispB}</p>
            <p className="text-[9px] text-[#888] mt-0.5">{winnerCounts.B} categor{winnerCounts.B === 1 ? 'y' : 'ies'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
