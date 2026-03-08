'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, X, Zap, ArrowRight, TrendingUp, Info } from 'lucide-react'
import type { GraphData, GraphNode } from '@/lib/decisionGraphEngine'

// ─── Dynamic import — ForceGraph2D needs canvas/DOM ───────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph2D = dynamic<any>(
  () => import('react-force-graph-2d').then((m) => m.default ?? m),
  { ssr: false }
)

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<number, string> = {
  0: '#FFD60A',
  1: '#FF4757',
  2: '#1E90FF',
  3: '#2ECC71',
}

const LEVEL_LABELS: Record<number, string> = {
  0: 'Decision',
  1: 'Immediate effect',
  2: 'Secondary effect',
  3: 'Long-term outcome',
}

const LEVEL_RADIUS: Record<number, number> = {
  0: 9,
  1: 7,
  2: 6,
  3: 5,
}

// ─── Node popup ───────────────────────────────────────────────────────────────

function NodePopup({
  node,
  onClose,
  pathColor,
}: {
  node: GraphNode
  onClose: () => void
  pathColor: string
}) {
  const color = LEVEL_COLORS[node.level]
  const LevelIcons = [Zap, ArrowRight, GitBranch, TrendingUp]
  const LevelIcon = LevelIcons[node.level] ?? Info

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ ease: [0.34, 1.56, 0.64, 1], duration: 0.25 }}
      className="rounded-2xl border-2 border-[#111] bg-white p-4 shadow-[4px_4px_0_#111] w-72"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="shrink-0 h-6 w-6 rounded-lg border-2 border-[#111] flex items-center justify-center shadow-[1px_1px_0_#111]"
            style={{ background: color }}
          >
            <LevelIcon size={11} strokeWidth={3} className="text-[#111]" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color }}>
              {LEVEL_LABELS[node.level]}
            </p>
            <p className="text-sm font-black text-[#111] leading-tight">{node.label}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-lg border border-[#eee] p-1 text-[#bbb] hover:border-[#111] hover:text-[#111] transition-all"
        >
          <X size={11} />
        </button>
      </div>
      <p className="text-[11px] font-medium text-[#555] leading-relaxed border-t border-[#f0f0eb] pt-2.5">
        {node.explanation}
      </p>
      <div
        className="mt-2.5 h-0.5 w-full rounded-full"
        style={{ background: pathColor }}
      />
    </motion.div>
  )
}

// ─── Single graph panel ───────────────────────────────────────────────────────

interface GraphPanelProps {
  graph: GraphData
  label: string
  color: string
  pathLetter: 'A' | 'B'
}

