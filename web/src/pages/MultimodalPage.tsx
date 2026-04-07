import { useState } from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-basic-dist-min'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import { useThemeColors } from '../useThemeColors'

const Plot = createPlotlyComponent(Plotly)

function Tex({ math, block = false }: { math: string; block?: boolean }) {
  const html = katex.renderToString(math, { displayMode: block, throwOnError: false })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

// CLIP 对比学习匹配矩阵
function CLIPContrastive() {
  const [step, setStep] = useState(0)
  const items = ['🐱 猫', '🐶 狗', '🚗 车', '🌸 花']
  const n = items.length
  const maxStep = n * n

  return (
    <div>
      <svg viewBox="0 0 400 260" style={{ width: '100%' }}>
        <text x={60} y={20} fontSize={11} fontWeight={600} fill="var(--text-primary)">图片嵌入</text>
        <text x={280} y={20} fontSize={11} fontWeight={600} fill="var(--text-primary)">文本嵌入</text>

        {items.map((item, i) => {
          const y = 50 + i * 50
          return (
            <g key={i}>
              <rect x={20} y={y - 14} width={100} height={28} rx={6}
                fill="var(--bg-surface)" stroke="var(--border)" strokeWidth={1} />
              <text x={70} y={y + 4} textAnchor="middle" fontSize={11} fill="var(--text-primary)">{item}</text>
              <rect x={280} y={y - 14} width={100} height={28} rx={6}
                fill="var(--bg-surface)" stroke="var(--border)" strokeWidth={1} />
              <text x={330} y={y + 4} textAnchor="middle" fontSize={11} fill="var(--text-primary)">{item}</text>
            </g>
          )
        })}

        {/* 正负样本连线 */}
        {Array.from({ length: Math.min(step, maxStep) }, (_, k) => {
          const imgIdx = Math.floor(k / n)
          const txtIdx = k % n
          const isPositive = imgIdx === txtIdx
          const y1 = 50 + imgIdx * 50
          const y2 = 50 + txtIdx * 50
          return (
            <line key={k} x1={120} y1={y1} x2={280} y2={y2}
              stroke={isPositive ? 'var(--success)' : 'var(--error)'}
              strokeWidth={isPositive ? 2.5 : 1}
              opacity={isPositive ? 0.9 : 0.3}
              strokeDasharray={isPositive ? 'none' : '4,3'} />
          )
        })}
      </svg>
      <div className="flex-center mt-16">
        <button className="btn btn-primary" onClick={() => setStep(s => Math.min(s + 1, maxStep))}>
          下一对 ({step}/{maxStep})
        </button>
        <button className="btn btn-secondary" onClick={() => setStep(maxStep)}>全部显示</button>
        <button className="btn btn-secondary" onClick={() => setStep(0)}>重置</button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
        <span style={{ color: 'var(--success)' }}>━</span> 正样本（对角线）
        <span style={{ marginLeft: 12, color: 'var(--error)' }}>┄</span> 负样本
      </div>
    </div>
  )
}

function EmbeddingSpace({ tc }: { tc: ReturnType<typeof useThemeColors> }) {
  // 模拟5对图文嵌入在2D空间的分布
  const pairs = [
    { label: '猫', ix: -2, iy: 3, tx: -1.8, ty: 2.7 },
    { label: '狗', ix: -1, iy: 2, tx: -0.7, ty: 1.8 },
    { label: '车', ix: 3, iy: -1, tx: 2.8, ty: -1.3 },
    { label: '花', ix: 1, iy: 3.5, tx: 1.3, ty: 3.2 },
    { label: '飞机', ix: 3.5, iy: 1, tx: 3.2, ty: 0.7 },
  ]

  return (
    <Plot
      data={[
        {
          x: pairs.map(p => p.ix), y: pairs.map(p => p.iy),
          text: pairs.map(p => `图:${p.label}`),
          type: 'scatter', mode: 'markers+text', textposition: 'top center',
          marker: { color: tc.accent, size: 12, symbol: 'circle' },
          name: '图片嵌入',
        },
        {
          x: pairs.map(p => p.tx), y: pairs.map(p => p.ty),
          text: pairs.map(p => `文:${p.label}`),
          type: 'scatter', mode: 'markers+text', textposition: 'bottom center',
          marker: { color: '#6366f1', size: 12, symbol: 'diamond' },
          name: '文本嵌入',
        },
      ]}
      layout={{
        ...plotLayout(tc, '共享嵌入空间', 'dim1', 'dim2', 300),
        legend: { font: { color: tc.plotlyText } },
        shapes: pairs.map(p => ({
          type: 'line' as const, x0: p.ix, y0: p.iy, x1: p.tx, y1: p.ty,
          line: { color: tc.plotlyGrid, width: 1, dash: 'dot' as const },
        })),
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  )
}

// ViT 图片被切分为 patch 再映射为 token 序列
function ViTPatchSVG() {
  const [patchSize, setPatchSize] = useState(4)
  const imgSize = 120
  const patches = imgSize / (imgSize / patchSize)
  const patchPx = imgSize / patches

  return (
    <div>
      <svg viewBox="0 0 460 160" style={{ width: '100%' }}>
        {/* 原始图片 */}
        <text x={10} y={15} fontSize={10} fill="var(--text-muted)">原始图片</text>
        <rect x={10} y={20} width={imgSize} height={imgSize} rx={4}
          fill="var(--bg-surface)" stroke="var(--border)" strokeWidth={1} />
        {Array.from({ length: patches * patches }, (_, i) => {
          const row = Math.floor(i / patches)
          const col = i % patches
          return (
            <rect key={i} x={10 + col * patchPx} y={20 + row * patchPx}
              width={patchPx} height={patchPx}
              fill={`hsl(${(i * 360) / (patches * patches)}, 50%, 40%)`} opacity={0.6}
              stroke="var(--bg-card)" strokeWidth={0.5} />
          )
        })}

        {/* 箭头 */}
        <text x={150} y={82} fontSize={18} fill="var(--text-muted)">→</text>

        {/* Patch 序列 */}
        <text x={180} y={15} fontSize={10} fill="var(--text-muted)">Patch Embeddings</text>
        {Array.from({ length: Math.min(patches * patches, 16) }, (_, i) => {
          const x = 180 + (i % 8) * 32
          const y = 24 + Math.floor(i / 8) * 32
          return (
            <g key={i}>
              <rect x={x} y={y} width={28} height={24} rx={3}
                fill={`hsl(${(i * 360) / (patches * patches)}, 50%, 40%)`} opacity={0.6} />
              <text x={x + 14} y={y + 15} textAnchor="middle" fontSize={8} fill="#fff">{i}</text>
            </g>
          )
        })}

        {/* Token 序列 */}
        <text x={180} y={105} fontSize={10} fill="var(--text-muted)">
          [CLS] + {patches * patches} tokens → Transformer
        </text>
        <rect x={180} y={112} width={260} height={24} rx={4}
          fill="var(--accent)" opacity={0.15} stroke="var(--accent)" strokeWidth={0.5} />
        <text x={185} y={128} fontSize={9} fill="var(--accent)">[CLS]</text>
        {Array.from({ length: Math.min(patches * patches, 12) }, (_, i) => (
          <text key={i} x={215 + i * 20} y={128} fontSize={8} fill="var(--text-muted)">P{i}</text>
        ))}
      </svg>
      <div className="flex-center mt-16">
        <label>Patch 数量: {patchSize}×{patchSize}</label>
        <input type="range" min={2} max={8} value={patchSize}
          onChange={e => setPatchSize(Number(e.target.value))} style={{ width: 150 }} />
      </div>
    </div>
  )
}

function FusionStrategySVG() {
  const strategies = [
    { title: 'Early Fusion', desc: '拼接原始输入后一起编码' },
    { title: 'Late Fusion', desc: '各模态独立编码后拼接' },
    { title: 'Cross-Attention', desc: '一个模态作为Q,另一个作为KV' },
  ]

  return (
    <svg viewBox="0 0 480 320" style={{ width: '100%' }}>
      {strategies.map((s, si) => {
        const y0 = si * 105 + 10
        return (
          <g key={si}>
            <text x={10} y={y0 + 14} fontSize={11} fontWeight={600} fill="var(--accent)">{s.title}</text>
            <text x={10} y={y0 + 28} fontSize={9} fill="var(--text-muted)">{s.desc}</text>
            {si === 0 && <EarlyFusionDiagram y={y0 + 36} />}
            {si === 1 && <LateFusionDiagram y={y0 + 36} />}
            {si === 2 && <CrossAttentionDiagram y={y0 + 36} />}
          </g>
        )
      })}
    </svg>
  )
}

function EarlyFusionDiagram({ y }: { y: number }) {
  return (
    <g>
      <FusionBox x={10} y={y} w={60} h={24} text="Image" color="#6366f1" />
      <FusionBox x={80} y={y} w={60} h={24} text="Text" color="#f59e0b" />
      <FusionBox x={30} y={y + 36} w={120} h={24} text="Concat → Encoder" color="var(--accent)" />
      <line x1={45} y1={y + 24} x2={75} y2={y + 36} stroke="var(--border)" strokeWidth={1} />
      <line x1={110} y1={y + 24} x2={100} y2={y + 36} stroke="var(--border)" strokeWidth={1} />
    </g>
  )
}

function LateFusionDiagram({ y }: { y: number }) {
  return (
    <g>
      <FusionBox x={10} y={y} w={60} h={24} text="Img Enc" color="#6366f1" />
      <FusionBox x={100} y={y} w={60} h={24} text="Txt Enc" color="#f59e0b" />
      <FusionBox x={40} y={y + 36} w={100} h={24} text="Concat → MLP" color="var(--accent)" />
      <line x1={40} y1={y + 24} x2={70} y2={y + 36} stroke="var(--border)" strokeWidth={1} />
      <line x1={130} y1={y + 24} x2={110} y2={y + 36} stroke="var(--border)" strokeWidth={1} />
    </g>
  )
}

function CrossAttentionDiagram({ y }: { y: number }) {
  return (
    <g>
      <FusionBox x={10} y={y} w={50} h={24} text="Q(Img)" color="#6366f1" />
      <FusionBox x={80} y={y} w={50} h={24} text="K(Txt)" color="#f59e0b" />
      <FusionBox x={150} y={y} w={50} h={24} text="V(Txt)" color="#f59e0b" />
      <FusionBox x={50} y={y + 36} w={120} h={24} text="Cross-Attn → FFN" color="var(--accent)" />
      <line x1={35} y1={y + 24} x2={80} y2={y + 36} stroke="var(--border)" strokeWidth={1} />
      <line x1={105} y1={y + 24} x2={110} y2={y + 36} stroke="var(--border)" strokeWidth={1} />
      <line x1={175} y1={y + 24} x2={140} y2={y + 36} stroke="var(--border)" strokeWidth={1} />
    </g>
  )
}

function FusionBox({ x, y, w, h, text, color }: {
  x: number; y: number; w: number; h: number; text: string; color: string
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill="var(--bg-surface)" stroke={color} strokeWidth={1} />
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize={9} fill="var(--text-primary)">{text}</text>
    </g>
  )
}

function MultimodalFormulas() {
  const formulas = [
    { label: 'InfoNCE Loss', tex: '\\mathcal{L} = -\\frac{1}{N}\\sum_{i=1}^{N}\\log\\frac{\\exp(sim(z_i^I, z_i^T)/\\tau)}{\\sum_{j=1}^{N}\\exp(sim(z_i^I, z_j^T)/\\tau)}' },
    { label: '余弦相似度', tex: 'sim(\\mathbf{a}, \\mathbf{b}) = \\frac{\\mathbf{a} \\cdot \\mathbf{b}}{\\|\\mathbf{a}\\| \\|\\mathbf{b}\\|}' },
  ]

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {formulas.map((f, i) => (
        <div key={i} style={{ background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</div>
          <Tex math={f.tex} block />
        </div>
      ))}
    </div>
  )
}

function plotLayout(
  tc: ReturnType<typeof useThemeColors>, title: string,
  xTitle: string, yTitle: string, height: number
) {
  return {
    title: { text: title, font: { size: 13, color: tc.plotlyTitle } },
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
    font: { color: tc.plotlyText, size: 11 },
    xaxis: { title: xTitle, gridcolor: tc.plotlyGrid, color: tc.plotlyText },
    yaxis: { title: yTitle, gridcolor: tc.plotlyGrid, color: tc.plotlyText },
    margin: { t: 36, b: 36, l: 50, r: 20 },
    height,
  }
}

export default function MultimodalPage() {
  const tc = useThemeColors()

  return (
    <div className="page" style={{ fontSize: 13 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        Multimodal Models
      </div>
      <h3 className="mb-16">多模态模型</h3>

      <div className="grid-2 mb-16">
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>CLIP 对比学习</label>
          <CLIPContrastive />
        </div>
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>嵌入空间可视化</label>
          <EmbeddingSpace tc={tc} />
        </div>
      </div>

      <div className="grid-2 mb-16">
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>视觉 Token 化 (ViT)</label>
          <ViTPatchSVG />
        </div>
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>多模态融合策略</label>
          <FusionStrategySVG />
        </div>
      </div>

      <div className="card">
        <label className="mb-12" style={{ display: 'block' }}>核心公式</label>
        <MultimodalFormulas />
      </div>
    </div>
  )
}
