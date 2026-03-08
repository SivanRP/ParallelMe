'use client'

import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import type { SimulateResponse, TimelinePoint, StoryMilestone } from '@/app/api/simulate/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
function easeOutBack(t: number) {
  const c1 = 1.70158, c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

interface Metrics { income: number; stress: number; freedom: number }

function getMetrics(timeline: TimelinePoint[], year: number): Metrics {
  const [t0, t1, t2] = timeline
  if (year <= 1)  return { income: t0.income, stress: t0.stress, freedom: t0.freedom }
  if (year >= 10) return { income: t2.income, stress: t2.stress, freedom: t2.freedom }
  const [from, to, t] = year <= 5
    ? [t0, t1, (year - 1) / 4] : [t1, t2, (year - 5) / 5]
  return {
    income:  lerp(from.income,  to.income,  t),
    stress:  lerp(from.stress,  to.stress,  t),
    freedom: lerp(from.freedom, to.freedom, t),
  }
}

// ─── Module-level animation state (one scene at a time) ───────────────────────

const ANIM = {
  split: 0,       // 0→1: world split progress
  beamZ: 2.0,     // current beam Z (-2 → +2 = year 1 → 10)
  beamFlash: 0,   // 0→1 flash when year changes
  ripple: 0,      // elapsed time since ripple started
  doRipple: false,
}

function yearToBeamZ(year: number) {
  return 2 - ((year - 1) / 9) * 4  // year 1 → z=2, year 10 → z=-2
}

// ─── Sky ──────────────────────────────────────────────────────────────────────

function Sky() {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(60, 8, 8)
    const pos = g.attributes.position as THREE.BufferAttribute
    const c = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const t = clamp((pos.getY(i) + 30) / 60, 0, 1)
      // Daytime sky: pale blue-white at horizon → deeper blue at zenith
      c[i*3]   = lerp(0.72,  0.42, t)   // R
      c[i*3+1] = lerp(0.90,  0.65, t)   // G
      c[i*3+2] = lerp(1.0,   0.92, t)   // B
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3))
    return g
  }, [])
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false }),
    []
  )
  return <mesh geometry={geo} material={mat} />
}

// ─── Sun ──────────────────────────────────────────────────────────────────────

function Sun() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) ref.current.position.y = 13 + Math.sin(s.clock.elapsedTime * 0.25) * 0.4
  })
  return (
    <mesh ref={ref} position={[0, 13, -14]}>
      <sphereGeometry args={[1.4, 16, 16]} />
      <meshBasicMaterial color="#FF9F43" />
    </mesh>
  )
}

// ─── YOU node (center, pre-split) ─────────────────────────────────────────────

function YouNode() {
  const ref  = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    const inv = 1 - easeInOut(clamp(ANIM.split * 2.5, 0, 1))
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = inv
      ref.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 2.8) * 0.06)
    }
    if (ring.current) {
      const mat = ring.current.material as THREE.MeshBasicMaterial
      mat.opacity = inv * 0.4
      ring.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 1.5) * 0.1)
    }
  })

  return (
    <group position={[0, 0.1, 0]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.35, 20, 20]} />
        <meshBasicMaterial color="#FFD60A" transparent />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.56, 32]} />
        <meshBasicMaterial color="#FFD60A" transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── Ripple rings ─────────────────────────────────────────────────────────────

const RING_DELAYS = [0, 0.4, 0.8]

function RippleRings() {
  const refs = useRef<(THREE.Mesh | null)[]>([null, null, null])

  useFrame((_, delta) => {
    if (!ANIM.doRipple) return
    ANIM.ripple += delta
    RING_DELAYS.forEach((delay, i) => {
      const mesh = refs.current[i]
      if (!mesh) return
      const t = clamp((ANIM.ripple - delay) / 1.8, 0, 1)
      mesh.scale.setScalar(1 + t * 9)
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - t) * 0.5
    })
    if (ANIM.ripple > 3.5) ANIM.doRipple = false
  })

  return (
    <>
      {RING_DELAYS.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.05, 0]}
        >
          <ringGeometry args={[0.4, 0.5, 40]} />
          <meshBasicMaterial color="#FFD60A" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}

