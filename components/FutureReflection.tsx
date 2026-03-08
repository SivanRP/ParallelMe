'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, RotateCcw } from 'lucide-react'
import type { SimulateResponse } from '@/app/api/simulate/route'

const PROMPTS = [
  'Which version of me might feel happier?',
  'Did I make the right call?',
  'What did I have to give up?',
  'Would I do it again?',
  'What do I wish I knew before?',
  'Am I proud of who I became?',
]

interface SpeechBubbleProps {
  text: string
  color: string
  label: string
  delay?: number
}

function SpeechBubble({ text, color, label, delay = 0 }: SpeechBubbleProps) {
  const isA = color === '#FF4757'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.34, 1.56, 0.64, 1] }}
      className="flex flex-col gap-2"
    >
      {/* Avatar + label */}
      <div className={`flex items-center gap-2 ${isA ? '' : 'flex-row-reverse'}`}>
        <div
          className="h-9 w-9 rounded-full border-2 border-[#111] flex items-center justify-center text-white text-xs font-black shadow-[2px_2px_0_#111]"
          style={{ background: color }}
        >
          {isA ? 'A' : 'B'}
        </div>
        <span className="text-[11px] font-black uppercase tracking-widest text-[#888]">
          Future {label}
        </span>
      </div>

      {/* Bubble */}
      <div
        className={`relative rounded-2xl border-2 border-[#111] px-4 py-3 shadow-[3px_3px_0_#111] ${isA ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
        style={{ background: isA ? '#FFF5F5' : '#F0F6FF' }}
      >
        {/* Tail */}
        <div
          className={`absolute -top-[9px] ${isA ? 'left-3' : 'right-3'} h-0 w-0`}
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: `9px solid #111`,
          }}
        />
        <div
          className={`absolute -top-[7px] ${isA ? 'left-[13px]' : 'right-[13px]'} h-0 w-0`}
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: `7px solid ${isA ? '#FFF5F5' : '#F0F6FF'}`,
          }}
        />
        <p className="text-sm font-semibold text-[#222] leading-relaxed">{text}</p>
      </div>
    </motion.div>
  )
}

export function FutureReflection({ data }: { data: SimulateResponse }) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [responses, setResponses] = useState<{ responseA: string; responseB: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const yr10A = data.optionA.timeline[data.optionA.timeline.length - 1]
  const yr10B = data.optionB.timeline[data.optionB.timeline.length - 1]

  const ask = async () => {
    const q = question.trim()
    if (!q || loading) return
    setLoading(true)
    setResponses(null)
    try {
      const res = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: data.decision ?? '',
          optionA: data.optionA.label,
          optionB: data.optionB.label,
          question: q,
          metricsA: { income: yr10A.income, stress: yr10A.stress, freedom: yr10A.freedom },
          metricsB: { income: yr10B.income, stress: yr10B.stress, freedom: yr10B.freedom },
        }),
      })
      const json = await res.json()
      setResponses(json)
    } catch {
      setResponses({
        responseA: 'Something went wrong. Try again.',
        responseB: 'Something went wrong. Try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResponses(null)
    setQuestion('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="mt-12"
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 sticker-yellow px-4 py-1.5 text-sm mb-4">
          <Sparkles size={13} />
          <span>New Feature</span>
        </div>
        <h2 className="text-2xl font-black text-[#111]">
          Ask Your{' '}
          <span className="relative inline-block text-[#FF4757]">
            Future Self
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 120 6" preserveAspectRatio="none">
              <path d="M2,4 Q30,1 60,3 Q90,5 118,2" stroke="#FF4757" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="mt-3 text-sm font-medium text-[#777] max-w-sm mx-auto">
          Both versions of you — 10 years out — answer your question. Honestly.
        </p>
      </div>

      <div className="brutal-card p-6 max-w-2xl mx-auto">
        {/* Quick prompts */}
        <AnimatePresence>
          {!responses && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="mb-4"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-[#aaa] mb-2">Quick questions</p>
              <div className="flex flex-wrap gap-1.5">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setQuestion(p); setTimeout(() => inputRef.current?.focus(), 50) }}
                    className="rounded-full border-2 border-[#ddd] bg-white px-3 py-1 text-[11px] font-bold text-[#555] transition-all hover:border-[#111] hover:text-[#111] hover:shadow-[2px_2px_0_#111]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <AnimatePresence mode="wait">
          {!responses ? (
            <motion.div key="input" className="flex gap-2">
              <div className="flex-1 input-chunky flex items-center gap-2 px-4 py-3">
                <span className="text-lg shrink-0">🔮</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && ask()}
                  placeholder="Ask both future versions of you..."
                  className="flex-1 bg-transparent text-sm font-semibold text-[#111] placeholder-[#bbb] outline-none"
                />
              </div>
              <button
                onClick={ask}
                disabled={!question.trim() || loading}
                className="btn-chunky bg-[#111] text-white px-5 py-3 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[4px_4px_0px_#111]"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="reset"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={reset}
              className="flex items-center gap-2 rounded-xl border-2 border-[#ddd] bg-white px-4 py-2 text-xs font-black text-[#555] hover:border-[#111] hover:text-[#111] transition-all"
            >
              <RotateCcw size={12} />
              Ask another question
            </motion.button>
          )}
        </AnimatePresence>

        {/* Loading state */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-5 flex items-center justify-center gap-3"
            >
              {['A', 'B'].map((l, i) => (
                <motion.div
                  key={l}
                  className="flex items-center gap-2 rounded-xl border-2 border-[#eee] bg-white px-4 py-2"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                >
                  <div className="h-2 w-2 rounded-full" style={{ background: l === 'A' ? '#FF4757' : '#1E90FF' }} />
                  <span className="text-xs font-black text-[#aaa]">Future {l} is thinking…</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Responses */}
        <AnimatePresence>
          {responses && (
            <motion.div
              key="responses"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 space-y-5"
            >
              {/* Question echo */}
              <div className="text-center">
                <span className="inline-block rounded-full border-2 border-[#111] bg-[#FFD60A] px-4 py-1.5 text-xs font-black text-[#111] shadow-[2px_2px_0_#111]">
                  "{question}"
                </span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <SpeechBubble
                  text={responses.responseA}
                  color="#FF4757"
                  label={data.optionA.label}
                  delay={0}
                />
                <SpeechBubble
                  text={responses.responseB}
                  color="#1E90FF"
                  label={data.optionB.label}
                  delay={0.15}
                />
              </div>

              {/* Divider hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center text-[10px] font-bold uppercase tracking-widest text-[#ccc]"
              >
                Both are you. Only one gets to be your future.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
