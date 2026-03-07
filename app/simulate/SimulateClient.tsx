'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight, GitBranch } from 'lucide-react'
import dynamic from 'next/dynamic'
import { StoryCards } from '@/components/StoryCards'
import { MetricTimeline } from '@/components/MetricTimeline'
import { ComparisonChart } from '@/components/ComparisonChart'
import { VerdictCard } from '@/components/VerdictCard'
import { LifeArcChart } from '@/components/LifeArcChart'
import { FutureReflection } from '@/components/FutureReflection'
import { ProbabilityDrift } from '@/components/ProbabilityDrift'
import { ConstellationMap } from '@/components/ConstellationMap'
import { BranchEvents } from '@/components/BranchingEvent'
import { RippleTimeline } from '@/components/RippleTimeline'
import { ThirdPath } from '@/components/ThirdPath'
import { LifeEventGraph } from '@/components/LifeEventGraph'
import { LifeSummaryReport } from '@/components/LifeSummaryReport'
import { DecisionAnalysis } from '@/components/DecisionAnalysis'
import { DecisionVariables } from '@/components/DecisionVariables'
import { DecisionGraph } from '@/components/DecisionGraph'
import { DecisionScoreboard } from '@/components/DecisionScoreboard'
import { NextWeekPlan } from '@/components/NextWeekPlan'
import { DecisionArena } from '@/components/DecisionArena'
import { PointOfNoReturn } from '@/components/PointOfNoReturn'
import { StreamingPanel } from '@/components/StreamingPanel'
import { FutureLetter } from '@/components/FutureLetter'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import { useUserProfile, PROFILE_LABELS } from '@/components/OnboardingModal'
import { saveToJournal } from '@/lib/journal'
import { saveShare, loadShare } from '@/lib/shareStore'
import { normalizeSimulateResponse } from '@/lib/normalizeSimulate'
import type { SimulateResponse } from '@/app/api/simulate/route'
import type { GraphResponse } from '@/app/api/graph/route'

const WorldViewer = dynamic(
  () => import('@/components/WorldScene').then((m) => m.WorldViewer),
  { ssr: false }
)

function Blobs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="float-slow absolute -top-32 -left-24 h-80 w-80 rounded-full bg-[#FF4757] opacity-5 blur-3xl" />
      <div className="float-medium absolute top-20 right-0 h-64 w-64 rounded-full bg-[#1E90FF] opacity-5 blur-3xl" />
      <div className="float-slow absolute bottom-20 left-0 h-56 w-56 rounded-full bg-[#FFD60A] opacity-8 blur-2xl" />
    </div>
  )
}

// ─── Reaction widget ──────────────────────────────────────────────────────────

const REACTIONS = [
  { mark: '!!', label: 'Mind blown' },
  { mark: '?!', label: 'Terrifying' },
  { mark: '→', label: "I'm going for it" },
  { mark: '✓', label: 'This tracks' },
  { mark: '...', label: 'Too real' },
]

