'use client'

import { motion, useAnimationControls } from 'framer-motion'
import { useEffect, useState } from 'react'

// Block figure: chunky SVG mascot peeking from sides
function BlockFigureSVG({ flipped = false, expression = 'grin' }: { flipped?: boolean; expression?: 'grin' | 'peek' | 'wink' }) {
  const eyeLeft  = expression === 'wink' ? (
    // wink: left eye closed
    <line x1="10" y1="13" x2="16" y2="13" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
  ) : (
    <rect x="10" y="10" width="6" height="6" rx="1.5" fill="#111" />
  )
  const eyeRight = (
    <rect x="24" y="10" width="6" height="6" rx="1.5" fill="#111" />
  )
  const mouth = expression === 'grin' ? (
    <path d="M13,24 Q20,30 27,24" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  ) : (
    <path d="M14,26 Q20,28 26,26" stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round" />
  )

  return (
    <svg
      viewBox="0 0 60 120"
      width={60}
      height={120}
      style={{ transform: flipped ? 'scaleX(-1)' : undefined, display: 'block' }}
      aria-hidden="true"
    >
      {/* Head */}
      <rect x="5" y="2" width="50" height="44" rx="8" fill="#FFD60A" stroke="#111" strokeWidth="3" />
      {eyeLeft}
      {eyeRight}
      {mouth}
      {/* Blush left */}
      <circle cx="9" cy="22" r="4" fill="#FF8C8C" opacity="0.5" />
      {/* Blush right */}
      <circle cx="51" cy="22" r="4" fill="#FF8C8C" opacity="0.5" />

      {/* Body */}
      <rect x="10" y="50" width="40" height="35" rx="6" fill="#FF4757" stroke="#111" strokeWidth="3" />
      {/* Body stripe */}
      <rect x="10" y="62" width="40" height="6" rx="0" fill="#111" opacity="0.12" />

      {/* Arms */}
      <rect x="-2" y="50" width="14" height="10" rx="4" fill="#FFD60A" stroke="#111" strokeWidth="2.5" />
      <rect x="48" y="50" width="14" height="10" rx="4" fill="#FFD60A" stroke="#111" strokeWidth="2.5" />

      {/* Legs */}
      <rect x="12" y="88" width="14" height="28" rx="6" fill="#111" stroke="#111" strokeWidth="1" />
      <rect x="34" y="88" width="14" height="28" rx="6" fill="#111" stroke="#111" strokeWidth="1" />
      {/* Shoes */}
      <rect x="8"  y="112" width="22" height="10" rx="5" fill="#333" />
      <rect x="30" y="112" width="22" height="10" rx="5" fill="#333" />
    </svg>
  )
}

// Left mascot — peeks from the left, waves
export function MascotLeft() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ x: -90, opacity: 0 }}
      animate={visible ? { x: 0, opacity: 1 } : {}}
      transition={{ type: 'spring', stiffness: 160, damping: 18, delay: 0 }}
      className="fixed bottom-0 left-0 z-30 hidden lg:block select-none pointer-events-none"
      style={{ transformOrigin: 'bottom left' }}
    >
      {/* Waving arm */}
      <motion.div
        animate={{ rotate: [0, -22, 0, -18, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
        style={{ transformOrigin: '55px 65px' }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <BlockFigureSVG expression="grin" />
        </motion.div>
      </motion.div>
      {/* Speech bubble */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 2.2, ease: [0.34, 1.56, 0.64, 1], duration: 0.4 }}
        className="absolute -top-8 left-14 whitespace-nowrap rounded-xl border-2 border-[#111]/15 bg-white/95 px-3 py-1.5 text-[10px] font-black text-[#2b3042] shadow-[0_6px_14px_rgba(45,60,102,0.16)]"
      >
        Your futures await! 👀
        {/* Tail */}
        <div className="absolute -bottom-2 left-3 h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white" />
        <div className="absolute -bottom-1 left-[13px] h-0 w-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-transparent" />
      </motion.div>
    </motion.div>
  )
}

// Right mascot — peeks from the right, winks
export function MascotRight() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1800)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ x: 90, opacity: 0 }}
      animate={visible ? { x: 0, opacity: 1 } : {}}
      transition={{ type: 'spring', stiffness: 160, damping: 18, delay: 0 }}
      className="fixed bottom-0 right-0 z-30 hidden lg:block select-none pointer-events-none"
      style={{ transformOrigin: 'bottom right' }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      >
        <BlockFigureSVG flipped expression="wink" />
      </motion.div>
      {/* Speech bubble */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 2.8, ease: [0.34, 1.56, 0.64, 1], duration: 0.4 }}
        className="absolute -top-8 right-14 whitespace-nowrap rounded-xl border-2 border-[#c59100]/40 bg-[#fff6cf] px-3 py-1.5 text-[10px] font-black text-[#835900] shadow-[0_6px_14px_rgba(197,145,0,0.2)]"
      >
        Both paths are you. 🤯
        {/* Tail */}
        <div className="absolute -bottom-2 right-3 h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-[rgba(255,214,10,0.5)]" />
        <div className="absolute -bottom-1 right-[13px] h-0 w-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-transparent" />
      </motion.div>
    </motion.div>
  )
}
