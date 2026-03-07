'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleFieldProps {
  count?: number
  spread?: number
  speed?: number
}

function ParticleField({ count = 900, spread = 28, speed = 0.04 }: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Distribute particles in a sphere-ish volume
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = Math.random() * spread

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi) - 5

      // Purple (#8b5cf6) to cyan (#06b6d4) gradient
      const t = Math.random()
      colors[i * 3] = 0.55 - t * 0.52       // R: 0.55 (purple) -> 0.02 (cyan)
      colors[i * 3 + 1] = 0.36 + t * 0.36   // G: 0.36 -> 0.71
      colors[i * 3 + 2] = 0.96 - t * 0.13   // B: 0.96 -> 0.83

      sizes[i] = Math.random() * 0.5 + 0.1
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [count, spread])

  useFrame((state) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = state.clock.elapsedTime * speed
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.15
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function FloatingOrbs() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.children.forEach((child, i) => {
      child.position.y = Math.sin(t * 0.4 + i * 1.5) * 0.5
      child.position.x = Math.cos(t * 0.3 + i * 0.8) * 0.3
    })
  })

  return (
    <group ref={groupRef}>
      {/* Large purple orb - top left */}
      <mesh position={[-5, 1, -8]}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial
          color="#7c3aed"
          emissive="#7c3aed"
          emissiveIntensity={0.6}
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Cyan orb - right */}
      <mesh position={[6, -1, -10]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={0.6}
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Small bright purple orb - center */}
      <mesh position={[1, 2, -6]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial
          color="#a78bfa"
          emissive="#a78bfa"
          emissiveIntensity={1.2}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Small bright cyan orb - lower */}
      <mesh position={[-2, -3, -7]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={1.2}
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  )
}

interface ParticleCanvasProps {
  particleCount?: number
  speed?: number
}

export function ParticleCanvas({ particleCount = 900, speed = 0.04 }: ParticleCanvasProps) {
  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 70 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.3} />
        <ParticleField count={particleCount} speed={speed} />
        <FloatingOrbs />
      </Canvas>
    </div>
  )
}
