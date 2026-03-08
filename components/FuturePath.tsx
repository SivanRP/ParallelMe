'use client'

import { motion } from 'framer-motion'
import type { FutureTimeline, Milestone } from '@/lib/generateFutures'

interface MilestoneCardProps {
  milestone: Milestone
  index: number
  theme: 'purple' | 'cyan'
  pathIndex: number
}

function MilestoneCard({ milestone, index, theme, pathIndex }: MilestoneCardProps) {
  const isPurple = theme === 'purple'

  const cardDelay = pathIndex * 0.15 + index * 0.18 + 0.4

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: cardDelay, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`relative overflow-hidden rounded-xl border p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] group ${
        isPurple
          ? 'border-purple-500/20 bg-purple-950/20 hover:border-purple-500/40 hover:bg-purple-950/30'
          : 'border-cyan-500/20 bg-cyan-950/20 hover:border-cyan-500/40 hover:bg-cyan-950/30'
      }`}
    >
      {/* Subtle inner glow on hover */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
          isPurple
            ? 'bg-gradient-to-br from-purple-600/5 to-transparent'
            : 'bg-gradient-to-br from-cyan-600/5 to-transparent'
        }`}
      />

      <div className="relative flex items-start gap-3">
        {/* Emoji */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl ${
            isPurple ? 'bg-purple-500/15' : 'bg-cyan-500/15'
          }`}
        >
          {milestone.emoji}
        </div>

        <div className="flex-1 min-w-0">
          {/* Year + title row */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isPurple
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-cyan-500/20 text-cyan-300'
              }`}
            >
              Year {milestone.year}
            </span>
          </div>

          <h4 className="text-sm font-semibold text-white leading-snug mb-1.5">
            {milestone.title}
          </h4>

          <p className="text-xs text-gray-400 leading-relaxed">{milestone.description}</p>

          {/* Metric badge */}
          <div className="mt-2.5 flex items-center gap-1.5">
            <div
              className={`h-1 w-1 rounded-full ${isPurple ? 'bg-purple-400' : 'bg-cyan-400'}`}
            />
            <span
              className={`text-[11px] font-semibold font-mono ${
                isPurple ? 'text-purple-300' : 'text-cyan-300'
              }`}
            >
              {milestone.metric}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface FuturePathProps {
  future: FutureTimeline
  pathIndex: number
}

export function FuturePath({ future, pathIndex }: FuturePathProps) {
  const isPurple = future.theme === 'purple'

  const headerDelay = pathIndex * 0.15 + 0.1

  return (
    <motion.div
      initial={{ opacity: 0, x: isPurple ? -32 : 32, filter: 'blur(8px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex flex-col gap-3 rounded-2xl border p-5 backdrop-blur-sm h-full ${
        isPurple
          ? 'border-purple-500/25 bg-gradient-to-b from-purple-950/30 to-purple-950/10 shadow-[0_0_60px_rgba(139,92,246,0.08)]'
          : 'border-cyan-500/25 bg-gradient-to-b from-cyan-950/30 to-cyan-950/10 shadow-[0_0_60px_rgba(6,182,212,0.08)]'
      }`}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: headerDelay, duration: 0.5 }}
        className="pb-3"
      >
        <div className="flex items-center gap-2 mb-2">
          {/* Path indicator */}
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
              isPurple
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            {future.id}
          </div>
          <span
            className={`text-xs font-bold uppercase tracking-widest ${
              isPurple ? 'text-purple-400' : 'text-cyan-400'
            }`}
          >
            Timeline {future.id}
          </span>
        </div>

        <h3 className="text-xl font-bold text-white leading-tight mb-1">{future.label}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{future.tagline}</p>
      </motion.div>

      {/* Divider */}
      <div
        className={`h-px w-full ${
          isPurple
            ? 'bg-gradient-to-r from-transparent via-purple-500/40 to-transparent'
            : 'bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent'
        }`}
      />

      {/* Milestone cards */}
      <div className="flex flex-col gap-2.5 flex-1">
        {future.milestones.map((milestone, i) => (
          <MilestoneCard
            key={milestone.year}
            milestone={milestone}
            index={i}
            theme={future.theme}
            pathIndex={pathIndex}
          />
        ))}
      </div>
    </motion.div>
  )
}
