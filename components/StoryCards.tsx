'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { SimulateResponse, StoryMilestone } from '@/app/api/simulate/route'

// ─── Single milestone card ─────────────────────────────────────────────────

interface MilestoneCardProps {
  milestone: StoryMilestone
  isA: boolean
  index: number
  isActive: boolean
  onClick: () => void
}

function MilestoneCard({ milestone, isA, index, isActive, onClick }: MilestoneCardProps) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer ${
        isActive
          ? isA
            ? 'border-[#FF4757] bg-[#FFE8EA] shadow-[4px_4px_0px_#FF4757]'
            : 'border-[#1E90FF] bg-[#DCF0FF] shadow-[4px_4px_0px_#1E90FF]'
          : 'border-[#e0e0e0] bg-white hover:border-[#111] hover:shadow-[3px_3px_0px_#111]'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest border ${
            isActive
              ? isA
                ? 'bg-[#FF4757] text-white border-[#FF4757]'
                : 'bg-[#1E90FF] text-white border-[#1E90FF]'
              : 'bg-[#f0f0eb] text-[#777] border-[#ddd]'
          }`}
        >
          Year {milestone.year}
        </span>

        <motion.span
          animate={isActive ? { scale: [1, 1.4, 1], rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="text-3xl leading-none select-none"
        >
          {milestone.emoji}
        </motion.span>
      </div>

      {/* Title */}
      <h4 className={`text-sm font-black leading-tight mb-2 ${isActive ? 'text-[#111]' : 'text-[#333]'}`}>
        {milestone.title}
      </h4>

      {/* Expanding description */}
      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div
            key="desc"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <p className="text-xs font-medium text-[#444] leading-relaxed mb-3">
              {milestone.description}
            </p>
            {milestone.memory && (
              <div className={`rounded-xl border-l-4 pl-3 pr-2 py-2 mb-3 ${isA ? 'border-[#FF4757] bg-[#fff0f1]' : 'border-[#1E90FF] bg-[#f0f7ff]'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isA ? 'text-[#FF4757]' : 'text-[#1E90FF]'}`}>
                  Memory
                </p>
                <p className="text-xs italic font-medium text-[#444] leading-relaxed">
                  "{milestone.memory}"
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metric pill */}
      <div
        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-[11px] font-black border ${
          isActive
            ? isA
              ? 'bg-white border-[#FF4757] text-[#FF4757]'
              : 'bg-white border-[#1E90FF] text-[#1E90FF]'
            : 'bg-[#f5f5f0] border-[#ddd] text-[#666]'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? (isA ? 'bg-[#FF4757]' : 'bg-[#1E90FF]') : 'bg-[#bbb]'} ${isActive ? 'animate-pulse' : ''}`} />
        {milestone.metric}
      </div>
    </motion.button>
  )
}

// ─── Path column ───────────────────────────────────────────────────────────

interface PathColumnProps {
  option: SimulateResponse['optionA']
  isA: boolean
  pathLabel: 'A' | 'B'
}

function PathColumn({ option, isA, pathLabel }: PathColumnProps) {
  const [activeIdx, setActiveIdx] = useState(0)

  return (
    <motion.div
      initial={{ opacity: 0, x: isA ? -28 : 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col gap-3"
    >
      {/* Header card */}
      <div
        className={`rounded-2xl border-2 p-5 ${
          isA
            ? 'border-[#FF4757] bg-[#FFE8EA] shadow-[4px_4px_0px_#FF4757]'
            : 'border-[#1E90FF] bg-[#DCF0FF] shadow-[4px_4px_0px_#1E90FF]'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black border-2 bg-white ${
              isA ? 'border-[#FF4757] text-[#FF4757]' : 'border-[#1E90FF] text-[#1E90FF]'
            }`}
          >
            {pathLabel}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isA ? 'text-[#FF4757]' : 'text-[#1E90FF]'}`}>
            Path {pathLabel}
          </span>
        </div>

        <h3 className="text-lg font-black text-[#111] capitalize leading-tight mb-1">
          {option.label}
        </h3>

        <p className="text-sm font-semibold text-[#555] leading-snug">
          {option.tagline}
        </p>
      </div>

      {/* Milestone cards */}
      {option.milestones.map((m, i) => (
        <MilestoneCard
          key={m.year}
          milestone={m}
          isA={isA}
          index={i}
          isActive={activeIdx === i}
          onClick={() => setActiveIdx(activeIdx === i ? -1 : i)}
        />
      ))}
    </motion.div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────

function StoryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {[true, false].map((isA) => (
        <div key={String(isA)} className="flex flex-col gap-3">
          <div
            className={`rounded-2xl border-2 p-5 space-y-3 animate-pulse ${isA ? 'border-[#FF4757] bg-[#FFE8EA]' : 'border-[#1E90FF] bg-[#DCF0FF]'}`}
          >
            <div className="h-7 w-20 rounded-lg bg-black/10" />
            <div className="h-5 w-3/4 rounded bg-black/8" />
            <div className="h-4 w-full rounded bg-black/6" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border-2 border-[#e0e0e0] bg-white p-4 space-y-3 animate-pulse">
              <div className="flex justify-between">
                <div className="h-5 w-16 rounded-full bg-[#eee]" />
                <div className="h-8 w-8 rounded bg-[#f0f0eb]" />
              </div>
              <div className="h-4 w-2/3 rounded bg-[#eee]" />
              <div className="h-6 w-24 rounded-xl bg-[#f0f0eb]" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────

interface StoryCardsProps {
  data: SimulateResponse | null
  isLoading: boolean
}

export function StoryCards({ data, isLoading }: StoryCardsProps) {
  return (
    <div className="mt-10">
      <div className="mb-5 flex flex-col items-center gap-1 text-center">
        <h2 className="text-2xl font-black text-[#111]">
          Your <span className="shimmer-text">Story</span>
        </h2>
        <p className="text-sm font-medium text-[#777]">
          Tap a milestone to read exactly what that year looks like.
        </p>
      </div>

      {isLoading ? (
        <StoryCardsSkeleton />
      ) : data ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <PathColumn option={data.optionA} isA={true} pathLabel="A" />
          <PathColumn option={data.optionB} isA={false} pathLabel="B" />
        </div>
      ) : (
        <p className="text-center text-sm text-[#aaa]">No story data available.</p>
      )}
    </div>
  )
}