// ─── Timeline beam (sweeps z-axis with year) ──────────────────────────────────

function TimelineBeam({ xOffset }: { xOffset: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (!ref.current) return
    ref.current.position.z = ANIM.beamZ
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.05 + ANIM.beamFlash * 0.3
    ANIM.beamFlash = Math.max(0, ANIM.beamFlash - 0.04)
  })
  return (
    <mesh ref={ref} rotation={[0, 0, 0]}>
      <planeGeometry args={[12, 12]} />
      <meshBasicMaterial color="#FFD60A" transparent opacity={0.05} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ─── Ground ───────────────────────────────────────────────────────────────────

function Ground({ isPurple }: { isPurple: boolean }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshLambertMaterial color={isPurple ? '#2d0a3e' : '#0a1a3e'} />
      </mesh>
      <gridHelper args={[14, 14, isPurple ? '#ff3cac' : '#00d4ff', isPurple ? 'rgba(255,60,172,0.3)' : 'rgba(0,212,255,0.3)']}
        position={[0, 0.01, 0]} />
    </group>
  )
}

// ─── Buildings ────────────────────────────────────────────────────────────────

const PALETTE_A       = ['#FF4757','#FF6B6B','#FF9F43','#FF3CAC','#C84B31','#FF4757','#FF6B6B','#FF9F43','#FF3CAC','#C84B31','#FF4757']
const PALETTE_A_ROOF  = ['#ff8a94','#ff9faf','#ffbf7a','#ff85d8','#e87560','#ff8a94','#ff9faf','#ffbf7a','#ff85d8','#e87560','#ff8a94']
const PALETTE_B       = ['#1E90FF','#00D4FF','#7C83FD','#54A0FF','#0ABDE3','#1E90FF','#00D4FF','#7C83FD','#54A0FF','#0ABDE3','#1E90FF']
const PALETTE_B_ROOF  = ['#60a5fa','#80eaff','#a5a8fd','#7ec8e3','#4ad4f5','#60a5fa','#80eaff','#a5a8fd','#7ec8e3','#4ad4f5','#60a5fa']

const BUILDINGS = [
  { x: -1.9, z: 0.5,  w: 0.60, d: 0.55, hf: 1.0  },
  { x: -1.1, z: -0.5, w: 0.65, d: 0.60, hf: 1.4  },
  { x: -0.2, z: 0.6,  w: 0.55, d: 0.50, hf: 0.85 },
  { x:  0.6, z: -0.4, w: 0.58, d: 0.55, hf: 1.2  },
  { x:  1.4, z: 0.4,  w: 0.52, d: 0.48, hf: 0.95 },
  { x: -1.6, z: -1.6, w: 0.42, d: 0.38, hf: 0.55 },
  { x: -0.7, z: -1.8, w: 0.44, d: 0.40, hf: 0.70 },
  { x:  0.3, z: -1.7, w: 0.46, d: 0.42, hf: 0.62 },
  { x:  1.3, z: -1.5, w: 0.42, d: 0.38, hf: 0.52 },
  { x:  2.0, z: -0.8, w: 0.38, d: 0.34, hf: 0.72 },
  { x: -2.2, z: -0.6, w: 0.36, d: 0.32, hf: 0.65 },
] as const

