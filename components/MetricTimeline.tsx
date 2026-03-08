'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import type { SimulateResponse, TimelinePoint } from '@/app/api/simulate/route'

// ─── Metric bar ───────────────────────────────────────────────────────────────

interface MetricBarProps {
  label: string
  value: number
  barColor: string
  textColor: string
  delay: number
  inView: boolean
}

function MetricBar({ label, value, barColor, textColor, delay, inView }: MetricBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#777]">{label}</span>
        <span className={`text-[11px] font-black font-mono ${textColor}`}>{value}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-[#f0f0eb] overflow-hidden border border-[#e0e0e0]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: inView ? `${value}%` : 0 }}
          transition={{ duration: 0.85, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}

// ─── Year card ────────────────────────────────────────────────────────────────

interface YearCardProps {
  point: TimelinePoint
  isA: boolean
  cardDelay: number
  inView: boolean
}

function YearCard({ point, isA, cardDelay, inView }: YearCardProps) {
  const metrics: MetricBarProps[] = [
    {
      label: 'Income',
      value: point.income,
      barColor: '#2ECC71',
      textColor: 'text-[#229954]',
      delay: cardDelay + 0.1,
      inView,
    },
    {
      label: 'Stress',
      value: point.stress,
      barColor: '#FF8C00',
      textColor: 'text-[#e07000]',
      delay: cardDelay + 0.18,
      inView,
    },
    {
      label: 'Freedom',
      value: point.freedom,
      barColor: isA ? '#FF4757' : '#1E90FF',
      textColor: isA ? 'text-[#FF4757]' : 'text-[#1E90FF]',
      delay: cardDelay + 0.26,
      inView,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: cardDelay, ease: 'easeOut' }}
      className={`rounded-2xl border-2 p-4 bg-white ${
        isA ? 'border-[#FF4757]/40' : 'border-[#1E90FF]/40'
      }`}
    >
      <div className="mb-3">
        <span
          className={`inline-flex items-center rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white ${
            isA ? 'bg-[#FF4757]' : 'bg-[#1E90FF]'
          }`}
        >
          Year {point.year}
        </span>
      </div>
      <p className="mb-3 text-xs font-medium text-[#555] leading-relaxed">{point.description}</p>
      <div className="space-y-2.5">
        {metrics.map((m) => (
          <MetricBar key={m.label} {...m} />
        ))}
      </div>
    </motion.div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard({ isA }: { isA: boolean }) {
  return (
    <div className={`rounded-2xl border-2 p-4 bg-white space-y-3 animate-pulse ${isA ? 'border-[#FF4757]/40' : 'border-[#1E90FF]/40'}`}>
      <div className="h-5 w-16 rounded-full bg-[#eee]" />
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded bg-[#f0f0eb]" />
        <div className="h-3 w-4/5 rounded bg-[#eee]" />
      </div>
      <div className="space-y-2.5 pt-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between">
              <div className="h-2.5 w-12 rounded bg-[#eee]" />
              <div className="h-2.5 w-6 rounded bg-[#eee]" />
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#f0f0eb]" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Option column ────────────────────────────────────────────────────────────

interface OptionColumnProps {
  option: SimulateResponse['optionA']
  isA: boolean
  colIndex: number
}

function OptionColumn({ option, isA, colIndex }: OptionColumnProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const baseDelay = colIndex * 0.1

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isA ? -24 : 24 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col gap-3"
    >
      <div
        className={`rounded-2xl border-2 p-4 ${
          isA
            ? 'border-[#FF4757] bg-[#FFE8EA] shadow-[4px_4px_0px_#FF4757]'
            : 'border-[#1E90FF] bg-[#DCF0FF] shadow-[4px_4px_0px_#1E90FF]'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black border-2 bg-white ${
              isA ? 'border-[#FF4757] text-[#FF4757]' : 'border-[#1E90FF] text-[#1E90FF]'
            }`}
          >
            {colIndex === 0 ? 'A' : 'B'}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isA ? 'text-[#FF4757]' : 'text-[#1E90FF]'}`}>
            Timeline {colIndex === 0 ? 'A' : 'B'}
          </span>
        </div>
        <h3 className="text-base font-black text-[#111] capitalize">{option.label}</h3>
      </div>

      {option.timeline.map((point, i) => (
        <YearCard
          key={point.year}
          point={point}
          isA={isA}
          cardDelay={baseDelay + i * 0.12}
          inView={inView}
        />
      ))}
    </motion.div>
  )
}

// ─── Source badge ─────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: SimulateResponse['source'] }) {
  if (source === 'mock') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ddd] bg-[#f5f5f0] px-3 py-1 text-[10px] font-bold text-[#999]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ccc]" />
        Mock data — add an API key for AI generation
      </span>
    )
  }
  const label = source === 'claude' ? 'Claude AI' : source === 'openai' ? 'GPT-4o' : 'Groq LLaMA'
  return (
    <span className="inline-flex items-center gap-1.5 sticker-yellow px-3 py-1 text-[10px]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#9A7D00] animate-pulse" />
      Generated by {label}
    </span>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface MetricTimelineProps {
  data: SimulateResponse | null
  isLoading: boolean
}

export function MetricTimeline({ data, isLoading }: MetricTimelineProps) {
  return (
    <div className="mt-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-5 flex flex-col items-center gap-2 text-center"
      >
        <h2 className="text-2xl font-black text-[#111]">
          Quantified <span className="shimmer-text">Futures</span>
        </h2>
        <p className="text-sm font-medium text-[#777] max-w-sm">
          Income, stress, and freedom scored 0–100 across three critical milestones.
        </p>
        {data && <SourceBadge source={data.source} />}
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[true, false].map((isA) => (
            <div key={String(isA)} className="flex flex-col gap-3">
              <div className={`rounded-2xl border-2 p-4 animate-pulse ${isA ? 'border-[#FF4757] bg-[#FFE8EA]' : 'border-[#1E90FF] bg-[#DCF0FF]'}`}>
                <div className="h-6 w-24 rounded-full bg-black/10" />
                <div className="mt-2 h-4 w-40 rounded bg-black/8" />
              </div>
              {[1, 2, 3].map((i) => <SkeletonCard key={i} isA={isA as boolean} />)}
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <OptionColumn option={data.optionA} isA={true} colIndex={0} />
          <OptionColumn option={data.optionB} isA={false} colIndex={1} />
        </div>
      ) : (
        <p className="text-center text-sm text-[#aaa]">Failed to load metrics.</p>
      )}
    </div>
  )
}
