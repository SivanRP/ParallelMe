'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mail, CheckCircle2, Loader2 } from 'lucide-react'
import type { SimulateResponse } from '@/app/api/simulate/route'

interface FutureLetterProps {
  data: SimulateResponse
}

type Stage = 'compose' | 'sending' | 'sent' | 'error'

export function FutureLetter({ data }: FutureLetterProps) {
  const [chosenPath, setChosenPath] = useState<'A' | 'B' | null>(null)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [stage, setStage] = useState<Stage>('compose')
  const [letter, setLetter] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [visibleChars, setVisibleChars] = useState(0)
  const [deliveryNote, setDeliveryNote] = useState<string | null>(null)
  const [deliveryMeta, setDeliveryMeta] = useState<{ id?: string; from?: string } | null>(null)

  const canSend = chosenPath && message.trim().length > 10 && email.includes('@') && stage === 'compose'

  const handleSend = async () => {
    if (!canSend) return
    setStage('sending')

    try {
      const res = await fetch('/api/letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, email, data, chosenPath }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')

      setLetter(json.letter as string)
      setDeliveryNote(json?.delivery?.sent ? null : (json?.delivery?.reason ?? 'Letter generated, but email was not delivered.'))
      setDeliveryMeta({ id: json?.delivery?.providerId, from: json?.delivery?.from })
      setStage('sent')

      // Typewriter reveal
      let i = 0
      const tick = () => {
        i += 3
        setVisibleChars(i)
        if (i < (json.letter as string).length) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    } catch (err) {
      setErrorMsg(String(err))
      setStage('error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="mt-10"
    >
      {/* Header */}
      <div className="mb-5 text-center">
        <div className="mb-3 inline-flex items-center gap-2 sticker-yellow px-4 py-1.5 text-xs">
          <Mail size={12} />
          <span>Message Your Future Self</span>
        </div>
        <h2 className="text-2xl font-black text-[#111]">Write to Year 10</h2>
        <p className="mt-1 text-sm font-medium text-[#777] max-w-sm mx-auto">
          Send a message. Your future self — 10 years down the chosen path — writes back.
        </p>
      </div>

      <div className="brutal-card p-6">
        <AnimatePresence mode="wait">

          {/* ── Compose stage ── */}
          {(stage === 'compose' || stage === 'error') && (
            <motion.div key="compose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Path selector */}
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-2">
                  Which path are you on?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(['A', 'B'] as const).map((p) => {
                    const opt = p === 'A' ? data.optionA : data.optionB
                    const color = p === 'A' ? '#FF4757' : '#1E90FF'
                    const bg = p === 'A' ? 'bg-[#FFE8EA] border-[#FF4757]' : 'bg-[#DCF0FF] border-[#1E90FF]'
                    const inactive = 'bg-white border-[#ddd] hover:border-[#999]'
                    return (
                      <motion.button
                        key={p}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setChosenPath(p)}
                        className={`rounded-2xl border-2 p-3.5 text-left transition-all duration-150 ${
                          chosenPath === p ? bg : inactive
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="h-5 w-5 rounded-md flex items-center justify-center text-[9px] font-black text-white"
                            style={{ background: color }}
                          >
                            {p}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>
                            Path {p}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[#555] capitalize leading-tight">{opt.label}</p>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Message textarea */}
              <div className="mb-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#888] mb-2">
                  Your message to year-10 you
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What do you want to know? What are you afraid of? What are you hoping for?..."
                  rows={4}
                  className="w-full rounded-xl border-2 border-[#ddd] bg-[#fafaf7] px-4 py-3 text-sm text-[#111] placeholder-[#ccc] font-medium resize-none focus:outline-none focus:border-[#111] transition-colors"
                />
                <p className="mt-1 text-right text-[9px] font-mono text-[#ccc]">{message.length} chars</p>
              </div>

              {/* Email */}
              <div className="mb-5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#888] mb-2">
                  Your email — the reply lands here
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border-2 border-[#ddd] bg-[#fafaf7] px-4 py-3 text-sm text-[#111] placeholder-[#ccc] font-medium focus:outline-none focus:border-[#111] transition-colors"
                />
              </div>

              {stage === 'error' && (
                <p className="mb-4 text-xs font-bold text-[#FF4757] bg-[#FFF5F5] border border-[#FF4757] rounded-xl px-3 py-2">
                  {errorMsg || 'Something went wrong. Try again.'}
                </p>
              )}

              {/* Send button */}
              <motion.button
                whileTap={canSend ? { scale: 0.97, x: 2, y: 2 } : {}}
                onClick={handleSend}
                disabled={!canSend}
                className={`w-full flex items-center justify-center gap-2 rounded-xl border-2 px-5 py-3 text-sm font-black transition-all duration-150 ${
                  canSend
                    ? 'border-[#111] bg-[#111] text-white shadow-[3px_3px_0_#FF4757] hover:shadow-[1px_1px_0_#FF4757] hover:translate-x-[2px] hover:translate-y-[2px]'
                    : 'border-[#eee] bg-[#f5f5f0] text-[#ccc] cursor-not-allowed'
                }`}
              >
                <Send size={14} />
                Send to future self
              </motion.button>

              <p className="mt-3 text-center text-[9px] font-mono text-[#bbb]">
                Your future self responds immediately. Powered by Groq + Resend.
              </p>
            </motion.div>
          )}

          {/* ── Sending stage ── */}
          {stage === 'sending' && (
            <motion.div
              key="sending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center gap-4 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 size={28} className="text-[#FFD60A]" />
              </motion.div>
              <div>
                <p className="text-sm font-black text-[#111]">Your future self is writing back…</p>
                <p className="text-xs font-medium text-[#888] mt-1">10 years of experience, compressed into a few paragraphs.</p>
              </div>
              <div className="flex gap-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-[#FFD60A]"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Sent / letter reveal stage ── */}
          {stage === 'sent' && letter && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Confirmation bar */}
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-[#2ECC71] bg-[#F0FFF4] px-4 py-2.5">
                <CheckCircle2 size={14} className="text-[#2ECC71] shrink-0" />
                <p className="text-xs font-bold text-[#1a7a3e]">
                  {deliveryNote
                    ? `Letter generated. ${deliveryNote}`
                    : <>Sent to <span className="font-black">{email}</span> — check your inbox.</>}
                </p>
              </div>
              {deliveryMeta?.id ? (
                <p className="mb-4 text-[10px] font-mono text-[#6d7388]">
                  Resend ID: {deliveryMeta.id} {deliveryMeta.from ? `· from ${deliveryMeta.from}` : ''}
                </p>
              ) : null}

              {/* Path label */}
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="h-5 w-5 rounded-md flex items-center justify-center text-[9px] font-black text-white"
                  style={{ background: chosenPath === 'A' ? '#FF4757' : '#1E90FF' }}
                >
                  {chosenPath}
                </div>
                <span
                  className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: chosenPath === 'A' ? '#FF4757' : '#1E90FF' }}
                >
                  Year 10 · {chosenPath === 'A' ? data.optionA.label : data.optionB.label}
                </span>
              </div>

              {/* Letter with typewriter effect */}
              <div className="rounded-xl border-2 border-[#1a1a1a] bg-[#0d0d0d] px-6 py-5">
                <p className="font-mono text-[13px] leading-relaxed text-[#ccc] whitespace-pre-wrap">
                  {letter.slice(0, visibleChars)}
                  {visibleChars < letter.length && (
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="inline-block h-3 w-0.5 bg-[#2ECC71] ml-0.5 align-middle"
                    />
                  )}
                </p>
              </div>

              <button
                onClick={() => { setStage('compose'); setLetter(null); setMessage(''); setChosenPath(null); setDeliveryNote(null); setDeliveryMeta(null) }}
                className="mt-4 text-xs font-bold text-[#aaa] hover:text-[#111] underline underline-offset-2"
              >
                Write another message
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  )
}
