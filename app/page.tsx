'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Clock, Trash2, RefreshCw, Dices, BookOpen } from 'lucide-react'
import { OnboardingModal, useUserProfile, PROFILE_LABELS } from '@/components/OnboardingModal'
import type { UserProfile } from '@/components/OnboardingModal'
import { MascotLeft, MascotRight } from '@/components/Mascot'
import { ContextPanel } from '@/components/ContextPanel'

const EXAMPLES = [
  'Start a startup vs take a stable job',
  'Move abroad vs stay close to family',
  'Pursue art full-time vs stay in finance',
  'Study medicine vs follow my passion',
]

const FEATURE_TILES = [
  { title: 'Evidence-Aware', sub: 'Real-world signals guide each simulation', bg: '#ffc3e2', rotate: '-2deg' },
  { title: '3D Worlds', sub: 'Watch both timelines unfold like a game map', bg: '#ffd75c', rotate: '1.4deg' },
  { title: 'Branching Forks', sub: 'See cascading effects, not just a score', bg: '#7cd6ff', rotate: '-1deg' },
]

const RANDOM_DECISIONS = [
  'Move to Tokyo vs stay home',
  'Start a band vs start a startup',
  'Become a teacher vs become a founder',
  'Buy a house now vs travel the world for 5 years',
  'Quit my job to freelance vs grind for a promotion',
  'Date the safe choice vs date the exciting one',
  'Get a PhD vs join a startup',
  'Go vegan vs stay a foodie',
  'Learn to code vs learn to paint',
  'Move to NYC vs move to LA',
  'Be a digital nomad vs build a home base',
  'Marry young vs build career first',
  'Adopt a dog vs adopt a minimalist lifestyle',
  'Write a novel vs build a SaaS product',
  'Become an athlete vs become a CEO',
]

const HISTORY_KEY = 'parallelme_history'

function useDecisionHistory() {
  const [history, setHistory] = useState<string[]>([])
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) setHistory(JSON.parse(raw))
    } catch {}
  }, [])
  const add = (d: string) => {
    setHistory((prev) => {
      const next = [d, ...prev.filter((x) => x !== d)].slice(0, 6)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      return next
    })
  }
  const remove = (d: string) => {
    setHistory((prev) => {
      const next = prev.filter((x) => x !== d)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      return next
    })
  }
  return { history, add, remove }
}

function Blobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="float-slow absolute -top-20 -left-20 h-80 w-80 rounded-full bg-[#FF4757] opacity-20 blur-3xl" />
      <div className="float-medium absolute -top-10 right-0 h-72 w-72 rounded-full bg-[#4DABF7] opacity-18 blur-3xl" />
      <div className="float-slow absolute bottom-10 left-10 h-56 w-56 rounded-full bg-[#FFD60A] opacity-12 blur-2xl" />
      <div className="float-medium absolute -bottom-10 right-20 h-64 w-64 rounded-full bg-[#8B5CF6] opacity-20 blur-3xl" />
      <div className="float-slow absolute top-[40%] left-[30%] h-96 w-96 rounded-full bg-[#8B5CF6] opacity-8 blur-[80px]" />
      {/* Glowing orbs */}
      <div className="absolute top-[12%] right-[6%] h-3 w-3 rounded-full bg-[#FFD60A] shadow-[0_0_10px_4px_rgba(255,214,10,0.6)] hidden md:block" />
      <div className="absolute top-[18%] right-[10%] h-2 w-2 rounded-full bg-[#FF4757] shadow-[0_0_8px_3px_rgba(255,71,87,0.6)] hidden md:block" />
      <div className="absolute top-[8%] left-[8%] h-2.5 w-2.5 rounded-full bg-[#4DABF7] shadow-[0_0_10px_4px_rgba(77,171,247,0.6)] hidden md:block" />
      <div className="absolute bottom-[20%] left-[5%] h-4 w-4 rounded-full bg-[#2ECC71] shadow-[0_0_12px_5px_rgba(46,204,113,0.5)] hidden md:block" />
      <div className="absolute bottom-[15%] right-[8%] h-3 w-3 rounded-full bg-[#8B5CF6] shadow-[0_0_10px_4px_rgba(139,92,246,0.6)] hidden md:block" />
    </div>
  )
}

