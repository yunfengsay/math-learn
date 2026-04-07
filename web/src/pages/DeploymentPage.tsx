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

// 各精度每个参数的字节数
const precisionBytes: Record<string, number> = { FP32: 4, FP16: 2, INT8: 1, INT4: 0.5 }
const precisionNames = ['FP32', 'FP16', 'INT8', 'INT4']

function calcMemoryGB(params: number, precision: string) {
  return (params * precisionBytes[precision]) / 1e9
}

function calcSpeedMultiplier(precision: string) {
  const base: Record<string, number> = { FP32: 1, FP16: 1.8, INT8: 3.2, INT4: 5.0 }
  return base[precision]
}

function QuantizationChart({ tc, paramB }: {
  tc: ReturnType<typeof useThemeColors>; paramB: number
}) {
  const params = paramB * 1e9
  const memories = precisionNames.map(p => calcMemoryGB(params, p))
  const speeds = precisionNames.map(p => calcSpeedMultiplier(p))
  const colors = [tc.plotlyText, '#6366f1', '#f59e0b', tc.accent]

  return (
    <div className="grid-2" style={{ gap: 12 }}>
      <Plot
        data={[{ x: precisionNames, y: memories, type: 'bar', marker: { color: colors } }]}
        layout={plotLayout(tc, '模型大小 (GB)', '', 'GB', 240)}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
      <Plot
        data={[{ x: precisionNames, y: speeds, type: 'bar', marker: { color: colors } }]}
        layout={plotLayout(tc, '推理加速倍数', '', '倍数', 240)}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  )
}

function ModelCalculator() {
  const [params, setParams] = useState('7')
  const [precision, setPrecision] = useState('FP16')

  const paramNum = (parseFloat(params) || 7) * 1e9
  const modelMem = calcMemoryGB(paramNum, precision)
  // 推理额外开销约模型大小的 20%
  const inferenceMem = modelMem * 1.2
  // KV Cache 估算：2 * layers * hidden * seq * precision_bytes / 1e9
  const layers = Math.round(Math.sqrt(parseFloat(params) || 7) * 10)
  const hidden = Math.round(Math.sqrt(parseFloat(params) || 7) * 1200)
  const kvCache = (2 * layers * hidden * 2048 * precisionBytes[precision]) / 1e9

  return (
    <div>
      <div className="grid-2 mb-12" style={{ gap: 8 }}>
        <div>
          <label>参数量 (B)</label>
          <input type="number" value={params} min={0.1} max={200} step={0.1}
            onChange={e => setParams(e.target.value)}
            style={inputStyle} />
        </div>
        <div>
          <label>精度</label>
          <select value={precision} onChange={e => setPrecision(e.target.value)}
            style={{ width: '100%', marginTop: 4 }}>
            {precisionNames.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <MetricCard label="模型内存" value={`${modelMem.toFixed(1)} GB`} />
        <MetricCard label="推理显存" value={`${inferenceMem.toFixed(1)} GB`} />
        <MetricCard label="KV Cache (2K seq)" value={`${kvCache.toFixed(2)} GB`} />
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: 6, textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</div>
      <div className="metric" style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)', marginTop: 4 }}>
        {value}
      </div>
    </div>
  )
}

function ServingArchitectureSVG() {
  const boxW = 100, boxH = 36, gap = 16
  const architectures = [
    { title: 'Online Serving', steps: ['请求', 'Load Balancer', 'GPU推理', '返回结果'], color: 'var(--accent)' },
    { title: 'Batch Processing', steps: ['数据队列', '批量聚合', 'GPU批推理', '写入存储'], color: '#6366f1' },
    { title: 'Streaming', steps: ['Token请求', 'KV Cache', '逐Token生成', 'SSE流返回'], color: '#f59e0b' },
  ]

  return (
    <svg viewBox="0 0 520 280" style={{ width: '100%' }}>
      {architectures.map((arch, ai) => {
        const y0 = ai * 90 + 20
        return (
          <g key={ai}>
            <text x={10} y={y0 + 22} fontSize={11} fontWeight={600} fill={arch.color}>{arch.title}</text>
            {arch.steps.map((step, si) => {
              const x = 120 + si * (boxW + gap)
              return (
                <g key={si}>
                  <rect x={x} y={y0} width={boxW} height={boxH} rx={6}
                    fill="var(--bg-surface)" stroke={arch.color} strokeWidth={1} />
                  <text x={x + boxW / 2} y={y0 + boxH / 2 + 4} textAnchor="middle"
                    fontSize={10} fill="var(--text-primary)">{step}</text>
                  {si < arch.steps.length - 1 && (
                    <line x1={x + boxW} y1={y0 + boxH / 2} x2={x + boxW + gap} y2={y0 + boxH / 2}
                      stroke={arch.color} strokeWidth={1.5} markerEnd="url(#arrow)" />
                  )}
                </g>
              )
            })}
          </g>
        )
      })}
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--text-muted)" />
        </marker>
      </defs>
    </svg>
  )
}

