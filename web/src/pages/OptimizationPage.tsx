import { useState } from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-basic-dist-min'
import { useThemeColors } from '../useThemeColors'

const Plot = createPlotlyComponent(Plotly)

function Tex({ math, block = false }: { math: string; block?: boolean }) {
  const html = katex.renderToString(math, { displayMode: block, throwOnError: false })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

// --- 损失函数：Beale 函数的简化版，有多个极值 ---
function lossFunc(x: number, y: number): number {
  return (x * x + y * y) * 0.1 + Math.sin(x) * Math.cos(y) * 2 + 3
}

function lossGrad(x: number, y: number): [number, number] {
  const dx = 0.2 * x + Math.cos(x) * Math.cos(y) * 2
  const dy = 0.2 * y - Math.sin(x) * Math.sin(y) * 2
  return [dx, dy]
}

// --- 优化器实现 ---
interface OptimizerState {
  x: number; y: number
  vx: number; vy: number
  mx: number; my: number
  sx: number; sy: number
  t: number
}

function initState(x0: number, y0: number): OptimizerState {
  return { x: x0, y: y0, vx: 0, vy: 0, mx: 0, my: 0, sx: 0, sy: 0, t: 0 }
}

function sgdStep(s: OptimizerState, lr: number): OptimizerState {
  const [gx, gy] = lossGrad(s.x, s.y)
  return { ...s, x: s.x - lr * gx, y: s.y - lr * gy }
}

function momentumStep(s: OptimizerState, lr: number): OptimizerState {
  const [gx, gy] = lossGrad(s.x, s.y)
  const beta = 0.9
  const vx = beta * s.vx + gx
  const vy = beta * s.vy + gy
  return { ...s, x: s.x - lr * vx, y: s.y - lr * vy, vx, vy }
}

function adamStep(s: OptimizerState, lr: number): OptimizerState {
  const [gx, gy] = lossGrad(s.x, s.y)
  const b1 = 0.9, b2 = 0.999, eps = 1e-8
  const t = s.t + 1
  const mx = b1 * s.mx + (1 - b1) * gx
  const my = b1 * s.my + (1 - b1) * gy
  const sx = b2 * s.sx + (1 - b2) * gx * gx
  const sy = b2 * s.sy + (1 - b2) * gy * gy
  const mxH = mx / (1 - b1 ** t), myH = my / (1 - b1 ** t)
  const sxH = sx / (1 - b2 ** t), syH = sy / (1 - b2 ** t)
  return {
    ...s, t, mx, my, sx, sy,
    x: s.x - lr * mxH / (Math.sqrt(sxH) + eps),
    y: s.y - lr * myH / (Math.sqrt(syH) + eps),
  }
}

// 运行多步优化器，返回轨迹
function runOptimizer(
  stepFn: (s: OptimizerState, lr: number) => OptimizerState,
  lr: number, steps: number, x0: number, y0: number
): [number, number][] {
  let s = initState(x0, y0)
  const path: [number, number][] = [[s.x, s.y]]
  for (let i = 0; i < steps; i++) {
    s = stepFn(s, lr)
    path.push([s.x, s.y])
  }
  return path
}

// --- 等高线 + 优化器轨迹 SVG ---
function ContourWithPaths({ paths, lr }: {
  paths: { name: string; color: string; points: [number, number][] }[]
  lr: number
}) {
  const w = 400, h = 400, pad = 20
  const range = 6

  function toSVG(x: number, y: number): [number, number] {
    const sx = pad + ((x + range) / (2 * range)) * (w - 2 * pad)
    const sy = pad + ((y + range) / (2 * range)) * (h - 2 * pad)
    return [sx, sy]
  }

  // 等高线用网格色块
  const gridN = 40
  const cells = Array.from({ length: gridN }, (_, i) =>
    Array.from({ length: gridN }, (_, j) => {
      const x = -range + (j / gridN) * 2 * range
      const y = -range + (i / gridN) * 2 * range
      const v = lossFunc(x, y)
      const t = Math.min((v - 1) / 6, 1)
      const alpha = 0.05 + t * 0.25
      return { x: j, y: i, alpha }
    })
  ).flat()

  const cellW = (w - 2 * pad) / gridN
  const cellH = (h - 2 * pad) / gridN

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', background: 'var(--bg-surface)', borderRadius: 8 }}>
      {cells.map((c, i) => (
        <rect key={i} x={pad + c.x * cellW} y={pad + c.y * cellH}
          width={cellW + 0.5} height={cellH + 0.5}
          fill="var(--accent)" opacity={c.alpha} />
      ))}
      {paths.map((p, pi) => {
        const d = p.points.map(([x, y], i) => {
          const [sx, sy] = toSVG(x, y)
          return `${i === 0 ? 'M' : 'L'}${sx},${sy}`
        }).join(' ')
        const last = p.points[p.points.length - 1]
        const [lx, ly] = toSVG(last[0], last[1])
        return (
          <g key={pi}>
            <path d={d} fill="none" stroke={p.color} strokeWidth={1.5} opacity={0.8} />
            <circle cx={lx} cy={ly} r={4} fill={p.color} />
          </g>
        )
      })}
      <text x={w / 2} y={h - 4} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
        lr={lr} | 颜色深浅表示损失值
      </text>
    </svg>
  )
}