function ReactionBar() {
  const [chosen, setChosen] = useState<string | null>(null)
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-10 brutal-card p-5"
    >
      <p className="mb-3 text-center text-sm font-black text-[#111] uppercase tracking-wider">
        How does this make you feel?
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {REACTIONS.map(({ mark, label }) => (
          <motion.button
            key={label}
            whileTap={{ scale: 0.88 }}
            onClick={() => setChosen(label)}
            className={`flex items-center gap-2 rounded-2xl border-2 px-4 py-2 text-sm font-black transition-all duration-150 ${
              chosen === label
                ? 'border-[#111] bg-[#111] text-white shadow-none translate-x-[2px] translate-y-[2px]'
                : 'border-[#ddd] bg-white text-[#333] shadow-[3px_3px_0_#ddd] hover:border-[#111] hover:shadow-[3px_3px_0_#111]'
            }`}
          >
            <span className="text-base font-black leading-none" style={{ color: chosen === label ? '#FFD60A' : '#FF4757' }}>{mark}</span>
            <span>{label}</span>
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {chosen && (
          <motion.p
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-center text-xs font-bold text-[#888]"
          >
            Noted. "{chosen}" is a very valid response to seeing your future.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Choose-your-path section ─────────────────────────────────────────────────

function ChooseYourPath({ data }: { data: SimulateResponse }) {
  const [chosen, setChosen] = useState<'A' | 'B' | null>(null)

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="mt-10"
    >
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-black text-[#111]">Make the Call</h2>
        <p className="mt-1 text-sm font-medium text-[#777]">
          Both futures are possible. Only one becomes real.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!chosen ? (
          <motion.div
            key="choose"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {/* Path A */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97, x: 3, y: 3 }}
              onClick={() => setChosen('A')}
              className="brutal-card-a p-6 text-center cursor-pointer hover:shadow-[8px_8px_0px_#FF4757] transition-shadow duration-150"
            >
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-2xl border-2 border-[#111] bg-[#FF4757] flex items-center justify-center text-xl font-black text-white shadow-[3px_3px_0_#111]">A</div>
              </div>
              <p className="text-lg font-black text-[#111] capitalize mb-1">{data.optionA.label}</p>
              <p className="text-sm text-[#555] font-medium">{data.optionA.tagline}</p>
              <div className="mt-4 rounded-xl bg-[#FF4757] border-2 border-[#111] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#111]">
                I choose this path
              </div>
            </motion.button>

            {/* Path B */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97, x: 3, y: 3 }}
              onClick={() => setChosen('B')}
              className="brutal-card-b p-6 text-center cursor-pointer hover:shadow-[8px_8px_0px_#1E90FF] transition-shadow duration-150"
            >
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-2xl border-2 border-[#111] bg-[#1E90FF] flex items-center justify-center text-xl font-black text-white shadow-[3px_3px_0_#111]">B</div>
              </div>
              <p className="text-lg font-black text-[#111] capitalize mb-1">{data.optionB.label}</p>
              <p className="text-sm text-[#555] font-medium">{data.optionB.tagline}</p>
              <div className="mt-4 rounded-xl bg-[#1E90FF] border-2 border-[#111] px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#111]">
                I choose this path
              </div>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="chosen"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ease: [0.34, 1.56, 0.64, 1], duration: 0.55 }}
            className={`brutal-card p-8 text-center border-4 ${chosen === 'A' ? 'border-[#FF4757]' : 'border-[#1E90FF]'}`}
          >
            <div className="flex justify-center mb-4">
              <div className={`h-16 w-16 rounded-2xl border-2 border-[#111] flex items-center justify-center text-2xl font-black text-white shadow-[4px_4px_0_#111] ${chosen === 'A' ? 'bg-[#FF4757]' : 'bg-[#1E90FF]'}`}>
                {chosen}
              </div>
            </div>
            <p className="text-2xl font-black text-[#111] mb-2">
              You chose{' '}
              <span className={chosen === 'A' ? 'text-[#FF4757]' : 'text-[#1E90FF]'}>
                {chosen === 'A' ? data.optionA.label : data.optionB.label}
              </span>
            </p>
            <p className="text-sm font-medium text-[#555] max-w-sm mx-auto mb-5">
              {chosen === 'A' ? data.optionA.tagline : data.optionB.tagline}
            </p>
            <div className="inline-flex items-center gap-2 sticker-yellow px-4 py-2 text-sm">
              <span>✦</span>
              Now go make it happen.
            </div>
            <div className="mt-4">
              <button onClick={() => setChosen(null)} className="text-xs font-bold text-[#aaa] hover:text-[#111] underline underline-offset-2">
                Change my mind
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface FeatureTab {
  id: string
  label: string
  accent: string
  render: () => ReactNode
}

// ─── Main client ──────────────────────────────────────────────────────────────

interface SimulateClientProps {
  decision: string
}

export function SimulateClient({ decision }: SimulateClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<SimulateResponse | null>(null)
  const [isError, setIsError] = useState(false)
  const [year, setYear] = useState(1)
  const [activeFeature, setActiveFeature] = useState(0)
  const [journalSaved, setJournalSaved] = useState(false)
  const [graphData, setGraphData] = useState<GraphResponse | null>(null)
  const { profile } = useUserProfile()

  // Load shared simulation from ?sid= on mount
  useEffect(() => {
    const sid = searchParams.get('sid')
    if (sid) {
      const saved = loadShare(sid)
      if (saved) setData(normalizeSimulateResponse(saved, decision))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch causal graph after simulation data is ready
  useEffect(() => {
    if (!data) return
    setGraphData(null)
    fetch('/api/graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        optionA: data.optionA.label,
        optionB: data.optionB.label,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((g) => { if (g) setGraphData(g) })
      .catch((err) => console.error('[SimulateClient] Graph fetch error:', err))
  }, [data, decision])

  const handleSaveJournal = () => {
    if (!data) return
    const avg = (opt: SimulateResponse['optionA']) => {
      const t = opt.timeline
      return Math.round(
        ((t[0].income + t[1].income + t[2].income) / 3) * 0.35 +
        ((t[0].freedom + t[1].freedom + t[2].freedom) / 3) * 0.40 -
        ((t[0].stress + t[1].stress + t[2].stress) / 3) * 0.25
      )
    }
    const scoreA = avg(data.optionA)
    const scoreB = avg(data.optionB)
    const diff = scoreA - scoreB
    saveToJournal({
      decision,
      optionA: data.optionA.label,
      optionB: data.optionB.label,
      scoreA,
      scoreB,
      winner: Math.abs(diff) < 3 ? 'tie' : diff > 0 ? 'A' : 'B',
      source: data.source,
    })
    setJournalSaved(true)
  }

  const sid = searchParams.get('sid')
  const hasSid = sid !== null
  const featureTabs: FeatureTab[] = []

  if (data) {
    featureTabs.push({
      id: 'scoreboard',
      label: 'Live Outcomes',
      accent: '#FFD60A',
      render: () => (
        <>
          <DecisionScoreboard data={data} />
          <div className="mt-5">
            <PointOfNoReturn data={data} />
          </div>
        </>
      ),
    })

    featureTabs.push(
      {
        id: 'trends',
        label: 'Trendlines',
        accent: '#4DABF7',
        render: () => (
          <>
            <ProbabilityDrift data={data} year={year} />
            <LifeArcChart data={data} />
            <RippleTimeline data={data} />
          </>
        ),
      },
      {
        id: 'stories',
        label: 'Story Paths',
        accent: '#FF4757',
        render: () => (
          <>
            <StoryCards data={data} isLoading={!data} />
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <BranchEvents
                branchEvents={data.optionA.branchEvents}
                pathLabel={data.optionA.label}
                color="#FF4757"
                decision={decision}
                originalMilestones={data.optionA.milestones}
                originalTimeline={data.optionA.timeline}
              />
              <BranchEvents
                branchEvents={data.optionB.branchEvents}
                pathLabel={data.optionB.label}
                color="#1E90FF"
                decision={decision}
                originalMilestones={data.optionB.milestones}
                originalTimeline={data.optionB.timeline}
              />
            </div>
          </>
        ),
      },
      {
        id: 'maps',
        label: 'Maps & Graphs',
        accent: '#8B5CF6',
        render: () => (
          <>
            <ConstellationMap data={data} year={Math.round(year)} />
            {graphData && (
              <DecisionGraph
                graphA={graphData.graphA}
                graphB={graphData.graphB}
                optionALabel={data.optionA.label}
                optionBLabel={data.optionB.label}
              />
            )}
            <LifeEventGraph data={data} />
          </>
        ),
      },
      {
        id: 'strategy',
        label: 'Strategy Lab',
        accent: '#2ECC71',
        render: () => (
          <>
            <ThirdPath data={data} />
            <DecisionAnalysis data={data} />
            <DecisionVariables data={data} />
            <div className="mt-5">
              <NextWeekPlan data={data} />
            </div>
          </>
        ),
      },
      {
        id: 'scoreboard',
        label: 'Scoreboard',
        accent: '#111111',
        render: () => (
          <>
            <ComparisonChart data={data} />
            {!isError && <MetricTimeline data={data} isLoading={!data} />}
            <LifeSummaryReport data={data} />
          </>
        ),
      },
      {
        id: 'reflection',
        label: 'Reflection',
        accent: '#FF8C00',
        render: () => (
          <>
            <FutureReflection data={data} />
            <ReactionBar />
            <ChooseYourPath data={data} />
            <FutureLetter data={data} />
          </>
        ),
      },
      {
        id: 'arena',
        label: 'Decision Arena',
        accent: '#8B5CF6',
        render: () => <DecisionArena data={data} roomId={sid ?? undefined} />,
      }
    )
  }

  useEffect(() => {
    setActiveFeature(0)
  }, [data?.decision])

  if (!decision && !hasSid) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-[#666] text-lg font-medium">No decision provided.</p>
        <button onClick={() => router.push('/')} className="btn-chunky bg-[#111] text-white px-6 py-2.5 text-sm">
          Go back
        </button>
      </div>
    )
  }

  return (
    <main className="relative min-h-screen bg-transparent overflow-x-hidden">
      <Blobs />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Back */}
        <motion.button
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => router.push('/')}
          className="mb-8 inline-flex items-center gap-2 btn-chunky bg-[#FFD60A] text-[#111] px-4 py-2 text-sm"
        >
          <ArrowLeft size={14} /> New decision
        </motion.button>

        {/* Header */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-10 text-center brutal-card px-5 py-7 sm:px-8"
        >
          <div className="mb-5 inline-flex items-center gap-2 sticker-yellow px-5 py-2 text-sm max-w-[90%]">
            <GitBranch size={14} className="shrink-0" />
            <span className="font-black truncate">{decision}</span>
          </div>

          <h1 className="mb-3 font-black leading-[0.95] tracking-tight text-[#111]"
            style={{ fontSize: 'clamp(2.4rem, 7vw, 4.5rem)' }}
          >
            Two{' '}
            <span className="relative inline-block text-[#FF4757]">
              Timelines
              <svg aria-hidden="true" className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" preserveAspectRatio="none" style={{ height: '0.15em' }}>
                <path d="M4,5 Q50,1 100,5 Q150,9 196,4" stroke="#FF4757" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
            . One Life.
          </h1>

          <p className="text-[#5f6477] text-base max-w-lg mx-auto font-medium">
            Every choice creates a fork. Here are the two versions of you that never met.
          </p>

          {/* Profile badge */}
          {profile && (
            <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#8a90a5]">Personalized for:</span>
              {[profile.risk, profile.priority, profile.pressure, profile.age, profile.col ? `${profile.col}-col` : undefined].filter(Boolean).map((v) => (
                <span key={v} className="rounded-full border border-[#111]/12 bg-white px-2 py-0.5 text-[9px] font-black text-[#4f556b]">
                  {PROFILE_LABELS[v as string] ?? v}
                </span>
              ))}
            </div>
          )}

          {/* AI source badge — shows when data is loaded */}
          {data && (
            <div className="mt-4 flex flex-col items-center gap-1.5">
              <div className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                data.source === 'mock'
                  ? 'border-[#FFD60A] bg-[#FFFBE6] text-[#996600]'
                  : 'border-[#2ECC71] bg-[#F0FFF4] text-[#1a7a3e]'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${data.source === 'mock' ? 'bg-[#FFD60A]' : 'bg-[#2ECC71]'}`} />
                {data.source === 'mock' ? 'Using demo data' : `AI powered · ${data.source}`}
              </div>
              {/* Show actual error when falling back to mock — helps diagnose key/quota issues */}
              {data._error && (
                <div className="max-w-md rounded-xl border border-[#FF4757] bg-[#FFF5F5] px-3 py-1.5 text-[9px] font-mono text-[#FF4757] text-center break-all">
                  {data._error}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Path A / B badges */}
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="relative mb-10 flex items-center justify-center gap-4"
        >
          <div className="sticker-a px-4 py-1.5 text-xs rotate-[-1deg] shadow-[3px_3px_0_#FF4757]">PATH A</div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111] bg-[#FFD60A] text-[#111] font-black text-sm shadow-[3px_3px_0_#111]">⚡</div>
          <div className="sticker-b px-4 py-1.5 text-xs rotate-[1deg] shadow-[3px_3px_0_#1E90FF]">PATH B</div>
        </motion.div>

        {/* ── 3D World ── */}
        <div className="mb-4">
          <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mb-4 text-center">
            <h2 className="text-2xl font-black text-[#111]">
              Your Parallel{' '}
              <span className="relative inline-block text-[#1E90FF]">
                Worlds
                <svg aria-hidden="true" className="absolute -bottom-1 left-0 w-full" viewBox="0 0 80 8" preserveAspectRatio="none" style={{ height: '0.18em' }}>
                  <path d="M3,5 Q20,2 40,5 Q60,8 77,4" stroke="#1E90FF" strokeWidth="3" fill="none" strokeLinecap="round"/>
                </svg>
              </span>
            </h2>
            <p className="mt-2 text-sm font-medium text-[#888]">Drag the slider — or hit Play to watch your decade unfold.</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!data ? (
              <motion.div key="streaming" exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.35 }}>
                <StreamingPanel
                  decision={decision}
                  profile={profile ?? undefined}
                  onComplete={(d) => {
                    const safe = normalizeSimulateResponse(d, decision)
                    const sid = saveShare(safe)
                    router.replace(`?decision=${encodeURIComponent(decision)}&sid=${sid}`, { scroll: false })
                    setData(safe)
                    setJournalSaved(false)
                  }}
                />
              </motion.div>
            ) : (
              <motion.div key="world" initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <WorldViewer data={data} onYearChange={setYear} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AppErrorBoundary>
          {/* ── Verdict ── */}
          {data && <VerdictCard data={data} profile={profile} />}

          {/* ── Feature Deck ── */}
          {data && featureTabs.length > 0 && (
            <section className="mt-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2">
                  <span className="comic-note px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#5f6477]">
                    Feature Deck
                  </span>
                  <span className="text-xs font-bold text-[#8a90a5]">
                    {activeFeature + 1} / {featureTabs.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveFeature((prev) => (prev - 1 + featureTabs.length) % featureTabs.length)}
                    className="comic-chip bg-white px-3 py-1.5 text-[#111]"
                    aria-label="Previous feature"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setActiveFeature((prev) => (prev + 1) % featureTabs.length)}
                    className="comic-chip bg-white px-3 py-1.5 text-[#111]"
                    aria-label="Next feature"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
                {featureTabs.map((tab, i) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFeature(i)}
                    className={`tape-tag shrink-0 rounded-xl border-2 px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                      i === activeFeature
                        ? 'border-[#111] bg-[#111] text-white shadow-[4px_4px_0_#111]'
                        : 'border-[#111]/20 bg-white text-[#5f6477] shadow-[3px_3px_0_rgba(17,17,17,0.2)] hover:border-[#111]/35'
                    }`}
                    style={{
                      transform: `rotate(${i % 2 === 0 ? '-1deg' : '1deg'})`,
                      boxShadow: i === activeFeature ? `0 0 0 2px ${tab.accent}44` : undefined,
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={featureTabs[activeFeature].id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="comic-card p-4 sm:p-6"
                >
                  {featureTabs[activeFeature].render()}
                </motion.div>
              </AnimatePresence>
            </section>
          )}

          {/* ── Footer ── */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="mt-14 flex flex-col items-center gap-4 text-center"
          >
            {/* Save to journal */}
            {data && (
              <motion.button
                whileTap={{ scale: 0.96, x: 2, y: 2 }}
                onClick={handleSaveJournal}
                disabled={journalSaved}
                className={`inline-flex items-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-black transition-all duration-150 ${
                  journalSaved
                    ? 'border-[#2ECC71] bg-[#F0FFF4] text-[#1a7a3e] shadow-none cursor-default'
                    : 'border-[#111] bg-white text-[#111] shadow-[3px_3px_0_#111] hover:shadow-[1px_1px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px]'
                }`}
              >
                {journalSaved ? (
                  <><span className="text-[#2ECC71] font-black">✓</span> Saved to journal</>
                ) : (
                  <>Save to Journal</>
                )}
              </motion.button>
            )}

            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/')}
                className="btn-chunky bg-white text-[#111] px-5 py-2.5 text-sm">
                Try another decision
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'Parallel Me', text: `My decision: ${decision}`, url: window.location.href })
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                  }
                }}
                className="btn-chunky bg-[#111] text-white px-5 py-2.5 text-sm"
              >
                Share
              </button>
              <button onClick={() => router.push('/journal')}
                className="btn-chunky bg-[#FFD60A] text-[#111] px-5 py-2.5 text-sm">
                Journal
              </button>
            </div>
          </motion.div>
        </AppErrorBoundary>

      </div>
    </main>
  )
}