function PagedAttentionSVG() {
  const blockW = 40, blockH = 28, gap = 4

  // 物理块和逻辑块的映射示意
  const logicalBlocks = ['L0', 'L1', 'L2', 'L3']
  const physicalBlocks = ['P2', 'P0', 'P5', 'P3']

  return (
    <svg viewBox="0 0 460 200" style={{ width: '100%' }}>
      <text x={10} y={20} fontSize={11} fontWeight={600} fill="var(--text-primary)">Logical KV Blocks</text>
      {logicalBlocks.map((name, i) => (
        <g key={`l${i}`}>
          <rect x={10 + i * (blockW + gap)} y={30} width={blockW} height={blockH}
            rx={4} fill="var(--accent)" opacity={0.8} />
          <text x={10 + i * (blockW + gap) + blockW / 2} y={48} textAnchor="middle"
            fontSize={10} fill="#09090b" fontWeight={600}>{name}</text>
        </g>
      ))}

      <text x={10} y={110} fontSize={11} fontWeight={600} fill="var(--text-primary)">Physical GPU Memory (分页)</text>
      {Array.from({ length: 8 }, (_, i) => {
        const mapped = physicalBlocks.indexOf(`P${i}`)
        const isUsed = mapped !== -1
        return (
          <g key={`p${i}`}>
            <rect x={10 + i * (blockW + gap)} y={120} width={blockW} height={blockH}
              rx={4} fill={isUsed ? '#6366f1' : 'var(--bg-surface)'}
              stroke={isUsed ? '#6366f1' : 'var(--border)'} strokeWidth={1} opacity={isUsed ? 0.8 : 0.5} />
            <text x={10 + i * (blockW + gap) + blockW / 2} y={138} textAnchor="middle"
              fontSize={10} fill={isUsed ? '#fff' : 'var(--text-muted)'}>P{i}</text>
          </g>
        )
      })}

      {/* 映射虚线 */}
      {logicalBlocks.map((_, i) => {
        const pIdx = parseInt(physicalBlocks[i].slice(1))
        const lx = 10 + i * (blockW + gap) + blockW / 2
        const px = 10 + pIdx * (blockW + gap) + blockW / 2
        return (
          <line key={`map${i}`} x1={lx} y1={58} x2={px} y2={120}
            stroke="var(--accent)" strokeWidth={1} strokeDasharray="4,3" opacity={0.6} />
        )
      })}

      <text x={10} y={180} fontSize={10} fill="var(--text-muted)">
        非连续物理内存通过页表映射为连续的逻辑KV Block，减少内存碎片
      </text>
    </svg>
  )
}

function DeployFormulas() {
  const formulas = [
    { label: '参数内存', tex: 'M_{params} = N_{params} \\times B_{precision}' },
    { label: 'KV Cache', tex: 'M_{kv} = 2 \\times L \\times d \\times s \\times B_{prec}' },
    { label: '吞吐量', tex: 'Throughput = \\frac{BatchSize \\times SeqLen}{Latency}' },
    { label: '量化误差', tex: 'E_q = \\|W - Q(W)\\|_F^2' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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

const inputStyle: React.CSSProperties = {
  width: '100%', marginTop: 4, padding: '6px 10px', borderRadius: 6,
  border: '1px solid var(--border)', background: 'var(--bg-surface)',
  color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
}

export default function DeploymentPage() {
  const tc = useThemeColors()
  const [paramB, setParamB] = useState(7)

  return (
    <div className="page" style={{ fontSize: 13 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        Model Deployment & Optimization
      </div>
      <h3 className="mb-16">模型部署</h3>

      <div className="card mb-16">
        <div className="flex-between mb-12">
          <label>量化对比 — 参数量: {paramB}B</label>
          <input type="range" min={1} max={70} step={1} value={paramB}
            onChange={e => setParamB(Number(e.target.value))}
            style={{ width: 200 }} />
        </div>
        <QuantizationChart tc={tc} paramB={paramB} />
      </div>

      <div className="grid-2 mb-16">
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>模型大小计算器</label>
          <ModelCalculator />
        </div>
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>核心公式</label>
          <DeployFormulas />
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>服务架构对比</label>
          <ServingArchitectureSVG />
        </div>
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>PagedAttention — KV Cache 分页管理</label>
          <PagedAttentionSVG />
        </div>
      </div>
    </div>
  )
}
