'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'

export const PROFILE_KEY = 'parallelme_profile'

const QUESTIONS = [
  {
    id: 'risk' as const,
    question: 'When a big decision appears...',
    subtitle: 'How do you roll?',
    color: '#FF4757',
    options: [
      { value: 'low' as const,    emoji: '🛡️', label: 'Calculate first',  desc: 'I need the odds before I move' },
      { value: 'medium' as const, emoji: '⚖️', label: 'Weigh it out',     desc: 'I map pros and cons carefully' },
      { value: 'high' as const,   emoji: '🎲', label: 'Trust the gut',    desc: 'I feel it and go for it' },
    ],
  },
  {
    id: 'priority' as const,
    question: 'In 10 years, you want...',
    subtitle: 'What does success look like?',
    color: '#1E90FF',
    options: [
      { value: 'wealth' as const,     emoji: '🏆', label: 'Real wealth',      desc: 'Financial power and security' },
      { value: 'creativity' as const, emoji: '🎨', label: 'Creative legacy',  desc: 'Something I built that matters' },
      { value: 'freedom' as const,    emoji: '❤️', label: 'Deep freedom',     desc: 'Relationships, time, autonomy' },
    ],
  },
  {
    id: 'pressure' as const,
    question: 'Under serious pressure...',
    subtitle: 'What happens to you?',
    color: '#2ECC71',
    options: [
      { value: 'thrive' as const,  emoji: '⚡', label: 'I sharpen up', desc: 'Pressure brings out my best' },
      { value: 'adapt' as const,   emoji: '🌊', label: 'I find a way',  desc: 'I bend before I break' },
      { value: 'reflect' as const, emoji: '🌿', label: 'I need space',  desc: 'I think before I move' },
    ],
  },
  {
    id: 'age' as const,
    question: 'Where are you in life?',
    subtitle: 'Helps us calibrate your starting point.',
    color: '#FFD60A',
    options: [
      { value: '20s' as const, emoji: '🌱', label: 'In my 20s',  desc: 'Building the foundation' },
      { value: '30s' as const, emoji: '⚡', label: 'In my 30s',  desc: 'Raising the stakes' },
      { value: '40s' as const, emoji: '🏔️', label: 'In my 40s',  desc: 'Peak pressure zone' },
      { value: '50s+' as const, emoji: '🌅', label: '50s or older', desc: 'Playing a longer game' },
    ],
  },
  {
    id: 'col' as const,
    question: 'Where do you live?',
    subtitle: 'We adjust income realism to your city\'s cost of living.',
    color: '#9B59B6',
    options: [
      { value: 'high' as const,   emoji: '🌆', label: 'Expensive city',   desc: 'NYC, SF, London, Sydney' },
      { value: 'medium' as const, emoji: '🏙️', label: 'Mid-size city',    desc: 'Austin, Chicago, Berlin' },
      { value: 'low' as const,    emoji: '🏘️', label: 'Affordable area',  desc: 'Small city or rural' },
    ],
  },
]

export interface UserProfile {
  risk: 'low' | 'medium' | 'high'
  priority: 'wealth' | 'creativity' | 'freedom'
  pressure: 'thrive' | 'adapt' | 'reflect'
  age?: '20s' | '30s' | '40s' | '50s+'
  col?: 'high' | 'medium' | 'low'
}

interface OnboardingModalProps {
  onComplete: (profile: UserProfile) => void
  onSkip: () => void
}

export function OnboardingModal({ onComplete, onSkip }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<UserProfile>>({})
  const [selected, setSelected] = useState<string | null>(null)

  const q = QUESTIONS[step]

  const pick = (value: string) => {
    if (selected) return
    setSelected(value)
    const key = q.id
    const next = { ...answers, [key]: value } as Partial<UserProfile>
    setAnswers(next)

    setTimeout(() => {
      setSelected(null)
      if (step < QUESTIONS.length - 1) {
        setStep(step + 1)
      } else {
        const profile = next as UserProfile
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
        onComplete(profile)
      }
    }, 320)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ ease: [0.34, 1.56, 0.64, 1], duration: 0.45 }}
        className="w-full max-w-md p-7 relative rounded-2xl border border-white/10"
        style={{ background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 100%)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
      >
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors p-1"
        >
          <X size={15} />
        </button>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {QUESTIONS.map((_, i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full"
              style={{ background: i <= step ? q.color : 'rgba(255,255,255,0.1)' }}
              animate={{ flex: i === step ? 3 : i < step ? 2 : 1 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        <div className="mb-5 inline-flex items-center gap-2 sticker-yellow px-3 py-1 text-xs">
          <span>🔮</span>
          <span>Personalizing your multiverse</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.22 }}
          >
            <h2 className="text-2xl font-black text-white mb-1">{q.question}</h2>
            <p className="text-sm font-medium text-white/45 mb-6">{q.subtitle}</p>

            <div className="flex flex-col gap-2.5">
              {q.options.map((opt) => (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.97, x: 3, y: 3 }}
                  onClick={() => pick(opt.value)}
                  className={`flex items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all duration-150 ${
                    selected === opt.value
                      ? 'border-white/40 bg-white/12 shadow-[0_0_20px_rgba(139,92,246,0.2)] translate-x-[2px] translate-y-[2px]'
                      : 'border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08] hover:shadow-[0_0_16px_rgba(139,92,246,0.15)]'
                  }`}
                >
                  <span className="text-2xl shrink-0">{opt.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-black text-white">
                      {opt.label}
                    </p>
                    <p className={`text-xs font-medium ${selected === opt.value ? 'text-white/60' : 'text-white/40'}`}>
                      {opt.desc}
                    </p>
                  </div>
                  <ArrowRight size={14} className={selected === opt.value ? 'text-white/50' : 'text-white/25'} />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-widest text-white/30">
          {step + 1} of {QUESTIONS.length}
        </p>
      </motion.div>
    </motion.div>
  )
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (raw) setProfile(JSON.parse(raw))
    } catch {}
  }, [])

  const save = (p: UserProfile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
    setProfile(p)
  }

  const clear = () => {
    localStorage.removeItem(PROFILE_KEY)
    setProfile(null)
  }

  return { profile, save, clear }
}

export const PROFILE_LABELS: Record<string, string> = {
  low: 'Careful',
  medium: 'Balanced',
  high: 'Bold',
  wealth: 'Wealth',
  creativity: 'Creative',
  freedom: 'Freedom',
  thrive: 'Thriver',
  adapt: 'Adapter',
  reflect: 'Reflector',
  '20s': '20s',
  '30s': '30s',
  '40s': '40s',
  '50s+': '50s+',
  'high-col': 'Expensive city',
  'medium-col': 'Mid-size city',
  'low-col': 'Affordable area',
}