function GraphPanel({ graph, label, color, pathLetter }: GraphPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null)
  const [width, setWidth] = useState(500)
  const HEIGHT = 380
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      setWidth(Math.max(280, entries[0].contentRect.width))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Configure force physics after mount for proper spacing
  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return
    fg.d3Force('charge')?.strength(-280)
    fg.d3Force('link')?.distance(80).strength(0.4)
    setTimeout(() => fg.zoomToFit(400, 40), 1200)
  }, [graph, width])

  // Convert edges → links
  const graphData = {
    nodes: graph.nodes.map((n) => ({
      ...n,
      // nodeVal controls physics collision radius
      nodeVal: LEVEL_RADIUS[n.level] ?? 5,
    })),
    links: graph.edges.map((e) => ({ source: e.source, target: e.target })),
  }

  const paintNode = useCallback(
    (node: Record<string, unknown>, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const level = node.level as number
      const x = node.x as number
      const y = node.y as number
      const label = node.label as string
      const r = LEVEL_RADIUS[level] ?? 5
      const nodeColor = LEVEL_COLORS[level]

      // Outer glow
      ctx.save()
      ctx.shadowBlur = level === 0 ? 14 : 8
      ctx.shadowColor = nodeColor + 'aa'

      // Node circle
      ctx.beginPath()
      ctx.arc(x, y, r, 0, 2 * Math.PI)
      ctx.fillStyle = nodeColor
      ctx.fill()
      ctx.restore()

      // Border
      ctx.beginPath()
      ctx.arc(x, y, r, 0, 2 * Math.PI)
      ctx.strokeStyle = '#111'
      ctx.lineWidth = 1.2 / globalScale
      ctx.stroke()

      // Text — placed ABOVE node, short font to reduce overlap
      const fontSize = Math.max(7, Math.min(10, 9 / globalScale))
      ctx.font = `800 ${fontSize}px Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'

      const words = label.split(' ')
      const maxLineW = 60 / globalScale
      const lines: string[] = []
      let cur = ''
      for (const w of words) {
        const test = cur ? `${cur} ${w}` : w
        if (ctx.measureText(test).width > maxLineW && cur) {
          lines.push(cur)
          cur = w
        } else {
          cur = test
        }
      }
      if (cur) lines.push(cur)

      const lineH = fontSize * 1.2
      const totalH = lines.length * lineH
      const startY = y - r - 3 / globalScale - totalH + lineH

      // Text shadow for readability
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      const pad = 2 / globalScale
      lines.forEach((line, i) => {
        const ty = startY + i * lineH
        ctx.fillRect(
          x - ctx.measureText(line).width / 2 - pad,
          ty - lineH + pad,
          ctx.measureText(line).width + pad * 2,
          lineH
        )
      })

      ctx.fillStyle = '#111'
      lines.forEach((line, i) => {
        ctx.fillText(line, x, startY + i * lineH)
      })
    },
    []
  )

  const handleNodeClick = useCallback(
    (node: Record<string, unknown>, event: MouseEvent) => {
      const container = containerRef.current
      if (container) {
        const rect = container.getBoundingClientRect()
        setPopupPos({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        })
      }
      setSelectedNode(node as unknown as GraphNode)
    },
    []
  )

  return (
    <div className="flex-1 min-w-0">
      {/* Path badge */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-7 w-7 rounded-xl border-2 border-[#111] flex items-center justify-center text-sm font-black text-white shadow-[2px_2px_0_#111]"
          style={{ background: color }}
        >
          {pathLetter}
        </div>
        <span className="text-sm font-black text-[#111] truncate">{label}</span>
      </div>

      {/* Graph canvas — position relative for popup */}
      <div
        ref={containerRef}
        className="relative rounded-2xl border-2 border-[#eee] bg-[#FAFAF7]"
        style={{ height: HEIGHT }}
      >
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={width}
          height={HEIGHT}
          backgroundColor="#FAFAF7"
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={() => 'replace'}
          nodeRelSize={1}
          linkColor={() => '#ccc'}
          linkWidth={1.2}
          linkDirectionalArrowLength={5}
          linkDirectionalArrowRelPos={0.88}
          linkDirectionalArrowColor={() => '#bbb'}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={1.8}
          linkDirectionalParticleColor={() => color}
          linkDirectionalParticleSpeed={0.005}
          onNodeClick={handleNodeClick}
          nodeLabel={() => ''}
          enableZoomInteraction
          enablePanInteraction
          cooldownTicks={180}
          warmupTicks={80}
          d3AlphaDecay={0.025}
          d3VelocityDecay={0.35}
        />

        {/* Popup — positioned where user clicked, inside container */}
        <AnimatePresence>
          {selectedNode && (
            <div
              className="absolute z-20 pointer-events-none"
              style={{
                left: Math.min(popupPos.x, width - 300),
                top: Math.max(8, popupPos.y - 200),
              }}
            >
              <div className="pointer-events-auto">
                <NodePopup
                  node={selectedNode}
                  pathColor={color}
                  onClose={() => setSelectedNode(null)}
                />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Node count */}
      <p className="mt-1.5 text-[9px] font-medium text-[#ccc] text-right">
        {graph.nodes.length} nodes · {graph.edges.length} edges
      </p>
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-[#f0f0eb]">
      {Object.entries(LEVEL_LABELS).map(([lvl, label]) => (
        <div key={lvl} className="flex items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-full border border-[#111] shadow-[1px_1px_0_#111]"
            style={{ background: LEVEL_COLORS[Number(lvl)] }}
          />
          <span className="text-[10px] font-black text-[#777]">{label}</span>
        </div>
      ))}
      <div className="ml-auto flex items-center gap-1">
        <Info size={9} className="text-[#bbb]" />
        <span className="text-[9px] font-medium text-[#bbb]">Click any node for details</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DecisionGraphProps {
  graphA: GraphData
  graphB: GraphData
  optionALabel: string
  optionBLabel: string
  dataSource?: string
}

export function DecisionGraph({
  graphA,
  graphB,
  optionALabel,
  optionBLabel,
  dataSource,
}: DecisionGraphProps) {
  const [activeTab, setActiveTab] = useState<'both' | 'A' | 'B'>('both')

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
      className="mt-10 brutal-card overflow-hidden"
    >
      {/* Header */}
      <div className="border-b-2 border-[#f0f0eb] px-5 py-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-5 w-5 rounded-md border-2 border-[#111] bg-[#FFD60A] flex items-center justify-center shadow-[1px_1px_0_#111]">
                <GitBranch size={10} strokeWidth={3} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#aaa]">
                Causal Knowledge Graph
              </p>
            </div>
            <h3 className="text-xl font-black text-[#111]">Decision Consequence Map</h3>
            <p className="text-xs font-medium text-[#888] mt-0.5">
              How this choice cascades — from immediate effects to decade-long outcomes.
            </p>
          </div>
          {dataSource && (
            <div className="shrink-0 rounded-full border border-[#ddd] bg-white px-2.5 py-1 text-[9px] font-black text-[#888] uppercase tracking-widest">
              {dataSource}
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          {(['both', 'A', 'B'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl border-2 px-3 py-1.5 text-[10px] font-black transition-all duration-100 ${
                activeTab === tab
                  ? 'border-[#111] bg-[#111] text-white shadow-none translate-x-[1px] translate-y-[1px]'
                  : 'border-[#ddd] bg-white text-[#555] shadow-[2px_2px_0_#ddd] hover:border-[#111]'
              }`}
            >
              {tab === 'both' ? 'Side by Side' : `Path ${tab} — ${tab === 'A' ? optionALabel : optionBLabel}`}
            </button>
          ))}
        </div>
      </div>

      {/* Graph panels */}
      <div className="p-4 sm:p-5">
        <div className={`flex gap-5 ${activeTab === 'both' ? 'flex-col lg:flex-row' : 'flex-col'}`}>
          {(activeTab === 'A' || activeTab === 'both') && (
            <GraphPanel
              graph={graphA}
              label={optionALabel}
              color="#FF4757"
              pathLetter="A"
            />
          )}
          {(activeTab === 'B' || activeTab === 'both') && (
            <GraphPanel
              graph={graphB}
              label={optionBLabel}
              color="#1E90FF"
              pathLetter="B"
            />
          )}
        </div>

        <div className="mt-4">
          <Legend />
        </div>
      </div>
    </motion.div>
  )
}