function Building({ cfg, targetH, color, roofColor }: {
  cfg: (typeof BUILDINGS)[number]
  targetH: number
  color: string
  roofColor: string
}) {
  const bodyRef = useRef<THREE.Mesh>(null)
  const roofRef = useRef<THREE.Mesh>(null)
  const winRef  = useRef<THREE.Group>(null)
  const curH = useRef(0.05)
  const tgtH = useRef(targetH)
  tgtH.current = targetH

  const splitAdjusted = useRef(0)

  useFrame((s) => {
    if (!bodyRef.current) return
    // Only grow after split begins
    const growFactor = clamp((ANIM.split - 0.6) / 0.4, 0, 1)
    curH.current = lerp(curH.current, Math.max(0.05, tgtH.current * growFactor), 0.05)
    bodyRef.current.scale.y = curH.current
    bodyRef.current.position.y = curH.current * 0.5
    if (roofRef.current) roofRef.current.position.y = curH.current + 0.08

    // Window flicker
    if (winRef.current) {
      winRef.current.position.y = curH.current * 0.5
      winRef.current.scale.y = curH.current
      winRef.current.children.forEach((c, i) => {
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial
        m.opacity = 0.6 + Math.sin(s.clock.elapsedTime * 2.1 + cfg.x * 5 + i) * 0.2
      })
    }
  })

  const windowPositions = useMemo(() => {
    const res: { x: number; y: number }[] = []
    const cols = Math.max(1, Math.floor(cfg.w / 0.22))
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < cols; c++)
        res.push({ x: -cfg.w / 2 + cfg.w / (cols + 1) * (c + 1), y: -0.42 + r * 0.26 })
    return res
  }, [cfg])

  return (
    <group position={[cfg.x, 0, cfg.z]}>
      <mesh ref={bodyRef} castShadow>
        <boxGeometry args={[cfg.w, 1, cfg.d]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh ref={roofRef} position={[0, 0.6, 0]}>
        <boxGeometry args={[cfg.w + 0.06, 0.1, cfg.d + 0.06]} />
        <meshLambertMaterial color={roofColor} />
      </mesh>
      <group ref={winRef} position={[0, 0.5, 0]}>
        {windowPositions.map((w, i) => (
          <mesh key={i} position={[w.x, w.y, cfg.d / 2 + 0.003]}>
            <planeGeometry args={[0.08, 0.10]} />
            <meshBasicMaterial color="#FFF8B0" transparent opacity={0.85} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ─── Cartoon clouds ───────────────────────────────────────────────────────────

const CLOUD_CFGS = [
  { x: -1.5, z:  0.3, s: 1.0 },
  { x: -0.6, z:  0.9, s: 0.8 },
  { x:  0.2, z: -0.3, s: 0.9 },
  { x:  1.0, z:  0.5, s: 0.75 },
  { x: -1.2, z: -0.9, s: 0.65 },
  { x:  0.6, z:  0.9, s: 0.6  },
] as const

const CLOUD_OFFSETS: [number, number, number][] = [
  [0, 0, 0], [-0.52, -0.18, 0.1], [0.52, -0.18, 0.1],
  [-0.26, 0.3, 0.05], [0.26, 0.3, 0.05],
]

function Clouds({ targetStress }: { targetStress: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const curS = useRef(targetStress)
  const tgtS = useRef(targetStress)
  tgtS.current = targetStress

  useFrame((s) => {
    if (!groupRef.current) return
    curS.current = lerp(curS.current, tgtS.current, 0.035)
    const st = curS.current / 100
    const t  = s.clock.elapsedTime

    // Only show clouds after split
    const vis = clamp((ANIM.split - 0.7) / 0.3, 0, 1)

    groupRef.current.children.forEach((child, ci) => {
      const grp = child as THREE.Group
      const cfg = CLOUD_CFGS[ci]
      grp.position.x = cfg.x + Math.sin(t * 0.18 + ci * 1.3) * 0.22
      grp.position.y = 5.5 + Math.sin(t * 0.22 + ci * 0.9) * 0.18 - st * 0.8
      grp.position.z = cfg.z
      const sc = cfg.s * (0.3 + st * 1.2) * vis
      grp.scale.setScalar(sc)

      const br = 1 - st * 0.7
      grp.children.forEach((m) => {
        const mat = (m as THREE.Mesh).material as THREE.MeshLambertMaterial
        mat.opacity = (0.05 + st * 0.75) * vis
        mat.color.setRGB(br, br, br)
      })
    })
  })

  return (
    <group ref={groupRef}>
      {CLOUD_CFGS.map((cfg, ci) => (
        <group key={ci} position={[cfg.x, 5.5, cfg.z]}>
          {CLOUD_OFFSETS.map(([ox, oy, oz], oi) => (
            <mesh key={oi} position={[ox, oy, oz]}>
              <sphereGeometry args={[oi === 0 ? 0.52 : 0.38, 8, 8]} />
              <meshLambertMaterial color="#ffffff" transparent opacity={0.1} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// ─── World light ──────────────────────────────────────────────────────────────

function WorldLight({ freedom, isPurple }: { freedom: number; isPurple: boolean }) {
  const ref = useRef<THREE.PointLight>(null)
  const curF = useRef(freedom)
  const tgtF = useRef(freedom)
  tgtF.current = freedom
  useFrame(() => {
    if (!ref.current) return
    curF.current = lerp(curF.current, tgtF.current, 0.04)
    const f = curF.current / 100
    ref.current.intensity = 0.5 + f * 2.5
    ref.current.distance  = 8 + f * 10
  })
  return <pointLight ref={ref} position={[0, 8, 2]} color={isPurple ? '#ffb3ba' : '#bae6fd'} />
}

// ─── Milestone node (glowing, clickable) ─────────────────────────────────────

const MILESTONE_POSITIONS: [number, number, number][] = [
  [0.8, 1.5,  1.2],   // Year 1
  [-0.6, 2.8, -0.2],  // Year 5
  [0.4, 4.0, -1.8],   // Year 10
]

function MilestoneNode({ position, milestone, isA, onSelect }: {
  position: [number, number, number]
  milestone: StoryMilestone
  isA: boolean
  onSelect: (m: StoryMilestone) => void
}) {
  const ref   = useRef<THREE.Mesh>(null)
  const halo  = useRef<THREE.Mesh>(null)
  const isHov = useRef(false)

  useFrame((s) => {
    if (!ref.current || !halo.current) return
    const pulse = 1 + Math.sin(s.clock.elapsedTime * 3 + position[0] * 4) * 0.08
    ref.current.scale.setScalar(isHov.current ? 1.4 : pulse)
    halo.current.scale.setScalar((isHov.current ? 1.6 : 1.2) * pulse)
    const mat = halo.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.25 + Math.sin(s.clock.elapsedTime * 2.2) * 0.1
    // Only show after split
    const vis = clamp((ANIM.split - 0.75) / 0.25, 0, 1)
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity = vis
    mat.opacity *= vis
  })

  const color = isA ? '#FF4757' : '#1E90FF'

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onClick={(e) => { e.stopPropagation(); onSelect(milestone) }}
        onPointerOver={(e) => { e.stopPropagation(); isHov.current = true; document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { isHov.current = false; document.body.style.cursor = '' }}
      >
        <sphereGeometry args={[0.18, 14, 14]} />
        <meshBasicMaterial color={color} transparent />
      </mesh>
      <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.30, 24]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── City world group ─────────────────────────────────────────────────────────

function CityWorld({ timeline, year, targetX, isPurple, milestones, onMilestoneSelect }: {
  timeline: TimelinePoint[]
  year: number
  targetX: number
  isPurple: boolean
  milestones: StoryMilestone[]
  onMilestoneSelect: (m: StoryMilestone) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const tX = useRef(0)
  tX.current = targetX

  useFrame(() => {
    if (!groupRef.current) return
    const eased = easeOutBack(clamp(ANIM.split, 0, 1))
    const currentX = groupRef.current.position.x
    groupRef.current.position.x = lerp(currentX, tX.current * eased, 0.06)
  })

  const metrics = getMetrics(timeline, year)
  const color = isPurple ? '#FF4757' : '#1E90FF'

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Ground isPurple={isPurple} />
      <WorldLight freedom={metrics.freedom} isPurple={isPurple} />
      <Clouds targetStress={metrics.stress} />
      <TimelineBeam xOffset={targetX} />
      {BUILDINGS.map((cfg, i) => (
        <Building
          key={i} cfg={cfg}
          targetH={(metrics.income / 100) * 5.5 * cfg.hf}
          color={isPurple ? PALETTE_A[i] : PALETTE_B[i]}
          roofColor={isPurple ? PALETTE_A_ROOF[i] : PALETTE_B_ROOF[i]}
        />
      ))}
      {milestones.slice(0, 3).map((m, i) => (
        <MilestoneNode
          key={i}
          position={MILESTONE_POSITIONS[i]}
          milestone={m}
          isA={isPurple}
          onSelect={onMilestoneSelect}
        />
      ))}
      <Avatar color={color} visible={year >= 8 && ANIM.split > 0.5} />
    </group>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ color, visible }: { color: string; visible: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!groupRef.current) return
    const target = visible ? 1 : 0
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, target, 0.06))
  })
  return (
    <group ref={groupRef} scale={0} position={[0, 0, 1.8]}>
      {/* Head */}
      <mesh position={[0, 2.05, 0]}>
        <sphereGeometry args={[0.28, 10, 10]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.1, 2.12, 0.26]}>
        <sphereGeometry args={[0.055, 6, 6]} />
        <meshLambertMaterial color="white" />
      </mesh>
      <mesh position={[0.1, 2.12, 0.26]}>
        <sphereGeometry args={[0.055, 6, 6]} />
        <meshLambertMaterial color="white" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.18, 0.24, 0.9, 8]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Left leg */}
      <mesh position={[-0.13, 0.5, 0]}>
        <cylinderGeometry args={[0.09, 0.08, 0.65, 6]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.13, 0.5, 0]}>
        <cylinderGeometry args={[0.09, 0.08, 0.65, 6]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.33, 1.35, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.065, 0.055, 0.55, 6]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.33, 1.35, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.065, 0.055, 0.55, 6]} />
        <meshLambertMaterial color={color} />
      </mesh>
    </group>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  const orbRef  = useRef<THREE.Mesh>(null)
  const beamRef = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    const vis = clamp((ANIM.split - 0.6) / 0.4, 0, 1)
    if (orbRef.current) {
      orbRef.current.scale.setScalar((1 + Math.sin(s.clock.elapsedTime * 2.4) * 0.1) * vis)
    }
    if (beamRef.current) {
      ;(beamRef.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * vis
    }
  })
  return (
    <group>
      <mesh ref={beamRef} position={[0, 5.5, 0]}>
        <planeGeometry args={[0.06, 12]} />
        <meshBasicMaterial color="#FFD60A" transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={orbRef} position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshBasicMaterial color="#FFD60A" transparent />
      </mesh>
      <mesh position={[0, 2.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.36, 0.022, 8, 32]} />
        <meshBasicMaterial color="#111111" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── Camera ───────────────────────────────────────────────────────────────────

function CameraRig() {
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const orbitR = lerp(8, 12, clamp(ANIM.split * 1.5, 0, 1))
    const orbitY = lerp(4,  6, clamp(ANIM.split * 1.5, 0, 1))
    const angle  = t * 0.055
    state.camera.position.x = Math.sin(angle) * orbitR
    state.camera.position.z = Math.cos(angle) * orbitR
    state.camera.position.y = orbitY + Math.sin(t * 0.3) * 1.0
    state.camera.lookAt(0, 1.5, 0)
  })
  return null
}

// ─── Full R3F scene ───────────────────────────────────────────────────────────

interface SceneProps {
  data: SimulateResponse
  year: number
  onMilestoneSelect: (m: StoryMilestone & { isA: boolean }) => void
}

function Scene({ data, year, onMilestoneSelect }: SceneProps) {
  // Kick off split animation & ripple on mount
  useEffect(() => {
    ANIM.split  = 0
    ANIM.ripple = 0
    ANIM.beamFlash = 0
    ANIM.beamZ = yearToBeamZ(year)
    ANIM.doRipple = true
  }, [])

  // Track year changes for beam
  const prevYear = useRef(year)
  useFrame((_, delta) => {
    // Advance split
    if (ANIM.split < 1) ANIM.split = Math.min(1, ANIM.split + delta * 0.38)

    // Beam flash on year change
    if (Math.abs(year - prevYear.current) > 0.01) {
      ANIM.beamFlash = 1
      prevYear.current = year
    }
    ANIM.beamZ = lerp(ANIM.beamZ, yearToBeamZ(year), 0.08)
  })

  const handleSelectA = (m: StoryMilestone) => onMilestoneSelect({ ...m, isA: true })
  const handleSelectB = (m: StoryMilestone) => onMilestoneSelect({ ...m, isA: false })

  return (
    <>
      <fog attach="fog" args={['#bae6fd', 30, 65]} />
      <ambientLight intensity={2.2} />
      <directionalLight position={[5, 12, 5]} intensity={0.5} castShadow />
      <Sky />
      <Sun />
      <CameraRig />
      <YouNode />
      <RippleRings />
      <CityWorld
        timeline={data.optionA.timeline} year={year}
        targetX={-4.2} isPurple={true}
        milestones={data.optionA.milestones ?? []}
        onMilestoneSelect={handleSelectA}
      />
      <CityWorld
        timeline={data.optionB.timeline} year={year}
        targetX={4.2} isPurple={false}
        milestones={data.optionB.milestones ?? []}
        onMilestoneSelect={handleSelectB}
      />
      <Divider />
    </>
  )
}

// ─── Milestone popup (HTML overlay) ──────────────────────────────────────────

interface MilestonePopupProps {
  milestone: (StoryMilestone & { isA: boolean }) | null
  onClose: () => void
}

function MilestonePopup({ milestone, onClose }: MilestonePopupProps) {
  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
          className={`absolute left-4 right-4 top-4 z-20 rounded-2xl border-2 p-4 shadow-[4px_4px_0_#111] ${
            milestone.isA
              ? 'border-[#FF4757] bg-[#FFE8EA]'
              : 'border-[#1E90FF] bg-[#DCF0FF]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-3xl leading-none">{milestone.emoji}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white ${milestone.isA ? 'bg-[#FF4757]' : 'bg-[#1E90FF]'}`}>
                    Year {milestone.year} · {milestone.isA ? 'Path A' : 'Path B'}
                  </span>
                </div>
                <p className="text-sm font-black text-[#111]">{milestone.title}</p>
                <p className="text-xs font-medium text-[#444] mt-0.5 leading-relaxed">{milestone.description}</p>
                <p className={`mt-1.5 text-[11px] font-black ${milestone.isA ? 'text-[#FF4757]' : 'text-[#1E90FF]'}`}>
                  {milestone.metric}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="shrink-0 rounded-lg border-2 border-[#111] bg-white px-2 py-1 text-[10px] font-black text-[#111] shadow-[2px_2px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#111] transition-all">
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Timeline slider ──────────────────────────────────────────────────────────

const YEAR_MARKERS = [1, 5, 10] as const

interface SliderProps {
  year: number
  onChange: (y: number) => void
  labelA: string
  labelB: string
  isPlaying: boolean
  onTogglePlay: () => void
}

function TimelineSlider({ year, onChange, labelA, labelB, isPlaying, onTogglePlay }: SliderProps) {
  const pct = ((year - 1) / 9) * 100
  const phase = year < 2 ? 'Just starting out' : year < 6 ? 'Building momentum' : 'Long-term reality'

  return (
    <div className="border-t-2 border-[#111] bg-white px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-3 w-3 rounded-full bg-[#FF4757] border-2 border-[#111] shrink-0" />
          <span className="text-[11px] font-black text-[#FF4757] uppercase tracking-wide truncate">{labelA}</span>
        </div>
        <div className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">tap a glowing node to explore</div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-black text-[#1E90FF] uppercase tracking-wide truncate">{labelB}</span>
          <div className="h-3 w-3 rounded-full bg-[#1E90FF] border-2 border-[#111] shrink-0" />
        </div>
      </div>

      <div className="mb-3 text-center">
        <span className="text-6xl font-black text-[#111] leading-none tabular-nums">{Math.round(year)}</span>
        <p className="mt-0.5 text-[11px] font-bold text-[#888] uppercase tracking-widest">{phase}</p>
      </div>

      <div className="relative mb-3">
        <div className="relative h-2.5 rounded-full bg-[#eee] border-2 border-[#ddd] pointer-events-none">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#FF4757] to-[#1E90FF]"
            style={{ width: `${pct}%` }}
          />
          {YEAR_MARKERS.map((y) => {
            const mPct = ((y - 1) / 9) * 100
            const active = Math.abs(year - y) < 0.6
            return (
              <button key={y} onClick={() => onChange(y)}
                className="pointer-events-auto absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${mPct}%` }}>
                <div className={`rounded-full border-2 transition-all duration-150 ${
                  active ? 'h-5 w-5 border-[#111] bg-[#FFD60A] shadow-[2px_2px_0_#111]'
                         : 'h-3.5 w-3.5 border-[#bbb] bg-white hover:border-[#111]'
                }`} />
              </button>
            )
          })}
        </div>
        <input type="range" min="1" max="10" step="0.05" value={year}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      </div>

      <div className="mb-3 flex justify-between text-[10px] font-black text-[#aaa]">
        {YEAR_MARKERS.map((y) => (
          <span key={y} className={Math.abs(year - y) < 0.6 ? 'text-[#111]' : ''}>Yr {y}</span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onTogglePlay}
          className={`btn-chunky flex items-center gap-2 px-4 py-2 text-xs ${isPlaying ? 'bg-[#FF4757] text-white' : 'bg-[#FFD60A] text-[#111]'}`}>
          <span>{isPlaying ? '⏸' : '▶'}</span>
          <span className="font-black">{isPlaying ? 'Pause' : 'Play Timeline'}</span>
        </button>
        <div className="flex gap-4">
          {[['🏢', 'Height = Income'], ['☁️', 'Clouds = Stress'], ['☀️', 'Light = Freedom']].map(([icon, label]) => (
            <span key={label} className="text-[10px] font-bold text-[#aaa]">{icon} {label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── WorldViewer (exported) ───────────────────────────────────────────────────

export function WorldViewer({ data, onYearChange }: { data: SimulateResponse; onYearChange?: (year: number) => void }) {
  const [year, setYear] = useState<number>(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<(StoryMilestone & { isA: boolean }) | null>(null)
  const rafRef       = useRef<number | null>(null)
  const startRef     = useRef<number | null>(null)
  const startYearRef = useRef(1)
  const onYearChangeRef = useRef(onYearChange)
  onYearChangeRef.current = onYearChange

  const stopPlay = useCallback(() => {
    setIsPlaying(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null; startRef.current = null
  }, [])

  const tick = useCallback((now: number) => {
    if (!startRef.current) startRef.current = now
    const elapsed = (now - startRef.current) / 1000
    const newYear = Math.min(10, startYearRef.current + (elapsed / 12) * (10 - startYearRef.current))
    setYear(newYear)
    onYearChangeRef.current?.(newYear)
    if (newYear >= 10) { stopPlay(); return }
    rafRef.current = requestAnimationFrame(tick)
  }, [stopPlay])

  const togglePlay = useCallback(() => {
    if (isPlaying) { stopPlay(); return }
    startYearRef.current = year >= 9.9 ? 1 : year
    if (year >= 9.9) setYear(1)
    setIsPlaying(true); startRef.current = null
    rafRef.current = requestAnimationFrame(tick)
  }, [isPlaying, year, tick, stopPlay])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-[#111] shadow-[5px_5px_0_#111] bg-[#C8E8FF]">
      <div className="relative h-[380px] sm:h-[460px]">
        {/* World name stickers */}
        <div className="pointer-events-none absolute inset-x-0 top-3 z-10 grid grid-cols-2 px-4">
          <div className="sticker-a px-2.5 py-1 text-[10px] rotate-[-1deg] w-fit">{data.optionA.label}</div>
          <div className="sticker-b px-2.5 py-1 text-[10px] rotate-[1deg] w-fit ml-auto">{data.optionB.label}</div>
        </div>

        {/* Milestone popup (HTML overlay) */}
        <MilestonePopup milestone={selectedMilestone} onClose={() => setSelectedMilestone(null)} />

        <Canvas
          camera={{ position: [0, 6, 13], fov: 60 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 1.5]}
          shadows
          style={{ background: '#C8E8FF' }}
        >
          <Scene
            data={data}
            year={year}
            onMilestoneSelect={(m) => { setSelectedMilestone(m); setYear(m.year === 1 ? 1 : m.year === 5 ? 5 : 10) }}
          />
        </Canvas>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
      </div>

      <TimelineSlider
        year={year}
        onChange={(y) => { stopPlay(); setYear(y); onYearChangeRef.current?.(y) }}
        labelA={data.optionA.label}
        labelB={data.optionB.label}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
      />
    </div>
  )
}