function OptimizerRace() {
  const [lr, setLr] = useState(0.15)
  const [steps, setSteps] = useState(0)
  const [running, setRunning] = useState(false)
  const maxSteps = 80
  const x0 = -4.5, y0 = -4.5

  const optimizers = [
    { name: 'SGD', color: '#3b82f6', stepFn: sgdStep },
    { name: 'Momentum', color: '#f59e0b', stepFn: momentumStep },
    { name: 'Adam', color: '#ef4444', stepFn: adamStep },
  ]

  const paths = optimizers.map(o => ({
    name: o.name, color: o.color,
    points: runOptimizer(o.stepFn, lr, steps, x0, y0),
  }))

  function animate() {
    setSteps(0)
    setRunning(true)
    let s = 0
    const id = setInterval(() => {
      s++
      setSteps(s)
      if (s >= maxSteps) { clearInterval(id); setRunning(false) }
    }, 50)
  }

  return (
    <div>
      <ContourWithPaths paths={paths} lr={lr} />
      <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11 }}>
        {optimizers.map(o => (
          <span key={o.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: o.color, display: 'inline-block' }} />
            {o.name}
          </span>
        ))}
      </div>
      <div className="mt-16">
        <label>学习率: {lr.toFixed(3)}</label>
        <input type="range" min={0.01} max={0.5} step={0.005} value={lr}
          onChange={e => { setLr(Number(e.target.value)); setSteps(0) }} />
      </div>
      <div className="mt-16" style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" onClick={animate} disabled={running}>
          {running ? '运行中...' : '开始'}
        </button>
        <button className="btn btn-secondary" onClick={() => { setSteps(0); setRunning(false) }}>重置</button>
      </div>
      <div className="metric mt-16" style={{ fontSize: 12 }}>
        步数: {steps}/{maxSteps}
        {paths.map(p => {
          const last = p.points[p.points.length - 1]
          const loss = lossFunc(last[0], last[1])
          return (
            <span key={p.name} style={{ marginLeft: 12 }}>
              | <span style={{ color: p.color }}>{p.name}</span> loss={loss.toFixed(3)}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// --- 学习率调度可视化 ---
type ScheduleType = 'constant' | 'step_decay' | 'cosine' | 'warmup_cosine'

function computeSchedule(type: ScheduleType, baseLr: number, epochs: number): number[] {
  return Array.from({ length: epochs }, (_, e) => {
    switch (type) {
      case 'constant': return baseLr
      case 'step_decay': return baseLr * (0.5 ** Math.floor(e / 30))
      case 'cosine': return baseLr * 0.5 * (1 + Math.cos(Math.PI * e / epochs))
      case 'warmup_cosine': {
        const warmup = Math.floor(epochs * 0.1)
        if (e < warmup) return baseLr * (e / warmup)
        const progress = (e - warmup) / (epochs - warmup)
        return baseLr * 0.5 * (1 + Math.cos(Math.PI * progress))
      }
    }
  })
}

function LRScheduleViz() {
  const [selected, setSelected] = useState<ScheduleType[]>(['cosine', 'warmup_cosine'])
  const tc = useThemeColors()
  const epochs = 100, baseLr = 0.01

  const schedules: { type: ScheduleType; label: string; color: string }[] = [
    { type: 'constant', label: '固定', color: '#3b82f6' },
    { type: 'step_decay', label: '阶梯衰减', color: '#f59e0b' },
    { type: 'cosine', label: '余弦退火', color: tc.accent },
    { type: 'warmup_cosine', label: 'Warmup+余弦', color: '#ef4444' },
  ]

  function toggleSchedule(type: ScheduleType) {
    setSelected(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const traces = schedules
    .filter(s => selected.includes(s.type))
    .map(s => ({
      x: Array.from({ length: epochs }, (_, i) => i),
      y: computeSchedule(s.type, baseLr, epochs),
      type: 'scatter' as const, mode: 'lines' as const,
      name: s.label, line: { color: s.color, width: 2 },
    }))

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {schedules.map(s => (
          <button key={s.type}
            className={`btn ${selected.includes(s.type) ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: 11 }}
            onClick={() => toggleSchedule(s.type)}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block', marginRight: 4 }} />
            {s.label}
          </button>
        ))}
      </div>
      <Plot
        data={traces}
        layout={{
          paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
          font: { color: tc.plotlyText, size: 11 },
          xaxis: { title: 'Epoch', gridcolor: tc.plotlyGrid },
          yaxis: { title: '学习率', gridcolor: tc.plotlyGrid },
          margin: { t: 20, b: 50, l: 60, r: 20 },
          height: 250,
          legend: { x: 0.7, y: 1, font: { size: 10 } },
          showlegend: true,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  )
}

// --- 损失地貌示意图 ---
function LossLandscape() {
  const [hovered, setHovered] = useState<string | null>(null)
  const w = 460, h = 180

  // 手绘一条有起伏的损失曲线
  const curvePoints = [
    [30, 50], [60, 80], [80, 120], [100, 90], [130, 140],
    [160, 70], [190, 130], [210, 60], [240, 100], [260, 35],
    [290, 80], [320, 30], [350, 55], [380, 45], [410, 60], [430, 50],
  ] as const

  const curveD = curvePoints.map(([x, y], i) =>
    `${i === 0 ? 'M' : 'L'}${x},${y}`
  ).join(' ')

  // 标注关键点
  const annotations = [
    { x: 260, y: 35, label: '全局最小', key: 'global', color: 'var(--accent)' },
    { x: 160, y: 70, label: '局部最小', key: 'local', color: '#f59e0b' },
    { x: 210, y: 60, label: '鞍点', key: 'saddle', color: '#ef4444' },
  ]

  const descriptions: Record<string, string> = {
    global: '损失函数的全局最低点，是我们优化的最终目标',
    local: '局部最低但非全局最低，SGD 容易陷入此处',
    saddle: '某些方向是极小、某些方向是极大，高维空间中比局部最小更常见',
  }

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', background: 'var(--bg-surface)', borderRadius: 8 }}>
        <path d={curveD} fill="none" stroke="var(--text-muted)" strokeWidth={2} />
        {/* 填充曲线下方 */}
        <path d={`${curveD} L430,${h - 10} L30,${h - 10} Z`}
          fill="var(--accent)" opacity={0.05} />
        {annotations.map(a => (
          <g key={a.key}
            onMouseEnter={() => setHovered(a.key)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}>
            <circle cx={a.x} cy={a.y} r={hovered === a.key ? 7 : 5}
              fill={a.color} stroke="#fff" strokeWidth={1} />
            <text x={a.x} y={a.y - 12} textAnchor="middle" fontSize={9}
              fill={a.color} fontWeight={600}>{a.label}</text>
          </g>
        ))}
        <text x={w / 2} y={h - 2} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
          参数空间
        </text>
      </svg>
      {hovered && (
        <div className="metric" style={{ fontSize: 12, marginTop: 8, padding: 8, background: 'var(--bg-surface)', borderRadius: 6 }}>
          {descriptions[hovered]}
        </div>
      )}
      {!hovered && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
          悬停在标注点上查看说明
        </div>
      )}
    </div>
  )
}

// --- 公式区 ---
function FormulaSection() {
  const formulas = [
    { label: 'SGD', tex: '\\theta_{t+1} = \\theta_t - \\eta \\nabla L(\\theta_t)' },
    { label: 'Momentum', tex: 'v_t = \\beta v_{t-1} + \\nabla L, \\quad \\theta_{t+1} = \\theta_t - \\eta v_t' },
    { label: 'Adam', tex: 'm_t = \\beta_1 m_{t-1} + (1-\\beta_1)g_t, \\quad \\hat{m}_t = \\frac{m_t}{1-\\beta_1^t}' },
    { label: 'Adam (续)', tex: 'v_t = \\beta_2 v_{t-1} + (1-\\beta_2)g_t^2, \\quad \\theta_{t+1} = \\theta_t - \\eta \\frac{\\hat{m}_t}{\\sqrt{\\hat{v}_t}+\\epsilon}' },
    { label: 'Cosine Annealing', tex: '\\eta_t = \\eta_{min} + \\frac{1}{2}(\\eta_{max} - \\eta_{min})(1 + \\cos(\\frac{t}{T}\\pi))' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
      {formulas.map((f, i) => (
        <div key={i} style={{ background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</div>
          <Tex math={f.tex} block />
        </div>
      ))}
    </div>
  )
}

// --- 主页面 ---
export default function OptimizationPage() {
  return (
    <div className="page" style={{ fontSize: 13 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        Optimization Theory
      </div>
      <h3 className="mb-16">优化理论</h3>

      <div className="grid-2 mb-16">
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Optimizer Race — SGD vs Momentum vs Adam
          </div>
          <OptimizerRace />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Learning Rate Schedule
          </div>
          <LRScheduleViz />
          <div className="mt-16">
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Loss Landscape Concepts
            </div>
            <LossLandscape />
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Key Formulas
        </div>
        <div className="grid-2">
          <FormulaSection />
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>优化器选择指南：</strong>
            </div>
            <div style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 10, marginBottom: 6 }}>
              <strong>SGD</strong> — 简单可靠，常用于 CV 任务，需要精心调节学习率
            </div>
            <div style={{ borderLeft: '2px solid #f59e0b', paddingLeft: 10, marginBottom: 6 }}>
              <strong>Momentum</strong> — 加速收敛并减少震荡，帮助越过局部最小值
            </div>
            <div style={{ borderLeft: '2px solid #ef4444', paddingLeft: 10, marginBottom: 6 }}>
              <strong>Adam</strong> — 自适应学习率，NLP/Transformer 的默认选择，对超参数不敏感
            </div>
            <div style={{ borderLeft: '2px solid var(--text-muted)', paddingLeft: 10 }}>
              <strong>学习率调度</strong> — Warmup+Cosine 是当前大模型训练的标准策略
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