export default function HomePage() {
  const [decision, setDecision] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [diceSpin, setDiceSpin] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [pendingDecision, setPendingDecision] = useState<string | null>(null)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const { history, add, remove } = useDecisionHistory()
  const { profile, save: saveProfile, clear: clearProfile } = useUserProfile()

  const rollRandom = () => {
    setDiceSpin(true)
    setTimeout(() => setDiceSpin(false), 600)
    const pick = RANDOM_DECISIONS[Math.floor(Math.random() * RANDOM_DECISIONS.length)]
    setDecision(pick)
    inputRef.current?.focus()
  }

  const navigate = (trimmed: string) => {
    add(trimmed)
    setIsNavigating(true)
    router.push(`/simulate?decision=${encodeURIComponent(trimmed)}`)
    // Safety reset — if navigation doesn't complete in 15s, unlock the button
    setTimeout(() => setIsNavigating(false), 15000)
  }

  const handleSimulate = () => {
    const trimmed = decision.trim()
    if (!trimmed || isNavigating) return
    if (!profile) {
      setPendingDecision(trimmed)
      setShowOnboarding(true)
      return
    }
    navigate(trimmed)
  }

  const handleOnboardingComplete = (p: UserProfile) => {
    saveProfile(p)
    setShowOnboarding(false)
    if (pendingDecision) {
      navigate(pendingDecision)
      setPendingDecision(null)
    }
  }

  const handleOnboardingSkip = () => {
    setShowOnboarding(false)
    if (pendingDecision) {
      navigate(pendingDecision)
      setPendingDecision(null)
    }
  }

  return (
    <>
    <AnimatePresence>
      {showOnboarding && (
        <OnboardingModal
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </AnimatePresence>

    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-transparent px-4 py-16">
      <Blobs />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center brutal-card px-6 py-8 sm:px-10 sm:py-10">

        {/* Badge */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="mb-7 inline-flex items-center gap-2 sticker-yellow px-4 py-1.5 text-sm tracking-wide"
        >
          <span>✦</span>
          <span>Multiverse Decision Engine</span>
        </motion.div>

        {/* Title — handcrafted, no generic shimmer */}
        <motion.h1
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-4 font-black leading-[0.9] tracking-tight text-[#111]"
          style={{ fontSize: 'clamp(3.8rem, 10vw, 7rem)' }}
        >
          Parallel{' '}
          {/* "Me" — bold coral with hand-drawn underline, not an AI shimmer */}
          <span className="relative inline-block text-[#FF4757]">
            Me
            {/* Hand-drawn wavy underline */}
            <svg
              aria-hidden="true"
              className="absolute -bottom-2 left-0 w-full"
              viewBox="0 0 120 10"
              preserveAspectRatio="none"
              style={{ height: '0.18em' }}
            >
              <motion.path
                d="M3,6 Q20,2 40,6 Q60,10 80,5 Q100,1 117,6"
                stroke="#FF4757"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, delay: 0.6, ease: 'easeOut' }}
              />
            </svg>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mb-10 max-w-lg text-lg font-medium text-[#5f6477] leading-relaxed"
        >
          Enter a life decision. Watch two versions of{' '}
          <span className="font-black text-[#111]">you</span> unfold.
        </motion.p>

        <div className="mb-8 grid w-full gap-3 sm:grid-cols-3">
          {FEATURE_TILES.map((tile) => (
            <div
              key={tile.title}
              className="comic-card p-3 text-left"
              style={{ background: tile.bg, transform: `rotate(${tile.rotate})` }}
            >
              <p className="text-sm font-black text-[#111]">{tile.title}</p>
              <p className="mt-1 text-xs font-semibold text-[#2b3042]">{tile.sub}</p>
            </div>
          ))}
        </div>

        {/* Profile badge / retake quiz */}
        <AnimatePresence>
          {profile && (
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ ease: [0.34, 1.56, 0.64, 1], duration: 0.4 }}
              className="mb-6 w-full"
            >
              <button
                onClick={() => { clearProfile(); setShowOnboarding(true) }}
                className="group w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#111]/15 bg-white/80 px-4 py-2.5 hover:border-[#111]/30 hover:bg-white transition-all duration-150"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-[#61667a] group-hover:text-[#232737]">Profile:</span>
                {[profile.risk, profile.priority, profile.pressure].map((v) => (
                  <span key={v} className="rounded-full border border-[#111]/15 bg-[#f4f7ff] px-2.5 py-0.5 text-[10px] font-black text-[#4d5368] group-hover:border-[#111]/30 group-hover:text-[#232737] transition-all">
                    {PROFILE_LABELS[v]}
                  </span>
                ))}
                <span className="ml-1 flex items-center gap-1 text-[10px] font-bold text-[#6f758b] group-hover:text-[#232737]">
                  <RefreshCw size={9} /> Edit
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.28 }}
          className="w-full mb-3"
        >
          <div className={`input-chunky flex items-center gap-3 px-5 py-4 ${isFocused ? 'shadow-[4px_4px_0px_rgba(17,17,17,0.5)]' : ''}`}>
            <span className="text-xl shrink-0">🔀</span>
            <input
              ref={inputRef}
              type="text"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
              placeholder="Start a startup vs take a stable job"
              className="flex-1 bg-transparent text-base font-semibold text-[#111] placeholder-[#8a90a5] outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <AnimatePresence>
              {decision.trim() && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="h-6 w-6 flex items-center justify-center rounded-full bg-[#FFD60A] text-[#111] font-black text-xs shrink-0 border-2 border-[#111]"
                >
                  ↵
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Context panel */}
        <ContextPanel />

        {/* CTA row */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="w-full flex gap-2.5 mb-0"
        >
          {/* Random decision button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={rollRandom}
            title="Random life decision"
            className="btn-chunky bg-[#FFD60A] text-[#111] px-4 py-4 text-base flex items-center justify-center shrink-0"
          >
            <motion.span
              animate={diceSpin ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="inline-flex"
            >
              <Dices size={20} />
            </motion.span>
          </motion.button>

          <motion.button
          onClick={handleSimulate}
          disabled={!decision.trim() || isNavigating}
          className="flex-1 btn-chunky bg-[#111] text-white px-8 py-4 text-base flex items-center justify-center gap-2.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isNavigating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                className="h-4 w-4 rounded-full border-2 border-white/25 border-t-white"
              />
              Simulating futures…
            </>
          ) : (
            <>
              Simulate My Futures
              <ArrowRight size={17} />
            </>
          )}
        </motion.button>
        </motion.div>

        {/* Examples */}
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 flex flex-col items-center gap-3 w-full"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[#7d8398]">Try an example</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((ex, i) => (
              <motion.button
                key={ex}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 + i * 0.06, ease: [0.34, 1.56, 0.64, 1] }}
                onClick={() => { setDecision(ex); inputRef.current?.focus() }}
                className="rounded-full border border-[#111]/14 bg-white/75 px-4 py-1.5 text-xs font-bold text-[#4f556b] backdrop-blur-sm transition-all duration-100 hover:border-[#111]/35 hover:bg-white hover:text-[#111] hover:shadow-[0_6px_14px_rgba(77,171,247,0.25)]"
              >
                {ex}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Decision history */}
        <AnimatePresence>
          {history.length > 0 && (
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-8 w-full"
            >
              <div className="comic-card p-4" style={{ transform: 'rotate(-0.5deg)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={13} className="text-[#8a90a5]" />
                  <p className="text-xs font-black uppercase tracking-widest text-[#8a90a5]">Recent</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {history.map((h) => (
                    <div key={h} className="flex items-center gap-2 group rounded-xl border-2 border-[#111]/10 bg-white/80 px-3 py-2 hover:border-[#111]/20 hover:bg-white transition-colors">
                      <button
                        onClick={() => { setDecision(h); inputRef.current?.focus() }}
                        className="flex-1 text-left text-sm font-semibold text-[#4f556b] truncate"
                      >
                        {h}
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { add(h); setIsNavigating(true); router.push(`/simulate?decision=${encodeURIComponent(h)}`) }}
                          className="rounded-lg bg-[#111] border border-[#111] px-2.5 py-1 text-[10px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#2a2d3c]"
                        >
                          Re-run
                        </button>
                        <button onClick={() => remove(h)} className="rounded-lg p-1 text-[#9aa0b4] hover:text-[#FF4757] opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Journal link */}
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <button
            onClick={() => router.push('/journal')}
            className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#7d8398] hover:text-[#232737] transition-colors"
          >
            <BookOpen size={11} />
            View decision journal
          </button>
        </motion.div>
      </div>

      {/* Floating path labels */}
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[14%] right-[6%] hidden lg:block select-none pointer-events-none">
        <div className="sticker-a px-3 py-1 text-[11px] font-black rotate-3">PATH A</div>
      </motion.div>
      <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-[20%] left-[5%] hidden lg:block select-none pointer-events-none">
        <div className="sticker-b px-3 py-1 text-[11px] font-black -rotate-2">PATH B</div>
      </motion.div>
    </main>

    <MascotLeft />
    <MascotRight />
    </>
  )
}
